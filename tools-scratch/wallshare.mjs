/* HOW MUCH OF THE FRAME IS WALL, over a real driven lap.
 *
 * The reported symptom is a frame swallowed by hillside with the road reduced
 * to a ribbon and the car to a speck. `camoccl` cannot see it: that asks
 * whether anything sits BETWEEN the eye and the car, and here nothing does -
 * the car is in clear view, there is just nothing else in the picture.
 *
 * So measure the picture. Cast a grid of rays through the camera's own
 * frustum and ask, for each, whether it lands on solid geometry within `NEAR`
 * metres. That fraction IS "how boxed in is this view", it needs no pixel
 * readback, and naming the objects the rays land on says what to fix.
 *
 * `sky` counts rays that hit nothing at all inside `ray.far`; a corridor you
 * cannot see out of reads as wall-high and sky-zero at the same time, which is
 * the shape of the complaint.
 *
 *   LEVELS=4,10,65,66,67 CAM=3 SECS=45 node wallshare.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
const rows = [];
for (const lv of (process.env.LEVELS ?? '4,10,65,66,67').split(',')) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
  const r = await p.evaluate(async ([secs, cam, near]) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track, pl = g.player;
    g.startRace?.();
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
    while (g.camMode !== cam) g.cycleCamera();
    const solids = [];
    g.scene.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh) return;
      for (let n = o; n; n = n.parent) if (n === pl.mesh) return;
      const m = o.material;
      if (!m || m.transparent || m.blending === THREE.AdditiveBlending || m.depthWrite === false) return;
      solids.push(o);
    });
    // a 9 x 13 grid over the frame — enough to be a share, cheap enough to run
    // every few frames of a live lap
    const grid = [];
    for (let iy = 0; iy < 9; iy++) for (let ix = 0; ix < 13; ix++)
      grid.push([(ix / 12) * 2 - 1, (iy / 8) * 2 - 1]);
    const ray = new THREE.Raycaster();
    ray.far = 900;
    const v = new THREE.Vector3();
    const frames = [], names = {};
    let n = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < secs * 1000) {
      if (g.input?.analog) { g.input.analog.throttle = 1; g.input.analog.steer = 0; }
      await f();
      if (++n % 4) continue;
      let wall = 0, sky = 0;
      for (const [x, y] of grid) {
        v.set(x, y, 0.5).unproject(g.camera).sub(g.camera.position).normalize();
        ray.set(g.camera.position, v);
        const xs = ray.intersectObjects(solids, false);
        const first = xs.find((h) => h.distance > 0.4);
        if (!first) { sky++; continue; }
        if (first.distance <= near) {
          wall++;
          const k = first.object.name || first.object.type;
          names[k] = (names[k] || 0) + 1;
        }
      }
      frames.push({ wall: wall / grid.length, sky: sky / grid.length,
        spd: +pl.vel.length().toFixed(0) });
    }
    const top = Object.entries(names).sort((a, c) => c[1] - a[1]).slice(0, 3);
    const mean = (k) => frames.reduce((s, o) => s + o[k], 0) / Math.max(1, frames.length);
    const worst = frames.reduce((a, o) => (o.wall > a.wall ? o : a), { wall: 0, sky: 1 });
    return { name: t.T?.name ?? '', frames: frames.length,
      meanWall: mean('wall'), meanSky: mean('sky'),
      worstWall: worst.wall, worstSky: worst.sky, top };
  }, [+(process.env.SECS ?? 45), +(process.env.CAM ?? 3), +(process.env.NEAR ?? 45)]);
  const pc = (v) => (100 * v).toFixed(0).padStart(3) + '%';
  console.log(`L${String(lv).padStart(3)} wall mean ${pc(r.meanWall)} worst ${pc(r.worstWall)}`
    + ` | sky mean ${pc(r.meanSky)} worst ${pc(r.worstSky)}  over ${r.frames} frames`);
  console.log(`      ${r.top.map(([k, c]) => `${k} x${c}`).join(', ')}`);
  rows.push({ lv, ...r });
}
const bad = rows.filter((r) => r.meanWall > 0.5);
console.log(bad.length
  ? `FAIL: ${bad.map((r) => 'L' + r.lv).join(',')} — over half the frame is wall within 45 u`
  : 'PASS: no level spends a lap boxed in');
await b.close();
process.exit(bad.length ? 1 : 0);
