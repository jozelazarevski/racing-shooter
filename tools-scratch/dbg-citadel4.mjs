import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=58&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, c = g.player;
  g.clock.getDelta = () => 1 / 30;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const trace = [];
  for (let k = 0; k < 300; k++) {
    g.input.analog.throttle = 1;
    g.frame();
    if (k % 60 === 0) {
      const cam = g.camera?.position ?? g.camPos;
      trace.push({ t: +(k / 30).toFixed(1), camY: +cam.y.toFixed(1),
        carY: +c.pos.y.toFixed(1), d: +Math.hypot(cam.x - c.pos.x, cam.y - c.pos.y, cam.z - c.pos.z).toFixed(1),
        v: +(Math.hypot(c.vel.x, c.vel.z) * 3.6).toFixed(0), hull: Math.round(c.health) });
    }
  }
  return trace;
});
console.log(JSON.stringify(r));
await p.evaluate(() => { const g = window.__game; g.input.analog.throttle = 0; });
await p.waitForTimeout(800);
await p.screenshot({ path: '/tmp/shot-citadel-drive.png' });
await browser.close();
