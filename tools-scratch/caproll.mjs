/* THE CAMERA, ROUND A WHOLE LAP, WITHOUT TELEPORTING IT.
 *
 * `camstuck.mjs` parked the car at twelve stations and found the camera 100 to
 * 180 units away at half of them, against the 49.5 that TOP-DOWN's own
 * geometry asks for (back 16, h 46 -> hypotenuse 48.7). That looked damning
 * and was probably the probe: jumping the car a third of a lap leaves the
 * camera to catch up from 300 units, and `clampCam` resolves a camera that far
 * out against the wrong part of the track. A player never teleports.
 *
 * So RAIL it. Advance the car smoothly along the centreline, one small index
 * step a frame, and sample as it goes — the camera is never asked to do
 * anything it is not asked to do in a race. Two frames of held index per
 * sample, which is a perturbation of centimetres rather than metres.
 *
 * Reports, per sample: how much of the car is hidden (key-colour, depth on vs
 * depth off), how far the camera is from it, and where it projects.
 *
 *   LEVEL=4 SAMPLES=20 node caproll.mjs
 */
import { chromium } from 'playwright-core';
const LEVEL = process.env.LEVEL ?? '4';
const SAMPLES = +(process.env.SAMPLES ?? 20);
const CAM = +(process.env.CAM ?? 0);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 760 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(async (cam) => {
  const g = window.__game;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  while (g.camMode !== cam) g.cycleCamera();
  const t = g.track, pl = g.player;
  window.__i = 0;
  window.__rail = (step) => {
    const t2 = g.track;
    window.__i = (window.__i + (step ?? 0)) % t2.N;
    const idx = Math.floor(window.__i);
    const c = t2.pointAt(idx, 0);
    pl.heading = t2.headingAt(idx);
    pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.vy = 0; pl.airborne = false; pl.trackIndex = idx;
    pl.vel.copy(pl.forward).multiplyScalar(28);
  };
  window.__key = (on, ignoreDepth) => {
    const car = pl.mesh;
    if (on) {
      car.__saved ??= [];
      if (!car.__saved.length) car.traverse((o) => { if (o.isMesh && o.material) car.__saved.push([o, o.material]); });
      for (const [o, m] of car.__saved) {
        const c2 = m.clone();
        c2.color?.setHex(0xff00ff); c2.emissive?.setHex(0xff00ff);
        c2.map = null; c2.emissiveMap = null; c2.transparent = false; c2.opacity = 1;
        c2.toneMapped = false; c2.fog = false; c2.depthTest = !ignoreDepth;
        o.material = c2; o.renderOrder = ignoreDepth ? 999 : 0;
      }
    } else {
      for (const [o, m] of car.__saved || []) { o.material.dispose?.(); o.material = m; o.renderOrder = 0; }
      car.__saved = [];
    }
  };
  // settle the camera on the rail before the first sample
  for (let i = 0; i < 60; i++) { window.__rail(1.2); await f(); }
}, CAM);
const shot = async () => (await p.screenshot({ clip: { x: 0, y: 0, width: 430, height: 660 } })).toString('base64');
const count = async (d) => p.evaluate(async (dd) => {
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + dd; });
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  cv.getContext('2d').drawImage(img, 0, 0);
  const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let n = 0;
  for (let q = 0; q < cv.width * cv.height; q++) {
    const i = q * 4;
    if (px[i] > 170 && px[i+2] > 170 && px[i+1] < 110) n++;
  }
  return n;
}, d);
const N = await p.evaluate(() => window.__game.track.N);
const perSample = Math.max(1, Math.round(N / SAMPLES / 1.2));
const rows = [];
for (let s = 0; s < SAMPLES; s++) {
  await p.evaluate(async (k) => {
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < k; i++) { window.__rail(1.2); await f(); }
  }, perSample);
  await p.evaluate(async () => {
    const f = () => new Promise((r) => requestAnimationFrame(r));
    window.__key(true, false); window.__rail(0); await f(); window.__rail(0); await f();
  });
  const seen = await count(await shot());
  await p.evaluate(async () => {
    const f = () => new Promise((r) => requestAnimationFrame(r));
    window.__key(false); window.__key(true, true);
    window.__rail(0); await f(); window.__rail(0); await f();
  });
  const full = await count(await shot());
  const geo = await p.evaluate(() => {
    const g = window.__game, pl = g.player;
    const v = pl.mesh.position.clone().project(g.camera);
    window.__key(false);
    const c = g.camera.position, tk = g.track;
    let camLat = null, ci = null;
    if (tk.nearestIndex && tk.lateralOffset) {
      ci = tk.nearestIndex(c, pl.trackIndex);
      camLat = +tk.lateralOffset(c, ci).toFixed(1);
    }
    return { idx: Math.floor(window.__i), ndc: [+v.x.toFixed(2), +v.y.toFixed(2)],
      camDist: +c.distanceTo(pl.mesh.position).toFixed(1),
      camY: +c.y.toFixed(1), carY: +pl.pos.y.toFixed(1),
      camLat, camIdx: ci, carIdx: pl.trackIndex,
      cliffWalls: !!tk.T?.cliffWalls };
  });
  rows.push({ seen, full, occludedPct: full ? +(100 * (1 - seen / full)).toFixed(1) : null, ...geo });
  if (process.env.SHOT && (rows.at(-1).occludedPct ?? 0) > 55)
    await p.screenshot({ path: `tools-scratch/shot-roll-${geo.idx}.png`, clip: { x: 0, y: 0, width: 430, height: 660 } });
}
console.log(JSON.stringify({ N, expectedCamDist: +Math.hypot(16, 46).toFixed(1), rows }));
await b.close();
