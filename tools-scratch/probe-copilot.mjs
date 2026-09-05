import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // steer sign check: steer=1 for 1s from a straight — which way does heading go?
  const pt = t.pointAt(220, 0);
  c.pos.set(pt.x, t.groundHeightAt(220, 0) + 0.3, pt.z); c.y = c.pos.y;
  c.heading = t.headingAt(220); c.trackIndex = 220; c.alive = true;
  c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(15);
  const h0 = c.heading;
  for (let k = 0; k < 60; k++) c.step(1 / 60, { throttle: 0.5, brake: 0, steer: 1, drift: false, hold: false });
  let dh = c.heading - h0;
  while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
  const steerPlusRaisesHeading = dh > 0;
  // now the copilot: grant L3, drive the expert stand-in, log notes
  const key = g.cars.selected;
  (g.garage.upgrades[key] ??= {}).copilot = 3;
  const notes = [];
  const el = document.getElementById('copilot-note');
  const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
  let lastTxt = '';
  for (let k = 0; k < 45 * 60; k++) {
    const sp = Math.hypot(c.vel.x, c.vel.z);
    const aim = t.center[(c.trackIndex + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
    let a = Math.atan2(aim.x - c.pos.x, aim.z - c.pos.z) - c.heading;
    while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
    g.input.analog.steer = Math.max(-1, Math.min(1, a * 1.8));
    g.input.analog.throttle = 0.85;
    g.frame();
    if (el.style.display !== 'none' && el.textContent !== lastTxt) {
      lastTxt = el.textContent;
      notes.push({ t: +g.raceTime.toFixed(1), txt: el.textContent, cls: el.className, si: c.trackIndex });
    }
  }
  return { steerPlusRaisesHeading, noteCount: notes.length, notes: notes.slice(0, 14) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
