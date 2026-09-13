/* IS ANYTHING BETWEEN THE CAMERA AND THE CAR, every frame of a real run.
 *
 * The reported symptom on CANYON RUN was half the frame filled with a flat
 * slab of cliff and the car pushed into a corner. `_watchCarVisible` does not
 * catch it and is right not to — it tests hidden, buried and OFF SCREEN, and
 * an occluded car is none of those. Posed reproductions all failed: parking
 * the car at chosen lateral offsets kept it dead centre, and driving straight
 * into the walls never hid it either.
 *
 * So stop posing and stop screenshotting. A probe can `import('three')` in the
 * page — the import map applies — which buys a real Raycaster: cast from the
 * eye to the car every few frames and ask what it hits first. That is exact,
 * costs no readback, and runs over a whole lap.
 *
 *   LEVEL=4 SECS=60 node camoccl.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${process.env.LEVEL ?? 4}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const out = await p.evaluate(async ([secs, steerMode]) => {
  const THREE = await import('three');
  const g = window.__game, t = g.track, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  // CAM picks the mode by index (main.js CAM_MODES). It matters: `cliffLift`,
  // the rule that lifts a low view between canyon walls, is set on TRAIL and
  // on nothing else — CHASE sits 14 u lower and never asked for it.
  const cam = +(window.__CAM ?? 0);
  while (g.camMode !== cam) g.cycleCamera();
  const ray = new THREE.Raycaster();
  ray.far = 400;
  // everything solid that is NOT the player and not a light/particle/backdrop
  const solids = [];
  g.scene.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    for (let n = o; n; n = n.parent) if (n === pl.mesh) return;
    const m = o.material;
    if (!m || m.transparent || m.blending === THREE.AdditiveBlending || m.depthWrite === false) return;
    solids.push(o);
  });
  const hits = [];
  let n = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < secs * 1000) {
    if (g.input?.analog) {
      g.input.analog.throttle = 1;
      const k = (performance.now() - t0) / 1000;
      g.input.analog.steer = steerMode === 'weave' ? Math.sin(k * 0.8) * 0.9 : 0;
    }
    await f();
    if (++n % 3) continue;
    const from = g.camera.position;
    const to = pl.mesh.position;
    const d = from.distanceTo(to);
    ray.set(from, to.clone().sub(from).normalize());
    const xs = ray.intersectObjects(solids, false);
    const first = xs.find((x) => x.distance > 0.6 && x.distance < d - 1.2);
    if (!first) continue;
    const v = to.clone().project(g.camera);
    const ci = t.nearestIndex(pl.pos, pl.trackIndex);
    hits.push({ t: +((performance.now() - t0) / 1000).toFixed(1),
      blockedBy: first.object.name || first.object.type,
      atFrac: +(first.distance / d).toFixed(2),
      ndc: [+v.x.toFixed(2), +v.y.toFixed(2)],
      carLat: +t.lateralOffset(pl.pos, ci).toFixed(1),
      camY: +from.y.toFixed(1), carY: +pl.pos.y.toFixed(1),
      spd: +pl.vel.length().toFixed(0), blindT: +(g._blindT ?? 0).toFixed(1) });
  }
  return { solids: solids.length, samples: Math.floor(n / 3), hits };
}, [+(process.env.SECS ?? 60), process.env.STEER ?? 'straight']);
console.log(`cam ${process.env.CAM ?? 0}  solids ${out.solids}   samples ${out.samples}   occluded ${out.hits.length}`
  + `  (${(100 * out.hits.length / Math.max(1, out.samples)).toFixed(1)}%)`);
for (const h of out.hits.slice(0, 12)) console.log(' ', JSON.stringify(h));
await b.close();
