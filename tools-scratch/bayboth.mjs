/* THE BAY FOR A DARK CAR AND FOR A LIGHT ONE, side by side as two files. The
 * room is repainted from the car now, so one screenshot proves nothing. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(2600);
const fs = await import('fs');
for (const key of ['bastion', 'alpine', 'brawler']) {
  const url = await p.evaluate((k) => {
    const g = window.__game;
    g.cars.selected = k; g.__stage.sig = null; g._stageSync();
    const st = g.__stage;
    st.r.setSize(st.cvs.clientWidth || 330, st.cvs.clientHeight || 200, false);
    st.cam.aspect = (st.cvs.clientWidth || 330) / (st.cvs.clientHeight || 200);
    st.cam.updateProjectionMatrix();
    g._frameStage(st);
    st.pivot.rotation.y = 0.7;
    st.r.render(st.scene, st.cam);
    return st.cvs.toDataURL('image/png');
  }, key);
  fs.writeFileSync(`tools-scratch/shot-bay-${key}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
console.log('three bays written');
await b.close();
