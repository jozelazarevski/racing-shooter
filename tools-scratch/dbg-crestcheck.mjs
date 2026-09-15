import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  const crests = (t.crests ?? []).map((c) => ({ i: c.index ?? c.i, len: c.len }));
  const ramps = (t.ramps ?? []).map((r) => ({ i: r.index, len: r.len, h: r.height, lat: r.lateral, hw: r.halfW }));
  const prof = [];
  for (let i = 248; i <= 266; i++) {
    const a = t.center[i], b = t.center[i + 1];
    prof.push({ i, y: +a.y.toFixed(2), run: +Math.hypot(b.x - a.x, b.z - a.z).toFixed(2),
      g0: +t.groundHeightAt(i, 0).toFixed(2) });
  }
  return { crests, ramps, prof };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
