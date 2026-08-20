/* PICK THE NUMBERS BY MEASURING THEM, NOT BY TASTE.
 *
 * UNDERCITY SLIPSTREAM's wall renders at saturation 0.979 against a texture
 * whose own saturation is 0.145. The control, GLACIAL PASS, renders 0.433
 * against 0.192. The fill is the suspect: hemiIntensity 5.5 in a saturated
 * yellow-green, plus a 3.0 sun in another one.
 *
 * But this world's ORIGINAL defect was the opposite — the darkest world in the
 * game at 7.6/255 — so any candidate has to answer both questions at once:
 * does the wall stop being a wash, AND does the road stay lit? Sweeping in the
 * page beats editing and reloading, and it makes the trade visible instead of
 * assumed.
 *
 * Reports, per candidate: wall saturation (target: near the control's 0.43),
 * wall luminance, and ROAD luminance right in front of the car, which is the
 * quantity `tests/test-unlit.mjs` gates at 25/255.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 18);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 380 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const CANDS = JSON.parse(process.env.CANDS ?? '[]');
const r = await page.evaluate(async (cands) => {
  const g = window.__game, t = g.track;
  const CN = g.constructor.CAM_NAMES ?? [];
  const ci = CN.indexOf('CHASE');
  if (ci >= 0) g.camMode = ci;
  g.clock.getDelta = () => 1 / 60;
  g._autoQuality = () => {};
  const real = g.composer.render.bind(g.composer);
  let stub = true;
  g.composer.render = () => { if (!stub) real(); };
  const ribbons = [];
  t.group.traverse((o) => {
    if (o.isMesh && o.material?.map && o.geometry?.attributes?.position?.count > 2000
        && o.name !== 'road-skirt') ribbons.push(o);
  });
  const hemi = g.scene.children.find((o) => o.isHemisphereLight);
  const sun = g.scene.children.find((o) => o.isDirectionalLight);
  const base = { hSky: hemi.color.getHex(), hGnd: hemi.groundColor.getHex(),
    hI: hemi.intensity, sCol: sun.color.getHex(), sI: sun.intensity };
  const grab = () => {
    const cv = g.renderer.domElement;
    const c = document.createElement('canvas');
    c.width = cv.width; c.height = cv.height;
    c.getContext('2d').drawImage(cv, 0, 0);
    return { d: c.getContext('2d').getImageData(0, 0, c.width, c.height).data,
      w: c.width, h: c.height };
  };
  // drive to a settled spot once, then hold it and sweep the lights there so
  // every candidate is judged on the SAME frame
  for (let f = 0; f < 900; f++) { g.input.analog.throttle = 1; g.frame(); }
  const measure = () => {
    stub = false;
    real();
    const A = grab();
    const vis = ribbons.map((o) => o.visible);
    ribbons.forEach((o) => { o.visible = false; });
    real();
    const B = grab();
    ribbons.forEach((o, k) => { o.visible = vis[k]; });
    real();
    stub = true;
    let n = 0, sat = 0, lum = 0;
    for (let i = 0; i < A.d.length; i += 4) {
      if (Math.abs(A.d[i] - B.d[i]) + Math.abs(A.d[i + 1] - B.d[i + 1])
        + Math.abs(A.d[i + 2] - B.d[i + 2]) < 12) continue;
      const R = A.d[i], G = A.d[i + 1], Bl = A.d[i + 2];
      const mx = Math.max(R, G, Bl), mn = Math.min(R, G, Bl);
      sat += mx ? (mx - mn) / mx : 0;
      lum += R * 0.299 + G * 0.587 + Bl * 0.114;
      n++;
    }
    // road: a band just below centre, where the carriageway ahead always is
    let rn = 0, rl = 0;
    const y0 = (A.h * 0.62) | 0, y1 = (A.h * 0.74) | 0;
    const x0 = (A.w * 0.36) | 0, x1 = (A.w * 0.64) | 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = (y * A.w + x) * 4;
      rl += A.d[i] * 0.299 + A.d[i + 1] * 0.587 + A.d[i + 2] * 0.114; rn++;
    }
    return { wallSat: n ? +(sat / n).toFixed(3) : null,
      wallLum: n ? +(lum / n).toFixed(1) : null, wallPx: n,
      roadLum: +(rl / rn).toFixed(1) };
  };
  const out = [{ label: 'AS SHIPPED', ...base, ...measure() }];
  for (const c of cands) {
    hemi.color.setHex(c.hSky ?? base.hSky);
    hemi.groundColor.setHex(c.hGnd ?? base.hGnd);
    hemi.intensity = c.hI ?? base.hI;
    sun.color.setHex(c.sCol ?? base.sCol);
    sun.intensity = c.sI ?? base.sI;
    out.push({ label: c.label, ...c, ...measure() });
  }
  g.composer.render = real;
  return out;
}, CANDS);
console.log('  candidate            hemi  sun  | wall sat   wall lum   road lum');
for (const o of r) {
  console.log(`  ${String(o.label).padEnd(20)} ${String(o.hI ?? '').padStart(4)} ${String(o.sI ?? '').padStart(4)}  | `
    + `${String(o.wallSat).padStart(8)}   ${String(o.wallLum).padStart(8)}   ${String(o.roadLum).padStart(8)}`);
}
await b.close();
