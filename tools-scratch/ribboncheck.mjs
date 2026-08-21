/* WHICH MESHES DOES THE ROAD-HIDDEN PROBE THINK ARE CLIFF RIBBONS?
 * It picks "unnamed, textured, >2000 verts". That matched exactly the two
 * ribbons on CANYON RUN, but a reading of 100% road hidden at CORNICHE
 * station 12 — where the render shows open ground and no cliff over the road
 * — says the filter may be catching terrain there. Print what it selects. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '27,4').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
for (const id of IDS) {
  await p.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    const box = new THREE.Box3(), sz = new THREE.Vector3();
    const picked = [];
    t.group.traverse((o) => {
      if (o.isMesh && !o.isInstancedMesh && o.material?.map && !o.name
          && o.geometry?.attributes?.position?.count > 2000) {
        box.setFromObject(o); box.getSize(sz);
        picked.push({ verts: o.geometry.attributes.position.count,
          size: [Math.round(sz.x), Math.round(sz.y), Math.round(sz.z)] });
      }
    });
    return { name: g.level?.name, picked };
  });
  console.log(`L${id} ${r.name}: ${r.picked.length} meshes selected as "ribbons"`);
  for (const q of r.picked) console.log('   ', JSON.stringify(q));
}
await b.close();
