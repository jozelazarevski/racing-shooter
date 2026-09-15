import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 16);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 390, height: 780 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 240000 });
const info = await p.evaluate(() => {
  const g = window.__game, c = g.player;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 60; k++) g.frame();
  const found = [];
  g.scene.traverse((o) => {
    if (!o.isInstancedMesh || o.visible === false) return;
    const n = o.count;
    let near = 0, ymin = 1e9, ymax = -1e9, smax = 0;
    for (let i = 0; i < n; i++) {
      const e = new Float32Array(16);
      o.instanceMatrix.array.slice(i * 16, i * 16 + 16).forEach((v, j) => { e[j] = v; });
      const x = e[12], y = e[13], z = e[14];
      const sx = Math.hypot(e[0], e[1], e[2]);
      if (Math.hypot(x - c.pos.x, z - c.pos.z) < 40) {
        near++; ymin = Math.min(ymin, y); ymax = Math.max(ymax, y);
        smax = Math.max(smax, sx);
      }
    }
    if (near) {
      found.push({ name: o.name || 'inst', near, ymin: +ymin.toFixed(1), ymax: +ymax.toFixed(1),
        smax: +smax.toFixed(1),
        col: o.material?.color ? '#' + o.material.color.getHexString() : null });
    }
  });
  found.sort((a, b) => b.smax - a.smax);
  return { world: g.level?.name, carY: +c.pos.y.toFixed(1), found: found.slice(0, 15) };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
