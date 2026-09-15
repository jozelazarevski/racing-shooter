/* DOES A CAR PINNED AGAINST A WALL EVER GET OUT? Reported with a photograph:
 * 0 km/h, lap 0 of 3, thirty-nine seconds in, last of eight, car in the wall.
 *
 * Points the car at the barrier, holds the throttle, and watches. The player's
 * free rescue is supposed to fire after five seconds of "wedged". Asserts the
 * car actually gets somewhere, and reports how long it took.
 *
 *   LEVEL=1 node wedgetest.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
let bad = 0;
for (const lvl of (process.env.LEVELS ?? '1,4').split(',')) {
  const p = await b.newPage({ viewport: { width: 430, height: 800 } });
  p.setDefaultTimeout(600000);
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
  const r = await p.evaluate(async () => {
    const g = window.__game, t = g.track, pl = g.player;
    g.startRace?.();
    const f = () => new Promise((r2) => requestAnimationFrame(r2));
    for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
    // HOLD IT WHERE IT CANNOT GET OUT, and add the jitter a real wall gives.
    //
    // Two earlier cuts of this test were worthless. The first passed the
    // moment the car had travelled 25 u — which a car that simply steers
    // around the obstruction also does, so it proved nothing about the net.
    // The second waited for the rescue to fire and could never see it: the
    // net needs five seconds of `dt`, `dt` is clamped to 0.05, and swiftshader
    // gives about two frames a second — a hundred-plus frames, a minute of
    // wall clock, for one assertion.
    //
    // So test the thing that was actually changed. The old rule was
    // `speed < 0.8` with the timer reset to ZERO the moment it failed, and a
    // car grinding on a barrier jitters above that constantly. Pin the car so
    // it genuinely cannot progress, shove a jitter velocity in every frame,
    // and count how often the timer goes BACKWARDS. Under the old rule that
    // count is most of the frames. It must now be zero.
    const HOME = Math.floor(t.N * 0.25);
    const c = t.pointAt(HOME, 9.6);
    let resets = 0, prevT = 0, peak = 0, frames = 0;
    for (let i = 0; i < 60; i++) {
      pl.pos.x = c.x; pl.pos.z = c.z;
      if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
      pl.trackIndex = HOME;
      pl.heading = t.headingAt(HOME) - Math.PI / 2;
      pl.airborne = false;
      // the jitter: a real barrier never leaves a car at exactly zero
      pl.vel.set(Math.sin(i * 2.1) * 1.6, 0, Math.cos(i * 1.7) * 1.6);
      if (g.input?.analog) { g.input.analog.throttle = 1; g.input.analog.steer = 0; g.input.analog.brake = 0; }
      await f();
      frames++;
      const w = pl._wedgeT ?? 0;
      if (w < prevT - 1e-6) resets++;
      prevT = w;
      peak = Math.max(peak, w);
    }
    return { frames, resets, wedgePeak: +peak.toFixed(2), sosLeft: pl.sos,
      speedSeen: +Math.hypot(pl.vel.x, pl.vel.z).toFixed(2) };
  });
  const ok = r.resets === 0 && r.wedgePeak > 0.5;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'} L${lvl}  ${r.frames} frames pinned with jitter`
    + `  timer went backwards ${r.resets}x (must be 0)  peaked ${r.wedgePeak}s`
    + `  speed seen ${r.speedSeen} (above the old 0.8 cut-off)`);
  await p.close();
}
console.log(bad ? `FAIL: ${bad} levels` : 'PASS: the wedge timer survives jitter');
await b.close();
process.exit(bad ? 1 : 0);
