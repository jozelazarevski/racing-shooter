/* WHAT DOES A 5x ROAD DO TO EVERYTHING PLACED AGAINST A 1x ROAD?
 * Trees, props and barriers were all sited to clear a 9 u half-width. At 45 u
 * the carriageway has swallowed whatever stood between. Ask the game's own
 * collider lists how much is now INSIDE the drivable width. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await page.evaluate(() => {
    const t = window.__game.track;
    // ASK THE SAME QUESTION THE BUILDER ASKS. `_distToTrack` searches the
    // WHOLE lap; `lateralOffset` at the nearest index measures along one
    // sample's normal and disagrees with it on a curve — the more so the wider
    // the road. Measuring the offset way reported 179 trees in the road here;
    // the builder's own test is the one that decides whether they are.
    const inRoad = (x, z, r = 0) => {
      const i = t.nearestIndex({ x, y: 0, z, isVector3: true });
      const half = t.widthAt ? t.widthAt(i) : 9;
      return (half + r) - t._distToTrack(x, z);
    };
    let trees = 0, worstTree = 0;
    for (const tr of (t.trees ?? [])) {
      const d = inRoad(tr.x, tr.z, tr.r ?? 0.6);
      if (d > 0) { trees++; if (d > worstTree) worstTree = d; }
    }
    let bars = 0, worstBar = 0;
    for (const q of (t.barriers ?? [])) {
      const d = inRoad((q.x1 + q.x2) / 2, (q.z1 + q.z2) / 2);
      if (d > 0) { bars++; if (d > worstBar) worstBar = d; }
    }
    let solids = 0;
    for (const s of (t.solids ?? [])) {
      if (!s || s.halfX === undefined) continue;
      if (inRoad(s.x, s.z, Math.max(s.halfX, s.halfZ)) > 0) solids++;
    }
    return { name: t.level?.name, half: +(t.widthAt ? t.widthAt(0) : 9).toFixed(1),
      trees, worstTree: +worstTree.toFixed(1), totalTrees: (t.trees ?? []).length,
      bars, worstBar: +worstBar.toFixed(1), totalBars: (t.barriers ?? []).length,
      solids, totalSolids: (t.solids ?? []).length };
  });
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(16)} half-width ${r.half} u`);
  console.log(`     trees inside the carriageway ${r.trees}/${r.totalTrees}  (deepest ${r.worstTree} u)`);
  console.log(`     barriers inside it           ${r.bars}/${r.totalBars}  (deepest ${r.worstBar} u)`);
  console.log(`     solids inside it             ${r.solids}/${r.totalSolids}`);
}
await b.close();
