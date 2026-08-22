/* DOES THE BAY ACTUALLY CONTRAST WITH THE CAR? The room is repainted from the
 * car's own colour now, so the claim is testable: for every car in the
 * catalogue, render the bay and measure the gap between the car's pixels and
 * the background's. The mask is built the same way the frontage probes do it —
 * hide everything but the car, render, and use that as the stencil. Also
 * watches the wall texture's offset over real frames, because "the background
 * moves" is either true in the numbers or it is decoration in a comment. */
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
// the band has to actually walk
const drift = await p.evaluate(() => new Promise((res) => {
  const st = window.__game.__stage;
  const a = st.wallTex.offset.x;
  setTimeout(() => res({ from: +a.toFixed(4), to: +st.wallTex.offset.x.toFixed(4) }), 1500);
}));
console.log('wall band offset over 1.5s: ' + JSON.stringify(drift));
await p.evaluate((v) => { window.__SWEEP = v; }, process.env.SWEEP || '');
const rows = await p.evaluate(async () => {
  const g = window.__game;
  const out = [];
  const keys = g.cars.owned.length > 2 ? g.cars.owned : null;
  const all = (await import('/src/vehicles.js')).CAR_CATALOG.map((c) => c.key);
  // SWEEP=a,b,c re-runs every car at those dark-end values; without it this is
  // a one-pass gate on the shipped setting.
  const DKS = (window.__SWEEP || '').split(',').filter(Boolean).map(Number);
  for (const spec of (keys ?? all).flatMap((k) => (DKS.length ? DKS : [g.BAY_DARK_END]).map((d) => [k, d]))) {
    const [key, dk] = spec;
    g.BAY_DARK_END = dk;
    g.cars.selected = key;
    g.__stage.sig = null;                 // force the repaint for the new knob
    g._stageSync();
    const st = g.__stage;
    st.r.setSize(st.cvs.clientWidth || 330, st.cvs.clientHeight || 200, false);
    st.cam.aspect = (st.cvs.clientWidth || 330) / (st.cvs.clientHeight || 200);
    st.cam.updateProjectionMatrix();
    g._frameStage(st);
    const grab = () => { st.r.render(st.scene, st.cam);
      const cv = st.cvs, o = document.createElement('canvas');
      o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
      return o.getContext('2d').getImageData(0, 0, o.width, o.height).data; };
    const A = grab();
    // stencil: everything but the car hidden
    const hid = [];
    st.scene.traverse((o) => { if ((o.isMesh || o.isInstancedMesh) && o.visible
      && !(function inCar(n) { for (let q = n; q; q = q.parent) if (q === st.car) return true; return false; })(o)) { o.visible = false; hid.push(o); } });
    const M = grab();
    for (const o of hid) o.visible = true;
    const cl = [], bl = [];
    for (let k = 0; k < A.length; k += 4) {
      const l = 0.2126*A[k] + 0.7152*A[k+1] + 0.0722*A[k+2];
      (M[k] + M[k+1] + M[k+2] > 12 ? cl : bl).push(l);
    }
    // THE BODY, NOT THE SILHOUETTE. A car's pixels are half tyre and glass, so
    // the mean says a white car is mid-grey and sends the whole sweep the
    // wrong way. P75 of the car's own pixels is its painted bodywork.
    cl.sort((a, b2) => a - b2);
    const body = cl.length ? cl[Math.floor(cl.length * 0.75)] : 0;
    const mean = cl.length ? cl.reduce((s2, v) => s2 + v, 0) / cl.length : 0;
    const bg = bl.length ? bl.reduce((s2, v) => s2 + v, 0) / bl.length : 0;
    out.push({ car: key, darkEnd: g.BAY_DARK_END,
      hull: '#' + (st.car.userData?.bodyMat?.color?.getHexString?.() ?? '??'),
      wall: '#' + st.wall.material.color.getHexString(),
      bodyLum: Math.round(body), carMean: Math.round(mean), bgLum: Math.round(bg),
      bodyGap: Math.round(Math.abs(body - bg)) });
  }
  return out;
});
for (const r of rows) console.log(JSON.stringify(r));
await p.evaluate(() => { window.__game.cars.selected = window.__game.cars.owned[0]; window.__game._stageSync(); });
await p.waitForTimeout(600);
await p.screenshot({ path: 'tools-scratch/shot-garage-top.png' });
if (errs.length) console.log('ERR ' + errs.slice(0, 3).join(' | '));
await b.close();
