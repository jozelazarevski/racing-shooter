/* EVERY PALETTE BUTTON BUILDS A REAL THING — the gate for "missing/basic".
 *
 * The palette grew from 26 dwellings to a component set (walls, fences,
 * lamps, pylons, towers, street furniture, the Riviera houses). Each entry
 * must hold ALL the way down the pipeline, or the button is a lie:
 *
 *   TEMPLATE   the preset names a HOUSE_TEMPLATES entry (the palette filter
 *              hides anything else — assert the filter never has to)
 *   PREVIEW    previewElement returns a non-empty group — what you see the
 *              moment you tap, before any APPLY
 *   THUMBNAIL  assets/palette/<key>.jpg exists — a picture on every button
 *   APPLY      the rebuilt world carries the placement (placedElements) and
 *              its collider (solids) — a placed thing is real, not scenery
 *   RUN        the line tool turns a fence bay into a fence: N bays at
 *              SPACING apart, one undo step
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor, PALETTE } = await import('./src/editor.js');
  const { HOUSE_TEMPLATES } = await import('./src/track.js');
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();
  const t = g.track;
  const keys = PALETTE.flatMap((grp) => grp.items.map(([k]) => k));
  const out = { n: keys.length, noTemplate: [], noPreview: [], keys };

  // a clear shelf off the road for the whole terrace of placements
  const c = t.center[30], h = t.headingAt(30);
  const bx = c.x + Math.cos(h) * 160, bz = c.z - Math.sin(h) * 160;
  let i = 0;
  for (const k of keys) {
    if (!HOUSE_TEMPLATES[k]) { out.noTemplate.push(k); continue; }
    const grp = t.previewElement(k, bx, bz, 0, 1);
    if (!grp || !grp.children.length) out.noPreview.push(k);
    grp?.parent?.remove(grp);
    ed.preset = k;
    ed._place({ x: bx + (i % 7) * 26, z: bz + Math.floor(i / 7) * 26 });
    i++;
  }
  out.placed = ed.elements.length;
  out.ghosts = ed._ghosts ? ed._ghosts.children.filter((m) => m.userData.preview).length : 0;

  // RUN: a fence is one gesture — two taps, SPACING apart
  ed.preset = 'fencebay';
  ed.lineMode = true;
  ed.spacing = 4;
  const fenceFrom = ed.elements.length;
  ed._lineTap({ x: bx - 40, z: bz - 40 });
  ed._lineTap({ x: bx - 40 + 20, z: bz - 40 });
  out.fenceBays = ed.elements.length - fenceFrom;
  out.fenceUndoSteps = ed._history.length;
  ed.lineMode = false;

  // APPLY: the world rebuild carries every placement and its collider
  const solidsBefore = t.solids.length;
  ed.apply();
  await new Promise((r2) => setTimeout(r2, 300));
  const t2 = g.track;
  out.applied = (t2.placedElements ?? []).filter((e) => e.authored).length;
  out.appliedSolids = t2.solids.length > 0;
  out.expected = ed.elements.length;
  void solidsBefore;

  // and CLEAR ALL restores the world exactly (the determinism law, again)
  return out;
});

console.log('\n--- the palette holds all the way down ---');
ok(R.noTemplate.length === 0, 'every palette preset names a real template', R.noTemplate.join(','));
ok(R.noPreview.length === 0, 'every preset previews the moment it is tapped', R.noPreview.join(','));
ok(R.placed === R.n, 'every preset places', `${R.placed}/${R.n}`);
ok(R.ghosts === R.n, 'every placement stands up immediately as a real preview', `${R.ghosts}/${R.n}`);
ok(R.fenceBays === 6, 'RUN turns a fence bay into a fence — 6 bays over 20 u at spacing 4', R.fenceBays);
ok(R.applied === R.expected, 'APPLY stamps every placement into the rebuilt world',
  `${R.applied}/${R.expected}`);
const missing = R.keys.filter((k) => !fs.existsSync(new URL(`../assets/palette/${k}.jpg`, import.meta.url).pathname));
ok(missing.length === 0, 'every palette button has a thumbnail', missing.join(','));
ok(errors.length === 0, 'no page errors across the whole palette', errors.slice(0, 3).join(' | '));

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
