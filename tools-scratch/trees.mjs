/* TREE TRUNKS AGAINST THE CARRIAGEWAY, PER WORLD.
 *
 * Only the TRUNK is solid — `_buildVizCorridors` says so where it pushes the
 * rows out ("collision r tracks the TRUNK, not the canopy; the canopy
 * overhangs the road, only the trunk is solid"). So a canopy leaning over the
 * road is the design working, and a trunk inside the drivable width is a
 * blocker the player meets and the racing line never does.
 *
 * The clearance a trunk owes is RULES.md's: `widthAt + r + car radius`, and
 * the car radius for a tree is 1.7. `_buildVizCorridors` aims for exactly that
 * (`widthAt(j) + 0.75*sc + 2.0 + ...`) but measures `lat` along ONE sample's
 * normal, which on a lap that comes back on itself says nothing about the
 * distance to the nearest leg — the "an offset is not a distance" defect.
 *
 *   node tools-scratch/trees.mjs             # every world
 *   node tools-scratch/trees.mjs 37 6        # only these
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const only = process.argv.slice(2).map(Number).filter(Boolean);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const roster = await page.evaluate(async () => {
  const { LEVELS } = await import('./src/track.js');
  return LEVELS.map((l) => ({ id: l.id, name: l.name }));
});
const worlds = only.length ? roster.filter((l) => only.includes(l.id)) : roster;

let tot = 0, bad = 0, worstAll = 0, dirty = 0;
for (const lv of worlds) {
  await page.goto(`${BASE}/?level=${lv.id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${lv.name}`); continue; }
  const r = await page.evaluate(() => {
    const t = window.__game.track;
    const V = new (t.center[0].constructor)();
    const CAR = 1.7;                       // RULES.md: car radius against trees
    const out = [];
    for (const tr of (t.trees ?? [])) {
      V.set(tr.x, 0, tr.z);
      const i = t.nearestIndex(V);
      // HEIGHT FIRST, or the canyon skyline reads as a defect. `_buildCacti`
      // deliberately silhouettes saguaros on the CANYON RIM, twenty-odd units
      // above the road; XZ distance alone calls those intrusions and "fixing"
      // them would strip the skyline for nothing. Only a trunk standing at
      // road level can be in the carriageway.
      const dy = (tr.y ?? 0) - t.center[i].y;
      if (dy > 3 || dy < -4) continue;
      // how far INSIDE the clearance the trunk's collision face reaches
      const bite = (t.widthAt(i) + (tr.r ?? 0.75) + CAR) - t._distToTrack(tr.x, tr.z);
      if (bite > 0.3) out.push({ bite: +bite.toFixed(2), i, kind: tr.kind ?? '?',
        r: +(tr.r ?? 0).toFixed(2), half: +t.widthAt(i).toFixed(2),
        dy: +dy.toFixed(1), solid: tr.solid !== false,
        lat: +t._distToTrack(tr.x, tr.z).toFixed(2) });
    }
    out.sort((a, b) => b.bite - a.bite);
    // how many actually reach the DRIVABLE surface, not just the margin
    const onRoad = out.filter((o) => o.lat - o.r < o.half).length;
    return { n: (t.trees ?? []).length, out, onRoad };
  });
  tot += r.n; bad += r.out.length;
  if (r.out.length) { dirty++; worstAll = Math.max(worstAll, r.out[0].bite); }
  const kinds = {};
  for (const o of r.out) kinds[o.kind] = (kinds[o.kind] ?? 0) + 1;
  console.log(`${r.out.length ? '••' : '  '} ${String(lv.id).padStart(2)} ${lv.name.padEnd(22)}`
    + `${String(r.n).padStart(5)} trees  `
    + (r.out.length
      ? `${r.out.length} INSIDE CLEARANCE (${Object.entries(kinds).map(([k, n]) => `${k}x${n}`).join(' ')})`
        + `, ${r.onRoad} ON THE DRIVABLE SURFACE, worst ${r.out[0].bite} u `
        + `(sample ${r.out[0].i}, trunk ${r.out[0].lat} u out, r ${r.out[0].r}, half ${r.out[0].half})`
      : 'all clear'));
}
console.log(`\n===== ${bad} of ${tot} trunks inside their clearance, on ${dirty} worlds; worst ${worstAll.toFixed(2)} u =====`);
await b.close();
