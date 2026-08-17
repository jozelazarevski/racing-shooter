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
 * TWO LAWS:
 *
 *   1. CAPE OLIVETO IS ENCLOSED. Of the flanks that are not simply another leg
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

// ---- CAPE OLIVETO: the world that was asked to run inside mountains -------
const M = await measure(62);
ok(!M.errors.length, 'CAPE OLIVETO builds without a page error', M.errors[0] ?? '');
ok(!M.coast, 'CAPE OLIVETO has no coast — it is inland now');

// LAW 1. Measured 92% — 188 walled flanks against 17 open, with 155 excluded
// as another leg of the lap. (Counted per STATION rather than per flank the
// same world scores 86%; both are honest, and this asserts the per-flank one.)
// The floor sits under that so a regression fails and a tuning nudge does not.
ok(M.pct >= 78,
  `CAPE OLIVETO: ${M.pct}% of its non-road flanks have ground standing over the road (floor 78%)`,
  `${M.walled} walled, ${M.open} open, ${M.road} excluded as another leg`);
ok(M.meanRise >= 45,
  `CAPE OLIVETO: mean rise beside the road is ${M.meanRise} u (floor 45)`, `max ${M.maxRise} u`);

// LAW 2. Measured p90 50%. SUMMIT CLIMB's open ground already runs at 61% and
// the rim wall is deliberately ~100%, so the ceiling sits between them: steep
// enough to read as mountain, not so steep the flank becomes an invisible
// fence that happens to be made of terrain.
ok(M.gradeP90 <= 62,
  `CAPE OLIVETO: open-ground grade p90 is ${M.gradeP90}% (ceiling 62%)`);

// ---- THE CONTROL: the same family, the same theme, no valley walls --------
// A coverage test that would pass on any world proves nothing.
const C = await measure(29);
ok(C.pct <= 10,
  `OLIVE COAST (control): still open ground, ${C.pct}% walled flanks (ceiling 10%)`,
  `${C.walled} walled, ${C.open} open — if this rises, the terrain change has leaked`);

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
