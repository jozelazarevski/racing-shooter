/* How often does the r306 gorge lift engage per world — current one-sided
 * trigger (+1) vs a true-dip trigger (high ground BOTH sides, +6)? */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
for (const lvl of [1, 4, 6, 69]) {
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    let oneSided = 0, twoSided = 0, maxLift = 0;
    for (let i = 0; i < N; i++) {
      const y = t.center[i].y;
      let rim = -Infinity, ahead = -Infinity, behind = -Infinity;
      for (let q = -12; q <= 12; q += 3) {
        const cy = t.center[(i + q + N) % N].y;
        rim = Math.max(rim, cy);
        if (q >= 3) ahead = Math.max(ahead, cy);
        if (q <= -3) behind = Math.max(behind, cy);
      }
      if (rim > y + 1) { oneSided++; maxLift = Math.max(maxLift, rim - y); }
      if (Math.min(ahead, behind) > y + 6) twoSided++;
    }
    return { world: window.__game.level?.name, N,
      oneSidedPct: +(100 * oneSided / N).toFixed(0),
      twoSidedPct: +(100 * twoSided / N).toFixed(1), maxLift: +maxLift.toFixed(1) };
  });
  console.log(JSON.stringify(r));
}
await browser.close();
