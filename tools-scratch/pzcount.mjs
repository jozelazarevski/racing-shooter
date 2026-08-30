/* How many draw calls the squares cost, and how many instances are in them. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '73';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game; const rows = []; let inst = 0;
  g.scene.traverse(o => {
    if (!o.name?.startsWith('piazza-')) return;
    rows.push(`${o.name}:${o.count ?? 1}`); inst += o.count ?? 1;
  });
  let scene = 0;
  g.scene.traverse(o => { if (o.isMesh || o.isInstancedMesh) scene++; });
  return { drawCalls: rows.length, instances: inst, sceneDrawCalls: scene,
    squares: g.track._piazzas?.length ?? 0, rows };
}), null, 1));
await b.close();
