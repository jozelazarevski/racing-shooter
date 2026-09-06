/* WHICH FOOT COLOUR ACTUALLY CLOSES THE SEAM - a sweep, not an opinion.
 *
 * Rebuilding a world to try one colour costs ~90 s, which is why this kind of
 * question usually gets settled by argument. It does not have to be: the
 * massif's colours live in one BufferAttribute, so a candidate can be painted
 * straight over it and re-rendered. One world build, N candidates, several
 * cones - and cones matter, because a flank facing away from the sun and one
 * facing into it disagree about what a foot should be.
 *
 * The ground never changes between candidates, so the massif-hidden reference
 * frame is rendered ONCE per cone and the cone mask taken from it; every
 * candidate is then measured against the same ground pixels and the same
 * boundary. Row ORIGINAL replays the shipped behaviour exactly (hillColor,
 * ramp full at the buried geometric base) so every other row has something
 * real to beat.
 *
 * dE is split into dL - a shading step, which no albedo can remove from a
 * steep face - and dC, the COLOUR step the bug report is actually about.
 * Candidates walk a dial k: 0 is the ground's own painted albedo, 1 keeps the
 * luminance the old hillColor foot had, so only the colour moves.
 *
 *   LEVELS=21,65,62,67 node tools-scratch/footsweep.mjs
 */

