/* WHERE THE COLOURED LAMPS ACTUALLY LAND, and what they contribute. Renders
 * the bay twice — lamps hidden, lamps shown — and reports each lamp's screen
 * position plus the pixel delta it is responsible for. A wash that paints
 * nothing is either off-frame or behind something, and both look identical
 * from a screenshot. */
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
  st.pivot.rotation.y = 0.7;
  const grab = () => { st.r.render(st.scene, st.cam);
    const cv = st.cvs, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    return { d: o.getContext('2d').getImageData(0, 0, o.width, o.height).data, w: o.width, h: o.height }; };
  const names = ['warmLamp', 'warmCore', 'coolLamp', 'warmPool', 'coolPool'];
  const lamps = names.map((n) => [n, st[n]]).filter(([, m]) => m);
  const base = grab();
  const out = [];
  st.cam.updateMatrixWorld(true);
  for (const [n, m] of lamps) {
    m.updateMatrixWorld(true);
    const v = new (st.cam.position.constructor)();
    m.getWorldPosition(v);
    const sp = v.clone().project(st.cam);
    m.visible = false;
    const off = grab();
    m.visible = true;
    let px = 0, sum = 0;
    for (let k = 0; k < base.d.length; k += 4) {
      const dd = Math.abs(base.d[k] - off.d[k]) + Math.abs(base.d[k+1] - off.d[k+1])
               + Math.abs(base.d[k+2] - off.d[k+2]);
      if (dd > 6) { px++; sum += dd; }
    }
    out.push({ lamp: n, world: [v.x, v.y, v.z].map((q) => +q.toFixed(1)),
      screenPct: [Math.round((sp.x * 0.5 + 0.5) * 100), Math.round((-sp.y * 0.5 + 0.5) * 100)],
      inFrame: sp.x > -1 && sp.x < 1 && sp.y > -1 && sp.y < 1,
      pixels: px, pctOfBay: +(100 * px / (base.d.length / 4)).toFixed(1),
      meanDelta: px ? Math.round(sum / px) : 0 });
  }
  return { canvas: [base.w, base.h], lamps: out };
}), null, 0));
await b.close();
