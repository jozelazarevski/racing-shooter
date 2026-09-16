import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(240000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 150)));
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  if (!t._bank9) return { world: window.__game.level?.name, banked: 0 };
  let n = 0, maxEdge = 0, maxDeg = 0, runs = 0, inRun = false;
  for (let i = 0; i < N; i++) {
    const v = t._bank9[i];
    if (v) {
      n++;
      const e = Math.abs(v) * (t.widthAt(i) + 1.5);
      if (e > maxEdge) maxEdge = e;
      const deg = Math.atan(Math.abs(v)) * 180 / Math.PI;
      if (deg > maxDeg) maxDeg = deg;
      if (!inRun) { runs++; inRun = true; }
    } else inRun = false;
  }
  return { world: window.__game.level?.name, banked: n, runs,
    maxEdgeDrop: +maxEdge.toFixed(2), maxDeg: +maxDeg.toFixed(1) };
});
console.log(JSON.stringify(r), errs.slice(0, 2).join('|') || '');
await browser.close();
