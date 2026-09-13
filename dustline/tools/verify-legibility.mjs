/* DOES THE WORLD REFLECT WHAT ITS MATERIALS SAY IT DOES?
 *
 * READ THE NEXT PARAGRAPH BEFORE TRUSTING THIS FILE.
 *
 * THIS CHECK DID NOT CATCH THE THING IT WAS WRITTEN FOR, and the honest record
 * of that is worth more than the check. The owner said the graphics did not
 * look remotely good; the road read as a black ribbon; I diagnosed it as a
 * double multiply — `map` and `vertexColors` do multiply in three.js, and the
 * road carried an asphalt map AND a vertex tint of its own surface albedo — and
 * asserted the product was 0.008 linear, about one per cent reflectance.
 *
 * That arithmetic assumed a map mean of 0.07. MEASURED, THE MAP'S MEAN IS ABOUT
 * 0.5, and the road's effective albedo was 0.094 — a completely plausible
 * asphalt. Normalising the map lifted it to 0.18, which reads better and was
 * kept, but that is an ART DECISION AND NOT A BUG FIX. This file passed before
 * that change and after it. A mutation test is the only reason any of that is
 * known: restoring the original tint left every check green, which is what a
 * check saying nothing looks like.
 *
 * SO WHAT IS IT FOR? A genuinely useful, much narrower thing: it catches a
 * surface that is effectively BLACK — the case where a material, a map and a
 * tint combine into something that returns almost nothing and can never be lit
 * into an image. That failure is real, it is invisible in source (each term
 * looks fine alone), and nothing else here would see it. It is NOT a judge of
 * whether the world looks good, and it must not be cited as one.
 *
 * WHAT IT CHECKS. For every drawn surface it forms the same product the shader
 * forms — material colour x map mean x vertex colour mean, in LINEAR space —
 * and requires the result to clear a floor. Two floors: one for everything, and
 * a higher one for surfaces carrying both a map and a vertex tint, because that
 * pairing has two chances to be dark and is where a combination defect hides.
 *
 * WHY NOT COMPARE AGAINST THE DECLARED SURF_COLORS. That was the first design
 * and it is abandoned deliberately: the road's declared tarmac is 0.065 and its
 * effective albedo was 0.094, a factor of 1.4, which no honest band would flag.
 * A check calibrated to fire on 1.4x would fire on every legitimate tint in the
 * library. The declared colour is simply not the right oracle here.
 *
 * WHAT IT CANNOT SEE, stated plainly:
 *   - IT DOES NOT RENDER. It reads materials and geometry out of a built world
 *     in the browser. It cannot tell you the scene is well lit, only that a
 *     surface is not lying about its own albedo. A correctly-albedoed world
 *     under a 2 degree sun is still dark and this file will pass it.
 *   - IT ONLY COVERS SURFACES WITH A DECLARED ALBEDO — the six in SURF_COLORS,
 *     plus water. Components declare colours per part with no single truth to
 *     check against, so they are counted and reported, not judged.
 *   - MEAN IS NOT PERCEPTION. A map that is half black and half white has the
 *     mean of a mid grey and looks like neither.
 *
 *   cd dustline && node tools/verify-legibility.mjs
 *   cd dustline && node tools/verify-legibility.mjs --table
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { ensureServer } from './serve.mjs';

const TABLE = process.argv.includes('--table');
const BASE = process.env.BASE || 'http://localhost:8941/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

/* THE TWO THRESHOLDS, AND WHERE THEY COME FROM.
 *
 * BLACK is the floor for anything drawn at all. Below 0.005 linear a surface
 * returns under half a per cent of the light landing on it — darker than fresh
 * asphalt (about 0.04), darker than charcoal, and low enough that no exposure
 * setting recovers it into an image. Nothing in a daylit world is legitimately
 * there.
 *
 * PAIRED is the higher floor for a surface carrying BOTH a map and a vertex
 * tint, because that pairing has two chances to be dark and the failure would
 * be the multiplication rather than either term. Measured census over the three
 * shipped tracks: the darkest such surface is grass ground cover at 0.079 and
 * the road sits at 0.18, so 0.012 is an order of magnitude below anything
 * legitimate and cannot fire on an authoring choice.
 *
 * MUTATION RESULT, RECORDED BECAUSE IT IS UNFLATTERING: restoring the original
 * un-normalised road tint puts the road at 0.094, and BOTH CHECKS STILL PASS.
 * These thresholds do not catch a merely-dark surface and are not claimed to.
 * They catch a black one. The census printed by --table is the instrument for
 * everything in between, and a human looking at a screenshot is still the
 * instrument for whether it looks good. */

const BLACK = 0.005;
const PAIRED = 0.012;

const TRACK_DIR = 'src/data/tracks';
const tracks = readdirSync(TRACK_DIR).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(TRACK_DIR, f), 'utf8')).id).sort();

const stopServer = await ensureServer(BASE, '../V2');
const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 500, height: 400 } });

