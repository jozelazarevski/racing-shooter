import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto(`${BASE}/?level=${process.env.LEVEL ?? 1}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const rows = [];
  for (let i = 90; i <= 170; i += 2) {
    const c = t.center[i];
    rows.push({ i, roadY: +c.y.toFixed(1), terr: +t.terrainHeight(c.x, c.z).toFixed(1),
      w: +(t.widthAt?.(i) ?? -1).toFixed(1) });
  }
  return { rows,
    fords: (t.fords ?? []).map((f) => ({ i: f.i ?? f.idx ?? f.si, keys: Object.keys(f).slice(0, 8) })),
    tunnels: (t._tunnels ?? []).map((u) => ({ a: u.a ?? u.i0, b: u.b ?? u.i1 })),
    gorges: (t.gorges ?? t._gorges ?? []).length,
    kickers: (t.kickers ?? []).length };
});
console.log(JSON.stringify(r.fords), 'tunnels', JSON.stringify(r.tunnels), 'gorges', r.gorges, 'kickers', r.kickers);
for (const row of r.rows) console.log(row.i, 'road', row.roadY, 'terr', row.terr, 'w', row.w, Math.abs(row.roadY - row.terr) > 3 ? '<<<' : '');
await browser.close();
