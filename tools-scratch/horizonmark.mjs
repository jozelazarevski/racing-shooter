/* WHERE IS THE HORIZON, ACTUALLY — drawn on the picture, not asserted.
 *
 * `rigmeas` computes the horizon from the lens pitch and prints a number. A
 * probe that only prints numbers cannot tell you whether the number describes
 * the picture: the first sweep of this bug reported a horizon comfortably
 * inside the frame while the sky measured 0% of it, and BOTH were being said
 * about a render nobody had ruled a line on. So: paint the sky dome magenta
 * and the painted far treeline cyan, re-shoot, and count those colours; and
 * rule the computed horizon across the base shot in red, so the arithmetic
 * can be checked by eye against the ground it claims to bound.
 *
 *   TAG=after node tools-scratch/horizonmark.mjs
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const TAG = process.env.TAG ?? 'x';
const NOVEG = process.env.NOVEG === '1';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8916/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(async ([NOVEG]) => {
  const THREE = await import('three');
  const g = window.__game;
  const mod = await import('./src/vehicles.js');
  const S = 4, W = 148 * S, H = 96 * S;
  // THE RIG IS READ OUT OF THE SERVED SOURCE, never handed in. `_shoot` takes
  // its eye direction from the module constant and from nowhere else — `dist`
  // and `look` are all a caller can pass — so a probe that "tries a rig" by
  // passing one renders the SHIPPED azimuth every time and reports a sweep
  // that never happened. To try a rig, edit the constant and run this again.
  const src = await (await fetch('./src/main.js')).text();
  const grab = (name) => {
    const m = src.match(new RegExp(`const ${name} = new THREE\\.Vector3\\(([^)]*)\\)`));
    if (!m) throw new Error(`${name} not found in the served source`);
    return m[1].split(',').map(Number);
  };
  const G = grab('SHOT_RIG_GROUND'), P = grab('SHOT_RIG');
  const dir = new THREE.Vector3(...G);
  const FRONT_OFF = Math.PI * 0.82 - Math.atan2(P[0], P[2]);
  const yaw = Math.atan2(dir.x, dir.z) + FRONT_OFF;
  const probe = new THREE.PerspectiveCamera(30, 148 / 96, 0.1, 600);
  const built = mod.CAR_CATALOG.map((car) => {
    const mesh = mod.buildCarMesh(car.spec);
    mesh.rotation.y = yaw;
    return { car, mesh, bx: new THREE.Box3().setFromObject(mesh) };
  });
  const tall = built.reduce((a, c) => (c.bx.max.y > a.bx.max.y ? c : a));
  const look = 0.55 + (tall.bx.getCenter(new THREE.Vector3()).y - 0.55) * 0.5;
  let dist = 0;
  for (const { bx } of built) dist = Math.max(dist, g._fitDist(bx, probe, look, 0.86, dir));
  const eye = dir.clone().normalize().multiplyScalar(dist);
  const pitch = Math.atan2(eye.y - look, Math.hypot(eye.x, eye.z));
  const hNdc = Math.tan(pitch) / Math.tan(15 * Math.PI / 180);
  const st = g._studio(W, H);
  if (st.forest.children.length !== 14) throw new Error('diorama is not 14 parts');
  const shoot = () => {
    const m = mod.buildCarMesh(tall.car.spec);
    m.rotation.y = yaw;
    return g._shoot(m, W, H, { ground: true, dist, look });
  };
  const base = shoot();
  // WHAT IS ABOVE THE HORIZON, if it is not the sky? Hide every solid the
  // diorama plants — pines, rocks, bushes, tufts, scuffs — and shoot again.
  // Whatever is left up there is backdrop, and if the backdrop is still not
  // magenta or cyan then the probe is lying and not the picture.
  if (NOVEG) for (let i = 5; i <= 13; i++) st.forest.children[i].visible = false;
  // PAINT THE BACKDROP. The dome and the far treeline are the only two things
  // in this diorama that live above the horizon by construction; if neither
  // shows up in flat magenta or cyan then nothing above the horizon is in shot.
  const dome = st.forest.children[0], back = st.forest.children[1];
  const dm = dome.material.map, bm = back.material.map;
  const dc = dome.material.color.clone(), bc = back.material.color.clone();
  dome.material.map = null; dome.material.color.set(0xff00ff); dome.material.needsUpdate = true;
  back.material.map = null; back.material.color.set(0x00ffff);
  back.material.transparent = false; back.material.needsUpdate = true;
  const marked = shoot();
  if (NOVEG) for (let i = 5; i <= 13; i++) st.forest.children[i].visible = true;
  dome.material.map = dm; dome.material.color.copy(dc); dome.material.needsUpdate = true;
  back.material.map = bm; back.material.color.copy(bc);
  back.material.transparent = true; back.material.needsUpdate = true;
  return { W, H, rig: G, dist: +dist.toFixed(2), look: +look.toFixed(3),
    pitchDeg: +(pitch * 180 / Math.PI).toFixed(2), hNdc: +hNdc.toFixed(3), base, marked };
}, [NOVEG]);

const res = await p.evaluate(async ([o]) => {
  const load = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; });
  // AT THE IMAGE'S OWN SIZE. The studio renderer draws at a pixel ratio, so
  // `toDataURL` hands back a picture LARGER than the pixel size asked for —
  // 1184x768 for a 592x384 shot. A canvas sized from the request and drawn
  // at 0,0 measures the top-left QUADRANT and calls it the frame, which is
  // how the sky came back at 0% from a probe looking only at the corner the
  // sky is not in.
  const m0 = await load(o.marked);
  o.W = m0.naturalWidth; o.H = m0.naturalHeight;
  const c = document.createElement('canvas');
  c.width = o.W; c.height = o.H;
  const x = c.getContext('2d');
  x.drawImage(m0, 0, 0);
  const d = x.getImageData(0, 0, o.W, o.H).data;
  let mag = 0, cyan = 0, topMag = o.H, topCyan = o.H, botMag = -1, botCyan = -1;
  for (let i = 0; i < d.length; i += 4) {
    const row = (i / 4 / o.W) | 0;
    if (d[i] > 180 && d[i+1] < 90 && d[i+2] > 180) { mag++; if (row < topMag) topMag = row; if (row > botMag) botMag = row; }
    if (d[i] < 90 && d[i+1] > 180 && d[i+2] > 180) { cyan++; if (row < topCyan) topCyan = row; if (row > botCyan) botCyan = row; }
  }
  // ...and rule the computed horizon on the base shot
  x.clearRect(0, 0, o.W, o.H);
  x.drawImage(await load(o.base), 0, 0);
  const y = Math.round(o.H * (1 - o.hNdc) / 2);
  x.fillStyle = 'rgba(255,0,0,0.9)';
  if (y >= 0 && y < o.H) x.fillRect(0, y, o.W, 2);
  return { imgH: o.H, mag: +(100 * mag / (o.W * o.H)).toFixed(2), cyan: +(100 * cyan / (o.W * o.H)).toFixed(2),
    magRows: [topMag, botMag], cyanRows: [topCyan, botCyan], horizonRow: y,
    ruled: c.toDataURL(), markedPng: o.marked };
}, [out]);

console.log(`SHOT_RIG_GROUND ${out.rig.join(', ')}  dist ${out.dist}  look ${out.look}  pitch ${out.pitchDeg}  horizon ndc ${out.hNdc}`);
console.log(`  computed horizon at row ${res.horizonRow} of ${res.imgH}${NOVEG ? '  [vegetation hidden]' : ''}`);
console.log(`  sky dome (magenta): ${res.mag}% of frame, rows ${res.magRows.join('..')}`);
console.log(`  far treeline (cyan): ${res.cyan}% of frame, rows ${res.cyanRows.join('..')}`);
for (const [n, u] of [[`ruled`, res.ruled], [`marked`, res.markedPng]]) {
  const f = `tools-scratch/shot-horizon-${TAG}-${n}.png`;
  writeFileSync(f, Buffer.from(u.split(',')[1], 'base64'));
  console.log(`  wrote ${f}`);
}
await b.close();
