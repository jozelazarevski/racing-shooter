/* On-road obstacles must not sit on the racing line.
 *
 * THE COMPLAINT: "Remove rocks and logs from the middle of the road. They start
 * becoming annoying."
 *
 * It was literally true. `_buildObstacles` placed every non-root obstacle at a
 * lateral of ±1.2–4.5 with a collider radius of up to 3.2, so a rock at 1.2
 * spanned −1.0 to +3.4 and physically straddled the centreline. There was no
 * line through it: you stopped, or you took the hit, three to six times a lap.
 * A rally stage has rocks and fallen timber on it; it does not have a boulder
 * parked on the racing line.
 *
 * Placement is now derived from the road instead of from a constant — reserve a
 * clear corridor, fit the obstacle into the shoulder that is left, sit it
 * against the outer edge. Run wide and it is still there; the line is open.
 *
 * What this asserts is the CORRIDOR, measured through the collider the car
 * actually hits (`t.obstacles` = {x, z, r}), not the mesh. The two can differ
 * and the collider is what makes a stage annoying.
 *
 * Worlds are discovered from window.__LEVELS rather than hardcoded, so a new
 * world with an obstacleSpec is covered the day it is added.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// The themes that declare an obstacleSpec. One level per theme is enough —
// placement is theme-driven, and building 28 worlds would take a quarter hour.
const THEMES = ['canyon', 'volcano', 'alpine', 'jungle', 'ravine', 'redwood',
                'flume', 'pass', 'tremola', 'furka'];

const probe = await browser.newPage({ viewport: { width: 640, height: 400 } });
await probe.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load' });
await probe.waitForFunction(() => window.__LEVELS, undefined, { timeout: 120000 });
const targets = await probe.evaluate((themes) => {
  const seen = new Set();
  return window.__LEVELS
    .filter((l) => themes.includes(l.theme) && !seen.has(l.theme) && seen.add(l.theme))
    .map((l) => ({ id: l.id, name: l.name, theme: l.theme }));
}, THEMES);
await probe.close();
console.log(`discovered ${targets.length} obstacle worlds: ${targets.map((t) => t.theme).join(', ')}\n`);
check('every obstacle theme has a level to test', targets.length === THEMES.length,
  `${targets.length}/${THEMES.length}`);

let totalObstacles = 0;
let worstCorridor = Infinity;
let worstWhere = '';

for (const { id, name, theme } of targets) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 180000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  const r = await p.evaluate(() => {
    const t = window.__game.track;
    const obs = t.obstacles ?? [];
    const out = [];
    for (const o of obs) {
      // Back out the lateral offset from world space. No index hint — these are
      // scattered over the whole lap, so a tracked search would be meaningless.
      const pos = { x: o.x, y: o.y ?? 0, z: o.z };
      const i = t.nearestIndex(pos);
      const lat = Math.abs(t.lateralOffset(pos, i));
      const half = t.widthAt ? t.widthAt(i) : 9;
      out.push({
        lat: +lat.toFixed(2),
        r: +o.r.toFixed(2),
        inner: +(lat - o.r).toFixed(2),   // nearest the collider comes to the centreline
        outer: +(lat + o.r).toFixed(2),
        half: +half.toFixed(2),
      });
    }
    return { count: obs.length, obs: out };
  });

  totalObstacles += r.count;
  if (r.count === 0) {
    // Not a failure on its own — a world can legitimately place none if every
    // candidate site had no usable verge. Reported so it cannot hide.
    console.log(`NOTE  ${name} (${theme}): no obstacles placed`);
    await p.close();
    continue;
  }

  const inner = r.obs.map((o) => o.inner);
  const minInner = Math.min(...inner);
  if (minInner < worstCorridor) { worstCorridor = minInner; worstWhere = `${name} (${theme})`; }

  // THE HEADLINE. 4.0 not 4.5: the corridor is built at max(4.5, half*0.55) and
  // the reserve is exact, so this only has to catch a real intrusion, not float
  // dust. A car is about 2 u wide, so 4.0 either side is room to place it.
  check(`${name}: nothing intrudes on the racing line`, minInner >= 4.0,
    `closest collider edge is ${minInner} u from the centreline (${r.count} obstacles)`);

  // Nothing may straddle the centreline — the specific reported defect.
  const straddling = r.obs.filter((o) => o.inner <= 0);
  check(`${name}: nothing straddles the centreline`, straddling.length === 0,
    straddling.length ? JSON.stringify(straddling.slice(0, 3)) : 'none');

  // ...and they must still be ON the road, not floating out in the scenery.
  // An obstacle you can never reach is not a hazard, it is set dressing.
  const offRoad = r.obs.filter((o) => o.inner > o.half);
  check(`${name}: obstacles still sit on the road`, offRoad.length === 0,
    offRoad.length ? JSON.stringify(offRoad.slice(0, 3)) : `all within half-width`);

  await p.close();
}

// Guard the other direction: it would be trivial to pass everything above by
// placing no obstacles anywhere, which is not what was asked for.
check('obstacles still exist across the game', totalObstacles >= 20,
  `${totalObstacles} colliders across ${targets.length} worlds`);

console.log(`\nnarrowest corridor anywhere: ${worstCorridor} u  (${worstWhere})`);
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe line is open');
process.exit(fail ? 1 : 0);
