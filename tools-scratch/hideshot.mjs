/* Hide one named mesh and re-shoot. Whatever disappears from the picture is
 * what that name was drawing — cheaper than reasoning about it. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74', F = +(process.env.F ?? 0.35);
const HIDE = (process.env.HIDE ?? '').split(',').filter(Boolean);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>24?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const r = await p.evaluate(({F, HIDE}) => {
  const g = window.__game, t = g.track;
  const names = [];
  g.scene.traverse(o => { if (o.isInstancedMesh && o.name) names.push(`${o.name}:${o.count}`); });
  for (const h of HIDE) g.scene.traverse(o => { if (o.name === h) o.visible = false; });
  const i = Math.floor(t.N * F), c = t.center[i], c2 = t.center[(i + 12) % t.N];
  g.camera.position.set(c.x, c.y + 2.6, c.z);
  g.camera.lookAt(c2.x, c2.y + 1.9, c2.z);
  g.camera.updateProjectionMatrix();
  g.renderer.render(g.scene, g.camera);
  return { names: [...new Set(names)], url: g.renderer.domElement.toDataURL('image/png') };
}, {F, HIDE});
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-hide.png`, Buffer.from(r.url.split(',')[1],'base64'));
console.log(r.names.join('\n'));
await b.close();
