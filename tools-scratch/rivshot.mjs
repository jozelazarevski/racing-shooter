import { chromium } from 'playwright-core';
const id = process.env.LV ?? '73';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 900, height: 520 } });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${id}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>26?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
// same-tick capture: render, then read the pixels, or the frame is stale
const url = await p.evaluate(() => { const g = window.__game;
  g.renderer.render(g.scene, g.camera);
  return g.renderer.domElement.toDataURL('image/png'); });
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-riviera-${id}.png`, Buffer.from(url.split(',')[1], 'base64'));
console.log(await p.evaluate(() => `${window.__game.level.name} ready`));
await b.close();
