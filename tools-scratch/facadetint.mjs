/* IS THE THEME'S PAINT REACHING THE WALL? The frontage body has no colour of
 * its own: it wears a generated facade texture and the per-house tint is an
 * INSTANCE COLOUR that multiplies it. So a street can come out grey with a
 * perfectly good tint list, and the only way to tell which half is at fault is
 * to read both — the tints the theme asked for, the instance colours actually
 * written, and the mean colour of the texture they multiply. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '54';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 500, height: 320 } })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, t = g.track, T = t.T;
  const hex = (r, gg, b) => '#' + [r, gg, b].map((v) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
  const out = { world: g.level.name, askedTints: T.frontage?.tints ?? null,
    render: T.frontage?.face?.render ?? null, shutter: T.frontage?.face?.shutter ?? null,
    ridge: T.frontage?.ridge ?? null, meshes: [] };
  g.scene.traverse((o) => {
    if (!o.isInstancedMesh || o.name !== 'oldtown-frontage' || !o.count) return;
    const ic = o.instanceColor;
    const seen = new Map();
    if (ic) for (let k = 0; k < o.count; k++) {
      const c = hex(ic.array[k * 3], ic.array[k * 3 + 1], ic.array[k * 3 + 2]);
      seen.set(c, (seen.get(c) ?? 0) + 1);
    }
    // mean colour of the facade texture this mesh wears
    let tex = null, texMode = null, texModeShare = 0;
    const img = o.material.map?.image;
    if (img) {
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      const x = cv.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, cv.width, cv.height).data;
      // THE MEAN IS THE WRONG NUMBER. A facade texture is render PLUS black
      // panes, shutters, iron and plinth, so its average is always a mid grey
      // and says nothing about the paint. The MODE is the wall.
      let r = 0, gg = 0, bb = 0, n = 0; const hist = new Map();
      for (let i = 0; i < d.length; i += 4) {
        r += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++;
        const q = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
        hist.set(q, (hist.get(q) ?? 0) + 1);
      }
      tex = '#' + [r / n, gg / n, bb / n].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
      let bq = 0, bn = 0;
      for (const [q, c] of hist) if (c > bn) { bn = c; bq = q; }
      texMode = '#' + [((bq >> 10) & 31) << 3, ((bq >> 5) & 31) << 3, (bq & 31) << 3]
        .map((v) => v.toString(16).padStart(2, '0')).join('');
      texModeShare = +(100 * bn / n).toFixed(1);
    }
    out.meshes.push({ count: o.count, hasInstanceColor: !!ic,
      tints: [...seen.entries()].sort((a, b2) => b2[1] - a[1]).slice(0, 8).map(([c, n]) => `${c}x${n}`),
      texMean: tex, texMode, texModeShare, matColor: '#' + o.material.color.getHexString(),
      emissiveIntensity: +(o.material.emissiveIntensity ?? 0).toFixed(2) });
  });
  return out;
}), null, 1));
await b.close();
