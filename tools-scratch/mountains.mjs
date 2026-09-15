/* DOES THE ROAD RUN INSIDE MOUNTAINS, OR PAST THEM?
 *
 * "Ringed by peaks" is not "has a massif" — a fan of nine peaks across one
 * horizon is a picture of mountains you drive alongside. The question is
 * whether, standing on the road, there is high ground in EVERY direction.
 *
 * So: sample the massif's placed instances, bucket them by compass bearing
 * from the world centre, and report how many of the twelve 30-degree sectors
 * hold a real peak. Then walk the lap and ask how much of the terrain within
 * 300 u of each station stands above the road — the "am I in a valley" test,
 * which a flat bowl with a distant skyline fails.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
for (const id of process.argv.slice(2).map(Number)) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    const THREE = window.THREE_NS;

    // ---- where did the massif peaks actually END UP? -------------------
    // Read the instance matrices, not the spec: the builder walks peaks clear
    // of the road and drops the ones the lap encircles, so the spec is a
    // request and the matrices are the answer.
    const sectors = new Array(12).fill(0);
    let placed = 0, dropped = 0, nearest = 1e9;
    t.group.traverse((o) => {
      if (!o.isInstancedMesh || !/massif|crag|peak/i.test(o.name || '')) return;
      for (let k = 0; k < o.count; k++) {
        const e = o.instanceMatrix.array, off = k * 16;
        const x = e[off + 12], y = e[off + 13], z = e[off + 14];
        if (y < -1000) { dropped++; continue; }      // parked out of sight
        placed++;
        const a = Math.atan2(z, x);
        sectors[Math.floor(((a + Math.PI) / (Math.PI * 2)) * 12) % 12]++;
        const s = t._nearestSample ? t._nearestSample(x, z) : null;
        if (s && s.d < nearest) nearest = s.d;
      }
    });

    // ---- is the road IN something, or ON something? ---------------------
    // For each station, look outward on both sides at 120/220/300 u and ask
    // how much higher the ground is than the road. A valley floor between
    // ridges answers yes on both sides; a plain with a distant skyline does
    // not.
    // A SIDE THAT IS ANOTHER LEG OF THE LAP CANNOT BE A MOUNTAIN, and counting
    // it as a miss punishes the world for being a closed circuit rather than
    // for being flat. So each side is classified first: if the sample point is
    // much nearer to SOME road sample than its own lateral offset, that side
    // is road, and it is excluded from the enclosure question instead of
    // failing it. Report how many were excluded, so the denominator is visible.
    let enclosed = 0, sampled = 0, sumRise = 0, maxRise = 0;
    let sidesWalled = 0, sidesOpen = 0, sidesRoad = 0;
    for (let i = 0; i < N; i += 5) {
      const c = t.center[i];
      let bothSides = 0, freeSides = 0;
      for (const side of [1, -1]) {
        let best = 0, isRoad = false;
        for (const d of [120, 220, 300]) {
          const p = t.pointAt(i, d * side);
          if (t._nearestSample && t._nearestSample(p.x, p.z).d < d * 0.45) isRoad = true;
          best = Math.max(best, t.terrainHeight(p.x, p.z) - c.y);
        }
        if (isRoad) { sidesRoad++; continue; }
        freeSides++;
        if (best > 25) { bothSides++; sidesWalled++; } else sidesOpen++;
        sumRise += best;
        if (best > maxRise) maxRise = best;
      }
      sampled++;
      if (freeSides > 0 && bothSides === freeSides) enclosed++;
    }
    const riseN = sidesWalled + sidesOpen;

    // ---- IS THE GROUND STILL DRIVEABLE? ---------------------------------
    // A mountainside you cannot climb out of is a trap, and raising the open
    // ground raises its GRADE with it. Sample the slope on a 12 u baseline
    // across the open field, away from the road corridor.
    let gMax = 0; const grades = [];
    for (let i = 0; i < N; i += 11) {
      for (const side of [1, -1]) {
        for (const d of [90, 160, 260]) {
          const p = t.pointAt(i, d * side), q = t.pointAt(i, (d + 12) * side);
          const g = Math.abs(t.terrainHeight(q.x, q.z) - t.terrainHeight(p.x, p.z)) / 12;
          grades.push(g); if (g > gMax) gMax = g;
        }
      }
    }
    grades.sort((a, b) => a - b);
    const gp90 = grades[Math.floor(grades.length * 0.9)] ?? 0;

    return { name: t.level?.name, coast: !!t.T.coast, tunnels: (t._tunnels ?? []).length,
      gradeP90: Math.round(gp90 * 100), gradeMax: Math.round(gMax * 100),
      placed, dropped, sectors, nearest: Math.round(nearest),
      sectorsFilled: sectors.filter((v) => v > 0).length,
      enclosedPct: Math.round((enclosed / sampled) * 100),
      sidesWalled, sidesOpen, sidesRoad,
      avgRise: +(sumRise / Math.max(1, riseN)).toFixed(1), maxRise: Math.round(maxRise),
      relief: +(Math.max(...t.center.map((c) => c.y)) - Math.min(...t.center.map((c) => c.y))).toFixed(1) };
  });
  console.log(`\n${id} ${r.name}   coast ${r.coast ? 'YES' : 'no'}   bores ${r.tunnels}   road relief ${r.relief} u`);
  console.log(`   massif peaks placed ${r.placed}, dropped ${r.dropped}, nearest ${r.nearest} u from the road`);
  console.log(`   compass sectors with a peak: ${r.sectorsFilled}/12   ${JSON.stringify(r.sectors)}`);
  console.log(`   lap enclosed on every NON-ROAD side (>25 u up within 300 u): ${r.enclosedPct}%   `
    + `mean rise ${r.avgRise} u, max ${r.maxRise} u`);
  console.log(`   flanks: ${r.sidesWalled} walled, ${r.sidesOpen} open, `
    + `${r.sidesRoad} excluded as another leg of the lap`);
  console.log(`   open-ground grade p90 ${r.gradeP90}%, max ${r.gradeMax}%  `
    + `(the massif tops out ~15%; a car stops pulling well before 60%)`);
  for (const e of errs.slice(0, 2)) console.log('   PAGEERROR: ' + e);
}
await b.close();
