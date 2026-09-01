/* CLAUDE.md v1.5 §6.11 / Q23 — THE HUD IS FROZEN.
 *
 * "The HUD as shipped in recording E (hull top-left, analogue gauge with
 * gear, camera toggle beside pause, weapon row under the gauge, field
 * strip, combo beside score) is the HUD. Do not move, resize, restyle or
 * remove any element." The r309 layout IS the frozen reference by owner
 * decision.
 *
 * This suite pins the GEOMETRY: every frozen element's bounding box at the
 * reference viewport (430x932 portrait, touch), against
 * tests/hud-freeze-ref.json. Any drift beyond 1.5 px fails the build —
 * Q23's pixel-identity, expressed in the coordinates a layout bug would
 * actually move. Regenerate the reference ONLY on an owner-approved layout
 * change: HUDFREEZE_WRITE=1 node tests/test-hudfreeze.mjs
 */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const REF_PATH = new URL('./hud-freeze-ref.json', import.meta.url);
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const IDS = ['race-info', 'health-box', 'score-box', 'speed-box', 'weapon-box',
  't-fire', 't-missile', 't-mine', 't-shock', 't-nitro', 't-drift', 't-brake',
  'progress-strip', 'pause-btn', 'cam-btn'];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2,
});
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=1&go=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const boxes = await p.evaluate((IDS2) => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  for (let k = 0; k < 30; k++) g.frame();     // HUD settles
  const out = {};
  for (const id of IDS2) {
    const e = document.getElementById(id);
    if (!e) { out[id] = null; continue; }
    const r = e.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) { out[id] = null; continue; }
    out[id] = { x: +r.x.toFixed(1), y: +r.y.toFixed(1),
      w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  }
  return out;
}, IDS);

if (process.env.HUDFREEZE_WRITE) {
  writeFileSync(REF_PATH, JSON.stringify(boxes, null, 1));
  console.log(`reference written: ${Object.keys(boxes).length} elements`);
  await browser.close();
  process.exit(0);
}

let ref;
try { ref = JSON.parse(readFileSync(REF_PATH, 'utf8')); } catch {
  console.log('FAIL  Q23: no reference snapshot — run HUDFREEZE_WRITE=1 once on the frozen layout');
  await browser.close();
  process.exit(1);
}

const TOL = 1.5;
let drift = [];
for (const id of IDS) {
  const a = ref[id], b = boxes[id];
  if (a === null && b === null) continue;      // absent by design on both sides
  if (!a || !b) { drift.push(`${id}: ${a ? 'vanished' : 'appeared'}`); continue; }
  for (const k of ['x', 'y', 'w', 'h']) {
    if (Math.abs(a[k] - b[k]) > TOL) {
      drift.push(`${id}.${k}: ${a[k]} -> ${b[k]}`);
      break;
    }
  }
}
check('Q23  the frozen HUD geometry matches the recording-E reference (±1.5 px)',
  drift.length === 0, drift.slice(0, 4).join(' | ') || `${IDS.length} elements pinned`);
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe HUD is frozen');
process.exit(fail ? 1 : 0);
