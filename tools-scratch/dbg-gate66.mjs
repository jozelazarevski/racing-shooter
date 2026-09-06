import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
p.setDefaultTimeout(300000);
await p.goto(`${BASE}/?level=${process.env.LEVEL ?? 66}&go=1&unlockall=1`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const c = t.center[0];
  const near = [];
  t.group.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    o.updateWorldMatrix(true, false);
    const e = o.matrixWorld.elements;
    const d = Math.hypot(e[12] - c.x, e[14] - c.z);
    if (d < 30 && o.geometry.type === 'CylinderGeometry') {
      near.push({ d: +d.toFixed(1), y: +e[13].toFixed(1),
        h: +(o.geometry.parameters?.height ?? 0).toFixed(1) });
    }
  });
  return { roadY: +c.y.toFixed(1), cylinders: near.slice(0, 10) };
});
console.log(JSON.stringify(r));
await browser.close();
