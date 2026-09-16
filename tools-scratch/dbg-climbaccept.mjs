/* MASTER FIX-6 acceptance: constant full throttle up a mandated climb —
 * on sustained >=8% grade above 80% of flat top, speed must FALL. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player, N = t.center.length;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  // find the start of the longest sustained climb
  let best = 0, bl = 0;
  for (let i = 0; i < N; i++) {
    let len = 0;
    while (len < N && (t.slopeAt?.((i + len) % N) ?? 0) > 0.08) len++;
    if (len > bl) { bl = len; best = i; }
  }
  // enter the climb FAST (above 80% top): place 40 samples before, at 90% top
  const i0 = (best - 40 + N) % N;
  const pt = t.center[i0];
  c.pos.set(pt.x, pt.y + 0.4, pt.z); c.y = c.pos.y; c.trackIndex = i0;
  c.heading = t.headingAt(i0);
  const v0 = c.maxSpeed * 0.9;
  c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(v0);
  const log = [];
  let violations = 0, prevV = v0, worst = 0;
  for (let k = 0; k < 60 * 40; k++) {
    // steer along the line, full throttle, never brake
    const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
    const aim = t.center[(c.trackIndex + Math.max(4, Math.round(14 / su))) % N];
    let a = Math.atan2(aim.x - c.pos.x, aim.z - c.pos.z) - c.heading;
    while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
    c.step(1 / 60, { throttle: 1, brake: 0, steer: Math.max(-1, Math.min(1, a * 1.8)), drift: false, hold: false });
    const v = Math.hypot(c.vel.x, c.vel.z);
    const s = t.slopeAt?.(c.trackIndex) ?? 0;
    if (k % 30 === 0) log.push({ i: c.trackIndex, s: +s.toFixed(2), v: +(v * 3.6).toFixed(0) });
    // the acceptance: on >=8% grade with v above 80% flat top, v must not RISE
    if (s >= 0.08 && v > c.maxSpeed * 0.8 && v > prevV + 0.02) {
      violations++; worst = Math.max(worst, v - prevV);
    }
    prevV = v;
    const dIn = (c.trackIndex - best + N) % N;
    if (dIn > bl && dIn < N / 2) break;   // past the climb
  }
  return { climbStart: best, climbLenSamples: bl, violations, worst: +worst.toFixed(3),
    top: +(c.maxSpeed * 3.6).toFixed(0), log: log.slice(0, 18) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
