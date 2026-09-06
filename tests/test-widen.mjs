/* THE ROAD ITSELF CAN BE MADE WIDER.
 *
 * "Make a wider u trn." MOVE ROAD bends the racing line and the sculpt
 * reshapes the ground under it, but between them the carriageway stayed
 * exactly nine metres wide — you could move a hairpin anywhere you liked and
 * never open it out. WIDEN is the missing gesture: tap the road, and the
 * surface there gets wider.
 *
 * The contract this guards is that widening reaches EVERYTHING, because it
 * lands in the one width profile the whole game reads through `widthAt(i)`:
 * the drawn ribbon, the rival lateral clamp, and the clearance rule that
 * keeps scenery off the road. A width change that only moved the paint would
 * be the r150 sculpt bug all over again.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor } = await import('./src/editor.js');
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();
  const t0 = g.track;
  const i0 = 300;
  const c = t0.center[i0];
  const out = { before: +t0.widthAt(i0).toFixed(2) };

  // ---- WIDEN: tap the road ------------------------------------------------
  ed.tool = 'widen';
  ed.radius = 70;
  ed._widenStep = 4;
  ed.narrowMode = false;
  ed._widenAt({ x: c.x, z: c.z });
  out.recorded = ed.widen.length;
  await new Promise((res) => ed.apply(res));

  const T = g.track;
  const j = T.nearestIndex({ x: c.x, y: 0, z: c.z });
  out.after = +T.widthAt(j).toFixed(2);
  // the falloff: at the rim of the brush the road is back to normal
  const far = T.nearestIndex({ x: T.center[(j + 60) % T.N].x, y: 0, z: T.center[(j + 60) % T.N].z });
  out.awayFromIt = +T.widthAt(far).toFixed(2);

  // the DRAWN road follows: the ground-vs-road clamp reads the same profile,
  // so a point that used to be verge is now road surface
  const nrm = T.nrm[j];
  const probe = { x: c.x + nrm.x * 11, z: c.z + nrm.z * 11 };
  out.roadY = +T.center[j].y.toFixed(2);
  out.groundAtProbe = +T.terrainHeight(probe.x, probe.z).toFixed(2);
  out.probeIsRoadNow = Math.abs(out.groundAtProbe - out.roadY) < 1.2;
  // physics and drawn ground still agree there
  out.meshGap = +(T.terrainHeight(probe.x, probe.z) - T._terrainMeshHeight(probe.x, probe.z)).toFixed(2);

  // nothing of the world stands in the widened lane
  let intruders = 0;
  for (const s of T.solids) {
    const cc = T.center[j];
    const lat = Math.abs((s.x - cc.x) * nrm.x + (s.z - cc.z) * nrm.z);
    const along = Math.abs((s.x - cc.x) * T.tan[j].x + (s.z - cc.z) * T.tan[j].z);
    if (along < 12 && lat < T.widthAt(j) && Math.abs((s.y ?? 0) - cc.y) < 6) intruders++;
  }
  out.intruders = intruders;

  // ---- NARROW: the same brush, inverted -----------------------------------
  ed.narrowMode = true;
  ed._widenStep = 3;
  ed._widenAt({ x: T.center[j].x, z: T.center[j].z });
  await new Promise((res) => ed.apply(res));
  const T2 = g.track, j2 = T2.nearestIndex({ x: c.x, y: 0, z: c.z });
  out.afterNarrow = +T2.widthAt(j2).toFixed(2);

  // ---- the brush refuses open country -------------------------------------
  const off = { x: c.x + T2.nrm[j2].x * 300, z: c.z + T2.nrm[j2].z * 300 };
  const nBefore = ed.widen.length;
  ed._widenAt(off);
  out.refusedOffRoad = ed.widen.length === nBefore;

  // ---- clamps: a road never becomes a runway, nor a footpath --------------
  ed.narrowMode = false;
  ed._widenStep = 8;
  for (let k = 0; k < 6; k++) ed._widenAt({ x: T2.center[j2].x, z: T2.center[j2].z });
  await new Promise((res) => ed.apply(res));
  out.capped = +g.track.widthAt(g.track.nearestIndex({ x: c.x, y: 0, z: c.z })).toFixed(2);

  // ---- it survives a save / load round trip -------------------------------
  const blob = ed.serialize();
  out.serialised = (blob.widen || []).length;
  const ed2 = new WorldEditor(g);
  ed2.load(blob);
  out.reloaded = ed2.widen.length;

  ed.exit();
  g.state = 'title'; g.editScene = null;
  const { LEVELS } = await import('./src/track.js');
  g.swapLevel(LEVELS.find((l) => l.id === 1), true, null);
  out.restored = +g.track.widthAt(i0).toFixed(2);
  return out;
});

console.log(`--- PINE VALLEY, half-width ${R.before} u ---`);
ok(R.recorded === 1, 'a tap on the road records one width pull', R.recorded);
ok(R.after > R.before + 2.5,
  'and the carriageway there is genuinely wider', `${R.before} -> ${R.after}`);
ok(Math.abs(R.awayFromIt - R.before) < 0.6,
  'the rest of the lap is untouched — the brush has a falloff', R.awayFromIt);
ok(R.probeIsRoadNow,
  'the DRAWN road followed: what was verge is road surface now',
  `road ${R.roadY} vs ground ${R.groundAtProbe}`);
ok(Math.abs(R.meshGap) < 0.05,
  'physics and drawn ground still agree on the widened edge', R.meshGap);
ok(R.intruders === 0,
  'nothing of the world stands in the new width', `${R.intruders} colliders in lane`);
ok(R.afterNarrow < R.after - 2,
  'NARROWER runs the same brush the other way', `${R.after} -> ${R.afterNarrow}`);
ok(R.refusedOffRoad,
  'a tap in open country is refused, not silently ignored');
ok(R.capped <= 22.01 && R.capped > R.afterNarrow,
  'six hard taps stop at the build limit, not a runway', R.capped);
ok(R.serialised >= 1 && R.reloaded === R.serialised,
  'the width edits save and load with the scene', `${R.serialised} -> ${R.reloaded}`);
ok(Math.abs(R.restored - R.before) < 0.01,
  'and a plain rebuild restores the shipped road', `${R.restored} vs ${R.before}`);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
