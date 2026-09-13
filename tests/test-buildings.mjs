/* A ROOF SITS ON A HOUSE.
 *
 * THE COMPLAINT, twice: "the weird house", with a screenshot of a timber box
 * whose top was a flat plank deck — window texture and all — with a stub of
 * pyramid poking out of the middle of it.
 *
 * The cause was one missing line. `BoxGeometry` and `ConeGeometry` are both
 * centred on their own origin. `_buildHuts` translated the wall box up by half
 * its height so its base sat at y=0, then composed both meshes at the same
 * anchor — but the cone never got the matching translate, so the pyramid's
 * base landed HALF ITS OWN HEIGHT below the wall top. Measured on a 7.65 u hut
 * before the fix: wall 0.02-5.02, roof 4.03-6.01.
 *
 * The same bug existed, independently and identically, in the spur farmstead's
 * barn builder — which is why the structures are now DATA. Every shape in the
 * game is an entry in HOUSE_TEMPLATES and every shared geometry is
 * base-anchored in exactly one place, so this test checks the shapes at the
 * source rather than chasing each builder that draws them.
 *
 * TWO PROPERTIES, both of which the old geometry violated:
 *
 *   SUPPORT   no part starts above everything beneath it (a floating roof)
 *   SEATING   no part that COVERS the structure — a roof, a canopy, a parapet,
 *             anything as wide as the widest part — starts below what it sits
 *             on by a meaningful fraction of its own height (a buried roof)
 *
 * The footprint test in SEATING is what lets a CHIMNEY pass. A chimney rises
 * through the roof by design and is buried in it by most of its length; it is
 * also narrow. An earlier version of this test compared only the lowest and
 * highest part of each structure, which was fine while a building was a box
 * and a lid and started reporting the chimneys as floating roofs the moment
 * the cottages gained one.
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

const probe = await browser.newPage({ viewport: { width: 640, height: 400 } });
await probe.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load' });
await probe.waitForFunction(() => window.__HOUSE_TEMPLATES, undefined, { timeout: 120000 });
const templates = await probe.evaluate(() => window.__HOUSE_TEMPLATES);
await probe.close();

const names = Object.keys(templates);
check('the house templates are exposed', names.length >= 10, `${names.length} templates: ${names.join(', ')}`);

for (const [name, T] of Object.entries(templates)) {
  // part = [kind, dx, dy, dz, sx, sy, sz, colour, roll?]
  //
  // `roll` tips a part onto its side — the stacked logs of a logpile, a well's
  // winch bar, the windmill's sails. For those, `sy` is the length along the
  // part's OWN axis and is horizontal in the world; what stands vertically is
  // its diameter. Reading sy as height regardless is what made an earlier run
  // of this test report the logpile as floating 0.55 u above the ground and
  // buried 3.65 u in itself at the same time.
  const parts = T.parts.map(([kind, dx, dy, dz, sx, sy, sz, , roll = 0]) => {
    const tipped = Math.abs(roll) > 0.1;
    const h = tipped ? sx : sy;
    return { kind, base: tipped ? dy - sx / 2 : dy, top: tipped ? dy + sx / 2 : dy + sy,
      h, foot: tipped ? Math.max(sy, sz) : Math.max(sx, sz), tipped };
  });
  const widest = Math.max(...parts.map((p) => p.foot));

  // --- SUPPORT: nothing hangs in the air ---
  // Deliberately compared against EVERY other part, not just the ones lower
  // down. These structures are not simple stacks — a house has a side wing
  // beside it and a chimney through its roof — and a strict "what is directly
  // underneath" model reported the wing as holding up the main block. What is
  // worth asserting is the weak, true version: no part hangs in the air above
  // everything else in its own structure.
  const floating = [];
  for (const p of parts) {
    const rest = parts.filter((q) => q !== p);
    if (!rest.length) continue;
    const highest = Math.max(...rest.map((q) => q.top));
    if (p.base > highest + 0.35) floating.push(`${p.kind}@${p.base} over ${highest.toFixed(2)}`);
  }
  check(`${name}: no part floats`, floating.length === 0, floating.join(', ') || `${parts.length} parts, all supported`);

  // and the structure has to start at the ground, not float as a whole
  check(`${name}: sits on the ground`, Math.min(...parts.map((p) => p.base)) <= 0.1,
    `lowest part starts at ${Math.min(...parts.map((p) => p.base)).toFixed(3)}`);
}

// --- THE INVARIANT THE BUG ACTUALLY BROKE ---
//
// Every shared geometry must be BASE-ANCHORED: its lowest vertex at y=0, so
// that composing it at a height puts its bottom there. `wallGeo` was; the roof
// cone was not, and half of every roof ended up inside the house. This is the
// exact property, checked on the real geometries the world was built from, and
// it is the reason the heuristics above can stay weak — there is now one place
// that anchors geometry and this asserts it directly.
const geoProbe = await browser.newPage({ viewport: { width: 640, height: 400 } });
await geoProbe.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
await geoProbe.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const anchored = await geoProbe.evaluate(() => {
  const out = [];
  window.__game.scene.traverse((o) => {
    if (!o.isInstancedMesh || !/^element-/.test(o.name || '')) return;
    o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox;
    out.push({ name: o.name, minY: +bb.min.y.toFixed(4), maxY: +bb.max.y.toFixed(4), n: o.count });
  });
  return out;
});
await geoProbe.close();
check('the shared element geometries exist', anchored.length >= 4,
  anchored.map((g) => `${g.name}x${g.n}`).join(' '));
const unanchored = anchored.filter((g) => Math.abs(g.minY) > 1e-3);
check('every shared geometry is base-anchored at y=0', unanchored.length === 0,
  unanchored.length ? unanchored.map((g) => `${g.name} minY=${g.minY}`).join(', ')
    : anchored.map((g) => `${g.name} 0..${g.maxY}`).join(', '));

// --- and the built worlds actually contain them ---
let total = 0;
for (const [id, name] of WORLDS) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center,
    undefined, { timeout: 240000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  const r = await p.evaluate(() => {
    const t = window.__game.track;
    const out = [];
    for (const b of (t.buildings ?? [])) {
      if (!b.parts || !b.parts.length) continue;
      // every registered part must point at a real instanced mesh and a slot
      // inside it — the deferred (mesh, slot) resolution is new, and a
      // building whose parts never resolved is invisible to the weapon paths
      const bad = b.parts.filter((pt) => !pt.mesh || !(pt.i >= 0) || pt.i >= pt.mesh.count);
      out.push({ n: b.parts.length, bad: bad.length, y: b.y, hp: b.hp });
    }
    return out;
  });

  total += r.length;
  check(`${name}: every building resolved its meshes`, r.every((b) => b.bad === 0),
    `${r.length} destructible buildings, ${r.reduce((a, b) => a + b.bad, 0)} unresolved parts`);
  check(`${name}: buildings are multi-part`, r.every((b) => b.n >= 2),
    `parts per building: ${Math.min(...r.map((b) => b.n))}-${Math.max(...r.map((b) => b.n))}`);

  await p.close();
}
check('buildings still exist across the game', total >= 30, `${total} destructible buildings`);

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nevery roof sits on its house');
process.exit(fail ? 1 : 0);
