/* THE SEAM WHERE A MASSIF CONE MEETS THE GROUND, AS A NUMBER.
 *
 * `_buildMassif` lerps the bottom third of each cone toward `T.hillColor` so
 * "the foot grows out of the land". Whether it does is a question about
 * PIXELS, not about hex literals: the ground is vertex colour TIMES the
 * ground texture, the cone is vertex colour alone, so two swatches that look
 * alike in the theme table can still render as a hard step.
 *
 * Method, so the number cannot be the wrong thing measured:
 *   1. park the camera at the foot of one cone and render  -> A
 *   2. hide the InstancedMesh named 'massif' and re-render -> B
 *   3. cone pixels are exactly the pixels where A != B. No eyeballing, no
 *      guessed coordinates: if the massif is not in frame the mask is empty
 *      and this FAILS instead of reporting a clean seam.
 *   4. per column, find the bottom edge of the cone silhouette, then take a
 *      band of rock above it and a band of ground below it, both from A, and
 *      report the CIELAB distance across that boundary.
 * Median over columns, so one tree or one grass tuft standing at the foot
 * cannot carry the answer.
 *
 *   LEVELS=21,65,62,67 TAG=before node tools-scratch/massifseam.mjs
 */
import { chromium } from 'playwright-core';
import fs from 'fs';

const LEVELS = (process.env.LEVELS ?? '21,65,62,67').split(',');
const TAG = process.env.TAG ?? 'run';
const SEED = process.env.SEED ?? '7';
const W = +(process.env.W ?? 640), H = +(process.env.H ?? 420);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
page.setDefaultTimeout(600000);

