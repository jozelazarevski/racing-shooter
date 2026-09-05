/* WHAT COLOUR THE WALLS ACTUALLY COME OUT. The texture's wall is near-white and
 * the instance tint is a warm pastel, so on paper the paint is right — and the
 * street still renders taupe. The only way to settle it is to read the FRAME:
 * render once normally, once with the frontage flat-white and everything else
 * hidden, and average the first over the mask the second draws. Also reports
 * the lit/shade split, which is what a flat-looking street usually is. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '54';
const F = process.env.F ? +process.env.F : null;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 960, height: 560 } })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>20?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
console.log(JSON.stringify(await p.evaluate(({ F }) => {
  const g = window.__game, t = g.track;
  const front = [];
  g.scene.traverse((o) => { if (o.isInstancedMesh && o.name === 'oldtown-frontage') front.push(o); });
  // densest stretch, same rule as facadeshot
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
  const i = F === null ? (bi + (W >> 1)) % t.N : Math.floor(t.N * F) % t.N;
  const c = t.center[i], f2 = t.center[(i + 26) % t.N];
  g.camera.position.set(c.x, c.y + 7.5, c.z);
  g.camera.lookAt(f2.x, f2.y + 2.5, f2.z);
  const grab = () => { g.renderer.render(g.scene, g.camera);
    const cv = g.renderer.domElement, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    return o.getContext('2d').getImageData(0, 0, o.width, o.height).data; };
  const A = grab();
  const hidden = [], swapped = [];
  g.scene.traverse((o) => {
    if (!(o.isMesh || o.isInstancedMesh) || !o.visible) return;
    if (front.includes(o)) return;
    o.visible = false; hidden.push(o);
  });
  const THREE_M = front[0]?.material.constructor;
  for (const o of front) { swapped.push([o, o.material]);
    const mm = new THREE_M({ color: 0xffffff }); mm.map = null; mm.emissive?.setHex?.(0xffffff);
    mm.emissiveIntensity = 1; mm.roughness = 1; o.material = mm; }
  const B = grab();
  for (const [o, mat] of swapped) o.material = mat;
  for (const o of hidden) o.visible = true;
  let n = 0, r = 0, gg = 0, bb = 0; const lum = [];
  for (let k = 0; k < A.length; k += 4) {
    if (B[k] < 120 || B[k+1] < 120 || B[k+2] < 120) continue;
    n++; r += A[k]; gg += A[k+1]; bb += A[k+2];
    lum.push(0.2126*A[k] + 0.7152*A[k+1] + 0.0722*A[k+2]);
  }
  lum.sort((a, b2) => a - b2);
  const q = (f3) => Math.round(lum[Math.floor(lum.length * f3)] ?? 0);
  const hx = (v) => Math.round(v).toString(16).padStart(2, '0');
  const mean = n ? '#' + hx(r/n) + hx(gg/n) + hx(bb/n) : null;
  const sat = n ? +(1 - Math.min(r, gg, bb) / Math.max(r, gg, bb, 1)).toFixed(3) : 0;
  return { world: g.level.name, at: +(i / t.N).toFixed(3),
    facadePixels: n, pctOfFrame: +(100 * n / (A.length / 4)).toFixed(1),
    meanColor: mean, saturation: sat,
    lumP10: q(0.10), lumP50: q(0.50), lumP90: q(0.90), litShadeSpread: q(0.90) - q(0.10) };
}, { F }), null, 0));
await b.close();
