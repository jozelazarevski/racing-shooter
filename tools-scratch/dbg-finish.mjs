/* R-FINISH-01 acceptance, stated as properties rather than a drive:
 *  F1 a return to gate 0 seats the car BEFORE the line, not on it
 *  F2 that return does not gain or lose a lap (progress stays honest)
 *  F3 a real crossing after such a return counts, so finishRace is reachable
 *  F4 a teleport across the line is never itself a crossing
 *  F5 the ordinary lap path still counts a lap                          */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 21);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,
  { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 500 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const c = g.player, ALL = 0b1111;
  const out = {};
  const armed = () => { c._cpMask = ALL; c._midCP = true; c._everCP1 = true; };

  // F1 / F2 — return to gate 0 from just before the line on lap 1
  c.lap = 1; c._wraps = 1; c.placeAt(Math.round(N * 0.9), 0, true); armed();
  const lapBefore = c.lap, progBefore = c.lap + c.trackIndex / N;
  g.returnToGate(c, 0, 'test');
  out.seatIndexFrac = +(c.trackIndex / N).toFixed(3);
  out.F1_seatedBeforeLine = c.trackIndex > N * 0.85;
  out.lapAfter = c.lap;
  out.progAfter = +(c.lap + c.trackIndex / N).toFixed(2);
  out.F2_progressHonest = Math.abs((c.lap + c.trackIndex / N) - progBefore) < 0.2;

  // F4 — the placement itself must not have counted as a crossing
  out.F4_teleportNotACrossing = c.checkLap(Math.round(N * 0.9)) === false;

  // F3 — a REAL crossing after that return counts
  armed();
  c._teleportFrames = 0;                 // two frames of immunity have passed
  const prev = Math.round(N * 0.95);
  c.trackIndex = Math.round(N * 0.02);
  out.F3_realCrossingCounts = c.checkLap(prev) === true;
  out.lapAfterCrossing = c.lap;

  // F5 — ordinary lap path, no teleport anywhere near it
  c.lap = 1; c._wraps = 1; c._teleportFrames = 0; armed();
  c.trackIndex = Math.round(N * 0.03);
  out.F5_ordinaryLapCounts = c.checkLap(Math.round(N * 0.97)) === true;

  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
