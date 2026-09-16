import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto('http://localhost:8901/?level=33&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const out = [];
  const v = { x: 0, y: 0, z: 0 };
  g.scene.updateMatrixWorld(true);
  g.scene.traverse((o) => {
    if (!o.isMesh) return;
    const pr = o.geometry?.parameters;
    const isCone = o.geometry?.type === 'ConeGeometry' && pr && Math.abs(pr.radius - 0.5) < 0.01 && Math.abs(pr.height - 1) < 0.01;
    if (!isCone) return;
    if (o.isInstancedMesh) {
      const m = new o.matrixWorld.constructor();
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m);
        // world = meshWorld * inst
        const w = o.matrixWorld.clone().multiply(m);
        const e = w.elements, x = e[12], y = e[13], z = e[14];
        if (Math.abs(x + 79) < 10 && Math.abs(z + 283) < 10) {
          out.push({ inst: i, name: o.name || '(inst-cone)', x: +x.toFixed(1), y: +y.toFixed(1), z: +z.toFixed(1),
            chain: (() => { let s = [], q = o; while (q && s.length < 5) { s.push(q.name || q.type); q = q.parent; } return s.join('<'); })() });
        }
      }
    } else {
      const e = o.matrixWorld.elements, x = e[12], y = e[13], z = e[14];
      if (Math.abs(x + 79) < 10 && Math.abs(z + 283) < 10) {
        out.push({ name: o.name || '(cone)', x: +x.toFixed(1), y: +y.toFixed(1), z: +z.toFixed(1),
          scale: +Math.hypot(e[0], e[1], e[2]).toFixed(2),
          chain: (() => { let s = [], q = o; while (q && s.length < 6) { s.push(q.name || q.type); q = q.parent; } return s.join('<'); })() });
      }
    }
  });
  const th = t.terrainHeight(-79, -283);
  return { out, terrainAt: +th.toFixed(1) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
