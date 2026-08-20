/* WHAT IS THE CAMERA INSIDE?
 *
 * The tour's first frame on UNDERCITY SLIPSTREAM is a flat green field with no
 * road, no car and no horizon. Guessing which surface that is from the pixels
 * is how the last four wrong answers happened, so ask the scene: drive to the
 * same moment, then raycast from the camera towards the car and report the
 * FIRST thing in the way, by name, with its distance.
 *
 * Also report the camera's own lateral offset and its height over the road, so
 * "inside the side wall" and "inside the ground" are distinguishable rather
 * than both being called "in the walls".
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 18);
const SECS = Number(process.env.SECS ?? 40);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 280 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const r = await page.evaluate(async (secs) => {
  const THREE = await import('three');
  const g = window.__game, t = g.track, p = g.player;
  g.clock.getDelta = () => 1 / 60;
  g.composer.render = () => {};
  g._autoQuality = () => {};
  // CHASE, the camera the report was made from
  const ci = (g.CAM_NAMES ?? []).indexOf('CHASE');
  if (ci >= 0) g.camMode = ci;
  const meshes = [];
  g.scene.traverse((o) => { if (o.isMesh && o.material) meshes.push(o); });
  const ray = new THREE.Raycaster();
  ray.far = 400;
  const dir = new THREE.Vector3();
  const out = [];
  for (let f = 0; f < secs * 60; f++) {
    g.input.analog.throttle = 1;
    g.frame();
    if (f % 15) continue;
    const cam = g.camera;
    dir.subVectors(p.pos, cam.position);
    const toCar = dir.length();
    dir.normalize();
    ray.set(cam.position, dir);
    const hits = ray.intersectObjects(meshes, false);
    const first = hits.find((h) => h.distance > 0.05);
    const ciX = t.nearestIndex(cam.position, p.trackIndex);
    const lat = t.lateralOffset(cam.position, ciX);
    out.push({ t: +(f / 60).toFixed(1),
      camLat: +lat.toFixed(2), camOverRoad: +(cam.position.y - t.center[ciX].y).toFixed(2),
      toCar: +toCar.toFixed(1),
      blocker: first && first.distance < toCar - 1.5
        ? { name: first.object.name || first.object.geometry?.type || '?',
            d: +first.distance.toFixed(2) } : null });
  }
  return { name: g.level?.name, cam: g.CAM_NAMES?.[g.camMode], out };
}, SECS);
console.log(`${r.name}  camera=${r.cam}`);
let blocked = 0;
for (const o of r.out) {
  if (o.blocker) blocked++;
  console.log(`  t${String(o.t).padStart(5)}s  camLat ${String(o.camLat).padStart(7)}  overRoad ${String(o.camOverRoad).padStart(7)}  toCar ${String(o.toCar).padStart(6)}  ${o.blocker ? 'BLOCKED BY ' + o.blocker.name + ' at ' + o.blocker.d : 'clear'}`);
}
console.log(`\n${blocked} of ${r.out.length} samples have something between the camera and the car`);
await b.close();
