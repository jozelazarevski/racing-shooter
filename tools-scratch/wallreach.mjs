/* HOW FAR OUT CAN THE CAR ACTUALLY GET, AND IS THE ROCK THERE?
 *
 * The clamp fires at `widthAt + 0.55` only when `_cliffProfile(i, side).h`
 * exceeds 2.5 — the low berm at the start bowl is deliberately open so a
 * roamer can drive out. But the guard that stops the clamp dragging them back
 * THROUGH the rock is `if (freeRoam)`, and a race is not free roam. So in a
 * race a car that leaves through the berm and drives on is, once the wall
 * rises, pulled back across a solid face.
 *
 * Measure it without driving: for every station, is the wall low enough to
 * pass (h <= 2.5)? And where it is not, how far does the visible face reach
 * beyond the clamp line — i.e. how much solid rock is there between where the
 * car is allowed to be and where the car can find itself?
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '18').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
for (const id of IDS) {
  await p.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length;
    if (!t.T.cliffWalls) return { name: g.level?.name, skip: 'no cliff walls' };
    let openSides = 0, worstGap = 0, worstAt = -1, insideFace = 0;
    const openRuns = [];
    let run = null;
    for (let j = 0; j < N; j++) {
      const half = t.widthAt(j);
      const clamp = half + 0.55;
      for (const side of [1, -1]) {
        const P = t._cliffProfile(j, side);
        if (P.h <= 2.5) { openSides++; continue; }
        // solid rock stands from `base` outward; the clamp holds the car at
        // `clamp`. Rock inside the clamp line is rock the car is held inside.
        if (P.base < clamp) insideFace++;
        const gap = P.base - clamp;                 // reachable-but-walled band
        if (gap > worstGap) { worstGap = gap; worstAt = j; }
      }
      const anyOpen = t._cliffProfile(j, 1).h <= 2.5 || t._cliffProfile(j, -1).h <= 2.5;
      if (anyOpen) { if (!run) { run = { from: j, n: 0 }; openRuns.push(run); } run.n++; }
      else run = null;
    }
    return { name: g.level?.name, N, openSides, of: N * 2,
      openRuns: openRuns.filter((x) => x.n > 2),
      insideFace, worstGap: +worstGap.toFixed(2), worstAt,
      cap: t._cliffCapped };
  });
  console.log(`L${id} ${JSON.stringify(r)}`);
}
await b.close();
