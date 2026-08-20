/* IS THE RIM CACTUS FLOATING, OR STANDING ON A CLIFF THE GATE CANNOT SEE?
 *
 * test-nothing-floats measures against the near TERRAIN PATCH's vertex buffer.
 * A saguaro silhouetted on a canyon rim stands on the CLIFF RIBBON, which is a
 * different mesh. If the ribbon is there under its feet, the 88 "floaters" on
 * CANYON RUN are the gate measuring the wrong surface; if nothing is there, they
 * are genuinely in the air and the datum seating is the bug. Those two need
 * opposite fixes, so this asks before anything is changed.
 *
 * For each reported floater: the analytic terrain height, the drawn terrain
 * height, and the nearest VERTEX of any other mesh below it within 2 u laterally.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 300 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=4&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(async () => {
  const g = window.__game, t = g.track;
  const V = new (g.player.pos.constructor)();
  // find the cactus instances and their world positions
  const found = [];
  const M = new (g.camera.matrixWorld.constructor)();
  t.group.traverse((o) => {
    if (!o.isInstancedMesh) return;
    const gp = o.geometry?.parameters ?? {};
    // the saguaro trunk: CapsuleGeometry(0.5, 3.6)
    if (!(Math.abs((gp.radius ?? 0) - 0.5) < 0.01 && Math.abs((gp.length ?? 0) - 3.6) < 0.01)) return;
    o.updateWorldMatrix(true, false);
    for (let i = 0; i < o.count && found.length < 400; i++) {
      o.getMatrixAt(i, M);
      V.set(M.elements[12], M.elements[13], M.elements[14]).applyMatrix4(o.matrixWorld);
      if (V.lengthSq() < 1) continue;                 // parked slot
      found.push({ x: V.x, y: V.y, z: V.z });
    }
  });
  // RAYCAST, NOT NEAREST VERTEX. The first cut looked for a vertex within 2.5 u
  // and reported `null` for most of these — but a cliff ribbon is long quads
  // with widely spaced vertices, so "no vertex nearby" is not "no surface
  // underneath", and one sample DID land on a surface at exactly the right
  // height (foot 39.2, mesh 39.6). A ray hits the face between the vertices and
  // answers the actual question: is there anything to stand on.
  // THREE is not global, but the page carries an import map, so the module
  // resolves by name here exactly as it does for the game's own files.
  const THREE = await import('three');
  const RC = new THREE.Raycaster();
  // INTERSECT A CURATED LIST, NOT THE WHOLE GROUP. Raycasting the group throws
  // inside three (`Cannot read properties of null (reading 'matrixWorld')`) —
  // something in there is a sprite or an LOD without the members raycast wants.
  // Only real, drawable, non-instanced meshes can be ground anyway.
  const targets = [];
  t.group.traverse((o) => {
    if (o.isMesh && !o.isInstancedMesh && o.geometry?.attributes?.position && o.material) {
      targets.push(o);
    }
  });
  const out = [];
  const probe = found.slice(0, 10);
  const down = new (g.player.pos.constructor)(0, -1, 0);
  const origin = new (g.player.pos.constructor)();
  for (const f of probe) {
    const th = t.terrainHeight(f.x, f.z);
    let hitY = null, hitName = '-';
    {
      origin.set(f.x, f.y + 1.0, f.z);
      RC.set(origin, down);
      RC.far = 400;
      const hits = RC.intersectObjects(targets, false) ?? [];
      for (const h of hits) {
        // ignore the cactus instances themselves
        if (h.object.isInstancedMesh) continue;
        hitY = +h.point.y.toFixed(2); hitName = h.object.name || h.object.type; break;
      }
    }
    out.push({ at: [Math.round(f.x), Math.round(f.z)], footY: +f.y.toFixed(2),
      terrain: +th.toFixed(2), gapVsTerrain: +(f.y - th).toFixed(2),
      groundBelow: hitY, gapVsGround: hitY === null ? null : +(f.y - hitY).toFixed(2),
      owner: hitName });
  }
  return { total: found.length, out, rayOk: true, targets: targets.length };
});
console.log(`saguaro instances found: ${r.total}, ray targets ${r.targets}`
  + (r.targets ? '' : '   (NO TARGETS — every result below would read as floating)') + '\n');
for (const q of r.out) {
  const verdict = q.gapVsGround === null ? 'NOTHING BELOW IT AT ALL'
    : q.gapVsGround > 1.5 ? `FLOATING ${q.gapVsGround} u` : 'standing on something';
  console.log(`at ${String(q.at).padEnd(14)} foot ${String(q.footY).padStart(7)} | `
    + `terrain ${String(q.terrain).padStart(7)} | ray hits ${String(q.groundBelow).padStart(7)} `
    + `[${String(q.owner).padEnd(6)}] -> ${verdict}`);
}
await b.close();
