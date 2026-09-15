/* THE BEAM FROM EVERY CAMERA THE GAME HAS. The rig was tuned from CHASE and
 * shipped blown out on TOP-DOWN, because a quad lying on the road is seen at a
 * grazing angle from one and face-on from the other. This drives the GAME's own
 * `_updateCamera` for each mode on a night world, then renders twice — rig
 * hidden, rig shown — and reports what the lamps actually add: the pixel count,
 * the peak, and how many of those pixels are clipped to white, which is the
 * number the report was looking at. Writes a shot per mode. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '17';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext(process.env.PORTRAIT ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 900, height: 560 } })).newPage();
p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>60?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const modes = await p.evaluate(() => {
  const g = window.__game;
  return (g.constructor.CAM_MODES ?? window.__CAM_MODES ?? []).length || null;
});
await p.evaluate((v) => { window.__NOFADE = v; }, !!process.env.NOFADE);
const rows = await p.evaluate(async () => {
  const g = window.__game, t = g.track, pl = g.player;
  const i = Math.floor(t.N * 0.2), c = t.center[i], c2 = t.center[(i + 14) % t.N];
  // put the car on the racing line, pointing down the road, and let each rig settle
  const place = () => {
    pl.pos.set(c.x, c.y, c.z);
    pl.heading = Math.atan2(c2.x - c.x, c2.z - c.z);
    pl.trackIndex = i;
    pl.mesh.position.set(c.x, c.y, c.z);
    pl.mesh.rotation.set(0, pl.heading, 0);
  };
  const grab = () => { g.renderer.render(g.scene, g.camera);
    const cv = g.renderer.domElement, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    return o.getContext('2d').getImageData(0, 0, o.width, o.height); };
  const rigs = []; g.scene.traverse((o) => { if (o.name === 'carLights') rigs.push(o); });
  const out = [];
  const nModes = 8;
  for (let m = 0; m < nModes; m++) {
    g.camMode = m;
    const name = (g.hud && g._camName) ? g._camName() : String(m);
    place();
    for (let k = 0; k < 40; k++) { place(); g._updateCamera(1 / 60); }
    const dv = new (g.camera.position.constructor)(0, 0, -1).applyQuaternion(g.camera.quaternion);
    // NOFADE=1 pins the material back to its unfaded value, which is what
    // the shipped build did at every angle — the baseline the fix is judged
    // against, taken in the same frame rather than remembered.
    if (window.__NOFADE) rigs[0].material.opacity = 0.85;
    for (const o of rigs) o.visible = false;
    const A = grab();
    const aUrl = g.renderer.domElement.toDataURL('image/png');
    for (const o of rigs) o.visible = true;  const B = grab();
    let n = 0, peak = 0, clipped = 0, sum = 0;
    for (let k = 0; k < A.data.length; k += 4) {
      const d = Math.abs(B.data[k]-A.data[k]) + Math.abs(B.data[k+1]-A.data[k+1]) + Math.abs(B.data[k+2]-A.data[k+2]);
      if (d <= 8) continue;
      n++; sum += d; if (d > peak) peak = d;
      if (B.data[k] > 246 && B.data[k+1] > 246 && B.data[k+2] > 246) clipped++;
    }
    out.push({ mode: m, name, down: +Math.abs(dv.y).toFixed(3),
      opacity: +g.player.mesh.userData.carLights.material.opacity.toFixed(3),
      litPixels: n, pctOfFrame: +(100 * n / (A.data.length / 4)).toFixed(2),
      meanDelta: n ? Math.round(sum / n) : 0, peak,
      clippedWhite: clipped, pctClipped: n ? +(100 * clipped / n).toFixed(1) : 0,
      aUrl, url: g.renderer.domElement.toDataURL('image/png') });
  }
  return out;
});
const fs = await import('fs');
for (const r of rows) {
  fs.writeFileSync(`tools-scratch/shot-beam-${r.mode}${process.env.NOFADE ? '-before' : ''}.png`, Buffer.from(r.url.split(',')[1], 'base64'));
  // the same frame with NO rig at all, so "is that cone even ours" is settled
  // by looking rather than by remembering what the code used to contain
  if (process.env.KEEPA) fs.writeFileSync(`tools-scratch/shot-beam-${r.mode}-norig.png`,
    Buffer.from(r.aUrl.split(',')[1], 'base64'));
  delete r.url; delete r.aUrl;
  console.log(JSON.stringify(r));
}
if (errs.length) console.log('ERR ' + errs.slice(0, 3).join(' | '));
await b.close();
