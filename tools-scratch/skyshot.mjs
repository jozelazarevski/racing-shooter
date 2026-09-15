/* Judge the sky, not the street: driver height, pitched up so the frame is
 * mostly cloud. A cloud bank tuned from a street shot is tuned on the one
 * strip of it a building has not already covered. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '73', F = +(process.env.F ?? 0.4);
const PITCH = +(process.env.PITCH ?? 0.42);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>24?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const url = await p.evaluate(({F, PITCH}) => {
  const g = window.__game, t = g.track, i = Math.floor(t.N * F);
  const c = t.center[i], c2 = t.center[(i + 40) % t.N];
  g.camera.position.set(c.x, c.y + 2.6, c.z);
  const d = Math.hypot(c2.x - c.x, c2.z - c.z) || 1;
  g.camera.lookAt(c2.x, c.y + 2.6 + d * Math.tan(PITCH), c2.z);
  g.camera.updateProjectionMatrix();
  g.renderer.render(g.scene, g.camera);
  return g.renderer.domElement.toDataURL('image/png');
}, { F, PITCH });
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-sky-${LV}.png`, Buffer.from(url.split(',')[1], 'base64'));
console.log(`shot-sky-${LV}.png`);
await b.close();
