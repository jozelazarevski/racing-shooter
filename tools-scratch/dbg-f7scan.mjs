import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const scan = (i, lat, len) => {
    const h = t.headingAt(i), pt = t.pointAt(i, lat);
    const dx = Math.sin(h), dz = Math.cos(h);
    let worst = 0, prev = t.terrainHeight(pt.x, pt.z), hits = 0;
    for (let s = 5; s <= len; s += 5) {
      const x = pt.x + dx * s, z = pt.z + dz * s;
      const y2 = t.terrainHeight(x, z);
      worst = Math.max(worst, Math.abs(y2 - prev) / 5);
      prev = y2;
      for (const tr of (t.camTreesNear ? t.camTreesNear(x, z) : [])) {
        if (Math.hypot(tr.x - x, tr.z - z) < 1.8) hits++;
      }
    }
    return { worst, hits };
  };
  const best = [];
  for (let i = 0; i < N; i += 5) {
    for (const lat of [9, 12, 16, 20, 26, 32, -9, -12, -16, -20, -26, -32]) {
      const { worst, hits } = scan(i, lat, 60);
      best.push({ i, lat, g: +worst.toFixed(3), hits });
    }
  }
  best.sort((a, b) => (a.g + a.hits * 0.03) - (b.g + b.hits * 0.03));
  return best.slice(0, 12);
});
console.log(JSON.stringify(r));
await browser.close();
