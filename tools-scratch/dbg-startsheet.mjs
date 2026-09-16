import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 16);
const OUT = process.env.OUT ?? '/tmp/sheet';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 390, height: 780 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 240000 });
const big = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 60; k++) g.frame();
  const out = [];
  g.scene.traverse((o) => {
    if (!o.isMesh || o.visible === false || o.name) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const bs = o.geometry.boundingSphere;
    const e = o.matrixWorld.elements;
    const s = Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
    const r = bs.radius * s;
    if (r > 200) {
      o.__cand = true;
      out.push({ r: +r.toFixed(0), y: +e[13].toFixed(1),
        col: o.material?.color ? '#' + o.material.color.getHexString() : null,
        type: o.geometry.type, tris: (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3,
        parent: o.parent?.name || o.parent?.type });
    }
  });
  return out.sort((a, b) => b.r - a.r).slice(0, 12);
});
console.log(JSON.stringify(big, null, 1));
const n = await p.evaluate(() => {
  const g = window.__game; let hid = 0;
  g.scene.traverse((o) => { if (o.__cand && o.visible) { o.visible = false; hid++; } });
  for (let k = 0; k < 3; k++) g.frame();
  return hid;
});
await p.screenshot({ path: OUT + '-nobig.png', timeout: 120000 });
console.log('hid', n);
await browser.close();
