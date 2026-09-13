import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=58&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  const out = [];
  for (const s of t.solids ?? []) {
    const d = Math.hypot(s.x - c.pos.x, s.z - c.pos.z);
    if (d < 80) {
      const top = (s.y ?? t.terrainHeight(s.x, s.z)) + (s.h ?? Math.min(14, (s.r ?? 1) * 1.6));
      out.push({ d: +d.toFixed(0), r: +(s.r ?? 0).toFixed(1), y: +(s.y ?? -999).toFixed(1),
        h: s.h != null ? +s.h.toFixed(1) : null, top: +top.toFixed(1), mat: s.mat ?? '?' });
    }
  }
  out.sort((a, b) => b.top - a.top);
  return { n: out.length, top10: out.slice(0, 10),
    playerAt: { x: +c.pos.x.toFixed(0), z: +c.pos.z.toFixed(0) } };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
