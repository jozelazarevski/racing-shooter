import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto('http://localhost:8901/?level=56&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, out = [];
  g.scene.updateMatrixWorld(true);
  g.scene.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const e = o.matrixWorld.elements, x = e[12], y = e[13], z = e[14];
    if (Math.abs(x + 322) < 14 && Math.abs(z - 573) < 14 && Math.abs(y - 220) < 6) {
      let s = [], q = o; while (q && s.length < 5) { s.push(q.name || q.type); q = q.parent; }
      out.push({ x: +x.toFixed(0), y: +y.toFixed(1), z: +z.toFixed(0),
        sc: o.scale ? [+o.scale.x.toFixed(1), +o.scale.y.toFixed(1), +o.scale.z.toFixed(1)] : null,
        chain: s.join('<') });
    }
  });
  return out.slice(0, 12);
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
