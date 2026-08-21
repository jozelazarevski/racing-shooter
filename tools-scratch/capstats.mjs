/* WHERE DO TWO LEGS OF THE SAME LAP SHARE A WALL?
 *
 * `_buildCliffCaps` walks each station's wall outward and stops it where the
 * FACE would reach another part of the lap. Its own note says a cap that lands
 * on the floor means a lap that doubles back inside its own verge, and that no
 * setback can fix that — the wall of one leg is then standing in the other
 * leg's field of view, which is what a jumble of interpenetrating rock slabs
 * with no road out looks like from above.
 *
 * So read the statistic the builder already publishes, for every cliff-walled
 * world, plus WHERE the floored stations are — a run of them in one place is a
 * pocket, scattered singles are cosmetic.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '4,7,10,18,27,44').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
for (const id of IDS) {
  await p.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length;
    if (!t.T.cliffWalls) return { name: g.level?.name, skip: 1 };
    const CLEAR = 2.3;
    // which stations are floored, and how close the OTHER leg actually is
    const floored = [];
    for (let j = 0; j < N; j++) {
      for (const side of [1, -1]) {
        const P = t._cliffProfile(j, side);
        const fl = t.widthAt(j) + CLEAR;
        if (P.base <= fl + 1e-6) floored.push(j);
      }
    }
    // group into runs
    const runs = [];
    let cur = null;
    for (const j of [...new Set(floored)].sort((a, x) => a - x)) {
      if (cur && j - cur.to <= 3) { cur.to = j; cur.n++; }
      else { cur = { from: j, to: j, n: 1 }; runs.push(cur); }
    }
    // and the worst pinch: nearest other leg to any station
    let worst = Infinity, worstAt = -1;
    for (let j = 0; j < N; j += 2) {
      const c = t.center[j];
      for (let k = 0; k < N; k += 2) {
        const lap = Math.min((j - k + N) % N, (k - j + N) % N);
        if (lap < 60) continue;
        const d = Math.hypot(c.x - t.center[k].x, c.z - t.center[k].z);
        if (d < worst) { worst = d; worstAt = j; }
      }
    }
    return { name: g.level?.name, cap: t._cliffCapped,
      flooredRuns: runs.filter((x) => x.n >= 2).sort((a, x) => x.n - a.n).slice(0, 5),
      nearestOtherLeg: +worst.toFixed(1), at: worstAt,
      roadHalf: +t.widthAt(0).toFixed(1) };
  });
  if (r.skip) continue;
  console.log(`L${String(id).padStart(2)} ${String(r.name).padEnd(20)} `
    + `capped ${String(r.cap.sides).padStart(4)}/${r.cap.of} floored ${String(r.cap.floored).padStart(4)} `
    + `| nearest other leg ${String(r.nearestOtherLeg).padStart(6)} u at ${r.at} `
    + `| runs ${JSON.stringify(r.flooredRuns)}`);
}
await b.close();
