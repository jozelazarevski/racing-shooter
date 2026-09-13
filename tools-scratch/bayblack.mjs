/* HOW MUCH OF THE BAY IS BLACK, and where. Reported directly: "light up all
 * background in the garage, so it is not black". The stage is its own renderer
 * and its own little scene, so this reads ITS canvas — the fraction of pixels
 * under a dark threshold, split into a 4x4 grid so the answer says WHICH part
 * of the picture is unlit, and the scene graph beside it. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(2600);
const out = await p.evaluate(() => {
  const st = window.__game.__stage; if (!st) return { err: 'no stage' };
  st.r.render(st.scene, st.cam);
  const cv = st.cvs, o = document.createElement('canvas');
  o.width = cv.width; o.height = cv.height;
  const x = o.getContext('2d'); x.drawImage(cv, 0, 0);
  const d = x.getImageData(0, 0, o.width, o.height).data;
  const W = o.width, H = o.height;
  const G = 4, cell = new Array(G * G).fill(0), tot = new Array(G * G).fill(0);
  let dark = 0, n = 0, sum = 0, clear = 0;
  for (let k = 0; k < d.length; k += 4) {
    const px = (k / 4) % W, py = Math.floor((k / 4) / W);
    const a = d[k + 3];
    const l = 0.2126*d[k] + 0.7152*d[k+1] + 0.0722*d[k+2];
    const gi = Math.min(G - 1, Math.floor(py / H * G)) * G + Math.min(G - 1, Math.floor(px / W * G));
    n++; sum += l; tot[gi]++;
    if (a < 24) { clear++; cell[gi]++; dark++; continue; }   // nothing drawn at all
    if (l < 34) { dark++; cell[gi]++; }
  }
  const grid = [];
  for (let r = 0; r < G; r++) grid.push(Array.from({ length: G },
    (_, c) => +(100 * cell[r * G + c] / Math.max(1, tot[r * G + c])).toFixed(0)));
  const scene = st.scene.children.map((c) => `${c.type} ${c.name || ''} ` +
    (c.geometry?.parameters ? `${c.geometry.parameters.width}x${c.geometry.parameters.height}` : '') +
    (c.material?.color ? ' #' + c.material.color.getHexString() : '') +
    ` p=${c.position.toArray().map((v) => +v.toFixed(1))}`);
  return { canvas: [W, H], meanLum: Math.round(sum / n),
    darkPct: +(100 * dark / n).toFixed(1), transparentPct: +(100 * clear / n).toFixed(1),
    darkGridPct: grid, alpha: st.r.getContext().getContextAttributes?.().alpha,
    clearAlpha: st.r.getClearAlpha?.(), scene,
    url: cv.toDataURL('image/png') };
});
const fs = await import('fs');
if (out.url) { fs.writeFileSync('tools-scratch/shot-baycanvas.png', Buffer.from(out.url.split(',')[1], 'base64')); delete out.url; }
console.log(JSON.stringify(out, null, 1));
if (errs.length) console.log('ERR ' + errs.slice(0, 3).join(' | '));
await b.close();
// THE TWO NUMBERS THIS FILE EXISTS FOR, as a pass/fail so `gates.mjs` can run
// it: any TRANSPARENT pixel means the backdrop is not reaching the camera (a
// hole with the panel behind it — see the far-plane round), and a mean below
// 90 means the bay has gone dark again, which is the complaint the whole
// forest was built to answer.
const bad = out.transparentPct > 0.5 || out.meanLum < 90 || errs.length > 0;
console.log(bad ? 'FAIL: bay backdrop' : 'PASS: bay lit and sealed');
process.exit(bad ? 1 : 0);
