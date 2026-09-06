/* "I CAN'T DRIVE BACKWARDS" — r304.
 *
 * The physics could, all along (hard brake >= 0.6 held 0.45 s at standstill
 * engages reverse gear, 5 m/s² — r288's law, unchanged). What broke it in
 * the hands was everything AROUND the gear:
 *
 *   1. AUTO-GAS (both touch schemes): throttle snapped to 1 the instant the
 *      pedal lifted, cancelling any reverse the moment the thumb moved to
 *      steer. Backing out of a wall was press-creep-lurch, forever.
 *   2. THE MISSED-GATE RETURN yanked a player who was driving BACK to the
 *      gate — §3.2 says "UNCORRECTED, returnToGate", and a player closing
 *      on the gate is correcting. With §3.5's silence there was nothing on
 *      screen to say why the snap happened, so it read as reverse refusing.
 *
 *   node tests/test-reverse.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg, extra); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

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
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
    get elapsedTime() { return elapsed; } };
  const park = (off = Math.floor(N / 2)) => {   // clear of the pack
    pl.placeAt((33 + off) % N, 0, true);
    pl.vel.set(0, 0, 0); pl.speedAlong = 0; pl.reverseTimer = 0;
  };
  const kmh = () => Math.hypot(pl.vel.x, pl.vel.z) * 3.6;

  // ---- 1. the BRAKE pedal reverses, on the two-thumb scheme -------------
  g.input.autoThrottle = true;
  park();
  const idx0 = pl.trackIndex;
  g.input.keys.add('ArrowDown');
  for (let f = 0; f < 150; f++) g._frameBody();      // 2.5 s of held pedal
  const pedal = { speed: +pl.speedAlong.toFixed(1), kmh: +kmh().toFixed(0),
    backed: ((idx0 - pl.trackIndex) + N) % N };

  // ---- 2. lifting the pedal COASTS while still rolling backwards --------
  g.input.keys.delete('ArrowDown');
  let minAfter = 0, maxAfter = -99;
  for (let f = 0; f < 60; f++) {                     // 1 s after release
    g._frameBody();
    minAfter = Math.min(minAfter, pl.speedAlong);
    maxAfter = Math.max(maxAfter, pl.speedAlong);
  }
  const coast = { minAfter: +minAfter.toFixed(1), maxAfter: +maxAfter.toFixed(1) };
  // ...and once the roll dies, auto-gas resumes and pulls forward again
  for (let f = 0; f < 300; f++) g._frameBody();
  const resumes = pl.speedAlong;

  // ---- 3. keyboard (no auto-gas) reverses too ---------------------------
  g.input.autoThrottle = false;
  park();
  g.input.keys.add('ArrowDown');
  for (let f = 0; f < 150; f++) g._frameBody();
  const keyboard = +pl.speedAlong.toFixed(1);
  g.input.keys.delete('ArrowDown');

  return { pedal, coast, resumes: +resumes.toFixed(1), keyboard };
});

ok(R.pedal.speed < -3 && R.pedal.backed > 0,
  'holding the BRAKE pedal at standstill backs the car up (two-thumb auto-gas)',
  `${R.pedal.speed} m/s (${R.pedal.kmh} km/h), ${R.pedal.backed} samples back in 2.5 s`);
ok(R.coast.maxAfter < 1,
  'lifting the pedal mid-reverse COASTS — auto-gas no longer slams it forward',
  `speed stayed in [${R.coast.minAfter}, ${R.coast.maxAfter}] m/s for 1 s after release`);
ok(R.resumes > 2,
  'once the backward roll dies, auto-gas resumes and pulls forward again',
  `${R.resumes} m/s five seconds after release`);
ok(R.keyboard < -3, 'the down arrow reverses on keyboard too', `${R.keyboard} m/s`);

// ---- 4. §3.2 "uncorrected": driving BACK to a missed gate is respected ----
const G = await p.evaluate(async () => {
  const g = window.__game, pl = g.player, N = g.track.center.length;
  let returns = 0;
  const realLog = g.telemetry.log.bind(g.telemetry);
  g.telemetry.log = (k, d) => { if (k === 'return') returns++; return realLog(k, d); };
  const owed = g.route?.gates?.[pl._nextGate ?? 0];
  if (!owed) return { noRoute: true };
  // overshoot the owed gate, then DRIVE BACK toward it the whole time
  pl.placeAt((owed.si + 40) % N, 0, true);
  pl.vel.set(0, 0, 0);
  g.input.keys.delete('ArrowDown'); g.input.analog.throttle = 0; g.input.analog.brake = 0;
  for (let f = 0; f < 390; f++) {                    // 6.5 s — well past the 4 s grace
    const dx = owed.x - pl.pos.x, dz = owed.z - pl.pos.z;
    const d = Math.hypot(dx, dz) || 1;
    // hold a straight 8 m/s toward the gate, the shape of a player correcting
    pl.vel.set((dx / d) * 8, 0, (dz / d) * 8);
    pl.heading = Math.atan2(dx / d, dz / d);
    g._frameBody();
    if (f % 120 === 0) await new Promise((rs) => setTimeout(rs, 0));
  }
  const whileCorrecting = returns;
  // now STOP correcting: stand still past the gate again — grace resumes
  pl.placeAt((owed.si + 40) % N, 0, true);
  pl.vel.set(0, 0, 0);
  pl._nextGate = owed.id; pl._gateAlong = undefined;
  for (let f = 0; f < 330 && returns === whileCorrecting; f++) g._frameBody();
  return { whileCorrecting, afterStopping: returns };
});
if (G.noRoute) ok(false, 'the race has a route to miss a gate on');
else {
  ok(G.whileCorrecting === 0,
    'driving back toward the missed gate is CORRECTING — no yank, however long it takes',
    `${G.whileCorrecting} returns in 6.5 s of closing on the gate`);
  ok(G.afterStopping > G.whileCorrecting,
    'stopping again is uncorrected — the grace resumes and the return still fires',
    `${G.afterStopping} return(s) once parked past the gate`);
}
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
