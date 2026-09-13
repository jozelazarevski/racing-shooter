import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto('http://localhost:8901/?level=29&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const water = [];
  t.group.traverse(o => {
    if (o.isMesh && /sea|water|bay/i.test(o.name || '')) {
      o.geometry.computeBoundingBox?.();
      const b = o.geometry.boundingBox;
      water.push({ name: o.name, y: +o.position.y.toFixed(1),
        bb: b ? [Math.round(b.min.x), Math.round(b.max.x), Math.round(b.min.z), Math.round(b.max.z)] : null });
    }
  });
  // terrain height profile from station 70 seaward
  const C = t.T.coast, c = t.center[70];
  const abx = C.b[0] - C.a[0], abz = C.b[1] - C.a[1];
  const L = Math.hypot(abx, abz);
  const nx = abz / L, nz = -abx / L;
  const prof = [];
  for (const d of [0, 20, 40, 60, 80, 120, 200, 300]) {
    prof.push({ d, h: +t.terrainHeight(c.x + nx * d, c.z + nz * d).toFixed(1) });
  }
  return { water, roadY: +c.y.toFixed(1), prof, seaLevel: C.level };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
