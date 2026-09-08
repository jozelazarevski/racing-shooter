/* Anything large standing well above the ground: name, size, height, colour. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 32);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const gy = (x, z) => (t._drawnGroundY ? t._drawnGroundY(x, z) : null) ?? t.terrainHeight(x, z);
  const out = [];
  g.scene.traverse((o) => {
    if (!o.isMesh || o.visible === false) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const bs = o.geometry.boundingSphere;
    const e = o.matrixWorld.elements;
    const s = Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
    const rad = bs.radius * s;
    const cy = e[13] + bs.center.y * s;
    if (rad < 10) return;
    const cx = e[12] + bs.center.x * s, cz = e[14] + bs.center.z * s;
    const above = cy - gy(cx, cz);
    if (above < 30 && !/horizon|peak|massif|sky|cloud/i.test(o.name || '')) return;
    out.push({ name: o.name || (o.parent?.name || o.type), r: Math.round(rad),
      pos: { x: Math.round(cx), y: Math.round(cy), z: Math.round(cz) },
      above: Math.round(above),
      col: o.material?.color ? '#' + o.material.color.getHexString() : null,
      tris: Math.round((o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3),
      inst: o.isInstancedMesh ? o.count : 1 });
  });
  return { world: g.level?.name, items: out.sort((a, b) => b.r - a.r).slice(0, 14) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
