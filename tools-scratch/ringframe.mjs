/* WHICH OF THE THINGS ON THE SKYLINE IS THE RING?
 *
 * A frame of GLACIER COL taken before and after the horizon ring was rebuilt
 * came back all but identical - 417091 bytes against 417050 - while the
 * panorama probe said the ring's silhouette had halved its aspect. Both can be
 * true: the pale spiky wall filling the top of that particular frame is the
 * DRIVABLE massif (real terrain, `_highland`, out to r 1450) and the ring at
 * 930-1280 was behind it. A frame where the subject is not visible is not
 * evidence about the subject, whatever it looks like.
 *
 * So this walks stations round the lap, renders each one twice - normally, and
 * with horizon-hills/horizon-peaks hidden - and counts the pixels that differ
 * in the top half of the frame. That number IS "how much of this skyline is
 * the ring". It prints the table, then photographs the best station three
 * ways: normal, ring hidden, and ring alone.
 *
 *   TAG=before LEVELS=62,21,66 node ringframe.mjs
 *
 * FAILS LOUDLY if no station on a level shows the ring at all: the answer is
 * then "photograph a different world", not a clean-looking picture.
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? '8911';
const TAG = process.env.TAG ?? 'now';
const LEVELS = (process.env.LEVELS ?? '62,21,66').split(',');
const STATIONS = +(process.env.STATIONS ?? 10);
// STOP pins the station instead of scanning for the best one, so the AFTER run
// photographs the SAME viewpoint as the BEFORE run rather than whichever
// station the new numbers happen to favour. Track generation is seeded per
// level (same instance counts, same radii, both runs), so the frame is
// comparable pixel for pixel.
const STOP = process.env.STOP === undefined ? null : +process.env.STOP;
const W = +(process.env.W ?? 1000), H = +(process.env.H ?? 300);
// FOV narrows the final photograph onto the ring. At the chase camera's 60
// deg the ring is a 30 px band and its shape is a guess; at 26 it is the
// subject, and the shape is the whole question.
const FOV = +(process.env.FOV ?? 60);
const YAW = +(process.env.YAW ?? 0);            // extra yaw, degrees, off the road

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

const fs = await import('fs');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1000, height: 400 } });
p.setDefaultTimeout(600000);
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));

for (const lv of LEVELS) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  await waitRing(p, lv);
  const scan = await p.evaluate(async ({ STATIONS, W, H }) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    const ring = [];
    t.group.traverse((o) => { if (/^horizon-/.test(o.name || '')) ring.push(o); });
    if (!ring.length) throw new Error('no horizon ring');
    const rt = new THREE.WebGLRenderTarget(W, H);
    const cam = new THREE.PerspectiveCamera(60, W / H, 1, 40000);
    const a = new Uint8Array(W * H * 4), c = new Uint8Array(W * H * 4);
    const shot = (buf) => {
      g.renderer.setRenderTarget(rt);
      g.renderer.clear();
      g.renderer.render(g.scene, cam);
      g.renderer.readRenderTargetPixels(rt, 0, 0, W, H, buf);
    };
    const rows = [];
    const oldRT = g.renderer.getRenderTarget();
    try {
      for (let s = 0; s < STATIONS; s++) {
        const i = Math.floor((s / STATIONS) * t.N) % t.N;
        const p0 = t.center[i], p1 = t.center[(i + 12) % t.N];
        const f = new THREE.Vector3(p1.x - p0.x, 0, p1.z - p0.z).normalize();
        // CHASE geometry (CAM_MODES[3]: 17 back, 11.5 up), pitched to the sky
        cam.position.set(p0.x - f.x * 17, (p0.y ?? 0) + 11.5, p0.z - f.z * 17);
        cam.lookAt(p0.x + f.x * 19, (p0.y ?? 0) + 15, p0.z + f.z * 19);
        cam.updateProjectionMatrix();
        shot(a);
        const vis = ring.map((m) => m.visible);
        for (const m of ring) m.visible = false;
        shot(c);
        ring.forEach((m, k) => { m.visible = vis[k]; });
        let diff = 0, tot = 0;
        for (let y = Math.floor(H / 2); y < H; y++) {          // top half (rows are bottom-up)
          for (let x = 0; x < W; x++) {
            const o = (y * W + x) * 4; tot++;
            if (Math.abs(a[o] - c[o]) + Math.abs(a[o + 1] - c[o + 1]) + Math.abs(a[o + 2] - c[o + 2]) > 12) diff++;
          }
        }
        rows.push({ i, f: s / STATIONS, pct: +(100 * diff / tot).toFixed(2) });
      }
    } finally {
      g.renderer.setRenderTarget(oldRT);
      rt.dispose();
    }
    return rows;
  }, { STATIONS, W, H });
  scan.sort((x, y) => y.pct - x.pct);
  console.log(`L${lv} ring share of the upper frame, by station: `
    + scan.map((r) => `${r.f.toFixed(2)}:${r.pct}%`).join(' '));
  if (scan[0].pct < 1) {
    throw new Error(`L${lv}: the horizon ring is under 1% of the upper frame at EVERY station `
      + `- this world's skyline is its own terrain, so no photograph of it is evidence about the ring`);
  }
  const best = STOP === null ? scan[0]
    : (scan.find((r) => Math.abs(r.f - STOP) < 1e-6)
       ?? (() => { throw new Error(`STOP=${STOP} is not one of the ${STATIONS} stations scanned`); })());
  const shots = await p.evaluate(async ({ f, W, H, FOV, YAW }) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    const ring = []; t.group.traverse((o) => { if (/^horizon-/.test(o.name || '')) ring.push(o); });
    const i = Math.floor(f * t.N) % t.N;
    const p0 = t.center[i], p1 = t.center[(i + 12) % t.N];
    const fw = new THREE.Vector3(p1.x - p0.x, 0, p1.z - p0.z).normalize();
    const cam = g.camera;
    cam.position.set(p0.x - fw.x * 17, (p0.y ?? 0) + 11.5, p0.z - fw.z * 17);
    const yr = YAW * Math.PI / 180;
    const lx = fw.x * Math.cos(yr) - fw.z * Math.sin(yr), lz = fw.x * Math.sin(yr) + fw.z * Math.cos(yr);
    cam.lookAt(p0.x + lx * 19, (p0.y ?? 0) + 15, p0.z + lz * 19);
    g.renderer.setSize(W, H, false);
    cam.aspect = W / H; cam.fov = FOV; cam.updateProjectionMatrix();
    const draw = () => { g.renderer.render(g.scene, cam); return g.renderer.domElement.toDataURL('image/png'); };
    const normal = draw();
    const vis = ring.map((m) => m.visible);
    for (const m of ring) m.visible = false;
    const noring = draw();
    ring.forEach((m, k) => { m.visible = vis[k]; });
    return { normal, noring };
  }, { f: best.f, W, H, FOV, YAW });
  for (const [k, url] of Object.entries(shots)) {
    const nm = `tools-scratch/shot-ring-${TAG}-L${lv}-${k}.png`;
    fs.writeFileSync(nm, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`  wrote ${nm} (station ${best.f.toFixed(2)}, ring = ${best.pct}% of upper frame)`);
  }
}
await b.close();
