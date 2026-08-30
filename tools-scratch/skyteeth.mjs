/* DOES THE SKYLINE READ AS A RANGE, OR AS A ROW OF TEETH?
 *
 * The note in `_buildHorizon` measured aspect in WORLD units (h against w) and
 * widened w until the median came down. That is not what the eye judges. The
 * eye judges the SILHOUETTE: the top edge of the ring against the sky, from
 * the driver's seat, all the way round the compass. A 400 u form still draws a
 * tooth if it is turned so its SHORT axis faces you, if its neighbours are
 * half its height, or if the near ring buries everything but its summit - and
 * the top third of ANY mountain is a triangle.
 *
 * Method: hide everything except the horizon rings, paint them white on black,
 * and render a 360 deg panorama from the driver's eye as four 90 deg
 * quadrants. The top-most lit pixel in a column IS the skyline. Rendered three
 * times - both rings, the near ring alone, the far ring alone - so the far
 * ring's own shape and how much of it survives the near ring are separable.
 *
 *   toothAspect  per silhouette peak: prominence(deg) / width(deg) at half
 *                prominence. A tooth is around 1; a range is well under 0.4.
 *   slope        mean |d elev / d az| over the ring, deg per deg.
 *   peaks        peaks per 360 deg with prominence > 0.5 deg.
 *   farExposure  of the far ring's own height, the fraction still visible
 *                above the near ring. Low means you are shown summits only,
 *                which is the one silhouette that cannot help but be a
 *                triangle.
 *   skyGap       % of the compass with no ring at all.
 *
 *   LEVELS=21,62,66 node skyteeth.mjs
 *
 * FAILS LOUDLY: no rings, no instances, an empty panorama or no peaks found
 * all throw. A probe that measured nothing must not print a clean number.
 */
import { chromium } from 'playwright-core';

const PORT = process.env.PORT ?? '8911';
const LEVELS = (process.env.LEVELS ?? '21,62,66').split(',');
const RES = +(process.env.RES ?? 512);            // px per 90 deg quadrant

// The rings are built late in a ~90 s track build and `track.center` appears
// long before them, so a probe that evaluates on `center` alone measures a
// world with no skyline in it and then reports that it found nothing - a probe
// failure wearing a result's clothes.
async function waitRing(p, lv) {
  try {
    await p.waitForFunction(() => {
      const t = window.__game?.track; if (!t?.group) return false;
      let n = 0; t.group.traverse((o) => { if (/^horizon-/.test(o.name || '')) n += o.count || 0; });
      return n > 0;
    }, undefined, { timeout: 300000 });
  } catch {
    const d = await p.evaluate(() => ({ th: window.__game?.track?.T?.horizon ?? '(generic)',
      nm: window.__game?.track?.level?.name }));
    throw new Error(`L${lv} "${d.nm}" never built a horizon-hills/peaks ring `
      + `(horizon theme: ${d.th}) - not a subject for this probe`);
  }
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 700 } });
p.setDefaultTimeout(600000);
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));

