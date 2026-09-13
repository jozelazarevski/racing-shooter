/* Mean colour of the road band in the driver's shot. Eyeballing two street
 * screenshots for "is the paving still blown out" is exactly the judgement
 * r243 got wrong three times; this prints a number. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74', F = +(process.env.F ?? 0.62);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>24?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
console.log(JSON.stringify(await p.evaluate((F) => {
  const g = window.__game, t = g.track, i = Math.floor(t.N * F);
  const c = t.center[i], c2 = t.center[(i + 12) % t.N];
  g.camera.position.set(c.x, c.y + 2.6, c.z);
  g.camera.lookAt(c2.x, c2.y + 1.9, c2.z);
  g.camera.updateProjectionMatrix();
  g.renderer.render(g.scene, g.camera);
  const cv = g.renderer.domElement;
  const o = document.createElement('canvas');
  o.width = cv.width; o.height = cv.height;
  o.getContext('2d').drawImage(cv, 0, 0);
  const px = o.getContext('2d');
  const band = (x, y, w, h) => {
    const d = px.getImageData(x, y, w, h).data;
    let r = 0, gg = 0, bb = 0, n = 0, blown = 0;
    for (let k = 0; k < d.length; k += 4) {
      r += d[k]; gg += d[k + 1]; bb += d[k + 2]; n++;
      if (d[k] > 240 && d[k + 1] > 240 && d[k + 2] > 240) blown++;
    }
    return { r: Math.round(r / n), g: Math.round(gg / n), b: Math.round(bb / n),
      blownPct: +(100 * blown / n).toFixed(1) };
  };
  const W = cv.width, H = cv.height;
  return { near: band(W * 0.3 | 0, H * 0.82 | 0, W * 0.4 | 0, H * 0.15 | 0),
    mid: band(W * 0.35 | 0, H * 0.60 | 0, W * 0.3 | 0, H * 0.1 | 0),
    wallL: band(0, H * 0.12 | 0, W * 0.18 | 0, H * 0.4 | 0),
    wallR: band(W * 0.82 | 0, H * 0.12 | 0, W * 0.18 | 0, H * 0.4 | 0) };
}, F)));
await b.close();
