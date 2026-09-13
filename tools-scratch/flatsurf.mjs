/* WHICH SURFACE IN THIS PICTURE IS FLATTEST. "It looks a bit plain" is not a
 * finding. This takes each welded piece of the diorama, works out which pixels
 * it owns (hide it, diff, mask), and then reports the SPREAD of luminance
 * across those pixels in the real frame — standard deviation, and the 10th to
 * 90th percentile range. A big surface with a tiny spread is a flat fill
 * pretending to be a material, and it is the next thing to paint. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(2600);
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, st = g.__stage;
  g._stageRun(false);
  st.pivot.rotation.y = 2.05;
  const grab = () => { st.r.render(st.scene, st.cam);
    const cv = st.cvs, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    return o.getContext('2d').getImageData(0, 0, o.width, o.height).data; };
  const base = grab();
  const px = base.length / 4;
  // the diorama's own group, not the car and not the lights
  const dio = st.scene.children.find((o) => o.type === 'Group' && o.children.some((c) => c.isMesh));
  const out = [];
  for (const m of dio.children) {
    if (!m.isMesh) continue;
    m.visible = false; const off = grab(); m.visible = true;
    const lum = [];
    for (let k = 0; k < base.length; k += 4) {
      if (Math.abs(base[k] - off[k]) + Math.abs(base[k+1] - off[k+1])
        + Math.abs(base[k+2] - off[k+2]) <= 6) continue;
      lum.push(0.2126 * base[k] + 0.7152 * base[k+1] + 0.0722 * base[k+2]);
    }
    if (lum.length < 400) continue;
    lum.sort((a, c) => a - c);
    const mean = lum.reduce((s, v) => s + v, 0) / lum.length;
    const sd = Math.sqrt(lum.reduce((s, v) => s + (v - mean) ** 2, 0) / lum.length);
    out.push({ color: m.material?.color ? '#' + m.material.color.getHexString() : '?',
      map: !!m.material?.map, sharePct: +(100 * lum.length / px).toFixed(1),
      meanLum: Math.round(mean), sd: +sd.toFixed(1),
      p10p90: [Math.round(lum[lum.length * 0.1 | 0]), Math.round(lum[lum.length * 0.9 | 0])] });
  }
  out.sort((a, c) => c.sharePct - a.sharePct);
  return out;
}), null, 0));
await b.close();
