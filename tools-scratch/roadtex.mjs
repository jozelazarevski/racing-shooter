/* What the RUNNING world's road actually is: the spec the theme handed to
 * roadTexture, plus the texture that came out of it. r243's rule — measure the
 * running world, do not read the tune and assume. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 900, height: 520 } });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(() => {
  const g = window.__game, T = g.track.T;
  const r = { spec: JSON.stringify(T.road?.cobbles?.stones ?? null),
    base: T.road?.base ?? null, fringe: JSON.stringify(T.road?.fringe ?? null),
    rails: JSON.stringify(T.road?.rails ?? null), maps: [] };
  g.scene.traverse(o => {
    if (!o.material || o.isInstancedMesh) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m.map?.image?.toDataURL) return;
    if (!/road|carriage|surface/i.test(o.name || '')) return;
    r.maps.push({ name: o.name, url: m.map.image.toDataURL('image/png') });
  });
  return r;
});
console.log('cobble stones in the RUNNING theme:', out.spec);
console.log('base', out.base, 'fringe', out.fringe, 'rails', out.rails);
const fs = await import('fs');
for (const m of out.maps.slice(0, 2)) {
  fs.writeFileSync(`tools-scratch/tex-road-${m.name}.png`, Buffer.from(m.url.split(',')[1], 'base64'));
  console.log('road mesh', m.name, '-> tex-road-<name>.png');
}
await b.close();
