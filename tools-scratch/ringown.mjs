/* WHO OWNS THE SKYLINE?
 *
 * A frame of GLACIER COL taken before and after the horizon ring was rebuilt
 * came back all but identical while the panorama probe said the ring's
 * silhouette had halved its aspect. Both were true: the pale spiky wall along
 * the top of that frame is the world's OWN terrain - `_highland` raises real
 * ground to ~68 u out to r 1450 and `_rimWall` puts a 260 u headwall at 1620 -
 * plus the near massif crags at r 340-720. The ring at 930-1280 was behind all
 * of it. A photograph of a skyline that is not the ring is not evidence about
 * the ring.
 *
 * So, per station round the lap: render the frame normally, then again with
 * horizon-hills/horizon-peaks hidden, then once with every mesh hidden to get
 * the bare sky. The topmost non-sky pixel in a column is the skyline; the
 * share of columns whose skyline MOVES when the ring is hidden is the share of
 * the skyline the ring actually owns. Cloud meshes are hidden throughout - a
 * cloud is not a skyline.
 *
 *   LEVELS=21,62,30,50 node ringown.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? '8911';
const LEVELS = (process.env.LEVELS ?? '21,62').split(',');
const STATIONS = +(process.env.STATIONS ?? 8);
const W = +(process.env.W ?? 640), H = +(process.env.H ?? 300);
const PITCH = +(process.env.PITCH ?? 15);        // lookAt height, camera sits at 11.5

async function waitRing(p, lv) {
  try {
    await p.waitForFunction(() => {
      const t = window.__game?.track; if (!t?.group) return false;
      let n = 0; t.group.traverse((o) => { if (/^horizon-/.test(o.name || '')) n += o.count || 0; });
      return n > 0;
    }, undefined, { timeout: 420000 });
  } catch {
    const d = await p.evaluate(() => ({ th: window.__game?.track?.T?.horizon ?? '(generic)',
      nm: window.__game?.track?.level?.name }));
    throw new Error(`L${lv} "${d.nm}" never built a horizon ring (theme ${d.th})`);
  }
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 900, height: 400 } });
p.setDefaultTimeout(600000);
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));

for (const lv of LEVELS) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  await waitRing(p, lv);
  const r = await p.evaluate(async ({ STATIONS, W, H, PITCH }) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    const ring = [], clouds = [];
    g.scene.traverse((o) => {
      if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
      if (/^horizon-/.test(o.name || '')) ring.push(o);
      if (/^cloud-bank/.test(o.name || '')) clouds.push(o);
    });
    if (!ring.length) throw new Error('no horizon ring on this level');
    // THE SKY IS A MESH TOO. The dome is an unnamed BackSide SphereGeometry
    // (r 3000, depthWrite false) and the haze bands are the same kind of
    // thing. Hiding "every mesh" to get a bare-sky reference hid the sky as
    // well, the reference came back as clear colour, every pixel then counted
    // as world, and the probe reported a confident 0% on five levels in a row.
    // The sky pass keeps the depth-less BackSide shells and hides the rest.
    const every = [], isSky = (o) => o.material && o.material.depthWrite === false
      && o.material.side === THREE.BackSide;
    g.scene.traverse((o) => {
      if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && !isSky(o)) every.push(o);
    });
    const rt = new THREE.WebGLRenderTarget(W, H);
    const cam = new THREE.PerspectiveCamera(60, W / H, 1, 40000);
    const A = new Uint8Array(W * H * 4), C = new Uint8Array(W * H * 4), S = new Uint8Array(W * H * 4);
    const oldRT = g.renderer.getRenderTarget();
    const shot = (buf) => {
      g.renderer.setRenderTarget(rt); g.renderer.clear();
      g.renderer.render(g.scene, cam);
      g.renderer.readRenderTargetPixels(rt, 0, 0, W, H, buf);
    };
    // topmost non-sky row per column (rows are bottom-up, so scan from the top)
    const skyline = (buf) => {
      const out = new Int16Array(W).fill(-1);
      for (let x = 0; x < W; x++) {
        for (let y = H - 1; y >= 0; y--) {
          const o = (y * W + x) * 4;
          if (Math.abs(buf[o] - S[o]) + Math.abs(buf[o + 1] - S[o + 1]) + Math.abs(buf[o + 2] - S[o + 2]) > 10) { out[x] = y; break; }
        }
      }
      return out;
    };
    const rows = [];
    const visAll = every.map((o) => o.visible);
    try {
      for (let s = 0; s < STATIONS; s++) {
        const i = Math.floor((s / STATIONS) * t.N) % t.N;
        const p0 = t.center[i], p1 = t.center[(i + 12) % t.N];
        const f = new THREE.Vector3(p1.x - p0.x, 0, p1.z - p0.z).normalize();
        cam.position.set(p0.x - f.x * 17, (p0.y ?? 0) + 11.5, p0.z - f.z * 17);
        cam.lookAt(p0.x + f.x * 19, (p0.y ?? 0) + PITCH, p0.z + f.z * 19);
        cam.updateProjectionMatrix();
        for (const o of every) o.visible = false;                 // bare sky
        shot(S);
        every.forEach((o, k) => { o.visible = visAll[k]; });
        for (const o of clouds) o.visible = false;                // a cloud is not a skyline
        shot(A);
        for (const o of ring) o.visible = false;
        shot(C);
        every.forEach((o, k) => { o.visible = visAll[k]; });
        const sa = skyline(A), sc = skyline(C);
        // If the sky reference is wrong, every column's "skyline" is the very
        // top row and the ownership number is meaningless zero. Say so.
        let atTop = 0;
        for (let x = 0; x < W; x++) if (sa[x] >= H - 1) atTop++;
        if (atTop > W * 0.9) {
          throw new Error('sky reference is broken: the world reaches the top row in '
            + `${(100 * atTop / W).toFixed(0)}% of columns, so no skyline can be measured`);
        }
        let owned = 0, sky = 0, ringPx = 0;
        for (let x = 0; x < W; x++) {
          if (sa[x] < 0) { sky++; continue; }
          if (sa[x] - sc[x] > 1) owned++;
        }
        for (let k = 0; k < W * H; k++) {
          const o = k * 4;
          if (Math.abs(A[o] - C[o]) + Math.abs(A[o + 1] - C[o + 1]) + Math.abs(A[o + 2] - C[o + 2]) > 12) ringPx++;
        }
        rows.push({ f: s / STATIONS, own: +(100 * owned / W).toFixed(1),
          area: +(100 * ringPx / (W * H)).toFixed(2), openSky: +(100 * sky / W).toFixed(1) });
      }
    } finally {
      every.forEach((o, k) => { o.visible = visAll[k]; });
      g.renderer.setRenderTarget(oldRT);
      rt.dispose();
    }
    return { name: t.level?.name, rows };
  }, { STATIONS, W, H, PITCH });
  const best = r.rows.slice().sort((a, c) => c.own - a.own)[0];
  console.log(`L${lv} ${r.name}: ring owns the skyline `
    + `${r.rows.map((x) => `${x.f.toFixed(2)}:${x.own}%`).join(' ')}`
    + `  | best station ${best.f.toFixed(2)} at ${best.own}% (ring = ${best.area}% of frame area,`
    + ` open sky ${best.openSky}% of columns)`);
}
await b.close();
