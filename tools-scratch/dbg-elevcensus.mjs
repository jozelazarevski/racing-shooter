/* Elevation census: per world, the lap's height range, the longest sustained
 * climb (consecutive stations gaining height), whether that climb is STRAIGHT
 * (mean circumcircle R over the run > 120), max grade, and how many times the
 * profile changes direction (undulation count). */
import { chromium } from 'playwright-core';
const LVLS = (process.env.LVLS ?? Array.from({ length: 78 }, (_, i) => i + 1).join(','))
  .split(',').map(Number);
for (const LVL of LVLS) {
  let browser;
  try {
    browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
      args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
    const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
    p.setDefaultTimeout(240000);
    await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
    await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
    const r = await p.evaluate(() => {
      const t = window.__game.track, N = t.center.length, segL = t.segLen;
      const K = Math.max(3, Math.round(30 / segL));
      const radAt = (i) => {
        const a = t.center[(i - K + N) % N], b = t.center[i], c = t.center[(i + K) % N];
        const cross = (b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x);
        if (Math.abs(cross) < 1e-6) return 1e9;
        return (Math.hypot(b.x - a.x, b.z - a.z) * Math.hypot(c.x - b.x, c.z - b.z)
          * Math.hypot(c.x - a.x, c.z - a.z)) / (2 * Math.abs(cross));
      };
      let lo = 1e9, hi = -1e9, maxGrade = 0;
      for (let i = 0; i < N; i++) {
        const y = t.center[i].y;
        if (y < lo) lo = y; if (y > hi) hi = y;
        const g = Math.abs(t.center[(i + 1) % N].y - y) / Math.max(1, segL);
        if (g > maxGrade) maxGrade = g;
      }
      // smoothed direction over 8 stations; count sign flips and longest climb
      const dir = new Int8Array(N);
      for (let i = 0; i < N; i++) {
        const d = t.center[(i + 8) % N].y - t.center[i].y;
        dir[i] = d > 1.5 ? 1 : d < -1.5 ? -1 : 0;
      }
      let flips = 0, last = 0;
      for (let i = 0; i < N; i++) { if (dir[i] && dir[i] !== last) { if (last) flips++; last = dir[i]; } }
      let bestRun = 0, bestStart = 0, run = 0, start = 0;
      for (let i = 0; i < 2 * N; i++) {
        const j = i % N;
        if (dir[j] === 1) { if (!run) start = j; run++; if (run > bestRun) { bestRun = run; bestStart = start; } }
        else run = 0;
      }
      let straightSum = 0, cnt = 0, gain = 0;
      for (let k = 0; k < bestRun; k++) {
        const j = (bestStart + k) % N;
        straightSum += Math.min(400, radAt(j)); cnt++;
        gain += Math.max(0, t.center[(j + 1) % N].y - t.center[j].y);
      }
      return { world: window.__game.level?.name,
        range: Math.round(hi - lo), maxGradePct: +(maxGrade * 100).toFixed(1),
        climbLenU: Math.round(bestRun * segL), climbGain: Math.round(gain),
        climbMeanR: cnt ? Math.round(straightSum / cnt) : 0, undulations: flips };
    });
    console.log(LVL, JSON.stringify(r));
  } catch (e) { console.log(LVL, 'ERR', String(e).slice(0, 90)); }
  try { await browser?.close(); } catch {}
}
