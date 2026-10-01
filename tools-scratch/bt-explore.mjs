/* bankTuck phase, step 0: what does a banked world look like from inside?
 * Dumps the banked-station runs, widths, flags and the road ribbon layout
 * for one level so the census probe set can be matched to the review's. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? 'C:/tmp/cleanchk/chrome.exe',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);
const t0 = Date.now();
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const b9 = t._bank9;
  const banked = [];
  if (b9) for (let i = 0; i < N; i++) if (b9[i]) banked.push(i);
  const runs = [];
  for (const i of banked) {
    const last = runs[runs.length - 1];
    if (last && last[1] === i - 1) last[1] = i; else runs.push([i, i]);
  }
  const set = new Set();
  for (const i of banked) for (let k = -2; k <= 2; k++) set.add((i + k + N) % N);
  const road = t.group.children.find((m) => m.name === 'road');
  const T = t.T;
  return {
    name: g.level?.name, N, segLen: t.segLen, nBanked: banked.length, runs,
    union2: set.size,
    w: [475, 476, 477, 479, 256, 509].map((i) => ({ i, wA: +t.widthAt(i).toFixed(4), v: b9 ? +b9[i].toFixed(4) : 0 })),
    flags: { retainingWalls: !!T.retainingWalls, shelfRoad: !!T.shelfRoad, tunnels: t._tunnels?.length ?? 0,
      gorge: !!t._gorge, jumpGorges: t._jumpGorges?.length ?? 0, river: !!t._river, coast: !!T.coast,
      mtn: !!t._mtnSide, delta: !!t._delta, blend: T.blend ?? null, patchHalf: t._patchHalf },
    roadVerts: road ? road.geometry.attributes.position.count : null,
    lattice: t._meshLattice ? t._meshLattice.size : null,
    driving: window.__DRIVING?.patch02b ?? null,
  };
});
console.log(JSON.stringify(r, null, 1));
console.log('boot+eval ms', Date.now() - t0);
await b.close();
