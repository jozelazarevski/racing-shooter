/* DOES THE ROAD RUN INSIDE MOUNTAINS, OR PAST THEM?
 *
 * Asked for directly: "change cape oliveto to run inside mountains." The
 * difference between those two things is the whole test, and it is not
 * rhetorical — the first attempt satisfied every obvious check and still put
 * the road on a plain:
 *
 *   a full ring massif           12 of 12 compass sectors held a peak
 *   ground standing over the road 0% of the lap, mean rise 4.9 u
 *
 * The control is what makes that damning rather than debatable. SUMMIT CLIMB
 * is an ALPINE world, and measured the same way it scores 0 walled flanks of
 * 156 at 0.8 u of mean rise. A massif is radial, so it can only close a closed
 * lap from the outside; nothing on this roster ran inside mountains until
 * `valleyWalls` was built for it.
 *
 * TWO LAWS, applied to every world in the family:
 *
 *   1. THE WORLD IS ENCLOSED. Of the flanks that are not simply another leg
 *      of the lap, the overwhelming majority must have ground standing well
 *      above the road within 300 u.
 *   2. THE MOUNTAINS ARE STILL GROUND, NOT A FENCE. Open-ground grade stays in
 *      the range the roster already drives. This is the law that stops law 1
 *      being satisfied by turning the verge into a cliff.
 *
 * And a CONTROL, because a coverage test that would pass on any world proves
 * nothing: OLIVE COAST — the same family, the same theme, no valley walls —
 * must still measure as open ground. If this ever passes, the terrain change
 * has leaked onto worlds that never asked for it.
 *
 *   node tests/test-mountainrun.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS  ' + msg); }
  else { fail++; console.log('FAIL  ' + msg + (extra ? '  ' + extra : '')); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

const measure = async (lv) => {
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  page.setDefaultTimeout(600000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  await page.goto(`${BASE}/?level=${lv}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const R = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;

    // A FLANK THAT IS ANOTHER LEG OF THE LAP CANNOT BE A MOUNTAIN. Counting it
    // as open punishes a world for being a closed circuit rather than for
    // being flat — measured, counting road flanks as misses put CAPE OLIVETO
    // at 16% when 92% of the flanks that COULD be mountain already were, and
    // would have sent someone tuning terrain that was already right.
    let walled = 0, open = 0, road = 0, sumRise = 0, maxRise = 0;
    for (let i = 0; i < N; i += 5) {
      const c = t.center[i];
      for (const side of [1, -1]) {
        let best = 0, isRoad = false;
        for (const d of [120, 220, 300]) {
          const p = t.pointAt(i, d * side);
          if (t._nearestSample(p.x, p.z).d < d * 0.45) isRoad = true;
          best = Math.max(best, t.terrainHeight(p.x, p.z) - c.y);
        }
        if (isRoad) { road++; continue; }
        if (best > 25) walled++; else open++;
        sumRise += best;
        if (best > maxRise) maxRise = best;
      }
    }

    // grade of the open ground, on a 12 u baseline clear of the corridor
    const grades = [];
    for (let i = 0; i < N; i += 11) {
      for (const side of [1, -1]) {
        for (const d of [90, 160, 260]) {
          const p = t.pointAt(i, d * side), q = t.pointAt(i, (d + 12) * side);
          grades.push(Math.abs(t.terrainHeight(q.x, q.z) - t.terrainHeight(p.x, p.z)) / 12);
        }
      }
    }
    grades.sort((a, b) => a - b);

    return { name: t.level?.name, walled, open, road,
      pct: walled + open ? Math.round((walled / (walled + open)) * 100) : 0,
      meanRise: +(sumRise / Math.max(1, walled + open)).toFixed(1),
      maxRise: Math.round(maxRise),
      gradeP90: Math.round((grades[Math.floor(grades.length * 0.9)] ?? 0) * 100),
      coast: !!t.T.coast };
  });
  await page.close();
  return { ...R, errors };
};

// ---- THE IN-MOUNTAIN WORLDS ----------------------------------------------
// Each row is [level, name, flank floor %, mean-rise floor u, grade ceiling %],
// and every threshold is set just under (or over) THAT WORLD'S measurement, so
// a regression fails and a tuning nudge does not. The measured figures are in
// the comment beside each row; if a change moves one, move the threshold with
// it rather than widening the loosest number for everybody.
//
// The grade ceilings differ ON PURPOSE, because the valley shapes do. GRANITE
// NARROWS buys its slot with `run: 130`, and a close wall is a steep wall —
// 69% at p90 against TIMBER GORGE's 42%. Holding all three to one number would
// either forbid the tight world or excuse the shallow one. For scale, SUMMIT
// CLIMB's open ground already measures 61% p90 and 190% max.
const WORLDS = [
  [62, 'CAPE OLIVETO',    78, 45, 62],   // measured 92%, 68.6 u, p90 50%
  [65, 'GRANITE NARROWS', 92, 55, 78],   // measured 100% (180 walled, 0 open), 66.0 u, p90 69%
  [66, 'GLACIER COL',     88, 62, 70],   // measured 96%, 76.5 u, p90 61%
  [67, 'TIMBER GORGE',    88, 55, 52],   // measured 96%, 65.1 u, p90 42%
];

for (const [lv, name, floor, riseFloor, gradeCap] of WORLDS) {
  const M = await measure(lv);
  ok(!M.errors.length, `${name} builds without a page error`, M.errors[0] ?? '');
  ok(!M.coast, `${name} has no coast — it is inland`);

  // LAW 1 — the flanks that COULD be mountain are.
  ok(M.pct >= floor,
    `${name}: ${M.pct}% of its non-road flanks have ground standing over the road (floor ${floor}%)`,
    `${M.walled} walled, ${M.open} open, ${M.road} excluded as another leg`);
  ok(M.meanRise >= riseFloor,
    `${name}: mean rise beside the road is ${M.meanRise} u (floor ${riseFloor})`, `max ${M.maxRise} u`);

  // LAW 2 — the mountains are still ground, not a fence. This is the law that
  // stops law 1 being satisfied by turning the verge into a cliff.
  ok(M.gradeP90 <= gradeCap,
    `${name}: open-ground grade p90 is ${M.gradeP90}% (ceiling ${gradeCap}%)`);
}

// ---- THE CONTROL: the same family, the same theme, no valley walls --------
// A coverage test that would pass on any world proves nothing.
const C = await measure(29);
ok(C.pct <= 10,
  `OLIVE COAST (control): still open ground, ${C.pct}% walled flanks (ceiling 10%)`,
  `${C.walled} walled, ${C.open} open — if this rises, the terrain change has leaked`);

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
