/* RALLY_PATCH_02 §5 — the acceptance tests that map onto this engine.
 *
 *   P2.1   rival damage during countdown         hull unchanged to GO+1.5
 *   P2.2   wall scrape at speed, shallow angle   hull loss 0
 *   P2.3   head-on boulder at 100 km/h           loss <= 45 (the cap)
 *   P2.6   grounded on the canyon rim 2 s        free auto-return, SOS intact
 *   P2.8   nose to wall at 20, hold steer        heading near tangent in 1.5 s
 *   P2.10  grid's first line crossing            no CHECKPOINT MISSED
 *
 * P2.4 (per-tick aggro) is guarded by the ticket office's own cap constant;
 * P2.5/P2.7/P2.9/P2.11 need a recorded-input rig and stay with the suite-
 * redesign task.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=2&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const out = {};

  // P2.1 — grid invulnerability: startRace arms invuln through GO + 1.5
  g.state = 'title';
  g.startRace?.() ?? (g.state = 'countdown');
  const h0 = c.health;
  c.damage(25, g.enemies?.[0] ?? null);           // a rival shot on the grid
  out.p21 = { hull: c.health, was: h0, invuln: +c.invuln.toFixed(1) };

  // set up a race context for the rest
  g.state = 'race'; g.raceTime = 30; c.invuln = 0; c.alive = true; c.health = 100;

  // P2.2 — glancing rock contact (square 0.2 ≈ 11°) at high speed: free
  const rock = { x: 0, z: 0, r: 3, mat: 'stone' };
  const before22 = c.health;
  g.onSolidCrash(rock, c, 45, 1, 0, 0.2);
  out.p22 = { loss: +(before22 - c.health).toFixed(1) };

  // P2.3 — head-on boulder at 100 km/h (27.8 u/s): capped at 45
  c._wdmgAt = -9; c._wdmgSum = 0; c.health = 100;
  g.onSolidCrash(rock, c, 27.8, 1, 0, 1.0);
  out.p23 = { loss: +(100 - c.health).toFixed(1) };

  // P2.8 — nose into a wall at 20 km/h, 90° to the road, holding steer:
  // heading closes on the tangent inside 1.5 s
  const idx = 60, pt = t.pointAt(idx, 0);
  c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
  c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
  c.trackIndex = idx; c.lateral = 0;
  const tangent = t.headingAt(idx);
  c.heading = tangent + Math.PI / 2;              // parked square across the road
  c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(20 / 3.6);
  c._wallTouchT = 0; c.slip = 0;
  let minOff = Math.PI;
  for (let k = 0; k < 90; k++) {
    c._wallTouchT = 0.3;                          // pinned on the wall throughout
    c.step(1 / 60, { throttle: 0, brake: 0, steer: 1, drift: false, hold: false });
    let off = c.heading - t.headingAt(c.trackIndex);
    while (off > Math.PI) off -= 2 * Math.PI;
    while (off < -Math.PI) off += 2 * Math.PI;
    minOff = Math.min(minOff, Math.abs(off));
  }
  out.p28 = { minOffDeg: Math.round(minOff * 180 / Math.PI) };

  // P2.10 — the grid's first crossing arms nothing and shouts nothing
  c._cpMask = 0; c._midCP = false; c._everCP1 = false; c._missedCP = false;
  c._wraps = 0;
  const N = t.center.length;
  c.trackIndex = Math.floor(N * 0.05);
  c.checkLap(Math.floor(N * 0.9));                // grid-behind-the-line crossing
  out.p210 = { missed: !!c._missedCP, wraps: c._wraps };

  // P2.6 — canyon-rim auto-return is FREE: simulate the cliff state directly
  const sosBefore = c.sos ?? 0;
  c._cliffT = 2.1; c._wedgeT = 0; c._lostT = 0; c.alive = true;
  g.freeRoam = false; g.state = 'race';
  c.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
  out.p26 = { cliffT: +(c._cliffT ?? 0).toFixed(1), sos: c.sos ?? 0, sosBefore };

  return out;
});

check('P2.1  no hull lost on the grid (invuln through GO+1.5)',
  r.p21.hull === r.p21.was && r.p21.invuln > 0,
  `hull ${r.p21.was} -> ${r.p21.hull}, invuln ${r.p21.invuln}s`);
check('P2.2  a shallow scrape at speed is paint, not hull', r.p22.loss === 0, `lost ${r.p22.loss}`);
check('P2.3  a head-on at 100 km/h costs at most the 45 cap', r.p23.loss > 0 && r.p23.loss <= 45,
  `lost ${r.p23.loss}`);
check('P2.6  the canyon rim rescue is free', r.p26.cliffT === 0 && r.p26.sos === r.p26.sosBefore,
  `cliffT ${r.p26.cliffT}, SOS ${r.p26.sosBefore} -> ${r.p26.sos}`);
check('P2.8  wall escape turns the nose toward the road inside 1.5 s', r.p28.minOffDeg <= 30,
  `closest ${r.p28.minOffDeg}° off tangent`);
check('P2.10 the grid crossing is silent and inert', !r.p210.missed, `missed=${r.p210.missed}`);
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await p.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe race is fixed around the car');
process.exit(fail ? 1 : 0);
