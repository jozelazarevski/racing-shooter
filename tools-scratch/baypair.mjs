/* THE SAME BAY, THE SAME ANGLE, TWO BUILDS. A before/after is worthless if
 * the turntable is at a different angle in each shot, and `_stageRun` writes
 * `pivot.rotation.y` every frame — so the loop is stopped before parking it.
 *
 *   node baypair.mjs 8902 shot-bay-before.png
 *
 * Pass the PORT explicitly and check what each one is serving first: srv.mjs
 * defaults its root to the working tree whatever the CWD, which has silently
 * served one branch on both ports before now. */
import { chromium } from 'playwright-core';
const [port, out, spin] = [process.argv[2] || '8901',
  process.argv[3] || 'tools-scratch/shot-bay-pair.png', process.argv[4] || '2.05'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 460, height: 900 }, hasTouch: true,
  isMobile: true, deviceScaleFactor: 3 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto(`http://localhost:${port}/?level=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(2600);
console.log(port, JSON.stringify(await p.evaluate((s) => {
  const g = window.__game, st = g.__stage;
  g._stageRun(false);
  st.pivot.rotation.y = +s;
  for (const d of st.dust || []) {}      // dust phases are already spread 0..1
  st.r.render(st.scene, st.cam);
  return { tag: document.getElementById('build-tag')?.textContent,
    dust: (st.dust || []).length, exposure: +st.r.toneMappingExposure.toFixed(2) };
}, spin)));
const box = await (await p.$('.bp-stage')).boundingBox();
await p.screenshot({ path: out, clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
if (errs.length) console.log('ERRORS', errs.slice(0, 2));
await b.close();
