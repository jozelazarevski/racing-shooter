import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto('http://localhost:8901/?level=68&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const tr = (t.camTrees || [])[100];
  if (!tr) return { err: 'no carpet' };
  // aim the car straight at the trunk from 30u, at 80 km/h
  const ang = Math.random() * Math.PI * 2;
  const sx = tr.x + Math.sin(ang) * 30, sz = tr.z + Math.cos(ang) * 30;
  c.alive = true; c.airborne = false; c.vy = 0;
  c.pos.set(sx, t.terrainHeight(sx, sz) + 0.4, sz); c.y = c.pos.y;
  c.heading = Math.atan2(tr.x - sx, tr.z - sz);
  c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(22);
  let minD = 1e9, vAfter = null;
  for (let k = 0; k < 180; k++) {
    c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    const d = Math.hypot(c.pos.x - tr.x, c.pos.z - tr.z);
    minD = Math.min(minD, d);
    if (k === 90) vAfter = Math.hypot(c.vel.x, c.vel.z);
  }
  return { trunkR: +(0.35 * tr.r / 1.9).toFixed(2), minD: +minD.toFixed(2),
    vAfter: +(vAfter * 3.6).toFixed(0), passedThrough: minD < 0.3 };
});
console.log(JSON.stringify(r));
await browser.close();
