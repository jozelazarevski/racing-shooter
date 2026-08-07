/* A ROOF SITS ON A HOUSE.
 *
 * THE COMPLAINT, twice: "the weird house", with a screenshot of a timber box
 * whose top was a flat plank deck — window texture and all — with a stub of
 * pyramid poking out of the middle of it.
 *
 * The cause was one missing line. `BoxGeometry` and `ConeGeometry` are both
 * centred on their own origin. `_buildHuts` translates the wall box up by half
 * its height so its base sits at y=0, then composes both meshes at the same
 * anchor — but the cone never got the matching translate, so the pyramid's
 * base landed HALF ITS OWN HEIGHT below the wall top. Measured on a 7.65 u hut
 * before the fix: wall 0.02-5.02, roof 4.03-6.01. Exactly 0.99 of the roof's
 * 1.98 u was inside the house, and what showed was the wall box's top face.
 *
 * Both earlier attempts at "the weird house" rewrote `_element`'s `house`,
 * which is a DIFFERENT builder and was never the thing in the screenshot. So
 * this test does not take a builder's name on trust either: it walks every
 * registered building, reads the real world-space vertical extent of each of
 * its instanced parts, and asserts the geometric property that was violated —
 * no part floats above the one under it, and no roof is buried in its walls.
 *
 * Worlds are chosen for hut density and to span the kits: the alpine hamlet,
 * the farm valley, the desert outpost, and one of the new regions.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const WORLDS = [[1, 'PINE VALLEY'], [21, 'FURKA RIDGE'], [10, 'ROCKFALL RAVINE'], [31, 'HEDGEROW DASH']];

let total = 0;
for (const [id, name] of WORLDS) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center,
    undefined, { timeout: 240000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  const r = await p.evaluate(() => {
    const t = window.__game.track;
    // World-space vertical extent of one instance of an InstancedMesh. Read off
    // the geometry through the instance matrix, so it accounts for the
    // geometry's own origin — which is the whole point: a number taken from
    // the compose() anchor alone would have looked correct throughout.
    const extent = (mesh, i) => {
      const m = new mesh.matrixWorld.constructor();
      mesh.getMatrixAt(i, m);
      const pos = mesh.geometry.attributes.position;
      const v = new mesh.position.constructor();
      let lo = Infinity, hi = -Infinity;
      for (let k = 0; k < pos.count; k++) {
        v.fromBufferAttribute(pos, k).applyMatrix4(m);
        if (v.y < lo) lo = v.y;
        if (v.y > hi) hi = v.y;
      }
      return { lo, hi };
    };
    const out = [];
    for (const b of (t.buildings ?? [])) {
      if (!b.parts || b.parts.length < 2) continue;      // single-piece structures
      const spans = b.parts.map((pt) => extent(pt.mesh, pt.i));
      spans.sort((a, c) => a.lo - c.lo);                 // bottom-up
      const base = spans[0], top = spans[spans.length - 1];
      out.push({
        x: +b.x.toFixed(1), z: +b.z.toFixed(1), w: +(b.w ?? 0).toFixed(2),
        // how far the upper part's base sits BELOW the lower part's top.
        // Positive = buried. A little overlap is how you seat two boxes
        // without a seam; half a part's height is a bug.
        buried: +(base.hi - top.lo).toFixed(2),
        upperHeight: +(top.hi - top.lo).toFixed(2),
        // and the reverse: a gap means the roof floats.
        gap: +(top.lo - base.hi).toFixed(2),
      });
    }
    return out;
  });

  total += r.length;
  if (!r.length) { console.log(`NOTE  ${name}: no multi-part buildings`); await p.close(); continue; }

  // THE HEADLINE. Nothing may be buried by more than a fifth of its own
  // height — that is loose enough for a deliberate seam overlap and nowhere
  // near the 50 % that was shipping.
  const sunk = r.filter((b) => b.buried > b.upperHeight * 0.2);
  check(`${name}: no roof is buried in its walls`, sunk.length === 0,
    sunk.length ? JSON.stringify(sunk.slice(0, 3)) : `${r.length} buildings, worst ${Math.max(...r.map((b) => b.buried)).toFixed(2)} u`);

  // ...and the other way, which the same missing translate would have caused
  // had the sign gone the other way.
  const floating = r.filter((b) => b.gap > 0.35);
  check(`${name}: no roof floats above its walls`, floating.length === 0,
    floating.length ? JSON.stringify(floating.slice(0, 3)) : 'all seated');

  // A house must still be a house and not a bunker: the roof has to be a
  // visible fraction of the silhouette, which is what the buried one was not.
  const flat = r.filter((b) => b.upperHeight < 1.2);
  check(`${name}: the roof is a real part of the silhouette`, flat.length === 0,
    flat.length ? JSON.stringify(flat.slice(0, 3)) : `thinnest roof ${Math.min(...r.map((b) => b.upperHeight)).toFixed(2)} u`);

  await p.close();
}

check('buildings still exist across the game', total >= 40, `${total} multi-part buildings`);
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nevery roof sits on its house');
process.exit(fail ? 1 : 0);
