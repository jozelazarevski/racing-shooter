import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
p.setDefaultTimeout(300000);
for (const lvl of (process.env.LEVELS ?? '20').split(',').map(Number)) {
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length;
    let lo = 1e9, hi = -1e9, maxG = 0;
    for (let i = 0; i < N; i++) {
      const y = t.center[i].y;
      if (y < lo) lo = y; if (y > hi) hi = y;
      const dy = Math.abs(t.center[(i + 1) % N].y - y);
      const ds = Math.hypot(t.center[(i + 1) % N].x - t.center[i].x,
        t.center[(i + 1) % N].z - t.center[i].z) || 1;
      if (i !== N - 1 && dy / ds > maxG) maxG = dy / ds;
    }
    return { name: g.level?.name, theme: g.level?.theme, range: +(hi - lo).toFixed(0),
      maxGradePct: +(maxG * 100).toFixed(0), errs: 0 };
  });
  console.log(JSON.stringify(r));
}
await browser.close();
