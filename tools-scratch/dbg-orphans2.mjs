import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 960, height: 600 } });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
const out = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const rows = [];
  const scan = (root, tag) => root.traverse(o => {
    if (!o.isMesh) return;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!mat || o.geometry.type !== 'PlaneGeometry') return;
    const col = mat.color;
    if (!(col && col.r > 0.85 && col.g > 0.85 && col.b > 0.85)) return;
    o.updateWorldMatrix(true, false);
    const e = o.matrixWorld.elements;
    const pr = o.geometry.parameters || {};
    rows.push({ tag, mt: mat.type, map: !!mat.map, tr: !!mat.transparent,
      w: pr.width, h: pr.height,
      x: +e[12].toFixed(0), y: +e[13].toFixed(0), z: +e[14].toFixed(0),
      rotX: +o.rotation.x.toFixed(2),
      parentKids: o.parent ? o.parent.children.length : 0,
      pname: o.parent?.name || '' });
  });
  scan(t.group, 'track');
  if (g.worldLayer) scan(g.worldLayer, 'world');
  // halo map check
  const halo = [];
  for (const pk of g.pickups || []) {
    const h = pk.mesh.children.find(c => c.geometry?.type === 'PlaneGeometry');
    if (h) halo.push({ type: pk.type, map: !!h.material.map, blend: h.material.blending, rotX: +h.rotation.x.toFixed(2) });
  }
  return { rows, halo: halo.slice(0, 6) };
});
for (const r of out.rows) console.log(JSON.stringify(r));
console.log('halos:', JSON.stringify(out.halo));
await browser.close();
