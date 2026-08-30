/* THE STANDING START, measured. Full throttle from 0 on PINE VALLEY's grid:
 * time to 60/100/160 km/h, slip/lag/grip traces, heading drift. Then a
 * low-speed steering check: half lock at 50 km/h — does the nose answer?
 *   BASE=http://localhost:8902 node tools-scratch/launchtest.mjs   (pristine)
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', e => console.log('pageerr:', e.message.slice(0, 120)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const place = (idx) => {
    const pt = t.pointAt(idx, 0);
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = idx; c.lateral = 0; c.heading = t.headingAt(idx);
    c.vel.set(0, 0, 0); c.slip = 0; c.steerSmooth = 0;
  };
  // --- launch: full throttle 8 s, straight ---
  place(10);
  const h0 = c.heading;
  const marks = { t60: null, t100: null, t160: null };
  const trace = [];
  for (let k = 0; k < 480; k++) {
    c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    const kmh = Math.hypot(c.vel.x, c.vel.z) * 3.6;
    if (!marks.t60 && kmh >= 60) marks.t60 = +(k / 60).toFixed(2);
    if (!marks.t100 && kmh >= 100) marks.t100 = +(k / 60).toFixed(2);
    if (!marks.t160 && kmh >= 160) marks.t160 = +(k / 60).toFixed(2);
    if (k % 30 === 0) trace.push({ s: +(k / 60).toFixed(1), kmh: Math.round(kmh),
      slip: +(c.slip ?? 0).toFixed(2), grip: +(c._gripBudget ?? c.grip ?? 0).toFixed(1),
      lat: +(t.lateralOffset(c.pos, c.trackIndex)).toFixed(1) });
  }
  const headDrift = +((c.heading - h0) * 180 / Math.PI).toFixed(1);
  const topKmh = Math.round(Math.hypot(c.vel.x, c.vel.z) * 3.6);
  // --- low-speed steer: 50 km/h, half lock 1.5 s → heading change ---
  place(40);
  c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(50 / 3.6);
  const hs = c.heading;
  for (let k = 0; k < 90; k++) c.step(1 / 60, { throttle: 0.5, brake: 0, steer: 0.5, drift: false, hold: false });
  const steerResp = +((c.heading - hs) * 180 / Math.PI).toFixed(1);
  // --- 100 km/h, half lock ---
  place(80);
  c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(100 / 3.6);
  const hs2 = c.heading;
  for (let k = 0; k < 90; k++) c.step(1 / 60, { throttle: 0.5, brake: 0, steer: 0.5, drift: false, hold: false });
  const steerResp100 = +((c.heading - hs2) * 180 / Math.PI).toFixed(1);
  return { marks, topKmh, headDrift, steerResp50: steerResp, steerResp100, trace };
});
console.log(JSON.stringify(r, null, 1));
await p.close(); await browser.close();
