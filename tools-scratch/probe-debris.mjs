import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const e = g.enemies[0];
  let debrisCalls = 0, popCalls = 0;
  const od = g.particles.debris.bind(g.particles);
  g.particles.debris = (pos, n) => { debrisCalls++; return od(pos, n); };
  const op = g.popCarPart.bind(g);
  g.popCarPart = (car) => { if (car === e) popCalls++; return op(car); };
  // 12 cannon hits
  for (let i = 0; i < 12; i++) g.onEnemyHit(e, 4.5, 'cannon');
  const afterCannon = { debrisCalls, popCalls, health: e.health };
  // 1 missile hit
  g.onEnemyHit(e, 26, 'missile');
  return { afterCannon, afterMissile: { debrisCalls, popCalls, health: e.health },
    flying: g.flyingProps.length, popped: (e._popped ?? []).length };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
