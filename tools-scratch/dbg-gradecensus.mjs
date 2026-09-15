import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const su = Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z);
  const grades = [];
  let ymin = 1e9, ymax = -1e9;
  for (let i = 0; i < N; i++) {
    const a = t.center[i], b = t.center[(i + 1) % N];
    const run = Math.hypot(b.x - a.x, b.z - a.z);
    if (run > 0.1) grades.push((b.y - a.y) / run);
    ymin = Math.min(ymin, a.y); ymax = Math.max(ymax, a.y);
  }
  grades.sort((x, y) => Math.abs(y) - Math.abs(x));
  const abs = grades.map(Math.abs).sort((x, y) => x - y);
  const pick = (q) => +abs[Math.floor(q * (abs.length - 1))].toFixed(3);
  const over16 = abs.filter(v => v > 0.16).length, over30 = abs.filter(v => v > 0.30).length;
  return { name: g.level?.name, N, segLen: +su.toFixed(2),
    elevRange: +(ymax - ymin).toFixed(0),
    p50: pick(0.5), p90: pick(0.9), p99: pick(0.99), max: pick(1),
    pctOver16: +(100 * over16 / abs.length).toFixed(1),
    pctOver30: +(100 * over30 / abs.length).toFixed(1),
    slopeAt220: +(t.slopeAt?.(220) ?? -9).toFixed(3) };
});
console.log(JSON.stringify(r));
await browser.close();
