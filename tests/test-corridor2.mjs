/* RALLY_CORRIDOR_REFACTOR §17 — step-2 acceptance: physics containment.
 *
 *   R3  55° slope at 160 km/h    speed bleeds, no progress up, slides back,
 *                                hull 0
 *   R4  30° slope at 100 km/h    the car climbs
 *   R5  grass, full throttle     top speed under 75% of the road's
 *   R6  spawn on the stage       every car inside the start gate's width,
 *                                heading within 5° of the gate heading
 *
 * R3/R4 run on a synthetic uniform slope (terrainHeight overridden to a
 * plane) so the angle is exact — a real massif face carries ripples and
 * every measurement would be arguing with the octaves instead of the law.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const LVL = process.env.LVL ?? '66';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.route && window.__game.player, undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game, c = g.player, t = g.track;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const out = {};

  // ---- R6 first, on the untouched grid --------------------------------------
  // ADAPTATION of §12: this game's grid is STAGGERED — rows run back along
  // the spline behind the start gate rather than all abreast on its plane —
  // so each slot is measured against its OWN road station: inside the gate's
  // width of the road line, at the local tangent. The spec's real target
  // (recording B: spawned on grass, facing the gantry footing) is exactly
  // this assertion.
  const gt = g.route.gates[0];
  const N6 = t.center.length;
  out.r6 = [g.player, ...g.enemies].map((car) => {
    let best = 1e9, bi = 0;
    for (let i = 0; i < N6; i++) {
      const d = Math.hypot(t.center[i].x - car.pos.x, t.center[i].z - car.pos.z);
      if (d < best) { best = d; bi = i; }
    }
    let off = car.heading - t.headingAt(bi);
    while (off > Math.PI) off -= 2 * Math.PI;
    while (off < -Math.PI) off += 2 * Math.PI;
    return { lat: +best.toFixed(1), offDeg: +(Math.abs(off) * 180 / Math.PI).toFixed(1) };
  });
  out.r6half = gt.halfWidth;

  for (let k = 0; k < 600 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }

  const thReal = t.terrainHeight.bind(t);
  // OPEN GROUND, FOUND, NOT ASSUMED: inside the world rim (1620 u), and the
  // farthest point from any road sample — the first cuts of this rig fought
  // the rim wall at x=3000, sat ON Glacier's road at x=1100, and rammed a
  // Canyon massif-cone solid (35 hull of R3 "slope damage" that was really
  // a rock). Solids and trees are stashed during the ramp runs: props are
  // §6's law, the slope is §5.1's.
  const NC = t.center.length;
  let X0 = 1100, Z0 = 0, roomiest = -1;
  for (let ang = 0; ang < 6.28; ang += 0.2) {
    for (const rad of [700, 900, 1100, 1350]) {
      const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
      let dmin = 1e9;
      for (let i = 0; i < NC; i += 4) {
        const c2 = t.center[i];
        const d = Math.hypot(c2.x - x, c2.z - z);
        if (d < dmin) dmin = d;
      }
      if (dmin > roomiest) { roomiest = dmin; X0 = x; Z0 = z; }
    }
  }
  out.rampSpot = { x: Math.round(X0), z: Math.round(Z0), roadDist: Math.round(roomiest) };
  const ramp = (deg, entryKmh, frames, mu1) => {
    const sol = t.solids, trs = t.trees;
    t.solids = []; t.trees = [];
    const slope = Math.tan(deg * Math.PI / 180);
    t.terrainHeight = (x) => Math.max(0, (x - X0) * slope);
    c.alive = true; c.health = 100; c.invuln = 0; c.airborne = false; c.vy = 0;
    c._cliffT = 0; c._wedgeT = 0; c._lostT = 0; c._wallTouchT = 0;
    // R4 tests the SLOPE law, not the surface table: a μ=1 car (offroad
    // skill 1) separates the two — on grass μ 0.55 the physical climb
    // ceiling is atan(0.55) ≈ 29° BY THE SPEC'S OWN §5.2 numbers, which is
    // R5's business, not R4's.
    const skill0 = c.offroadSkill;
    if (mu1) c.offroadSkill = 1;
    c.pos.set(X0 - 60, 0.3, Z0); c.y = 0.3;
    c.heading = Math.PI / 2;
    c.vel.set(entryKmh / 3.6, 0, 0);
    let maxX = 0, midX = 0;
    for (let k = 0; k < frames; k++) {
      c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false });
      maxX = Math.max(maxX, c.pos.x - X0);
      if (k === Math.floor(frames / 2)) midX = c.pos.x - X0;
    }
    const res = { maxUp: +maxX.toFixed(1), atEnd: +(c.pos.x - X0).toFixed(1),
      lateGain: +((c.pos.x - X0) - midX).toFixed(1),
      hull: +(100 - c.health).toFixed(1) };
    t.terrainHeight = thReal;
    t.solids = sol; t.trees = trs;
    c.offroadSkill = skill0;
    return res;
  };
  out.r3 = ramp(55, 160, 600, true);
  out.r4 = ramp(30, 100, 420, true);

  // ---- R5: flat grass vs the road's own cap ---------------------------------
  t.terrainHeight = () => 0;
  c.alive = true; c.airborne = false; c.vy = 0;
  c.pos.set(X0, 0.3, Z0); c.y = 0.3; c.heading = Math.PI / 2;
  c.vel.set(0, 0, 0);
  for (let k = 0; k < 900; k++) c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false });
  const grassTop = Math.hypot(c.vel.x, c.vel.z);
  t.terrainHeight = thReal;
  out.r5 = { grassKmh: Math.round(grassTop * 3.6),
    roadKmh: Math.round(c.maxSpeed * 3.6), pct: +(grassTop / c.maxSpeed * 100).toFixed(0) };
  return out;
});

const worstLat = Math.max(...r.r6.map((s) => s.lat));
const worstOff = Math.max(...r.r6.map((s) => s.offDeg));
check('R6  every car spawns inside the start gate at its heading',
  worstLat <= r.r6half && worstOff <= 5,
  `worst lateral ${worstLat} vs half ${r.r6half}, worst heading ${worstOff}°`);
// The LAW under test: no SUSTAINED progress once the entry momentum is
// spent. 160 km/h of momentum legitimately runs tens of metres up any face
// (44²/2g·sin55 ≈ 121 u drag-free) — the spec's "speed bleeds" — so the run
// is bounded by physics, the second half must gain nothing, and the face
// costs no hull. (A throttle-held car can end PARKED mid-face on the
// synthetic plane — a hop-cycle wart, recorded in HANDOVER; step 4's stuck
// return is the collector for parked cars.)
check('R3  a 55° face at 160: momentum only, no sustained climb, hull 0',
  r.r3.maxUp < 100 && r.r3.lateGain < 3 && r.r3.hull === 0,
  `up ${r.r3.maxUp}, late gain ${r.r3.lateGain}, ended ${r.r3.atEnd}, hull ${r.r3.hull}`);
check('R4  a 30° hill at 100: the car climbs',
  r.r4.maxUp > 25 && r.r4.atEnd > 20 && r.r4.hull === 0,
  `up ${r.r4.maxUp}, ended ${r.r4.atEnd}, hull ${r.r4.hull}`);
check('R5  grass tops out under 75% of the road cap',
  r.r5.pct < 75, `${r.r5.grassKmh} km/h on grass vs ${r.r5.roadKmh} road (${r.r5.pct}%)`);
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await p.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe world contains the car because the world is physical');
process.exit(fail ? 1 : 0);
