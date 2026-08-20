/* Dump the ACTUAL facade texture the running world is using, straight off the
 * material's map. If an edit to the painter does not show up here, the edit is
 * not reaching the render and no amount of squinting at a street shot will say
 * so. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 900, height: 520 } });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(() => {
  const g = window.__game;
  const found = [];
  g.scene.traverse(o => {
    if (!o.isInstancedMesh || !o.material) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (m.map && m.map.image && m.map.image.toDataURL) {
      found.push({ name: o.name || '(anon)', count: o.count,
        w: m.map.image.width, h: m.map.image.height,
        url: m.map.image.toDataURL('image/png') });
    }
  });
  return found;
});
const fs = await import('fs');
for (const f of out) {
  const safe = f.name.replace(/[^a-z0-9-]/gi, '_');
  fs.writeFileSync(`tools-scratch/tex-${safe}.png`, Buffer.from(f.url.split(',')[1], 'base64'));
  console.log(`${f.name}  count=${f.count}  ${f.w}x${f.h}  -> tex-${safe}.png`);
}
await b.close();
