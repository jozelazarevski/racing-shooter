import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
p.setDefaultTimeout(300000);
for (const lvl of (process.env.LEVELS ?? '68').split(',').map(Number)) {
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, N2 = t.center.length;
    let ext = 0, worstGap = 0, wi = -1;
    for (let i = 0; i < N2; i++) {
      const c = t.center[i];
      ext = Math.max(ext, Math.abs(c.x), Math.abs(c.z));
      const dg = t._drawnGroundY(c.x, c.z);
      const gap = dg === null ? 999 : Math.abs(c.y - dg);
      if (gap > worstGap && dg !== null) { worstGap = gap; wi = i; }
      if (dg === null && wi === -1) { wi = -i; worstGap = 999; }
    }
    return { name: g.level?.name, ext: Math.round(ext), patchHalf: t._patchHalf,
      worstRoadVsDrawn: +worstGap.toFixed(1), atIdx: wi };
  });
  console.log(JSON.stringify(r));
}
await browser.close();
