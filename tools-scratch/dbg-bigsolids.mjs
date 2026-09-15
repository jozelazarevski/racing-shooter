import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto(`${BASE}/?level=${process.env.LEVEL ?? 1}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const big = t.solids.filter((s) => (s.r ?? 0) > 60).map((s) => ({
    x: Math.round(s.x), z: Math.round(s.z), r: +s.r.toFixed(1), h: s.h && Math.round(s.h),
    mat: s.mat, hasProf: !!s.prof, y: s.y && +s.y.toFixed(1),
    d: +t._nearestSample(s.x, s.z).d.toFixed(1) }));
  return { big, goat: t._goat && { x: Math.round(t._goat.x), z: Math.round(t._goat.z), R: t._goat.R },
    massifSpec: t.T.massif, theme: g.level?.theme };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
