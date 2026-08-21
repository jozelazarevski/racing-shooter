/* IS THE WALL GREEN BECAUSE OF ITS TEXTURE, OR BECAUSE OF THE LIGHT?
 *
 * UNDERCITY SLIPSTREAM declares a stained-concrete `cliffPalette` — five
 * greys — and renders as saturated green. Two candidates, and they need
 * different fixes, so guessing is not allowed:
 *   (a) the palette never reaches `cliffTexture` and the texture is green;
 *   (b) the texture is grey and the light multiplies it green.
 *
 * Read the texture's OWN pixels off its canvas, before any light touches it,
 * and read the material's vertex colours. Whatever the texture says, says it.
 *
 * CONTROL: the same read on a cliffWalls world nobody has complained about.
 * If its texture is also nothing like its palette, the reader is wrong.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '18').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
for (const id of IDS) {
  await p.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    if (!t.T.cliffWalls) return { name: g.level?.name, skip: 'no cliff walls' };
    let mesh = null;
    t.group.traverse((o) => { if (!mesh && o.isMesh && /cliff|ribbon/i.test(o.name)) mesh = o; });
    if (!mesh) t.group.traverse((o) => {
      if (!mesh && o.isMesh && o.material?.map?.image?.width >= 256
          && o.geometry?.attributes?.position?.count > 2000) mesh = o;
    });
    if (!mesh) return { name: g.level?.name, skip: 'no cliff mesh found' };
    const img = mesh.material.map?.image;
    let tex = null;
    if (img) {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let R = 0, G = 0, B = 0, n = 0, sat = 0;
      for (let i = 0; i < px.length; i += 4) {
        R += px[i]; G += px[i + 1]; B += px[i + 2]; n++;
        const mx = Math.max(px[i], px[i + 1], px[i + 2]);
        const mn = Math.min(px[i], px[i + 1], px[i + 2]);
        sat += mx ? (mx - mn) / mx : 0;
      }
      tex = { w: img.width, h: img.height,
        mean: [Math.round(R / n), Math.round(G / n), Math.round(B / n)],
        sat: +(sat / n).toFixed(3) };
    }
    // vertex colours, which multiply the map
    let vc = null;
    const ca = mesh.geometry.attributes.color;
    if (ca) {
      let R = 0, G = 0, B = 0;
      for (let i = 0; i < ca.count; i++) { R += ca.getX(i); G += ca.getY(i); B += ca.getZ(i); }
      vc = [+(R / ca.count).toFixed(3), +(G / ca.count).toFixed(3), +(B / ca.count).toFixed(3)];
    }
    const hemi = g.scene.children.find((o) => o.isHemisphereLight);
    return { name: g.level?.name, mesh: mesh.name || mesh.geometry.type, tex, vc,
      matColor: '#' + mesh.material.color.getHexString(),
      vertexColors: !!mesh.material.vertexColors,
      declared: t.T.cliffPalette?.bands ?? null,
      hemi: hemi ? { sky: '#' + hemi.color.getHexString(),
        ground: '#' + hemi.groundColor.getHexString(), i: hemi.intensity } : null };
  });
  console.log(`L${id} ${JSON.stringify(r, null, 1)}`);
}
await b.close();
