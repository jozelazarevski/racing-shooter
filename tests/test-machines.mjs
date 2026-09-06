/* r312 MACHINES DIFFER — the user's law, verbatim: "not all cars have same
 * 0-100kmph so start should be different same with turnings corner handling
 * etc."
 *
 * Three claims, each measured on the real engine, not read off the cards:
 *   M1  0-100 SPREADS ACROSS THE CATALOGUE, measured on a dry sealed
 *       circuit (MONZA). FLATSIX (the ACC headline holder, 42) launches
 *       quickest; the 36-accel sealed machines trail their 39+ siblings;
 *       the spread is a real ≥0.6 s; the BRAWLER — the accelRef datum —
 *       sits mid-pack (its tight FT5 anchor stays drivingspec 12.1's).
 *   M2  CORNERING DIFFERS: the SLEEK (grip 5.65, steer 2.75) turns through
 *       more heading than the CROWN (4.60, 2.35) from the same entry.
 *   M3  THE GRID DRIVES ITS MACHINES: rivals carry their catalogue car's
 *       stats at the 0.96 handicap — grips heterogeneous, the DUNE rival
 *       keeps its sand feet while the CROWN rival does not, and no rival
 *       out-runs its own showroom car.
 *
 * The player swaps ride the REAL path (game.swapPlayerCar), so the wiring
 * of steer/driftL through the swap site is under test, not just physics.
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
// M1 runs on MONZA — dry and SEALED. Two earlier cuts of this test measured
// the wrong thing: on PINE VALLEY the stage's first corner arrived before a
// 36-accel machine reached 100 (the clock timed the CORNER), and on NEON
// GRID the glass-asphalt is surface:'wet', where keep() lets the OFF-ROAD
// stat buy back traction — so the ALPINE and DUNE launched quickest, which
// is that world telling the truth, not this test's question. A dry circuit
// asks only the drivetrain and the tyre. The drivingspec-12.4 loop-back hop
// makes one endless straight: every 1.5 s the car returns to the same
// sample CARRYING its speed.
await p.goto(`${BASE}/?level=39&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player && window.__CARS,
  undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const dt = 1 / 60;
  const place = (idx, speedU = 0) => {
    const c = g.player;
    const pt = t.pointAt(idx, 0);
    c.alive = true; c.health = c.maxHealth; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = idx; c.lateral = 0; c.heading = t.headingAt(idx);
    c.slip = 0; c.steerSmooth = 0; c._hbKick = 0; c._hbHeld = false;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(speedU);
  };
  const kmh = () => Math.hypot(g.player.vel.x, g.player.vel.z) * 3.6;

  // ---- M1: 0-100 per machine, through the real swap path ----
  const launches = [];
  for (const entry of window.__CARS) {
    // The garage sets the selection BEFORE the swap (main.js buy/select
    // path) — applyUpgrades reads the tyre class off cars.selected, so a
    // bare swapPlayerCar would launch every machine on the old car's tyres.
    g.cars.selected = entry.key;
    g.swapPlayerCar(entry);
    const c = g.player;
    place(10, 0);
    let t100 = null;
    for (let k = 0; k < 900 && t100 === null; k++) {
      if (k > 0 && k % 90 === 0) place(10, Math.hypot(c.vel.x, c.vel.z));
      c.step(dt, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
      if (kmh() >= 100) t100 = +(k / 60).toFixed(2);
    }
    launches.push({ name: entry.name, accel: +c.accel.toFixed(1), t100,
      steerRate: c.steerRate, driftLag: c.driftLag });
  }

  // ---- M3: the grid, read straight off the spawned rivals ----
  const showroom = (nm) => window.__CARS.find((e) => e.name === nm)?.stats;
  const rivals = (g.enemies ?? []).map((e) => ({
    name: e.name, grip: +e.grip.toFixed(2), accel: +e.accel.toFixed(1),
    off: e.offroadSkill, max: +e.maxSpeed.toFixed(1),
    showMax: showroom(e.name)?.maxSpeed ?? null,
  }));

  return { launches, rivals };
});

// ---- M2: cornering on GOTTHARD's high meadow (drivingspec 12.5's open
// plane), with |v| RE-NORMALISED to 70 km/h every frame. The first cut let
// each car keep its scrubbed speed and the CROWN "out-turned" the SLEEK by
// going slower into a tighter circle; holding speed constant makes the
// heading integral measure grip + steer authority and nothing else. ----
await p.goto(`${BASE}/?level=19&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player && window.__CARS,
  undefined, { timeout: 300000 });
const r2 = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  g.state = 'race'; g.freeRoam = true; g.missionMode = false;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const corner = (name) => {
    const entry = window.__CARS.find((e) => e.name === name);
    g.cars.selected = entry.key;
    g.swapPlayerCar(entry);
    const c = g.player;
    const x = 780, z = 300, v0 = 70 / 3.6;
    c.alive = true; c.health = c.maxHealth; c.airborne = false; c.vy = 0;
    c.pos.set(x, t.terrainHeight(x, z) + 0.4, z); c.y = c.pos.y;
    c.heading = Math.atan2(-x, -z); c.trackIndex = t.nearestIndex(c.pos);
    c.slip = 0; c.steerSmooth = 0; c._hbKick = 0;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(v0);
    let turned = 0, prev = c.heading;
    for (let k = 0; k < 120; k++) {
      const sp = Math.hypot(c.vel.x, c.vel.z);
      if (sp > 0.5) { c.vel.x *= v0 / sp; c.vel.z *= v0 / sp; }
      c.step(1 / 60, { throttle: 0.5, brake: 0, steer: 1, drift: false, hold: false });
      const d = ((c.heading - prev + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      turned += Math.abs(d); prev = c.heading;
    }
    return +(turned * 180 / Math.PI).toFixed(0);
  };
  return { yawSleek: corner('SLEEK'), yawCrown: corner('CROWN') };
});
r.yawSleek = r2.yawSleek; r.yawCrown = r2.yawCrown;

const byName = (nm) => r.launches.find((l) => l.name === nm);
const times = r.launches.filter((l) => l.t100 !== null).map((l) => l.t100);
const quickest = r.launches.reduce((a, b) => ((b.t100 ?? 99) < (a.t100 ?? 99) ? b : a));
const slowest = r.launches.reduce((a, b) => ((b.t100 ?? 0) > (a.t100 ?? 0) ? b : a));
const lLine = r.launches.map((l) => `${l.name} ${l.t100}s`).join(', ');

check('M1a  every machine reaches 100 km/h', times.length === r.launches.length, lLine);
check('M1b  FLATSIX (ACC 42, sealed specialist) launches quickest on the dry circuit',
  quickest.name === 'FLATSIX', `quickest: ${quickest.name} ${quickest.t100}s`);
check('M1c  the low-accel sealed machines pay: CROWN 0.6s+ behind FLATSIX, PIT-99 behind SLEEK',
  byName('CROWN')?.t100 - byName('FLATSIX')?.t100 >= 0.6
    && byName('PIT-99')?.t100 > byName('SLEEK')?.t100,
  `CROWN ${byName('CROWN')?.t100}s / FLATSIX ${byName('FLATSIX')?.t100}s / `
    + `PIT-99 ${byName('PIT-99')?.t100}s / SLEEK ${byName('SLEEK')?.t100}s`);
check('M1d  the 0-100 spread is real: >= 0.6 s across the catalogue',
  Math.max(...times) - Math.min(...times) >= 0.6,
  `spread ${(Math.max(...times) - Math.min(...times)).toFixed(2)}s`);
check('M1e  BRAWLER (the accelRef datum) sits mid-pack: behind FLATSIX, ahead of CROWN',
  byName('BRAWLER')?.t100 > byName('FLATSIX')?.t100
    && byName('BRAWLER')?.t100 < byName('CROWN')?.t100,
  `BRAWLER ${byName('BRAWLER')?.t100}s (FT5 anchor itself is drivingspec 12.1's)`);
check('M1f  the swap path carries steer/driftL (SLEEK 2.75/0.19)',
  byName('SLEEK')?.steerRate === 2.75 && byName('SLEEK')?.driftLag === 0.19,
  `steerRate ${byName('SLEEK')?.steerRate}, driftLag ${byName('SLEEK')?.driftLag}`);

check('M2   SLEEK out-turns CROWN from the same 70 km/h entry (>= 5%)',
  r.yawSleek > r.yawCrown * 1.05, `SLEEK ${r.yawSleek}° vs CROWN ${r.yawCrown}°`);

const grips = new Set(r.rivals.map((v) => v.grip.toFixed(1)));
const dune = r.rivals.find((v) => v.name === 'DUNE');
const crownR = r.rivals.find((v) => v.name === 'CROWN');
const overShowroom = r.rivals.filter((v) => v.showMax !== null && v.max >= v.showMax);
check('M3a  rival grips are heterogeneous (>= 4 distinct)', grips.size >= 4,
  `${[...grips].join(', ')}`);
check('M3b  DUNE rival keeps its sand feet; CROWN rival does not',
  !!dune && !!crownR && dune.off > crownR.off + 0.3,
  `DUNE off ${dune?.off} vs CROWN off ${crownR?.off}`);
check('M3c  no rival out-runs its own showroom car', overShowroom.length === 0,
  overShowroom.map((v) => `${v.name} ${v.max} >= ${v.showMax}`).join('; ') || 'grid holds the 0.96 handicap');
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await p.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe machines differ');
process.exit(fail ? 1 : 0);
