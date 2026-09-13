import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto(`http://localhost:8901/?level=${process.env.LVL ?? 66}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  let wmin = 1e9, wmax = 0; const hair = [];
  for (let i = 0; i < N; i++) {
    const w = t.widthAt(i); wmin = Math.min(wmin, w); wmax = Math.max(wmax, w);
    const c = t.curvature[i], R = c > 1e-6 ? 1 / c : 1e9;
    if (R < 30) hair.push({ i, R: +R.toFixed(1), w: +w.toFixed(2) });
  }
  const sample = hair.filter((_, k) => k % 8 === 0).slice(0, 12);
  return { world: window.__game.level?.name, N, wmin: +wmin.toFixed(2), wmax: +wmax.toFixed(2),
    roadWidthTune: t.T.roadWidth ?? null, hairpinStations: hair.length, sample };
});
console.log(JSON.stringify(r));
await browser.close();
