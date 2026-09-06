/* THE TURNTABLE DUST, PARKED. `bayshot2.mjs`'s SPIN is overwritten by the next
 * frame of the stage loop, so a puff behind the rear wheels is never in shot.
 * This one stops the loop, parks the pivot and the dust phases by hand, and
 * shoots the bay from a rear three-quarter — which is the only angle a wheel
 * puff is visible from. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate((spin) => {
  const g = window.__game, st = g.__stage;
  g._stageRun(false);                       // freeze it, or the next tick undoes this
  st.pivot.rotation.y = +spin;
  const seen = [];
  for (const d of st.dust || []) {
    // READ it, do not recompute it: a probe that carries its own copy of the
    // curve reports the curve it was written against, not the one in the code.
    seen.push({ t: +d.t.toFixed(2), op: +d.m.material.opacity.toFixed(3),
      pos: d.m.position.toArray().map(n => +n.toFixed(2)) });
  }
  st.r.render(st.scene, st.cam);
  return { puffs: seen.length, sample: seen.slice(0, 4) };
}, process.env.SPIN || '2.35'))); 
const el = await p.$('.bp-stage');
const box = await el.boundingBox();
await p.screenshot({ path: 'tools-scratch/shot-dust.png',
  clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 } });
if (errs.length) console.log('ERRORS', errs.slice(0, 3));
await b.close();
