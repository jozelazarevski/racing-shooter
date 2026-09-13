/* A view from INSIDE the lap, not from the grid. The start line is deliberately
 * open ground, so it is the one place a street world looks least like a street. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const F = +(process.env.F ?? 0.35);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 900, height: 520 } });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>24?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const url = await p.evaluate((F) => {
  const g = window.__game, t = g.track, THREE = g.THREE ?? null;
  const i = Math.floor(t.N * F);
  const c = t.center[i], c2 = t.center[(i + 12) % t.N];
  // stand on the road at driver height and look along it — the shot a player
  // actually gets, rather than the map view from above
  g.camera.position.set(c.x, c.y + 2.6, c.z);
  g.camera.lookAt(c2.x, c2.y + 1.9, c2.z);
  g.camera.updateProjectionMatrix();
  g.renderer.render(g.scene, g.camera);
  return g.renderer.domElement.toDataURL('image/png');
}, F);
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-lap-${LV}.png`, Buffer.from(url.split(',')[1], 'base64'));
console.log('shot-lap-' + LV + '.png at f=' + F);
await b.close();
