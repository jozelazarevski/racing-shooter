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
  for (let k = 0; k < 150; k++) g.frame();
  const cands = [];
  g.scene.traverse((o) => {
    if (!o.isMesh || o.visible === false) return;
    const e = o.matrixWorld.elements;
    const wx = e[12], wy = e[13], wz = e[14];
    const dh = Math.hypot(wx - c.pos.x, wz - c.pos.z);
    if (dh < 80 && wy > c.pos.y + 1) {
      cands.push({ name: o.name || o.type, y: +wy.toFixed(1), dh: +dh.toFixed(1),
        col: o.material?.color ? '#' + o.material.color.getHexString() : null,
        opac: o.material?.opacity ?? 1 });
    }
  });
  cands.sort((a, b) => b.y - a.y);
  return { world: g.level?.name, carY: +c.pos.y.toFixed(1), camY: +g.camera.position.y.toFixed(1),
    cands: cands.slice(0, 15), total: cands.length };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
