import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
for (const lvl of [21, 1, 13]) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    const out = { name: g.level.name, rows: [], onDrawn: 0, offDrawn: 0 };
    const scan = (list, label) => {
      for (const o of (list ?? [])) {
        if (o.y === undefined || (o.r ?? 0) > 20) continue;
        if ((t._distToTrackCoarse ? t._distToTrackCoarse(o.x, o.z) : 999) < 16) continue;
        const d = o.y - t.terrainHeight(o.x, o.z);
        if (d < -1.2) {
          const dg = t._drawnGroundY(o.x, o.z);
          const seatErr = dg === null ? null : +(o.y - dg).toFixed(2);
          if (seatErr !== null && Math.abs(seatErr) < 0.35) out.onDrawn++; else out.offDrawn++;
          if (out.rows.length < 6) out.rows.push({ label, d: +d.toFixed(2), seatErr });
        }
      }
    };
    scan(t.trees, 'tree'); scan(t.solids ?? t.rocks, 'solid');
    return out;
  });
  console.log(`${r.name}: seated-on-drawn ${r.onDrawn}, off ${r.offDrawn}`, JSON.stringify(r.rows));
  await p.close();
}
await browser.close();
