import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto(`${BASE}/?level=12&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const fords = (t.fords ?? []).map((f) => ({ i: f.i, half: +(+f.half).toFixed(1) }));
  const hits = [];
  for (let s = 0; s < 30; s++) {
    const idx = (200 + s * 7) % N;
    for (const f of fords) {
      const d = Math.min((idx - f.i + N) % N, (f.i - idx + N) % N) * t.segLen;
      if (d < f.half + 6) hits.push({ s, idx, fordI: f.i, distU: +d.toFixed(1) });
    }
  }
  return { name: g.level?.name, segLen: +t.segLen.toFixed(2), fords, hits };
});
console.log(JSON.stringify(r, null, 1).slice(0, 900));
await browser.close();
