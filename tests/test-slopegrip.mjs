/* r330 — v2.3 §3.3: SLOPE GRIP. Above maxClimbDeg (35°) the wheel has no
 * drive (r298 law) and the car SLIDES DOWN instead of hanging — past the
 * onset window gravity acts on the body as a raw downhill push, fenced
 * outside the r328 rejoin band and on the goat-aware grade.
 *
 *   T1  a 55°+ wilds face driven at 60 km/h: peak within 5 s, then the car
 *       is shed (P2: slides back, never holds)
 *   T2  a car PARKED mid-face on the same slope slides down without input
 *   T3  flat off-road control: an idle car stays put (no phantom slide)
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 800, height: 520 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=25&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const r = await p.evaluate(async () => {
  const g = window.__game, t = g.track, pl = g.player, N = t.center.length;
  g.startRace?.();
  const f = () => new Promise((r2) => requestAnimationFrame(r2));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  // a genuinely steep face well beyond the rejoin band
  let spot = null;
  // r346: wider hunt — the 2x route runs through flatter neighborhoods,
  // and with the game-validated candidate gate below the old 70-120 u
  // sweep found nothing honest on world 12.
  for (let i = 0; i < N && !spot; i += 8) {
    const c = t.center[i], c2 = t.center[(i + 1) % N];
    let sx = c2.z - c.z, sz = -(c2.x - c.x);
    const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    for (const side of [1, -1]) {
      for (const dist of [70, 90, 120, 155, 195]) {
        const x = c.x + sx * side * dist, z = c.z + sz * side * dist;
        const E = 4;
        const gx = (t.terrainHeight(x + E, z) - t.terrainHeight(x - E, z)) / (2 * E);
        const gz = (t.terrainHeight(x, z + E) - t.terrainHeight(x, z - E)) / (2 * E);
        const gm = Math.hypot(gx, gz);
        if (gm < 1.4 || gm > 5) continue;
        const ux = gx / gm, uz = gz / gm;
        if ((t.terrainHeight(x + ux * 14, z + uz * 14) - t.terrainHeight(x, z)) / 14 < 1.0) continue;
        // r346: a face the GAME agrees is a face. At 2x this hunt's first
        // match on world 12 was the river gorge wall beneath an overpass —
        // the car seated at terr −12.6 and the deck capture lifted it to
        // +12.8, so T1 measured a road drive. Water checks missed it
        // (waterAt is 0 there); the honest validator is the game itself:
        // seat the car, run one input-free frame, and accept only a spot
        // where it stays put on the analytic ground.
        if (t.waterAt && (t.waterAt(x, z) > 0
          || t.waterAt(x - ux * 12, z - uz * 12) > 0
          || t.waterAt(x + ux * 20, z + uz * 20) > 0)) continue;
        const terrHere = t.terrainHeight(x, z);
        pl.pos.x = x; pl.pos.z = z; pl.y = terrHere;
        pl.vel.set(0, 0, 0); pl.vy = 0; pl.airborne = false;
        pl.invuln = 20; pl._lostT = 0; pl._wedgeT = 0; pl._voidT = 0; pl._steepT = 0;
        g.input.analog = { steer: 0, throttle: 0, brake: 0 };
        g.frame();
        // 6 u, not 3: on a 55°+ ridge the drawn mesh chord honestly cuts
        // a few units under the analytic curve and the game seats on the
        // mesh — the deck-capture defect this gate exists for snapped 25.
        if (Math.abs(pl.y - terrHere) > 6
          || Math.hypot(pl.pos.x - x, pl.pos.z - z) > 3) continue;
        spot = { x, z, ux, uz, grade: +gm.toFixed(2) };
        break;
      }
      if (spot) break;
    }
  }
  if (!spot) return { fail: 'no steep wilds face found' };
  const seat = (x, z, vx, vz) => {
    pl.pos.x = x; pl.pos.z = z; pl.y = t.terrainHeight(x, z);
    pl.vel.set(vx, 0, vz); pl.vy = 0; pl.airborne = false;
    pl.invuln = 20; pl._lostT = 0; pl._wedgeT = 0; pl._voidT = 0; pl._steepT = 0;
  };
  // T1: driven at the face at ~17 u/s
  seat(spot.x, spot.z, spot.ux * 17, spot.uz * 17);
  pl.heading = Math.atan2(spot.ux, spot.uz);
  const y0 = pl.y;
  let peakY = pl.y, peakAt = 0;
  for (let k = 0; k < 8 * 60; k++) {
    g.input.analog = { steer: 0, throttle: 1, brake: 0 };
    g.frame();
    if (pl.y > peakY) { peakY = pl.y; peakAt = k; }
  }
  const t1 = { grade: spot.grade, climb: +(peakY - y0).toFixed(1),
    peakAtS: +(peakAt / 60).toFixed(1), endBelowPeak: +(peakY - pl.y).toFixed(1) };
  // T2: parked mid-face — the face sheds the car (touch auto-gas means a
  // real player is never truly input-free, so throttle is held: above the
  // ceiling drive is authority-less anyway and the slide must win)
  const midX = spot.x + spot.ux * 8, midZ = spot.z + spot.uz * 8;
  seat(midX, midZ, 0, 0);
  pl.heading = Math.atan2(spot.ux, spot.uz);
  const yMid = pl.y;
  // r346: measure the DEEPEST descent during the run, not the end state —
  // on HIGHCROWN the shed car slid clean off the face into a kill-return
  // (moved 458 u, final drop 0.3) and the old meter passed on the
  // teleport's displacement. A slide shows y going DOWN before any rescue;
  // a return cannot fake that.
  let minY = pl.y;
  for (let k = 0; k < 4 * 60; k++) {
    g.input.analog = { steer: 0, throttle: 1, brake: 0 };
    g.frame();
    if (pl.y < minY) minY = pl.y;
  }
  const t2 = { dropped: +(yMid - minY).toFixed(1),
    moved: +Math.hypot(pl.pos.x - midX, pl.pos.z - midZ).toFixed(1) };
  // T3: flat off-road control — idle car stays put
  let flat = null;
  for (let i = 0; i < N && !flat; i += 20) {
    const c = t.center[i], c2 = t.center[(i + 1) % N];
    let sx = c2.z - c.z, sz = -(c2.x - c.x);
    const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    const x = c.x + sx * 45, z = c.z + sz * 45;
    const E = 4;
    const gx = (t.terrainHeight(x + E, z) - t.terrainHeight(x - E, z)) / (2 * E);
    const gz = (t.terrainHeight(x, z + E) - t.terrainHeight(x, z - E)) / (2 * E);
    if (Math.hypot(gx, gz) < 0.08) flat = { x, z };
  }
  let t3 = { skip: true };
  if (flat) {
    seat(flat.x, flat.z, 0, 0);
    let maxSteepT = 0;
    for (let k = 0; k < 3 * 60; k++) {
      g.input.analog = { steer: 0, throttle: 1, brake: 0 };
      g.frame();
      maxSteepT = Math.max(maxSteepT, pl._steepT ?? 0);
    }
    t3 = { maxSteepT: +maxSteepT.toFixed(2) };
  }
  return { t1, t2, t3 };
});

if (r.fail) { check('setup', false, r.fail); }
else {
  check('T1  55°+ face at 60 km/h: peak early, then shed (P2)',
    r.t1.peakAtS <= 5 && r.t1.endBelowPeak >= 2, JSON.stringify(r.t1));
  check('T2  parked mid-face: the face sheds the car without input',
    r.t2.dropped >= 2 || r.t2.moved >= 4, JSON.stringify(r.t2));
  check('T3  flat off-road: the slide law never engages',
    r.t3.skip === true || r.t3.maxSteepT === 0, JSON.stringify(r.t3));
}
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe mountain sheds what it cannot hold');

// r346: the verdict must reach the exit code (the test-strip lesson).
process.exit(fail ? 1 : 0);
