/* "WHEN I DRIFT IT DOES NOT SEEM IT HELPING ME TURN. BUT JUST SLIDING."
 *
 * r307. Measured before the fix: a 2 s handbrake drift at 70 km/h, full
 * steer, yawed the nose 52 degrees while scrubbing 70 -> 2 km/h. The slide
 * existed; the turn did not. Three laws close it:
 *   - the kinetic scrub ceiling drops to driftScrubCap x budget while the
 *     handbrake is held (locked tyres are unloaded, not a 2.3 g anchor)
 *   - the drift reward returns driftReward of the scrubbed slide as
 *     forward speed while held, so the drift carries momentum
 *   - CLAUDE.md 4.4 drift assist: 15-65 degrees of slip with the
 *     handbrake held adds rotation TOWARD the steer; past the spin angle
 *     it stops — the spin is earned
 * FT3 (spec 4.1) rides along: slip > 40 degrees within 0.5 s of the pull.
 *
 *   node tests/test-drift.mjs
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (c, m, e = '') => { if (c) { pass++; console.log('PASS ', m, e); } else { fail++; console.log('FAIL ', m, e); } };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
const errors = [];
p.on('pageerror', (e) => errors.push(String(e.message)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });
const R = await p.evaluate(() => {
  const g = window.__game, pl = g.player, N = g.track.center.length;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  // r310: the start rotation moved every index-to-world mapping, and the
  // blind mid-lap spot landed on a bend where full-lock GRIP also rotated
  // hard (114 deg) - the ratio gate measured the road, not the law. The
  // runs stage on the straightest, flattest stretch instead.
  const t = g.track;
  const rad = (i) => {
    const a = t.center[(i - 6 + N) % N], b = t.center[i % N], c = t.center[(i + 6) % N];
    const abx = b.x - a.x, abz = b.z - a.z, bcx = c.x - b.x, bcz = c.z - b.z;
    const cross = abx * bcz - abz * bcx;
    if (Math.abs(cross) < 1e-6) return 1e9;
    const ab = Math.hypot(abx, abz), bc = Math.hypot(bcx, bcz), ac = Math.hypot(c.x - a.x, c.z - a.z);
    return (ab * bc * ac) / (2 * Math.abs(cross));
  };
  let stage = 40, best = -1;
  for (let i = 40; i < N - 40; i += 7) {
    let w = 1e9, climb = 0;
    for (let j = 0; j < 40; j += 5) {
      w = Math.min(w, rad((i + j) % N));
      climb = Math.max(climb, Math.abs(t.center[(i + j) % N].y - t.center[i].y));
    }
    const score = Math.min(w, 2000) - climb * 50;
    if (score > best) { best = score; stage = i; }
  }
  // the runs measure the LAW, not the rock lottery: colliders come out for
  // the staged physics and go straight back (test-shortcut's own doctrine)
  const kept = { o: t.obstacles, s: t.solids, b: t.barriers, tr: t.trees };
  t.obstacles = []; t.solids = []; t.barriers = []; t.trees = [];
  const run = (drift, kmh0) => {
    pl.placeAt(stage, 0, true);
    const v0 = kmh0 / 3.6;
    pl.vel.set(Math.sin(pl.heading) * v0, 0, Math.cos(pl.heading) * v0);
    pl.speedAlong = v0; pl.airborne = false;
    const h0 = pl.heading;
    let slipAt05 = 0, maxSlip = 0;
    for (let f = 0; f < 120; f++) {
      pl.step(1 / 60, { throttle: 0.6, brake: 0, steer: 1, drift, hold: false });
      const slip = Math.abs(wrap(pl.heading - Math.atan2(pl.vel.x, pl.vel.z))) * 180 / Math.PI;
      maxSlip = Math.max(maxSlip, slip);
      if (f === 29) slipAt05 = slip;
    }
    return { turn: Math.abs(wrap(pl.heading - h0)) * 180 / Math.PI,
      slipAt05, maxSlip, endKmh: Math.hypot(pl.vel.x, pl.vel.z) * 3.6 };
  };
  const out = { d70: run(true, 70), p70: run(false, 70), d110: run(true, 110) };
  t.obstacles = kept.o; t.solids = kept.s; t.barriers = kept.b; t.trees = kept.tr;
  return out;
});
ok(R.d70.turn > 90, 'a 2 s handbrake drift at 70 km/h actually TURNS the car (>90°)',
  `${R.d70.turn.toFixed(0)}° (was 52° when this was reported)`);
ok(R.d70.endKmh > 25, 'and it carries momentum through the corner instead of parking',
  `exits at ${R.d70.endKmh.toFixed(0)} km/h (was 2)`);
ok(R.d70.slipAt05 > 40, 'FT3: slip > 40° within 0.5 s of the pull',
  `${R.d70.slipAt05.toFixed(0)}°`);
// 1.2x, not 1.8x: the original grip figure (34 deg) was a car scrubbing
// to a stop against scenery at the old probe spot. On honest flat ground
// full-lock GRIP legitimately turns ~124 deg in 2 s at 70 (v/r kinematics
// give ~111); the drift's edge is turning MORE while KEEPING SPEED (the
// exit-speed law above), not multiplying the arc.
ok(R.d70.turn > R.p70.turn * 1.2,
  'drifting turns the car harder than gripping at the same speed',
  `drift ${R.d70.turn.toFixed(0)} deg vs grip ${R.p70.turn.toFixed(0)} deg`);
ok(R.d110.turn > 90 && R.d110.endKmh > 45,
  'the same story holds at 110 km/h',
  `${R.d110.turn.toFixed(0)}°, exits ${R.d110.endKmh.toFixed(0)} km/h`);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
