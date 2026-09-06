import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
await p.goto(`${BASE}/?level=${process.env.LEVEL ?? 70}&go=1&unlockall=1`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
const r = await p.evaluate(() => {
  const g = window.__game;
  const cars = [g.player, ...g.enemies].map((c, i) => ({ i, x: +c.pos.x.toFixed(1), z: +c.pos.z.toFixed(1) }));
  let minPair = 1e9, pair = null;
  for (let a = 0; a < cars.length; a++) for (let b = a + 1; b < cars.length; b++) {
    const d = Math.hypot(cars[a].x - cars[b].x, cars[a].z - cars[b].z);
    if (d < minPair) { minPair = d; pair = [a, b]; }
  }
  return { n: cars.length, minPair: +minPair.toFixed(2), pair,
    shieldVis: [g.player, ...g.enemies].filter((c) => c._shield && c._shield.visible).length,
    invulnN: [g.player, ...g.enemies].filter((c) => c.invuln > 0).length, state: g.state };
});
console.log(JSON.stringify(r));
await browser.close();
