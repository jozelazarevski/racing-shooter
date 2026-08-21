/* IDENTIFY A MESH BY ITS VERTEX COUNT, THEN FIND ITS BUILDER.
 * The occluder over CANYON RUN's road at station 819 is an unnamed
 * BufferGeometry of 4505 vertices. Nothing else about it is known, so list
 * every mesh in the world with its name, vertex count, bounds and height above
 * the road, and let the count pick it out. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 4);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=${ID}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game, t = g.track;
  const box = new THREE.Box3(), sz = new THREE.Vector3(), ctr = new THREE.Vector3();
  const rows = [];
  t.group.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position) return;
    const n = o.geometry.attributes.position.count;
    box.setFromObject(o); box.getSize(sz); box.getCenter(ctr);
    rows.push({ name: o.name || '(unnamed)', verts: n, inst: !!o.isInstancedMesh,
      size: [Math.round(sz.x), Math.round(sz.y), Math.round(sz.z)],
      at: [Math.round(ctr.x), Math.round(ctr.y), Math.round(ctr.z)] });
  });
  rows.sort((a, x) => Math.abs(a.verts - 4505) - Math.abs(x.verts - 4505));
  return { name: g.level?.name, total: rows.length, rows: rows.slice(0, 10) };
});
console.log(`${r.name}: ${r.total} meshes; closest to 4505 verts:`);
for (const q of r.rows) console.log('  ' + JSON.stringify(q));
await b.close();
