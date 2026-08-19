/* CAN YOU TELL A WRECK FROM A HOLE IN THE GROUND?
 *
 * `spawnHusk` clones the car and gives every mesh ONE MeshStandardMaterial at
 * 0x1d1a16 — albedo 0.11 — with no flat shading. On DUST CANYON's bright sand
 * that renders as a flat black silhouette with no facets in it at all, which
 * reads as a hole rather than as a burnt car.
 *
 * Measured two ways, because "dark" and "featureless" are different faults and
 * only the second is definitely a bug:
 *   MEAN luminance of the husk's own pixels — how dark it is.
 *   SPREAD (p90 - p10) across them — whether it has any form. A solid
 *   silhouette has almost none; an object lit from one side has plenty.
 *
 * The husk's pixels are found by DIFFERENCE, the same way dialcover.mjs finds
 * the car: render the frame with the husk hidden and again with it shown, and
 * take what changed. No key colour, nothing to threshold wrong.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '';
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 800, height: 460 } });
page.setDefaultTimeout(600000);
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, p = g.player;
    g.clock.getDelta = () => 1 / 60;
    // drive a little so the camera has settled behind the car
    for (let k = 0; k < 120; k++) { g.input.analog.throttle = 1; g.input.analog.steer = 0; g.frame(); }
    g.husks.length = 0;
    g.spawnHusk(p);
    const husk = g.husks[0]?.mesh;
    if (!husk) return { err: 'no husk' };
    // park the camera on it so it fills a decent share of the frame
    const c = husk.position;
    g.camera.position.set(c.x + 7, c.y + 3.4, c.z + 7);
    g.camera.lookAt(c.x, c.y + 0.8, c.z);
    g.camera.updateMatrixWorld(true);
    const grab = () => {
      const cv = g.renderer.domElement;
      const t2 = document.createElement('canvas');
      t2.width = cv.width; t2.height = cv.height;
      t2.getContext('2d').drawImage(cv, 0, 0);
      return t2.getContext('2d').getImageData(0, 0, t2.width, t2.height);
    };
    husk.visible = false; g.composer.render(); const A = grab();
    husk.visible = true;  g.composer.render(); const B = grab();
    const lum = [];
    for (let i = 0; i < A.data.length; i += 4) {
      const d = Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1])
        + Math.abs(A.data[i + 2] - B.data[i + 2]);
      if (d < 24) continue;
      lum.push(0.2126 * B.data[i] + 0.7152 * B.data[i + 1] + 0.0722 * B.data[i + 2]);
    }
    lum.sort((x, y) => x - y);
    const q = (f) => lum.length ? lum[Math.min(lum.length - 1, Math.floor(lum.length * f))] : 0;
    // ...and what the GROUND right next to it measures, as the contrast the
    // eye actually judges the wreck against
    let bg = 0, n = 0;
    for (let i = 0; i < A.data.length; i += 4) {
      bg += 0.2126 * A.data[i] + 0.7152 * A.data[i + 1] + 0.0722 * A.data[i + 2]; n++;
    }
    return { name: t.level?.name, px: lum.length,
      mean: +(lum.reduce((a, x) => a + x, 0) / (lum.length || 1)).toFixed(1),
      p10: +q(0.10).toFixed(1), p90: +q(0.90).toFixed(1),
      spread: +(q(0.90) - q(0.10)).toFixed(1),
      scene: +(bg / n).toFixed(1) };
  });
  if (r.err) { console.log(`${id} ${r.err}`); continue; }
  if (OUT) await page.screenshot({ path: `${OUT}/L${String(id).padStart(2, '0')}-husk.png` });
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(18)} husk ${String(r.px).padStart(5)} px  `
    + `mean ${String(r.mean).padStart(6)}  p10 ${String(r.p10).padStart(6)}  p90 ${String(r.p90).padStart(6)}  `
    + `spread ${String(r.spread).padStart(6)}   scene around it ${r.scene}`);
}
await b.close();
