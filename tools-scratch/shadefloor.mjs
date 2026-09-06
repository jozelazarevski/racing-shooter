/* LIFTING THE SHADE SIDE WITHOUT WASHING THE WORLD OUT. The reference's facades
 * bottom out at luminance 68; the game's bottom out at 9-15, which is what
 * makes a Ligurian street read heavy. The lever is the hemisphere fill, but it
 * lights EVERYTHING, so this sweeps it and reports the cost alongside the
 * gain: facade P10/P50/P90 through a flat-white mask of the frontage itself,
 * and the road and whole-frame means beside them. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 900, height: 540 } })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>20?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const front = [];
  g.scene.traverse((o) => { if (o.isInstancedMesh && o.name === 'oldtown-frontage') front.push(o); });
  // park on the densest built-up stretch
  const bin = new Array(t.N).fill(0), step = Math.max(1, Math.floor(t.N / 260));
  const m = new (g.camera.matrixWorld.constructor)();
  for (const o of front) for (let k = 0; k < o.count; k++) {
    o.getMatrixAt(k, m); const x = m.elements[12], z = m.elements[14];
    let best = -1, bd = 1e9;
    for (let i = 0; i < t.N; i += step) { const c = t.center[i]; const d = (c.x-x)**2 + (c.z-z)**2; if (d < bd) { bd = d; best = i; } }
    if (bd < 3600) bin[best]++;
  }
  const W = Math.max(4, Math.floor(t.N * 0.06));
  let run = 0; for (let k = 0; k < W; k++) run += bin[k];
  let bi = 0, bv = run;
  for (let i = 1; i < t.N; i++) { run += bin[(i+W-1)%t.N] - bin[(i-1+t.N)%t.N]; if (run > bv) { bv = run; bi = i; } }
  const i = (bi + (W >> 1)) % t.N, c = t.center[i], f2 = t.center[(i + 26) % t.N];
  g.camera.position.set(c.x, c.y + 7.5, c.z);
  g.camera.lookAt(f2.x, f2.y + 2.5, f2.z);
  const grab = () => { g.renderer.render(g.scene, g.camera);
    const cv = g.renderer.domElement, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    return o.getContext('2d').getImageData(0, 0, o.width, o.height).data; };
  // the mask: frontage flat-white, everything else hidden. Built once.
  const hidden = [], swapped = [];
  g.scene.traverse((o) => { if ((o.isMesh || o.isInstancedMesh) && o.visible && !front.includes(o)) { o.visible = false; hidden.push(o); } });
  const MC = front[0].material.constructor;
  for (const o of front) { swapped.push([o, o.material]);
    const mm = new MC({ color: 0xffffff }); mm.map = null; mm.emissive?.setHex?.(0xffffff);
    mm.emissiveIntensity = 1; o.material = mm; }
  const M = grab();
  for (const [o, mat] of swapped) o.material = mat;
  for (const o of hidden) o.visible = true;
  const mask = [];
  for (let k = 0; k < M.length; k += 4) if (M[k] > 120 && M[k+1] > 120 && M[k+2] > 120) mask.push(k);
  const road = [];
  g.scene.traverse((o) => { if (o.name === 'road') road.push(o); });
  const stat = () => {
    const A = grab();
    const lum = [];
    let r = 0, gg = 0, bb = 0;
    for (const k of mask) { lum.push(0.2126*A[k] + 0.7152*A[k+1] + 0.0722*A[k+2]); r += A[k]; gg += A[k+1]; bb += A[k+2]; }
    lum.sort((a, b2) => a - b2);
    const q = (f) => Math.round(lum[Math.floor(lum.length * f)] ?? 0);
    let fr = 0, n2 = 0;
    for (let k = 0; k < A.length; k += 4) { fr += 0.2126*A[k] + 0.7152*A[k+1] + 0.0722*A[k+2]; n2++; }
    const mx = Math.max(r, gg, bb, 1);
    return { p10: q(0.10), p50: q(0.50), p90: q(0.90),
      sat: +(1 - Math.min(r, gg, bb) / mx).toFixed(3),
      frameMean: Math.round(fr / n2) };
  };
  const hemi = g.hemi;
  const base = { intensity: +hemi.intensity.toFixed(2),
    sky: '#' + hemi.color.getHexString(), ground: '#' + hemi.groundColor.getHexString(),
    themeHemiIntensity: t.T.hemiIntensity, sun: +(g.sun?.intensity ?? 0).toFixed(2) };
  const rows = [];
  for (const mult of [1, 1.5, 2.0, 2.5, 3.0]) {
    hemi.intensity = base.intensity * mult;
    rows.push({ hemiMult: mult, hemi: +hemi.intensity.toFixed(2), ...stat() });
  }
  hemi.intensity = base.intensity;
  // ...and the other lever: a paler hemisphere GROUND, which is what actually
  // reaches a wall's shaded face (the sky half is occluded by the street)
  const g0 = hemi.groundColor.clone();
  const alts = [];
  for (const hexc of ['#cfc6b4', '#ded6c6', '#efe9dc']) {
    hemi.groundColor.set(hexc);
    hemi.intensity = base.intensity * 1.8;
    alts.push({ ground: hexc, hemiMult: 1.8, ...stat() });
  }
  hemi.groundColor.copy(g0); hemi.intensity = base.intensity;
  return { world: g.level.name, at: +(i / t.N).toFixed(3), base, sweep: rows, groundSweep: alts,
    reference: { p10: 68, p50: 124, p90: 188, sat: 0.327 } };
}), null, 1));
await b.close();
