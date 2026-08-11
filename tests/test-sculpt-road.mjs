/* THE SCULPT MOVES THE ROAD, THE BRIDGES STAND HIGH, AND THEIR WALLS HOLD.
 *
 * Four reports, one suite:
 *
 *   "If I lower the ground with the editor tool, when driving it is still
 *   high ground." — "the road is the floor" clamped the GROUND to the road,
 *   so a sculpt could reshape everything except the one surface the car
 *   drives on. The delta now displaces the elevation profile itself.
 *
 *   "Raise the bridge." — 8.6 u of overpass clearance put the soffit at
 *   roof height over the lower road.
 *
 *   "I can go in and out a bridge wall." — the flyover parapets were r=1.2
 *   point colliders every SIXTH sample: dots, with car-sized gaps between.
 *
 *   The shark teeth and the stacked cubes — massif cones and glacier slabs
 *   placed against a constant datum on worlds whose valley floor drops, so
 *   only their tips broke the surface (teeth), or as raw boxes (cubes).
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

// ---- 1. LOWER digs the road down with the ground --------------------------
const S = await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor } = await import('./src/editor.js');
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();
  const t = g.track;
  const i0 = 300;
  const c = t.center[i0];
  const out = {
    roadBefore: +t.center[i0].y.toFixed(2),
    groundBefore: +t.terrainHeight(c.x, c.z).toFixed(2),
  };
  ed.tool = 'lower'; ed.radius = 60; ed.strength = 8;
  ed._strokeFrom = ed.delta.dabs.length;
  for (let k = 0; k < 6; k++) ed._dab({ x: c.x, z: c.z });
  ed._endStroke();
  out.deltaHere = +ed.delta.at(c.x, c.z).toFixed(2);
  await new Promise((res) => ed.apply(res));
  const T = g.track, j = T.nearestIndex({ x: c.x, y: 0, z: c.z });
  out.roadAfter = +T.center[j].y.toFixed(2);
  out.groundAfter = +T.terrainHeight(c.x, c.z).toFixed(2);
  // the surface the CAR reads is the road surface, moved
  out.driveAfter = +T.groundHeightAt(j, 0).toFixed(2);
  // and the drawn ground still agrees with the physics at the verge
  const hd = T.headingAt(j);
  const vx = c.x + Math.sin(hd) * 14, vz = c.z + Math.cos(hd) * 14;
  out.vergeGap = +(T.terrainHeight(vx, vz) - T._terrainMeshHeight(vx, vz)).toFixed(2);
  ed.exit();
  g.state = 'title'; g.editScene = null;
  const { LEVELS } = await import('./src/track.js');
  g.swapLevel(LEVELS.find((l) => l.id === 1), true, null);
  out.roadRestored = +g.track.center[i0].y.toFixed(2);
  return out;
});

console.log('\n--- LOWER digs the road itself ---');
ok(S.deltaHere < -4, 'the sculpt recorded a real dig', `${S.deltaHere} u`);
ok(S.roadAfter < S.roadBefore - 3,
  'the ROAD dropped with it — no more shelf over your cutting',
  `${S.roadBefore} -> ${S.roadAfter}`);
ok(Math.abs(S.driveAfter - S.roadAfter) < 1.5,
  'and the surface the car drives is the moved road', `${S.driveAfter} vs ${S.roadAfter}`);
ok(Math.abs(S.vergeGap) < 0.05,
  'physics and drawn ground still agree at the verge of the dig', S.vergeGap);
ok(Math.abs(S.roadRestored - S.roadBefore) < 0.01,
  'a plain rebuild restores the shipped road', `${S.roadRestored} vs ${S.roadBefore}`);

// ---- 2. bridges stand high, and their walls hold --------------------------
const B = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.state = 'title'; g.editScene = null;
  g.swapLevel(LEVELS.find((l) => l.id === 59), true, null);   // CLIFF KNOT
  const t = g.track, n = t.center.length;
  const out = { overpasses: (t._overpasses || []).length, gaps: [], rails: 0 };
  for (const o of t._overpasses) {
    const up = t.center[o.up], down = t.center[o.down];
    out.gaps.push(+(up.y - down.y).toFixed(1));
  }
  // parapet barriers along the flyover spans: count SEGMENTS near the deck
  for (const b of t.barriers) {
    const mx = (b.x1 + b.x2) / 2, mz = (b.z1 + b.z2) / 2;
    for (const o of t._overpasses) {
      const c = t.center[o.up];
      if (Math.hypot(mx - c.x, mz - c.z) < o.half * t.segLen + 8) { out.rails++; break; }
    }
  }
  // no car-sized hole: walk one span's rail line and measure coverage
  const o = t._overpasses[0];
  let holes = 0;
  for (let sN = -o.half + 2; sN <= o.half - 2; sN++) {
    const j = (o.up + sN + n) % n;
    const c = t.center[j], nrm = t.nrm[j];
    const px = c.x + nrm.x * 10.2, pz = c.z + nrm.z * 10.2;
    const covered = t.barriers.some((b) => {
      const dx = b.x2 - b.x1, dz = b.z2 - b.z1;
      const L2 = dx * dx + dz * dz || 1;
      const tt = Math.max(0, Math.min(1, ((px - b.x1) * dx + (pz - b.z1) * dz) / L2));
      const qx = b.x1 + dx * tt, qz = b.z1 + dz * tt;
      return Math.hypot(px - qx, pz - qz) < 1.6;
    });
    if (!covered) holes++;
  }
  out.holes = holes;
  return out;
});

console.log(`\n--- CLIFF KNOT: ${B.overpasses} flyovers ---`);
ok(B.overpasses >= 4, 'the crossings are all there', B.overpasses);
ok(Math.min(...B.gaps) >= 9,
  'every deck stands at bridge height over the road below',
  `clearances ${B.gaps.join(', ')} u`);
ok(B.rails > 40, 'the spans carry parapet BARRIERS, not dots', `${B.rails} segments`);
ok(B.holes === 0,
  'and one full span has no car-sized hole in its wall', `${B.holes} uncovered stations`);

// ---- 3. FURKA: no shark teeth, no stacked cubes ---------------------------
const F = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.state = 'title'; g.editScene = null;
  g.swapLevel(LEVELS.find((l) => l.id === 21), true, null);   // FURKA RIDGE
  const t = g.track;
  const out = { cones: 0, buried: 0, teeth: 0 };
  for (const s of t.solids) {
    if (s.h === undefined || s.mat !== 'stone') continue;
    out.cones++;
    const ground = t.terrainHeight(s.x, s.z);
    const base = s.y - 2;                       // solids carry y = base + 2
    const visible = (base + s.h) - ground;
    if (base > ground + 1) out.buried++;        // floating would be worse
    if (visible < s.h * 0.5) out.teeth++;       // mostly underground = a tooth
  }
  let glacier = null;
  t.group.traverse((o) => { if (o.name === 'glacier') glacier = o; });
  out.glacierFaceted = glacier
    ? glacier.geometry.attributes.position.count > 200 : false;
  return out;
});

console.log(`\n--- FURKA RIDGE: ${F.cones} peaks ---`);
ok(F.cones > 0, 'the massif is there', F.cones);
ok(F.teeth === 0,
  'no peak is buried to its tip — the shark teeth are mountains again',
  `${F.teeth}/${F.cones} mostly underground`);
ok(F.buried === 0, 'and none floats above the ground either', F.buried);
ok(F.glacierFaceted,
  'the glacier is faceted ice, not stacked crates',
  'box geometry would have 24 verts per slab');

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
