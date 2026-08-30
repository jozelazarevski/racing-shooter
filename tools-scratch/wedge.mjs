/* THE WEDGE THE BEAM LAYS ON THE ROAD, before and after the elevation fade.
 * Metric: road pixels in the band ahead of the nose that sit more than 22
 * above the road's own median, and how far above. That is what "a white cone
 * washing out the carriageway" is, in numbers. Runs every camera mode. */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? '8901';
const LV = process.env.LV ?? '17';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 },
  isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>90?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const rows = await p.evaluate(() => {
  const g = window.__game, t = g.track, pl = g.player;
  const i = Math.floor(t.N * 0.2), c = t.center[i], c2 = t.center[(i + 14) % t.N];
  const settle = () => { for (let k = 0; k < 40; k++) {
    pl.pos.set(c.x, c.y, c.z);
    pl.heading = Math.atan2(c2.x - c.x, c2.z - c.z); pl.trackIndex = i;
    pl.mesh.position.set(c.x, c.y, c.z); pl.mesh.rotation.set(0, pl.heading, 0);
    g._updateCamera(1 / 60); } };
  const measure = () => {
    g.renderer.render(g.scene, g.camera);
    const cv = g.renderer.domElement, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    const d = o.getContext('2d').getImageData(0, 0, o.width, o.height).data;
    const w = o.width, h = o.height, lum = [];
    for (let y = Math.floor(h * 0.30); y < Math.floor(h * 0.62); y++)
      for (let x = Math.floor(w * 0.18); x < Math.floor(w * 0.86); x++) {
        const k = (y * w + x) * 4;
        lum.push(0.2126*d[k] + 0.7152*d[k+1] + 0.0722*d[k+2]);
      }
    const med = [...lum].sort((a, b2) => a - b2)[Math.floor(lum.length / 2)];
    let n = 0, sum = 0, peak = 0;
    for (const l of lum) if (l > med + 22) { n++; sum += l - med; if (l > peak) peak = l; }
    return { pctOfBand: +(100 * n / lum.length).toFixed(1),
      lift: n ? Math.round(sum / n) : 0, peak: Math.round(peak) };
  };
  const rig = pl.mesh.userData.carLights;
  const out = [];
  for (let m = 0; m < 8; m++) {
    g.camMode = m; settle();
    const faded = rig.material.opacity;
    const after = measure();
    rig.material.opacity = 0.85;
    const before = measure();
    rig.material.opacity = faded;
    out.push({ mode: m, opacity: +faded.toFixed(3), before, after });
  }
  return out;
});
for (const r of rows) console.log(JSON.stringify(r));
await b.close();
