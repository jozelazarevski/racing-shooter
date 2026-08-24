/* THE DRAFT REACHES THE DATABASE — realtime, end to end.
 *
 * THE ASK: work in the editor should be saved to the DB as you work, not
 * only when you remember to press SAVE. The pieces already existed — the
 * draft is written inside the profile prefix, the sync engine snapshots that
 * prefix — but nothing SCHEDULED a push for a draft write, so an hour of
 * unsaved sculpting lived on exactly one device until some unrelated save
 * happened to sync. This suite drives the real editor against a MOCKED
 * PostgREST endpoint (a routed URL that records every POST) and asserts the
 * whole path:
 *
 *   REALTIME    a sculpt stroke, by itself, lands the draft in the DB row —
 *               debounced (one push per burst, not one per dab), but with no
 *               other action taken by the user
 *   ON THE WAY OUT  a push still inside its debounce window is FLUSHED on
 *               pagehide, so closing the tab cannot eat the last stroke
 *   THE CHIP    the top bar reports the row's answer (CLOUD ✓), not the
 *               tab's hope
 *   NO CHIMERA  two devices' drafts merge as DOCUMENTS — the newer wins
 *               whole; mergeMax would take max(base id) and splice fields
 *   DEDUPE      collapsing a stroke's dabs still works through the grid
 *               (the O(scene) scan per dab is gone)
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const DB = 'https://fake-db.test';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));

// ---- the "database": every POST body, in order --------------------------
const posts = [];
await page.route(`${DB}/**`, (route) => {
  const req = route.request();
  if (req.method() === 'POST') {
    posts.push(JSON.parse(req.postData() || '[]'));
    return route.fulfill({ status: 201, body: '' });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});
// index.html assigns a blank IGNITE_SYNC of its own; a getter-only property
// makes that assignment a silent no-op, so the test's endpoint survives boot
await page.addInitScript(`Object.defineProperty(window, 'IGNITE_SYNC', {
  get() { return { url: '${DB}', key: 'test-anon-key' }; }, configurable: false });`);

await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.sync,
  undefined, { timeout: 300000 });

const draftPosts = () => posts.filter((rows) =>
  rows.some((r) => r?.data?.keys?.['scenes-draft']?.scene));

// let the BOOT's own profile writes push and settle, so everything counted
// below was caused by the stroke and nothing else
for (let quiet = 0, last = posts.length; quiet < 25; ) {
  await new Promise((r) => setTimeout(r, 200));
  if (posts.length === last) quiet++;
  else { quiet = 0; last = posts.length; }
}

// ---- 1. a stroke, alone, reaches the row --------------------------------
const preStroke = posts.length;
await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor } = await import('./src/editor.js');
  g.editor = new WorldEditor(g);
  g.editor.enter();
  const c = g.track.center[30];
  g.editor._strokeFrom = g.editor.delta.dabs.length;   // what pointerdown does
  for (let i = 0; i < 30; i++) {
    g.editor._dab({ x: c.x + 150 + i * 2, z: c.z + 150 + i * 2 });   // a real drag
  }
  g.editor._endStroke();
});
const chipEarly = await page.evaluate(() => ({
  text: document.querySelector('#ed-save')?.textContent || '',
  state: document.querySelector('#ed-save')?.dataset.state || '',
}));
ok(chipEarly.state === 'pending' || chipEarly.state === 'draft',
  'the save chip announces the write immediately', JSON.stringify(chipEarly));

// draft debounce (0.9 s) + push debounce (4 s): allow 12 s for the mock row
let landed = null;
for (let i = 0; i < 60 && !landed; i++) {
  await new Promise((r) => setTimeout(r, 200));
  landed = draftPosts()[0] ?? null;
}
ok(!!landed, 'a sculpt stroke lands the draft in the DB row, unprompted');
const row = landed && landed.find((r) => r?.data?.keys?.['scenes-draft']);
const draft = row?.data?.keys?.['scenes-draft'];
ok(!!draft && (draft.scene.dabs || []).length >= 1,
  'the row carries the sculpt itself', JSON.stringify(draft?.scene?.dabs));
ok(!!row && typeof row.id === 'string' && row.id.length === 26,
  'the row is keyed by the profile\'s 26-char syncId', row?.id);
// give any straggler its debounce window, then hold the law: a thirty-dab
// stroke costs a couple of debounced pushes (the first-ever push also
// registers the syncId, which is itself a profile write), never one per dab
await new Promise((r) => setTimeout(r, 6000));
const burst = posts.length - preStroke;
ok(burst >= 1 && burst <= 3, 'a 30-dab stroke costs debounced pushes, not one per dab',
  `${burst} pushes`);

// ---- 2. the chip reports the DB's answer --------------------------------
const chip = await page.evaluate(() => ({
  text: document.querySelector('#ed-save')?.textContent || '',
  state: document.querySelector('#ed-save')?.dataset.state || '',
  status: window.__game.sync.status,
}));
ok(chip.status === 'ok', 'the push round-tripped (status ok)', chip.status);
ok(chip.state === 'cloud' && /CLOUD ✓/.test(chip.text),
  'the chip shows CLOUD ✓ only after the row answered', JSON.stringify(chip));

// ---- 3. pagehide flushes a push still in its debounce window ------------
const before = posts.length;
await page.evaluate(() => {
  const g = window.__game;
  const c = g.track.center[60];
  g.editor._strokeFrom = g.editor.delta.dabs.length;
  g.editor._dab({ x: c.x + 150, z: c.z + 150 });
  g.editor._endStroke();
  g.editor._saveDraftNow();               // draft on disk; push now debounced 4 s
  window.dispatchEvent(new Event('pagehide'));   // ...and the lid closes
});
let flushed = false;
for (let i = 0; i < 10 && !flushed; i++) {      // 2 s — half the debounce
  await new Promise((r) => setTimeout(r, 200));
  flushed = posts.length > before;
}
ok(flushed, 'pagehide flushes the pending push instead of losing it',
  `${posts.length - before} pushes within 2 s of hide`);

// ---- 4. two drafts merge as documents, never a chimera ------------------
const merged = await page.evaluate(() => {
  const A = { v: 1, when: 1000, profile: { name: 'A' }, keys: {
    'scenes-draft': { t: 1000, scene: { v: 2, base: 7, dabs: [{ x: 1, z: 1, r: 9, dh: 5 }], elements: [] } },
  } };
  const B = { v: 1, when: 2000, profile: { name: 'B' }, keys: {
    'scenes-draft': { t: 2000, scene: { v: 2, base: 3, dabs: [], elements: [{ preset: 'barn', x: 0, z: 0, rot: 0, scale: 1 }] } },
  } };
  const ab = window.__sync.mergeSnapshots(A, B).keys['scenes-draft'];
  const ba = window.__sync.mergeSnapshots(B, A).keys['scenes-draft'];
  return { ab, ba };
});
ok(merged.ab.scene.base === 3 && merged.ab.scene.dabs.length === 0
  && merged.ab.scene.elements.length === 1,
  'the newer draft wins WHOLE (base 3, its own dabs, its own objects)',
  JSON.stringify(merged.ab.scene));
ok(JSON.stringify(merged.ab) === JSON.stringify(merged.ba),
  'draft merge is symmetric — device order cannot matter');

// ---- 5. stroke dedupe still collapses, now through the grid -------------
const dd = await page.evaluate(async () => {
  const { TerrainDelta } = await import('./src/editor.js');
  const d = new TerrainDelta();
  d.add({ x: 100, z: 100, r: 40, dh: 2, mode: 'raise' });
  d.add({ x: 102, z: 101, r: 40, dh: 3, mode: 'raise' });   // same spot: merges
  d.add({ x: 500, z: 500, r: 40, dh: 2, mode: 'raise' });   // another cell: kept
  d.add({ x: 101, z: 100, r: 40, dh: 1, mode: 'lower' });   // other mode: kept
  return { n: d.length, dh: d.dabs[0].dh };
});
ok(dd.n === 3 && dd.dh === 5,
  'near-identical dabs merge, different spots and modes stay', JSON.stringify(dd));

ok(errors.length === 0, 'no page errors on the whole path', errors.join(' | '));

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
