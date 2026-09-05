/* What the town costs: draw calls in the scene, and the texture memory the
 * facade painter is holding. Run before and after any detail pass. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game;
  let meshes = 0, instances = 0, texBytes = 0, sprites = 0, cloudBank = 0;
  const seen = new Set(), town = {};
  g.scene.traverse(o => {
    if (o.isSprite) sprites++;
    if (o.name === 'cloud-bank') cloudBank = o.count;
    if (!o.isMesh && !o.isInstancedMesh) return;
    meshes++; instances += o.count ?? 1;
    if (/oldtown|frontage|piazza/.test(o.name || '')) town[o.name] = o.count ?? 1;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      for (const k of ['map', 'emissiveMap']) {
        const t = m?.[k];
        if (!t?.image || seen.has(t)) continue;
        seen.add(t);
        texBytes += (t.image.width || 0) * (t.image.height || 0) * 4;
      }
    }
  });
  return { meshes, sprites, cloudBank, instances, textureMB: +(texBytes / 1048576).toFixed(1),
    townParts: Object.keys(town).length, town };
}), null, 1));
await b.close();