let failed = 0;
for (const lv of LEVELS) {
  await page.goto(`http://localhost:8913/?level=${lv}&go=1&unlockall=1&seed=${SEED}`,
    { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  await page.evaluate(() => new Promise((r) => { let n = 0; const f = () => (++n > 24 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }));

  const res = await page.evaluate(async () => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    const mesh = g.scene.getObjectByName('massif');
    if (!mesh) return { err: 'no InstancedMesh named massif in the scene' };
    mesh.geometry.computeBoundingBox();
    const bb = mesh.geometry.boundingBox;
    const gr = Math.max(bb.max.x, bb.max.z);          // unit-cone foot radius
    const m = new THREE.Matrix4(), p = new THREE.Vector3();
    const q = new THREE.Quaternion(), s = new THREE.Vector3();
    const cones = [];
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, m); m.decompose(p, q, s);
      if (p.y < -9999 || s.y < 1) continue;
      cones.push({ i, x: p.x, z: p.z, r: gr * s.x, h: s.y });
    }
    if (!cones.length) return { err: 'massif mesh carries no live instances' };
    cones.sort((a, c) => c.r - a.r);

    const srgb2lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lab = (r, gg, bb2) => {
      const R = srgb2lin(r / 255), G = srgb2lin(gg / 255), B = srgb2lin(bb2 / 255);
      let x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
      let y = (0.2126 * R + 0.7152 * G + 0.0722 * B);
      let z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
      const f = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
      x = f(x); y = f(y); z = f(z);
      return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    };
    const dE = (a, c) => Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]);
    const med = (a) => (a.length ? a.slice().sort((x, y) => x - y)[a.length >> 1] : NaN);
    // SYNCHRONOUS, and that is the whole trick. The first cut of this awaited
    // an Image decode between the two renders; the game's own rAF loop got the
    // gap, redrew the frame from the car camera, and the A-vs-B diff came back
    // as 97 % of the picture - a "mask" that was really two different frames.
    // Nothing here may yield until both reads are done.
    const grab = () => {
      const src = g.renderer.domElement;
      const cv = document.createElement('canvas');
      cv.width = src.width; cv.height = src.height;
      const cx = cv.getContext('2d');
      cx.drawImage(src, 0, 0);
      return { px: cx.getImageData(0, 0, cv.width, cv.height).data,
        w: cv.width, h: cv.height, cv };
    };

    let best = null;
    for (const c of cones.slice(0, 3)) {
      // stand inside the ring, looking out at the near flank of this cone
      const L = Math.hypot(c.x, c.z) || 1;
      const dx = -c.x / L, dz = -c.z / L;                            // cone -> world centre
      const fx = c.x + dx * c.r * 0.92, fz = c.z + dz * c.r * 0.92;  // foot point
      const fy = t.terrainHeight(fx, fz);
      // far enough back that the whole cone, its foot and the ground it
      // stands in are all in one frame - a camera parked at the flank sees
      // nothing but rock, and the bottom silhouette never enters the picture
      const D = c.r * 1.15 + c.h * 0.9 + 30;
      const camx = c.x + dx * D, camz = c.z + dz * D;
      g.camera.fov = 42; g.camera.near = 0.2; g.camera.far = 4000;
      g.camera.position.set(camx, t.terrainHeight(camx, camz) + c.h * 0.20, camz);
      g.camera.lookAt(fx, fy + c.h * 0.06, fz);
      g.camera.updateProjectionMatrix();
      mesh.visible = true;
      g.renderer.render(g.scene, g.camera);
      const A = grab();
      mesh.visible = false;
      g.renderer.render(g.scene, g.camera);
      const B = grab();
      mesh.visible = true;

      const mask = new Uint8Array(A.w * A.h);
      let nmask = 0;
      for (let i = 0; i < mask.length; i++) {
        const o = i * 4;
        const d = Math.abs(A.px[o] - B.px[o]) + Math.abs(A.px[o + 1] - B.px[o + 1])
          + Math.abs(A.px[o + 2] - B.px[o + 2]);
        if (d > 12) { mask[i] = 1; nmask++; }
      }
      const ROCK = 10, GAP = 2, GRND = 10;
      const pairs = [];
      for (let x = 4; x < A.w - 4; x++) {
        let yb = -1;
        for (let y = A.h - 1 - GAP - GRND; y >= ROCK + 4; y--) {
          if (mask[y * A.w + x]) { yb = y; break; }
        }
        if (yb < 0) continue;
        let ok = true;
        for (let k = 1; k <= ROCK && ok; k++) if (!mask[(yb - k) * A.w + x]) ok = false;
        for (let k = GAP; k <= GAP + GRND && ok; k++) if (mask[(yb + k) * A.w + x]) ok = false;
        if (!ok) continue;
        const acc = (y0, y1) => {
          let r = 0, gg = 0, bl = 0, n = 0;
          for (let y = y0; y <= y1; y++) { const o = (y * A.w + x) * 4; r += A.px[o]; gg += A.px[o + 1]; bl += A.px[o + 2]; n++; }
          return [r / n, gg / n, bl / n];
        };
        const rock = acc(yb - ROCK, yb - 2), grnd = acc(yb + GAP, yb + GAP + GRND);
        pairs.push({ rock, grnd, d: dE(lab(...rock), lab(...grnd)) });
      }
      const cand = { cone: c, nmask, pairs, url: A.cv.toDataURL('image/png'), frame: A.w * A.h };
      if (!best || pairs.length > best.pairs.length) best = cand;
      if (nmask > A.w * A.h * 0.05 && nmask < A.w * A.h * 0.8 && pairs.length >= 80) break;
    }
    if (!best) return { err: 'no cone could be framed' };
    const ds = best.pairs.map((p2) => p2.d).sort((a, c) => a - c);
    const col = (k, key) => med(best.pairs.map((p2) => p2[key][k]));
    // what the foot is being told to aim at, for the record
    const hc = new THREE.Color(t.T.hillColor ?? 0x6e8a5c).getHexString();
    const ft = t._massifFootTone ? t._massifFootTone(t.T.massif).getHexString() : 'n/a';
    return {
      hillColor: '#' + hc, footTone: '#' + ft,
      theme: t.themeName ?? '', ncones: cones.length, r: Math.round(best.cone.r),
      nmask: best.nmask, frame: best.frame, cols: best.pairs.length,
      rock: [0, 1, 2].map((k) => col(k, 'rock')),
      grnd: [0, 1, 2].map((k) => col(k, 'grnd')),
      med: ds.length ? ds[ds.length >> 1] : NaN,
      mean: ds.reduce((a, v) => a + v, 0) / (ds.length || 1),
      p90: ds.length ? ds[Math.floor(ds.length * 0.9)] : NaN,
      url: best.url,
    };
  });

  if (res.err) { console.log(`L${lv}  PROBE FAIL: ${res.err}`); failed++; continue; }
  if (res.nmask < res.frame * 0.01) {
    console.log(`L${lv}  PROBE FAIL: massif covers only ${res.nmask}/${res.frame} px — not in frame`);
    failed++; continue;
  }
  if (res.cols < 40) {
    console.log(`L${lv}  PROBE FAIL: only ${res.cols} clean boundary columns (mask ${res.nmask} px)`);
    failed++; continue;
  }
  const hex = (a) => '#' + a.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  console.log(`L${lv} hill ${res.hillColor} foot ${res.footTone}  cone r${String(res.r).padStart(4)}  `
    + `mask ${String((100 * res.nmask / res.frame).toFixed(1)).padStart(4)}%  cols ${String(res.cols).padStart(3)}  `
    + `rock ${hex(res.rock)}  ground ${hex(res.grnd)}  `
    + `seam dE  med ${res.med.toFixed(1)}  mean ${res.mean.toFixed(1)}  p90 ${res.p90.toFixed(1)}`);
  fs.writeFileSync(`tools-scratch/seam-${TAG}-L${lv}.png`,
    Buffer.from(res.url.split(',')[1], 'base64'));
}
await b.close();
console.log(failed ? `PROBE FAILED on ${failed} level(s)` : 'probe found its subject on every level');
process.exit(failed ? 1 : 0);