const out = [];
for (const lv of LEVELS) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`,
    { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  await waitRing(p, lv);
  const r = await p.evaluate(async (RES) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    const ring = [];
    t.group.traverse((o) => { if (/^horizon-/.test(o.name || '')) ring.push(o); });
    if (!ring.length) throw new Error('NO HORIZON MESHES - nothing to measure');
    const nearM = ring.filter((m) => m.name === 'horizon-hills');
    const farM = ring.filter((m) => m.name === 'horizon-peaks');
    const inst = ring.reduce((s, m) => s + (m.count ?? 0), 0);
    if (!inst) throw new Error('horizon meshes present but ZERO instances');
    if (!farM.length) throw new Error('no horizon-peaks (far) ring found');

    const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
    const pct = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };

    // ---- world-unit shape of every instance, read off the real matrices ----
    const m4 = new THREE.Matrix4(), pos = new THREE.Vector3(),
      qq = new THREE.Quaternion(), sc = new THREE.Vector3();
    const shape = (list) => {
      const rows = [];
      for (const m of list) {
        for (let i = 0; i < m.count; i++) {
          m.getMatrixAt(i, m4); m4.decompose(pos, qq, sc);
          // unit form: y spans -0.5..0.5 and the across-ridge base radius is
          // 0.5, so world height = sy and the narrow horizontal width = min(sx, sz)
          rows.push({ h: sc.y, narrow: Math.min(sc.x, sc.z), broad: Math.max(sc.x, sc.z),
            rad: Math.hypot(pos.x, pos.z) });
        }
      }
      if (!rows.length) throw new Error('no instances in a ring the probe expected to find');
      return { n: rows.length, h: med(rows.map((x) => x.h)),
        narrow: med(rows.map((x) => x.narrow)), broad: med(rows.map((x) => x.broad)),
        rad: med(rows.map((x) => x.rad)),
        aspMed: med(rows.map((x) => x.h / x.narrow)),
        aspP90: pct(rows.map((x) => x.h / x.narrow), 0.9),
        hSpread: pct(rows.map((x) => x.h), 0.95) / pct(rows.map((x) => x.h), 0.05) };
    };

    // ---- panorama machinery ----
    const scene = g.scene, renderer = g.renderer;
    const rt = new THREE.WebGLRenderTarget(RES, RES);
    const cam = new THREE.PerspectiveCamera(90, 1, 1, 40000);
    const c0 = t.center[0];
    cam.position.set(c0.x, (c0.y ?? 0) + 2.6, c0.z);
    const TAN = Math.tan(Math.PI / 4);
    const buf = new Uint8Array(RES * RES * 4);
    const STEP = 0.25, NG = Math.round(360 / STEP);
    const el = (row) => Math.atan((((row + 0.5) / RES) * 2 - 1) * TAN) * 180 / Math.PI;

    const meshy = [];
    scene.traverse((o) => {
      if (o.isMesh || o.isPoints || o.isLine || o.isLineSegments || o.isSprite) meshy.push([o, o.visible]);
    });
    const sBG = scene.background, sFog = scene.fog, sOver = scene.overrideMaterial;
    const oldRT = renderer.getRenderTarget();
    const oldCC = new THREE.Color(); renderer.getClearColor(oldCC);
    const oldCA = renderer.getClearAlpha();
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });

    const pano = (keepList) => {
      const keep = new Set(keepList);
      for (const [o] of meshy) o.visible = keep.has(o);
      scene.background = null; scene.fog = null; scene.overrideMaterial = white;
      renderer.setClearColor(0x000000, 1);
      const prof = [];
      for (let qd = 0; qd < 4; qd++) {
        const yaw = qd * Math.PI / 2;
        cam.rotation.set(0, 0, 0);
        cam.lookAt(cam.position.x + Math.sin(yaw) * 100, cam.position.y, cam.position.z + Math.cos(yaw) * 100);
        cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
        renderer.setRenderTarget(rt);
        renderer.clear();
        renderer.render(scene, cam);
        renderer.readRenderTargetPixels(rt, 0, 0, RES, RES, buf);   // rows BOTTOM-UP
        for (let x = 0; x < RES; x++) {
          let top = -1, bot = -1;
          for (let yy = RES - 1; yy >= 0; yy--) if (buf[(yy * RES + x) * 4] > 16) { top = yy; break; }
          for (let yy = 0; yy < RES; yy++) if (buf[(yy * RES + x) * 4] > 16) { bot = yy; break; }
          const ndcX = ((x + 0.5) / RES) * 2 - 1;
          const az = (yaw * 180 / Math.PI + Math.atan(ndcX * TAN) * 180 / Math.PI + 720) % 360;
          prof.push({ az, top: top < 0 ? null : el(top), bot: bot < 0 ? null : el(bot) });
        }
      }
      if (!prof.some((s) => s.top !== null)) throw new Error('panorama is EMPTY - rendered no ring pixels');
      // Resample onto a uniform grid by NEAREST SAMPLE, not by bucketing: a
      // perspective quadrant samples azimuth unevenly (0.35 deg per pixel at
      // its edge against 0.18 at its centre), and bucketing leaves empty cells
      // at the seams that would be counted as holes in the range.
      const byAz = prof.slice().sort((a, c) => a.az - c.az);
      const top = new Array(NG), bot = new Array(NG);
      let ptr = 0;
      for (let k = 0; k < NG; k++) {
        const az = k * STEP;
        while (ptr < byAz.length - 1 && byAz[ptr + 1].az <= az) ptr++;
        const a = byAz[ptr], c = byAz[Math.min(byAz.length - 1, ptr + 1)];
        const s = Math.abs(a.az - az) <= Math.abs(c.az - az) ? a : c;
        top[k] = s.top; bot[k] = s.bot;
      }
      return { top, bot };
    };

    const stats = (top) => {
      const filled = top.filter((v) => v !== null).length;
      if (filled < NG * 0.2) throw new Error(`panorama covers only ${filled}/${NG} columns`);
      const skyGap = 100 * (1 - filled / NG);
      const base = pct(top.filter((v) => v !== null), 0.02);
      const E = top.map((v) => (v === null ? base : v));
      let sl = 0;
      for (let i = 0; i < NG; i++) sl += Math.abs(E[(i + 1) % NG] - E[i]) / STEP;
      const S = E.map((_, i) => (E[(i - 1 + NG) % NG] + E[i] + E[(i + 1) % NG]) / 3);
      const ext = [];
      for (let i = 0; i < NG; i++) {
        const a = S[(i - 1 + NG) % NG], c = S[i], d = S[(i + 1) % NG];
        if (c > a && c >= d) ext.push({ i, v: c, up: true });
        else if (c < a && c <= d) ext.push({ i, v: c, up: false });
      }
      const teeth = [];
      for (let e = 0; e < ext.length; e++) {
        const P = ext[e]; if (!P.up) continue;
        let L = null, R = null;
        for (let k = 1; k < ext.length; k++) { const z = ext[(e - k + ext.length * 2) % ext.length]; if (!z.up) { L = z; break; } }
        for (let k = 1; k < ext.length; k++) { const z = ext[(e + k) % ext.length]; if (!z.up) { R = z; break; } }
        if (!L || !R) continue;
        const prom = P.v - Math.max(L.v, R.v);
        if (prom < 0.5) continue;
        const half = P.v - prom / 2;
        let li = P.i, ri = P.i;
        for (let k = 0; k < NG / 2 && S[(P.i - k + NG) % NG] >= half; k++) li = P.i - k;
        for (let k = 0; k < NG / 2 && S[(P.i + k) % NG] >= half; k++) ri = P.i + k;
        const wid = (ri - li) * STEP;
        teeth.push({ prom, wid, asp: prom / Math.max(STEP, wid) });
      }
      if (!teeth.length) throw new Error('no silhouette peaks found at all - suspect the measurement');
      return { skyGap, base, top: Math.max(...E), slope: sl / NG, peaks: teeth.length,
        aspMed: med(teeth.map((x) => x.asp)), aspP90: pct(teeth.map((x) => x.asp), 0.9),
        promMed: med(teeth.map((x) => x.prom)), widMed: med(teeth.map((x) => x.wid)) };
    };

    let A, F, Nr, expo;
    try {
      A = pano(ring); const sA = stats(A.top);
      F = pano(farM); const sF = stats(F.top);
      Nr = pano(nearM);
      // how much of the far ring's own height still shows above the near ring
      const ex = [];
      for (let k = 0; k < NG; k++) {
        if (F.top[k] === null || F.bot[k] === null) continue;
        const full = F.top[k] - F.bot[k];
        if (full <= 0.05) continue;
        const floor = Nr.top[k] === null ? F.bot[k] : Math.max(F.bot[k], Nr.top[k]);
        ex.push(Math.max(0, F.top[k] - floor) / full);
      }
      if (!ex.length) throw new Error('far ring never rendered a base - cannot judge exposure');
      expo = { med: med(ex), p10: pct(ex, 0.1) };
      A = sA; F = sF;
    } finally {
      renderer.setRenderTarget(oldRT);
      renderer.setClearColor(oldCC, oldCA);
      rt.dispose(); white.dispose();
      scene.background = sBG; scene.fog = sFog; scene.overrideMaterial = sOver;
      for (const [o, v] of meshy) o.visible = v;
    }
    const rnd = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +v.toFixed(3)]));
    return { name: t.level?.name ?? '?', inst,
      all: rnd(A), far: rnd(F), expo: rnd(expo),
      wNear: rnd(shape(nearM)), wFar: rnd(shape(farM)) };
  }, RES);
  out.push(r);
  const L = (t, s) => `${t} peaks ${s.peaks} aspect med ${s.aspMed} p90 ${s.aspP90}`
    + ` (prom ${s.promMed}deg/wid ${s.widMed}deg) slope ${s.slope} top ${s.top}deg base ${s.base}deg gap ${s.skyGap}%`;
  console.log(`L${lv} ${r.name}  ${r.inst} instances`);
  console.log('   ' + L('BOTH ', r.all));
  console.log('   ' + L('FAR  ', r.far));
  console.log(`   far ring exposed above near ring: med ${r.expo.med} p10 ${r.expo.p10}`);
  const W = (t, w) => `${t} n${w.n} r${w.rad} h${w.h} narrow${w.narrow} broad${w.broad}`
    + ` aspect(h/narrow) med ${w.aspMed} p90 ${w.aspP90}  h spread x${w.hSpread}`;
  console.log('   ' + W('world near:', r.wNear));
  console.log('   ' + W('world far :', r.wFar));
}
const avg = (f) => +(out.reduce((s, r) => s + f(r), 0) / out.length).toFixed(3);
console.log(`\nMEAN over ${out.length} levels:`
  + ` BOTH aspect ${avg((r) => r.all.aspMed)} p90 ${avg((r) => r.all.aspP90)} slope ${avg((r) => r.all.slope)} peaks ${avg((r) => r.all.peaks)}`
  + ` | FAR aspect ${avg((r) => r.far.aspMed)} p90 ${avg((r) => r.far.aspP90)} slope ${avg((r) => r.far.slope)}`
  + ` | farExposure ${avg((r) => r.expo.med)}`
  + ` | worldAspFar ${avg((r) => r.wFar.aspMed)} p90 ${avg((r) => r.wFar.aspP90)}`);
await b.close();
