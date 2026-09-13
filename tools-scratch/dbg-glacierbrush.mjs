/* K-15 A/B: is r410's mid-ring registration what starved GLACIER COL's F7
 * runway of a brush-free corridor?
 *
 * The gate line is "66 vs 190 km/h = 35%, NO brush-free corridor (best 1
 * brushed samples)". The waiver it hides behind was written for a 52-54%
 * thrust-equilibrium read and records GLACIER COL at 89% on the r403 base,
 * so 35% is a different animal and needs attributing before r410 ships.
 *
 * No rebuild needed to attribute it. r399's underbrush drag fires on three
 * registered trees within 8 u, so the question is simply: in the belt the
 * runway search walks, how many registered trees are there, and how many of
 * them are mid-ring entries that only exist because r410 registered them?
 * The mid ring is identifiable by its mesh: it is the only ring built with
 * reg=true, so its entries share a meshes[0] that no earlier ring uses.
 *
 *   node tools-scratch/dbg-glacierbrush.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1',
  { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center?.length, undefined, { timeout: 600000 });

console.log(JSON.stringify(await p.evaluate(() => {
  const t = window.__game.track;
  const N = t.center.length;
  // the belt the runway search can reach: just off the drivable edge out to
  // the width r399's brush test cares about (3 trees within 8 u)
  const IN = 2, OUT = 26;
  const byMesh = new Map();          // mesh uuid -> count in the belt
  let inBelt = 0;
  for (const c of t.camTrees ?? []) {
    if (!(c.r > 0)) continue;
    const d = t._distToTrack(c.x, c.z);
    const half = 6;                  // furka half-width, near enough for a belt
    if (d < half + IN || d > half + OUT) continue;
    inBelt++;
    const key = c.meshes?.[0]?.uuid ?? 'none';
    byMesh.set(key, (byMesh.get(key) ?? 0) + 1);
  }
  // brush density along the lap: how many stations have >=3 registered trees
  // within 8 u of a point just off the edge — the r399 trigger, sampled
  let brushed = 0, sampled = 0;
  for (let i = 0; i < N; i += Math.max(1, Math.round(N / 400))) {
    const q = t.pointAt(i, 10);
    let n = 0;
    for (const c of t.camTreesNear ? t.camTreesNear(q.x, q.z) : []) {
      if (!(c.r > 0)) continue;
      if (Math.hypot(c.x - q.x, c.z - q.z) < 8) n++;
      if (n >= 3) break;
    }
    sampled++; if (n >= 3) brushed++;
  }
  return {
    world: t.level?.name, camTrees: (t.camTrees ?? []).length,
    ghostsPruned: t._ghostTreesPruned ?? null,
    inBelt, meshes: [...byMesh.entries()].map(([k, v]) => [k.slice(0, 8), v])
      .sort((a, c) => c[1] - a[1]).slice(0, 6),
    brushedStations: brushed, sampled,
    brushedPct: +(100 * brushed / Math.max(1, sampled)).toFixed(1),
  };
}, undefined)));
await b.close();
