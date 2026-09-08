import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 16);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 390, height: 780 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 240000 });
const names = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 60; k++) g.frame();
  const out = {};
  g.scene.traverse((o) => {
    if ((o.isMesh || o.isPoints) && o.visible !== false) {
      const key = o.name || o.type;
      const tri = o.geometry?.index ? o.geometry.index.count / 3
        : (o.geometry?.attributes?.position?.count ?? 0) / 3;
      out[key] = (out[key] ?? 0) + Math.round(tri);
    }
  });
  return out;
});
const rows = Object.entries(names).sort((a, b) => b[1] - a[1]).slice(0, 25);
console.log(JSON.stringify(rows));
await browser.close();
