/* HOW MUCH OF THE PLAYER'S CAR DOES THE SPEEDO DIAL COVER?
 *
 * TWO MEASUREMENT LESSONS, BOTH PAID FOR IN THIS FILE:
 *
 * 1. COVERAGE IS COUNTED IN PIXELS, NOT PROJECTED VERTICES (the rule
 *    `eyesweep.mjs` established). Vertices are not area.
 *
 * 2. A KEY COLOUR IS NOT A KEY IF THE PIPELINE REPAINTS IT. Keying the car
 *    magenta and thresholding the canvas failed twice in opposite directions:
 *    a loose threshold (R>=150,G<=110,B>=150) swallowed PINE VALLEY's lavender
 *    SKY and reported a car 305 px wide, and a tight one (>=235/<=45/>=235)
 *    reported ZERO pixels on every world and every camera — because the
 *    renderer's tone mapping and sRGB output never emit pure magenta.
 *    Neither number was a measurement.
 *
 *    So the car is found by DIFFERENCE instead: render the same frame twice,
 *    once as it is and once with the player's materials keyed, and take the
 *    pixels that CHANGED. Nothing else in the frame moves between the two
 *    renders, so the difference IS the car, whatever the pipeline does to the
 *    colours on the way out.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const W = Number(process.env.W ?? 800), H = Number(process.env.H ?? 460);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: W, height: H } });
page.setDefaultTimeout(600000);
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const rows = await page.evaluate(() => {
    const g = window.__game, out = [];
    g.clock.getDelta = () => 1 / 60;
    const dial = document.getElementById('speedo').getBoundingClientRect();
    const names = g.constructor.CAM_NAMES ?? [];
    const grab = () => {
      const cv = g.renderer.domElement;
      const t = document.createElement('canvas');
      t.width = cv.width; t.height = cv.height;
      t.getContext('2d').drawImage(cv, 0, 0);
      return t.getContext('2d').getImageData(0, 0, t.width, t.height);
    };
    for (let m = 0; m < names.length; m++) {
      g.camMode = m;
      for (let k = 0; k < 150; k++) {
        g.input.analog.throttle = 1; g.input.analog.steer = 0; g.frame();
      }
      g.renderer.render(g.scene, g.camera);
      const A = grab();
      const keyed = [];
      g.player.mesh.traverse((o) => {
        if (!o.isMesh || !o.material?.color) return;
        keyed.push([o, o.material.color.getHex(), o.material.map]);
        o.material.color.setHex(0x00ff00);
        o.material.map = null;
        o.material.needsUpdate = true;
      });
      g.renderer.render(g.scene, g.camera);
      const B = grab();
      keyed.forEach(([o, c, map]) => {
        o.material.color.setHex(c); o.material.map = map; o.material.needsUpdate = true;
      });
      const cv = g.renderer.domElement, rc = cv.getBoundingClientRect();
      const sx = A.width / rc.width, sy = A.height / rc.height;
      const dcx = (dial.left + dial.width / 2 - rc.left) * sx;
      const dcy = (dial.top + dial.height / 2 - rc.top) * sy;
      const dr = (dial.width / 2) * sx;
      let total = 0, hidden = 0, minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
      for (let y = 0; y < A.height; y++) for (let x = 0; x < A.width; x++) {
        const i = (y * A.width + x) * 4;
        const d = Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1])
          + Math.abs(A.data[i + 2] - B.data[i + 2]);
        if (d < 24) continue;
        total++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        const ddx = x - dcx, ddy = y - dcy;
        if (ddx * ddx + ddy * ddy <= dr * dr) hidden++;
      }
      out.push({ mode: names[m], total, hidden,
        pct: total ? +(hidden / total * 100).toFixed(1) : 0,
        box: total ? [minX, minY, maxX, maxY] : null,
        dial: [Math.round(dcx), Math.round(dcy), Math.round(dr)] });
    }
    return { name: g.track.level?.name, out };
  });
  console.log(`\n===== ${id} ${rows.name}  (${W}x${H}) =====`);
  for (const r of rows.out) {
    console.log(`  ${r.mode.padEnd(10)} car ${String(r.total).padStart(6)} px   `
      + `${String(r.pct).padStart(5)}% behind the dial   carbox ${JSON.stringify(r.box)}  dial ${JSON.stringify(r.dial)}`);
  }
}
await b.close();
