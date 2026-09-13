import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=29&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const info = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = t.center[40];
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.camMode = 3;
  g.player.pos.set(c.x, c.y + 0.4, c.z); g.player.y = c.y + 0.4;
  g.player.trackIndex = 40; g.player.heading = t.headingAt(40);
  g.player.vel.set(Math.sin(g.player.heading), 0, Math.cos(g.player.heading)).multiplyScalar(17);
  g.input.analog.throttle = 1;
  // census: contact-shadow instances within 60u of station 40, with radii
  let cs = null;
  t.group.traverse(o => { if ((o.name || '') === 'contact-shadows') cs = o; });
  const out = [];
  if (cs) {
    const a = cs.instanceMatrix.array;
    for (let i = 0; i < cs.count; i++) {
      const x = a[i * 16 + 12], y = a[i * 16 + 13], z = a[i * 16 + 14];
      const sx = Math.hypot(a[i * 16 + 0], a[i * 16 + 1], a[i * 16 + 2]);
      const d = Math.hypot(x - c.x, z - c.z);
      if (d < 70 && sx > 1.5) out.push({ i, d: +d.toFixed(0), r: +sx.toFixed(1), y: +y.toFixed(1) });
    }
  }
  return out.slice(0, 12);
});
console.log(JSON.stringify(info));
await p.waitForTimeout(2500);
await p.evaluate(() => {
  let cs = null;
  window.__game.track.group.traverse(o => { if ((o.name || '') === 'contact-shadows') cs = o; });
  if (cs) cs.visible = false;
});
await p.waitForTimeout(400);
await p.screenshot({ path: '/tmp/shot-noblob.png' });
console.log('saved');
await browser.close();
