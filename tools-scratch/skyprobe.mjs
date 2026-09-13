/* What the cloud bank actually is in the running world: the theme's tint, the
 * per-instance colours it produced, and the material type. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '73';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, T = g.track.T, out = { kind: T.cloudKind,
    tint: T.cloudTint?.toString(16), deep: T.cloudDeep?.toString(16),
    tone: g.renderer.toneMapping, exposure: g.renderer.toneMappingExposure, banks: [] };
  g.scene.traverse(o => {
    if (!/^cloud-bank/.test(o.name || '')) return;
    const c = [];
    const ic = o.instanceColor;
    for (let k = 0; k < Math.min(o.count, 4); k++) {
      c.push([+ic.array[k * 3].toFixed(2), +ic.array[k * 3 + 1].toFixed(2),
        +ic.array[k * 3 + 2].toFixed(2)]);
    }
    out.banks.push({ name: o.name, count: o.count, mat: o.material.type, colors: c });
  });
  return out;
})));
await b.close();
