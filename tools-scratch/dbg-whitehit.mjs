/* NAME THE SLIVER. No rendering — raycast only, which is ~100x faster on
 * software GL. Chase-pose the camera at many stations, cast a grid, and
 * report every hit that is UNNAMED or whose material is near-white, with
 * enough identity to find its builder: geometry type, vertex count, bbox
 * extent, material colour, and the hit distance. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 25);
const STATIONS = Number(process.env.STATIONS ?? 24);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(900000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,
  { waitUntil: 'load', timeout: 900000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 });
const info = await p.evaluate(async ({ S9 }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  const THREE = await import('three');
  const cam = g.camera, rc = new THREE.Raycaster();
  const chain = (o) => { const q9 = []; let q = o; while (q) { if (q.name) q9.push(q.name); q = q.parent; } return q9.join('<'); };
  const box = new THREE.Box3();
  const seen = {}, odd = new Map();
  for (let s = 0; s < S9; s++) {
    const i = Math.round((s + 0.5) * N / S9) % N;
    const c = t.center[i], c2 = t.center[(i + 4) % N];
    const fx = c2.x - c.x, fz = c2.z - c.z, L = Math.hypot(fx, fz) || 1;
    const ux = fx / L, uz = fz / L;
    cam.position.set(c.x - ux * 16, c.y + 6, c.z - uz * 16);
    cam.lookAt(c.x + ux * 40, c.y + 3, c.z + uz * 40);
    cam.updateMatrixWorld(true);
    for (let gx = -0.95; gx <= 0.95; gx += 0.13) {
      for (let gy = -0.95; gy <= 0.95; gy += 0.13) {
        rc.setFromCamera(new THREE.Vector2(gx, gy), cam);
        const hit = rc.intersectObjects(g.scene.children, true).filter((h) => h.object.visible)[0];
        if (!hit) { seen.sky = (seen.sky ?? 0) + 1; continue; }
        const o = hit.object, nm = chain(o) || `(unnamed ${o.type})`;
        seen[nm] = (seen[nm] ?? 0) + 1;
        const col = o.material?.color;
        const white = col ? (col.r > 0.78 && col.g > 0.78 && col.b > 0.78) : false;
        if (!chain(o) || white) {
          const key = nm + '|' + (col ? col.getHexString() : '-') + '|' + o.geometry?.type;
          if (!odd.has(key)) {
            box.setFromObject(o);
            odd.set(key, { name: nm, colour: col ? col.getHexString() : null,
              geo: o.geometry?.type, verts: o.geometry?.attributes?.position?.count,
              inst: o.isInstancedMesh ? o.count : undefined,
              mat: o.material?.type,
              ext: +Math.max(box.max.x - box.min.x, box.max.y - box.min.y,
                box.max.z - box.min.z).toFixed(0),
              boxY: [+box.min.y.toFixed(0), +box.max.y.toFixed(0)],
              hits: 0, nearest: 1e9 });
          }
          const r = odd.get(key); r.hits++;
          if (hit.distance < r.nearest) r.nearest = +hit.distance.toFixed(1);
        }
      }
    }
  }
  const top = Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 12);
  return { world: g.level?.name, stations: S9, hitCounts: top,
    suspects: [...odd.values()].sort((a, b) => b.hits - a.hits).slice(0, 12) };
}, { S9: STATIONS });
console.log(JSON.stringify(info, null, 1));
await browser.close();
