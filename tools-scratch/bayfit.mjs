/* HOW BIG THE CAR IS IN THE BAY, as a function of camera distance. The small
 * angle formula in `_frameStage` badly underestimates a 6.4 m car seen from
 * 7 m up a 3/4 angle — near end vs far end differ by a factor of three — so
 * the framing multiplier is picked from this sweep, not from the algebra. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(2500);
console.log(await p.evaluate(() => {
  const st = window.__game.__stage; if (!st?.car) return 'no car';
  const V = st.cam.position.constructor;
  const dir = st.cam.position.clone().normalize();
  const fill = (d) => {
    st.cam.position.copy(dir).multiplyScalar(d);
    st.cam.lookAt(0, 0.75, 0); st.cam.updateMatrixWorld(true);
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
    st.car.traverse((o) => {
      if (!o.isMesh || !o.visible || o === st.car.userData?.carLights) return;
      const a = o.geometry?.attributes?.position; if (!a) return;
      for (let k = 0; k < a.count; k += Math.max(1, Math.floor(a.count / 20))) {
        const v = new V(a.getX(k), a.getY(k), a.getZ(k)).applyMatrix4(o.matrixWorld).project(st.cam);
        x0=Math.min(x0,v.x); x1=Math.max(x1,v.x); y0=Math.min(y0,v.y); y1=Math.max(y1,v.y);
      }
    });
    return `d=${d.toFixed(1)}  w=${((x1-x0)*50).toFixed(0)}%  h=${((y1-y0)*50).toFixed(0)}%`;
  };
  return [8, 9, 10, 11, 12, 13, 14, 16].map(fill).join('\n');
}));
await b.close();