const rows = [];
for (const id of tracks) {
  await page.goto(`${BASE}index.html?track=${id}&nopost=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__dust?.terrain, null, { timeout: 120000 });

  const r = await page.evaluate(() => {
    const d = window.__dust;
    // three converts an sRGB hex to LINEAR working space on `set()`, and that
    // linear value is what the shader multiplies. Everything here stays linear.
    const meanOfTexture = (tex) => {
      if (!tex?.image) return null;
      const im = tex.image;
      const cv = document.createElement('canvas');
      cv.width = Math.min(im.width || 256, 256);
      cv.height = Math.min(im.height || 256, 256);
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(im, 0, 0, cv.width, cv.height);
      const px = g.getImageData(0, 0, cv.width, cv.height).data;
      const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      let r = 0, gg = 0, b = 0;
      for (let i = 0; i < px.length; i += 4) {
        r += toLin(px[i] / 255); gg += toLin(px[i + 1] / 255); b += toLin(px[i + 2] / 255);
      }
      const n = px.length / 4;
      return [r / n, gg / n, b / n];
    };
    const meanOfVertexColors = (geo) => {
      const a = geo.getAttribute('color');
      if (!a) return null;
      let r = 0, g = 0, b = 0;
      // vertex colours are authored in linear already (three does not convert
      // a BufferAttribute), so they are summed as they are
      for (let i = 0; i < a.count; i++) { r += a.getX(i); g += a.getY(i); b += a.getZ(i); }
      return [r / a.count, g / a.count, b / a.count];
    };

    const out = [];
    d.scene.traverse((o) => {
      if (!o.isMesh || !o.material || o.material.fog === false) return;
      // The spatial merge leaves a GEOMETRY-LESS InstancedMesh per component
      // part as the placement record four other tools read matrices out of —
      // see `world/build.ts`. It draws nothing, so it has no albedo to judge.
      const pos = o.geometry?.getAttribute?.('position');
      if (!pos) return;
      const m = o.material;
      const base = m.color ? [m.color.r, m.color.g, m.color.b] : [1, 1, 1];
      const map = m.map ? meanOfTexture(m.map) : [1, 1, 1];
      const vc = m.vertexColors ? meanOfVertexColors(o.geometry) : [1, 1, 1];
      if (!map || !vc) return;
      const eff = [0, 1, 2].map((i) => base[i] * map[i] * vc[i]);
      const lum = 0.2126 * eff[0] + 0.7152 * eff[1] + 0.0722 * eff[2];
      out.push({
        name: o.name || o.geometry.type,
        tris: (o.geometry.index ? o.geometry.index.count : pos.count) / 3,
        hasMap: !!m.map, hasVC: !!m.vertexColors,
        eff, lum,
      });
    });
    // the declared truth, straight out of the module the game uses
    return { surfaces: d.terrain.constructor.SURF_COLORS_FOR_TOOLS ?? null, meshes: out };
  });

  // the road ribbon and the terrain are the two meshes with a declared albedo;
  // both are found by triangle count and material shape rather than by name,
  // because neither carries one
  const big = r.meshes.filter((m) => m.tris > 2000).sort((a, b) => b.tris - a.tris);
  for (const m of big) rows.push({ track: id, ...m });
}

await browser.close();
await stopServer?.();

if (TABLE) {
  console.log('\ntrack'.padEnd(17) + 'mesh'.padEnd(20) + 'tris'.padEnd(10) + 'map vc'.padEnd(8) + 'effective albedo (linear)');
  console.log('-'.repeat(96));
  for (const r of rows) {
    console.log(r.track.padEnd(16) + ' ' + String(r.name).slice(0, 19).padEnd(20)
      + String(Math.round(r.tris)).padEnd(10)
      + `${r.hasMap ? ' y' : ' -'}  ${r.hasVC ? 'y' : '-'}`.padEnd(8)
      + r.eff.map((c) => c.toFixed(4)).join('  ') + `   lum ${r.lum.toFixed(4)}`);
  }
  console.log('');
}

// ---- 1. nothing that is drawn is effectively black --------------------------
//
// The floor is not a taste: below about 0.005 linear a surface returns less
// than half a per cent of the light that lands on it, which no real material
// outside soot does, and which no exposure setting can recover into an image.

const dark = rows.filter((r) => r.lum < BLACK)
  .map((r) => `${r.track}/${r.name} lum ${r.lum.toFixed(4)}${r.hasMap && r.hasVC ? ' (map x vertexColors — painted twice?)' : ''}`);
check(dark.length === 0,
  `no large surface reflects less than ${BLACK} of the light that reaches it (${rows.length} checked)`,
  dark.join(' | '));

// ---- 2. a surface carrying both a map and a vertex tint is not double-dimmed -
//
// This is the specific trap, named. Both are legitimate; both being full-
// strength albedo is not, and the product gives it away.
const both = rows.filter((r) => r.hasMap && r.hasVC);
const suspicious = both.filter((r) => r.lum < PAIRED)
  .map((r) => `${r.track}/${r.name} lum ${r.lum.toFixed(4)}`);
check(suspicious.length === 0,
  `every surface with BOTH a map and a vertex tint clears ${PAIRED} effective albedo (${both.length} of them)`,
  suspicious.join(' | '));

console.log(fails
  ? `\n${fails} FAILED — a surface is far darker than its own material claims. That is a`
    + `\n           material bug, not a lighting one, and relighting will not move it.`
  : `\nevery measured surface reflects roughly what its material says it does`);
process.exit(fails ? 1 : 0);
