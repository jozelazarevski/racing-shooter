/* WHAT THE SHELF RIG ACTUALLY FRAMES.
 *
 * THE RIG IS READ OUT OF THE SERVED SOURCE, not handed in. `_shoot` takes its
 * eye direction from the module constant and nothing else — `dist` and `look`
 * are the only things a caller can pass — so a probe that "sweeps a rig" by
 * passing one to `_shoot` renders the SHIPPED azimuth every time at a slightly
 * different zoom, and reports a sweep that never happened. This one fetches
 * /src/main.js, pulls `SHOT_RIG_GROUND` out of it, and does its arithmetic on
 * that: the numbers and the picture cannot disagree about which rig is in play.
 * To try a rig, edit the constant and run this again.
 *
 * Reports, for the whole catalogue framed the way `_carIcons` frames it:
 *
 *   pitch      how far below horizontal the lens looks
 *   horizon    the horizon's clip-space y. >= 1 is OFF THE TOP: no sky, no
 *              skyline, no treetop can reach the frame whatever is built
 *   above%     share of the frame's height above the horizon line
 *   sky/skyline  MEASURED: hide the dome / the painted far treeline, count
 *              the pixels that changed
 *   fit        worst |ndc| over every corner of every car. >= 1 is cropped
 *   occl       samples over the car's own projected box where a pine, rock,
 *              bush or tuft is nearer the lens than the car is
 *
 * FAILS LOUDLY: no constant in the source, a diorama that is not the fourteen
 * parts it knows by index, or a ray sweep that cannot hit the car, all throw.
 *
 *   TAG=before CARS=brawler,sleek node tools-scratch/rigmeas.mjs
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const TAG = process.env.TAG ?? 'x';
const CARS = (process.env.CARS ?? 'brawler').split(',');
const SCALE = +(process.env.SCALE ?? 4);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
p.setDefaultTimeout(600000);
p.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERR', m.text()); });
await p.goto('http://localhost:8916/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(async ([CARS, S]) => {
  const THREE = await import('three');
  const g = window.__game;
  const mod = await import('./src/vehicles.js');
  const W = 148 * S, H = 96 * S;
  const src = await (await fetch('./src/main.js')).text();
  const grab = (name) => {
    const m = src.match(new RegExp(`const ${name} = new THREE\\.Vector3\\(([^)]*)\\)`));
    if (!m) throw new Error(`${name} not found in the served source — this probe reads the rig out of the file it is measuring, and cannot guess`);
    return m[1].split(',').map(Number);
  };
  const G = grab('SHOT_RIG_GROUND'), P = grab('SHOT_RIG');
  const rig = new THREE.Vector3(...G);
  // `_carIcons`' own yaw: hold the offset from the PART rig, which never moves
  const FRONT_OFF = Math.PI * 0.82 - Math.atan2(P[0], P[2]);
  const yaw = Math.atan2(rig.x, rig.z) + FRONT_OFF;
  // ...and its one-aim-one-distance-for-the-whole-row
  const probe = new THREE.PerspectiveCamera(30, 148 / 96, 0.1, 600);
  const built = mod.CAR_CATALOG.map((car) => {
    const mesh = mod.buildCarMesh(car.spec);
    mesh.rotation.y = yaw;
    return { car, mesh, bx: new THREE.Box3().setFromObject(mesh) };
  });
  const tall = built.reduce((a, c) => (c.bx.max.y > a.bx.max.y ? c : a));
  const look = 0.55 + (tall.bx.getCenter(new THREE.Vector3()).y - 0.55) * 0.5;
  let dist = 0;
  for (const { bx } of built) dist = Math.max(dist, g._fitDist(bx, probe, look, 0.86, rig));

  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 600);
  cam.position.copy(rig).normalize().multiplyScalar(dist);
  cam.lookAt(0, look, 0);
  cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  const pitch = Math.atan2(cam.position.y - look, Math.hypot(cam.position.x, cam.position.z));
  const hNdc = Math.tan(pitch) / Math.tan(15 * Math.PI / 180);
  const above = Math.max(0, Math.min(1, (1 - hNdc) / 2));

  const fits = built.map(({ car, bx }) => {
    let worst = 0;
    for (const x of [bx.min.x, bx.max.x]) for (const y of [bx.min.y, bx.max.y])
      for (const z of [bx.min.z, bx.max.z]) {
        const v = new THREE.Vector3(x, y, z).project(cam);
        worst = Math.max(worst, Math.abs(v.x), Math.abs(v.y));
      }
    return { key: car.key, h: +bx.max.y.toFixed(2), worst: +worst.toFixed(3) };
  });

  const st = g._studio(W, H);
  if (st.forest.children.length !== 14)
    throw new Error(`diorama is ${st.forest.children.length} parts, expected 14 — this probe knows which is which by INDEX`);
  const shoot = (key) => {
    const e = built.find((c) => c.car.key === key);
    if (!e) throw new Error(`no car ${key} in the catalogue`);
    const mesh = mod.buildCarMesh(e.car.spec);
    mesh.rotation.y = yaw;
    return g._shoot(mesh, W, H, { ground: true, dist, look });
  };
  const shots = { base: shoot(CARS[0]) };
  for (const [i, n] of [[0, 'dome'], [1, 'skyline']]) {
    st.forest.children[i].visible = false;
    shots[`no-${n}`] = shoot(CARS[0]);
    st.forest.children[i].visible = true;
  }
  const extra = {};
  for (const k of CARS) extra[k] = shoot(k);

  // OCCLUSION, by ray, over each car's own projected box — EVERY car, not a
  // representative one. A trunk that misses the saloon can still cross the
  // truck: they are different sizes and they are all shot from one place.
  st.forest.visible = true;
  const solids = [5, 6, 7, 8, 9, 10, 11, 12].map((i) => st.forest.children[i]);
  const rc = new THREE.Raycaster();
  const N = 34;
  const occl = [];
  for (const e of built) {
    const mesh = mod.buildCarMesh(e.car.spec);
    mesh.rotation.y = yaw;
    st.scene.add(mesh);
    const bx = e.bx;
    let lo = [1, 1], hi = [-1, -1];
    for (const x of [bx.min.x, bx.max.x]) for (const y of [bx.min.y, bx.max.y])
      for (const z of [bx.min.z, bx.max.z]) {
        const v = new THREE.Vector3(x, y, z).project(cam);
        lo = [Math.min(lo[0], v.x), Math.min(lo[1], v.y)];
        hi = [Math.max(hi[0], v.x), Math.max(hi[1], v.y)];
      }
    let onCar = 0, blocked = 0;
    for (let iy = 0; iy <= N; iy++) for (let ix = 0; ix <= N; ix++) {
      rc.setFromCamera(new THREE.Vector2(lo[0] + (hi[0]-lo[0]) * ix / N,
        lo[1] + (hi[1]-lo[1]) * iy / N), cam);
      const hc = rc.intersectObject(mesh, true)[0];
      if (!hc) continue;
      onCar++;
      const hf = rc.intersectObjects(solids, true)[0];
      if (hf && hf.distance < hc.distance - 1e-3) blocked++;
    }
    st.scene.remove(mesh);
    if (onCar < 150)
      throw new Error(`${e.car.key}: ray sweep hit the car only ${onCar} times of ${(N+1)*(N+1)} — the probe lost its subject, not a clean result`);
    occl.push({ key: e.car.key, onCar, blocked, pct: +(100 * blocked / onCar).toFixed(1) });
  }
  st.forest.visible = false;

  return { W, H, rig: G, dist: +dist.toFixed(2), look: +look.toFixed(3),
    azDeg: +(Math.atan2(rig.x, rig.z) * 180 / Math.PI).toFixed(1),
    elDeg: +(Math.atan2(rig.y, Math.hypot(rig.x, rig.z)) * 180 / Math.PI).toFixed(1),
    eye: cam.position.toArray().map((v) => +v.toFixed(2)),
    pitchDeg: +(pitch * 180 / Math.PI).toFixed(2), hNdc: +hNdc.toFixed(3),
    abovePct: +(above * 100).toFixed(1), fits, occl, shots, extra };
}, [CARS, SCALE]);

const diffs = await p.evaluate(async ([shots]) => {
  const load = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; });
  // AT THE IMAGE'S OWN SIZE. The studio renders at a pixel ratio, so the data
  // URL is bigger than the size asked for; a canvas sized from the request
  // measures the top-left QUADRANT and reports it as the whole frame.
  const px = async (u) => { const i = await load(u);
    const c = document.createElement('canvas');
    c.width = i.naturalWidth; c.height = i.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(i, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
  const base = await px(shots.base);
  const out = [];
  for (const [k, u] of Object.entries(shots)) {
    if (k === 'base') continue;
    const a = await px(u);
    let n = 0;
    for (let i = 0; i < a.length; i += 4)
      if (Math.abs(a[i] - base[i]) + Math.abs(a[i+1] - base[i+1]) + Math.abs(a[i+2] - base[i+2]) > 18) n++;
    out.push([k, +(100 * n / (a.length / 4)).toFixed(1)]);
  }
  return out;
}, [out.shots]);

console.log(`SHOT_RIG_GROUND ${out.rig.join(', ')}  (azimuth ${out.azDeg} deg off the trail's axis, elevation ${out.elDeg} deg)`);
console.log(`  dist ${out.dist}  look ${out.look}  eye ${out.eye.join(', ')}`);
console.log(`  pitch ${out.pitchDeg} deg below horizontal`);
console.log(`  HORIZON ndc ${out.hNdc}${out.hNdc >= 1 ? '   OFF THE TOP OF THE FRAME' : ''}`);
console.log(`  frame above the horizon: ${out.abovePct}%`);
for (const [k, v] of diffs) console.log(`  ${k.padEnd(12)} owns ${v}% of the frame`);
console.log('  per car — fit (worst |ndc|, >=1 is cropped) and occlusion (samples behind a pine/rock/bush):');
for (const f of out.fits) {
  const o = out.occl.find((q) => q.key === f.key);
  console.log(`    ${f.key.padEnd(10)} h ${String(f.h).padEnd(5)} worst ${f.worst}${f.worst >= 1 ? ' CROPPED' : '       '}  occluded ${o.blocked}/${o.onCar} = ${o.pct}%`);
}
for (const [k, u] of Object.entries(out.extra)) {
  const f = `tools-scratch/shot-rig-${TAG}-${k}.png`;
  writeFileSync(f, Buffer.from(u.split(',')[1], 'base64'));
  console.log(`  wrote ${f}`);
}
await b.close();
