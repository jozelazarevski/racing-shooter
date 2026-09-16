import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const worst = [];
  for (let i = 0; i < N; i++) {
    const a = t.center[i], b = t.center[(i + 1) % N];
    const run = Math.hypot(b.x - a.x, b.z - a.z);
    if (run > 0.1) worst.push({ i, gr: +((b.y - a.y) / run).toFixed(3), run: +run.toFixed(1) });
  }
  worst.sort((x, y) => Math.abs(y.gr) - Math.abs(x.gr));
  return { post: t._gradeDbgPostFilter, worst: worst.slice(0, 14) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
