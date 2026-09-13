/* A SHOT OF THE TOWN. Houses land in shared InstancedMeshes, so there is no
 * per-building object to find by name — the first cut of this probe searched
 * for one and reported "0 buildings" on a world full of them. Park the camera
 * on the road at a given fraction of the lap instead and look along it. */
import { chromium } from 'playwright-core';
const id = process.env.LV ?? '74';
const F = +(process.env.F ?? 0.35);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 960, height: 560 } });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto(`http://localhost:8901/?level=${id}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>20?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const shot = await p.evaluate((F) => {
  const g = window.__game, t = g.track;
  const i = Math.floor(t.N * F) % t.N;
  const c = t.center[i], f2 = t.center[(i + 26) % t.N];
  g.camera.position.set(c.x, c.y + 7.5, c.z);
  g.camera.lookAt(f2.x, f2.y + 2.5, f2.z);
  g.renderer.render(g.scene, g.camera);
  let inst = 0; g.scene.traverse((o) => { if (o.isInstancedMesh) inst += o.count; });
  // SAME TICK. render() and toDataURL() must happen in ONE evaluate: the
  // drawing buffer is not preserved, and the game's own rAF loop re-renders
  // from the CAR's camera the moment this call returns. Splitting them gave a
  // 12KB blank against the 858KB the seafront shot weighs.
  return { line: `${g.level.name} @${Math.round(F*100)}% of the lap · ${inst} instanced objects`,
    url: g.renderer.domElement.toDataURL('image/png') };
}, F);
console.log(shot.line);
const url = shot.url;
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-town-${id}-${Math.round(F*100)}.png`, Buffer.from(url.split(',')[1], 'base64'));
if (errs.length) console.log('ERR ' + errs.slice(0,2).join(' | '));
await b.close();