import { chromium } from 'playwright-core';
const LEVELS = (process.env.LEVELS ?? '21,65').split(',');
const SEED = process.env.SEED ?? '7';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await (await b.newContext({ viewport: { width: 640, height: 420 } })).newPage();
page.setDefaultTimeout(600000);
for (const lv of LEVELS) {
  await page.goto(`http://localhost:8913/?level=${lv}&go=1&unlockall=1&seed=${SEED}`,
    { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  await page.evaluate(() => new Promise((r) => { let n = 0; const f = () => (++n > 24 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }));
  const out = await page.evaluate(async () => {
    const THREE = await import('three');
    const g = window.__game, t = g.track, T = t.T, M = T.massif;
    const mesh = g.scene.getObjectByName('massif');
    if (!mesh) return { err: "no mesh named 'massif'" };
    const srgb2lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lab = (r, gg, bb) => {
      const R = srgb2lin(r / 255), G = srgb2lin(gg / 255), B = srgb2lin(bb / 255);
      let x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
      let y = (0.2126 * R + 0.7152 * G + 0.0722 * B);
      let z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
      const f = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
      x = f(x); y = f(y); z = f(z);
      return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    };
    const med = (a) => (a.length ? a.slice().sort((x, y) => x - y)[a.length >> 1] : NaN);
    const grab = () => {
      const s = g.renderer.domElement;
      const cv = document.createElement('canvas');
      cv.width = s.width; cv.height = s.height;
      cv.getContext('2d').drawImage(s, 0, 0);
      return { px: cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, w: cv.width, h: cv.height };
    };

    // ---- frame the biggest cone -------------------------------------------
    mesh.geometry.computeBoundingBox();
    const gr = Math.max(mesh.geometry.boundingBox.max.x, mesh.geometry.boundingBox.max.z);
    const m4 = new THREE.Matrix4(), p = new THREE.Vector3();
    const q = new THREE.Quaternion(), sc = new THREE.Vector3();
    const cones = [];
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, m4); m4.decompose(p, q, sc);
      if (p.y < -9999 || sc.y < 1) continue;
      cones.push({ x: p.x, z: p.z, r: gr * sc.x, h: sc.y });
    }
    if (!cones.length) return { err: 'no live instances' };
    cones.sort((a, c) => c.r - a.r);
    const ALL = [];
    let texOut = null, ringOut = null;
    for (const c of cones.slice(0, 2)) {
    const L = Math.hypot(c.x, c.z) || 1, dx = -c.x / L, dz = -c.z / L;
    const fx = c.x + dx * c.r * 0.92, fz = c.z + dz * c.r * 0.92;
    const fy = t.terrainHeight(fx, fz);
    const D = c.r * 1.15 + c.h * 0.9 + 30;
    const cx2 = c.x + dx * D, cz2 = c.z + dz * D;
    g.camera.fov = 42; g.camera.near = 0.2; g.camera.far = 4000;
    g.camera.position.set(cx2, t.terrainHeight(cx2, cz2) + c.h * 0.20, cz2);
    g.camera.lookAt(fx, fy + c.h * 0.06, fz);
    g.camera.updateProjectionMatrix();

    // ---- the ground, once --------------------------------------------------
    mesh.visible = false; g.renderer.render(g.scene, g.camera);
    const B = grab();
    mesh.visible = true; g.renderer.render(g.scene, g.camera);
    const A0 = grab();
    const mask = new Uint8Array(A0.w * A0.h);
    let nmask = 0;
    for (let i = 0; i < mask.length; i++) {
      const o = i * 4;
      const d = Math.abs(A0.px[o] - B.px[o]) + Math.abs(A0.px[o + 1] - B.px[o + 1])
        + Math.abs(A0.px[o + 2] - B.px[o + 2]);
      if (d > 12) { mask[i] = 1; nmask++; }
    }
    if (nmask < A0.w * A0.h * 0.01) continue;      // this cone is not in frame; try the next
    const ROCK = 10, GAP = 2, GRND = 10;
    const cols = [];
    for (let x = 4; x < A0.w - 4; x++) {
      let yb = -1;
      for (let y = A0.h - 1 - GAP - GRND; y >= ROCK + 4; y--) if (mask[y * A0.w + x]) { yb = y; break; }
      if (yb < 0) continue;
      let ok = true;
      for (let k = 1; k <= ROCK && ok; k++) if (!mask[(yb - k) * A0.w + x]) ok = false;
      for (let k = GAP; k <= GAP + GRND && ok; k++) if (mask[(yb + k) * A0.w + x]) ok = false;
      if (ok) cols.push({ x, yb });
    }
    if (cols.length < 40) continue;               // no clean silhouette here; try the next
    const band = (px, w, x, y0, y1) => {
      let r = 0, gg = 0, bl = 0, n = 0;
      for (let y = y0; y <= y1; y++) { const o = (y * w + x) * 4; r += px[o]; gg += px[o + 1]; bl += px[o + 2]; n++; }
      return [r / n, gg / n, bl / n];
    };
    const gLab = cols.map((o) => lab(...band(A0.px, A0.w, o.x, o.yb + GAP, o.yb + GAP + GRND)));

    // ---- repaint + measure -------------------------------------------------
    const geo = mesh.geometry, pos = geo.attributes.position, ca = geo.attributes.color;
    const rockA = new THREE.Color(M.color ?? t._massifRock());
    const rockB = rockA.clone().offsetHSL(0.015, 0.05, -0.045);
    const snow = !!(T.rockSnowCap || T.treeSnowCap);
    const crest = snow ? new THREE.Color(0xf2f6fa) : rockA.clone().offsetHSL(0, -0.04, 0.10);
    const fh = (a, bq) => { const v = Math.sin(a * 12.9898 + bq * 78.233) * 43758.5453; return v - Math.floor(v); };
    const tmp = new THREE.Color();
    // anchor = the hf the ramp reaches full strength at. 0 replays the original
    // exactly (full at the geometric base, which is buried); 0.20 puts it at
    // the ground line, where the instance is actually seated.
    const paint = (foot, strength, top, anchor) => {
      for (let f = 0; f < pos.count; f += 3) {
        const hf = THREE.MathUtils.clamp((pos.getY(f) + pos.getY(f + 1) + pos.getY(f + 2)) / 3 + 0.5, 0, 1);
        tmp.copy((Math.floor(hf * 7) % 2) ? rockB : rockA);
        const apron = THREE.MathUtils.clamp((top - hf) / (top - anchor), 0, 1);
        if (apron > 0) tmp.lerp(foot, apron * strength);
        if (hf > 0.72) tmp.lerp(crest, ((hf - 0.72) / 0.28) * (snow ? 0.95 : 0.6));
        tmp.multiplyScalar(0.90 + fh(pos.getX(f), pos.getZ(f)) * 0.18);
        for (let k = 0; k < 3; k++) { ca.setXYZ(f + k, tmp.r, tmp.g, tmp.b); }
      }
      ca.needsUpdate = true;
      g.renderer.render(g.scene, g.camera);
      const A = grab();
      const dLs = [], dCs = [], dEs = [];
      const rk = [[], [], []];
      for (let i = 0; i < cols.length; i++) {
        const rgb = band(A.px, A.w, cols[i].x, cols[i].yb - ROCK, cols[i].yb - 2);
        rk[0].push(rgb[0]); rk[1].push(rgb[1]); rk[2].push(rgb[2]);
        const r = lab(...rgb), gl = gLab[i];
        const dL = gl[0] - r[0], da = gl[1] - r[1], db = gl[2] - r[2];
        dLs.push(Math.abs(dL)); dCs.push(Math.hypot(da, db));
        dEs.push(Math.hypot(dL, da, db));
      }
      const hex = (a) => '#' + a.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
      return { rock: hex(rk.map(med)), dL: med(dLs), dC: med(dCs), dE: med(dEs) };
    };

    // ---- what the ground REALLY is ----------------------------------------
    // `ground.base` is only the first fill of a canvas that then gets bands,
    // 420 growth patches, 150 lit pebbles, tufts and soft drifts painted over
    // it. Assuming base IS the map is the mistake that made the first fix too
    // dark, so take the map's own mean - averaged in LINEAR light, which is
    // what the shader multiplies in.
    let gm = null;
    g.scene.traverse((o) => {
      if (gm || !o.isMesh || !o.material || !o.material.map) return;
      const pm = o.geometry.parameters;
      if (pm && pm.widthSegments === 200 && pm.width === 2000) gm = o;
    });
    if (!gm) return { err: 'could not find the near ground mesh (2000/200 plane with a map)' };
    const img = gm.material.map.image;
    const tc = document.createElement('canvas');
    tc.width = img.width; tc.height = img.height;
    tc.getContext('2d').drawImage(img, 0, 0);
    const tp = tc.getContext('2d').getImageData(0, 0, tc.width, tc.height).data;
    let lr = 0, lg = 0, lb = 0;
    for (let i = 0; i < tp.length; i += 4) {
      lr += srgb2lin(tp[i] / 255); lg += srgb2lin(tp[i + 1] / 255); lb += srgb2lin(tp[i + 2] / 255);
    }
    const npx = tp.length / 4;
    const texMean = new THREE.Color(lr / npx, lg / npx, lb / npx);   // already linear

    // and the terrain's own painted vertex colours, out on the massif ring
    const gpos = gm.geometry.attributes.position, gcol = gm.geometry.attributes.color;
    const ringCol = new THREE.Color(0, 0, 0);
    let nring = 0;
    const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
    for (let i = 0; i < gpos.count; i++) {
      const X = gpos.getX(i), Z = gpos.getZ(i), R = Math.hypot(X, Z);
      if (R < M.r0 || R > M.r1) continue;
      if (M.spread < 6 && Math.abs(wrap(Math.atan2(Z, X) - M.az)) > M.spread / 2) continue;
      ringCol.r += gcol.getX(i); ringCol.g += gcol.getY(i); ringCol.b += gcol.getZ(i); nring++;
    }
    if (!nring) return { err: 'no terrain vertices found on the massif ring' };
    ringCol.multiplyScalar(1 / nring);
    const vtx = ringCol.clone().multiply(texMean);      // the product the shader draws
    texOut = '#' + texMean.getHexString(); ringOut = '#' + ringCol.getHexString();

    // ---- the candidates ----------------------------------------------------
    const gnd = t._massifFootTone ? t._massifFootTone(M) : new THREE.Color(T.hillColor);
    const model = gnd.clone();
    // GROUND CHROMATICITY, LUMINANCE ON A DIAL. k = 0 is the ground's own
    // albedo; k = 1 keeps the luminance the old hillColor foot had, so the
    // shading step across the seam cannot move and only the COLOUR does.
    const hillC = new THREE.Color(T.hillColor ?? 0x6e8a5c);
    const Y = (cc) => 0.2126 * cc.r + 0.7152 * cc.g + 0.0722 * cc.b;
    const gY = Math.max(1e-4, Y(model)), hY = Y(hillC);
    const lumMix = (k) => model.clone().multiplyScalar((gY * (1 - k) + hY * k) / gY);
    const cands = [
      ['k=0.00 pure ground', lumMix(0)],
      ['k=0.50 half way', lumMix(0.5)],
      ['k=1.00 hill lumin', lumMix(1)],
    ];
    const rows = [];
    rows.push({ name: 'ORIGINAL', st: 0.7,
      foot: '#' + new THREE.Color(T.hillColor ?? 0x6e8a5c).getHexString(),
      ...paint(new THREE.Color(T.hillColor ?? 0x6e8a5c), 0.7, 0.34, 0) });
    for (const [name, col] of cands) {
      for (const st of [0.7, 0.9]) {
        rows.push({ name, st, ...paint(col, st, 0.40, 0.20), foot: '#' + col.getHexString() });
      }
    }
    ALL.push({ cone: { r: Math.round(c.r), h: Math.round(c.h), az: Math.round(Math.atan2(c.z, c.x) * 180 / Math.PI) },
      cols: cols.length, nmask, frame: A0.w * A0.h, ground: '#' + [0,1,2].map((k) => Math.round(med(cols.map((o) => band(A0.px, A0.w, o.x, o.yb + GAP, o.yb + GAP + GRND)[k]))).toString(16).padStart(2,'0')).join(''), rows });
    }   // end cone loop
    return { hill: '#' + new THREE.Color(T.hillColor).getHexString(),
      base: T.ground && T.ground.base, texMean: texOut, ringVtx: ringOut, all: ALL };
  });
  if (out.err) { console.log(`L${lv}  SWEEP FAIL: ${out.err}`); continue; }
  console.log(`\nL${lv}  hillColor ${out.hill}  ground.base ${out.base}  map mean ${out.texMean}  terrain ramp on the ring ${out.ringVtx}`);
  if (!out.all.length) { console.log('   SWEEP FAIL: no cone could be measured on this level'); continue; }
  for (const C of out.all) {
    console.log(`   cone r${C.cone.r} h${C.cone.h} az${C.cone.az}deg  ${C.cols} cols  ground pixel ${C.ground}`);
    for (const r of C.rows) {
      console.log(`      ${r.name.padEnd(18)} ${r.foot}  str ${r.st}  rock ${r.rock}  dL ${r.dL.toFixed(1).padStart(5)}  dC ${r.dC.toFixed(1).padStart(5)}  dE ${r.dE.toFixed(1).padStart(5)}`);
    }
  }
}
await b.close();
console.log('\nsweep done');
