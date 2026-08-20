/* NAME THE THING THAT IS 24.8 U OVER CANYON RUN'S ROAD.
 *
 * The occlusion sweep says "BufferGeometry" at stations 791-793, 805-807 and
 * 817-819 — unnamed, which is what the cliff ribbon is, but the ribbon's face
 * rows measured clear of every carriageway. So do not infer: take the actual
 * intersection point, and ask which station and side of the ribbon owns the
 * geometry there, and which row of the profile it corresponds to.
 *
 * The 13-station spacing between the runs is the other clue and it wants an
 * explanation too — a defect that repeats on a fixed interval is a builder
 * loop, not an accident of the terrain.
 */
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
  const g = window.__game, t = g.track, N = t.center.length;
  const meshes = [];
  t.group.traverse((o) => { if (o.isMesh && o.visible && o.material) meshes.push(o); });
  const ray = new THREE.Raycaster(); ray.far = 200;
  const down = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
  const out = [];
  for (const j of [791, 792, 805, 806, 818, 819, 820]) {
    const c = t.center[j];
    from.set(c.x, c.y + 46, c.z);
    ray.set(from, down);
    const xs = ray.intersectObjects(meshes, false);
    const first = xs.find((h) => h.distance > 0.4);
    if (!first) { out.push({ j, clear: true }); continue; }
    const P = first.point;
    // which station's wall is standing here?
    const ns = t._nearestSample(P.x, P.z);
    // and how far off THAT station's centreline, in its own normal's terms
    const cc = t.center[ns.i], nn = t.nrm[ns.i];
    const lat = (P.x - cc.x) * nn.x + (P.z - cc.z) * nn.z;
    const prof = t._cliffProfile(ns.i, Math.sign(lat) || 1);
    out.push({ j, hitY: +P.y.toFixed(1), roadY: +c.y.toFixed(1),
      over: +(P.y - c.y).toFixed(1),
      ownerSample: ns.i, ownerLat: +lat.toFixed(1), ownerDist: +ns.d.toFixed(1),
      ownerHalf: +t.widthAt(ns.i).toFixed(1),
      profBase: +prof.base.toFixed(1), profH: +prof.h.toFixed(1),
      profL2: +prof.l2.toFixed(1),
      rimIn: +(prof.base + prof.l2).toFixed(1),
      lapApart: Math.min((ns.i - j + N) % N, (j - ns.i + N) % N),
      geo: first.object.geometry?.type, name: first.object.name || '(unnamed)',
      verts: first.object.geometry?.attributes?.position?.count });
  }
  return { name: g.level?.name, out };
});
console.log(r.name);
for (const o of r.out) console.log('  ' + JSON.stringify(o));
await b.close();
