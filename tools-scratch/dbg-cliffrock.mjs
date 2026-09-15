import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto(`${BASE}/?level=59&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const out = [];
  for (const ob of t.solids ?? []) {
    if (!(ob.r > 0) || ob.culled) continue;
    const gi = t.nearestIndex ? t.nearestIndex(ob, null) : 0;
    if (Math.abs(((gi - 548 + N) % N + N) % N) > 4 && Math.abs(((548 - gi + N) % N)) > 4) continue;
    const c = t.center[gi];
    const lat = Math.hypot(ob.x - c.x, ob.z - c.z);
    if (lat > 8) continue;
    out.push({ ...Object.fromEntries(Object.entries(ob).filter(([, v]) => typeof v !== 'object' || v === null)),
      gi, lat: +lat.toFixed(2), roadY: +c.y.toFixed(1) });
  }
  // also the nearest placedElements + what section kind
  const kind = g.route?.kindAtIndex?.(548);
  return { out, kind, width: t.widthAt?.(548) };
});
console.log(JSON.stringify(r, null, 1).slice(0, 1500));
await browser.close();
