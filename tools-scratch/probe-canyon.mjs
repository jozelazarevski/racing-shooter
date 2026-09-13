/* CANYON RUN cleanup probe: find everything that pokes ABOVE the carriageway
 * deck inside the drivable width — terrain shards, cliff wedges, solids —
 * and everything solid overlapping the road corridor. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LVL = process.env.LVL ?? 4;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 180000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const shards = [];      // terrain above the deck inside the drivable width
  const rocks = [];       // solids overlapping the carriageway, base near deck
  for (let i = 0; i < N; i++) {
    const c = t.center[i], n = t.nrm[i];
    const half = t.widthAt?.(i) ?? 9;
    let worst = 0, worstLat = 0;
    for (let lat = -half; lat <= half; lat += 2) {
      const x = c.x + n.x * lat, z = c.z + n.z * lat;
      const th = t.terrainHeight(x, z);
      const deck = t.groundHeightAt ? t.groundHeightAt(i, lat) : c.y;
      const ex = th - deck;
      if (ex > worst) { worst = ex; worstLat = lat; }
    }
    if (worst > 0.6) shards.push({ i, ex: +worst.toFixed(2), lat: worstLat });
  }
  for (const s of t.solids ?? []) {
    // nearest sample; overlap if the circle crosses inside the drivable width
    const gi = t.nearestIndex ? t.nearestIndex(s, null) : 0;
    const c = t.center[gi];
    const d = Math.hypot(s.x - c.x, s.z - c.z);
    const half = t.widthAt?.(gi) ?? 9;
    if (d - (s.r ?? 0) < half - 1 && Math.abs((s.y ?? c.y) - c.y) < 8) {
      rocks.push({ i: gi, mat: s.mat, r: +(s.r ?? 0).toFixed(1), d: +d.toFixed(1) });
    }
  }
  // cluster shards into runs for readability
  const runs = [];
  for (const s of shards) {
    const last = runs[runs.length - 1];
    if (last && s.i - last.end <= 3) { last.end = s.i; last.ex = Math.max(last.ex, s.ex); }
    else runs.push({ start: s.i, end: s.i, ex: s.ex });
  }
  return { N, world: g.level?.name, shardSamples: shards.length, runs: runs.slice(0, 30), rocks: rocks.slice(0, 30) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
