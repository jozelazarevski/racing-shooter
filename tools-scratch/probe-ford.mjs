import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
for (const lvl of [13, 1]) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    let water = null;
    t.group.traverse((o) => { if (o.name === 'river-water') water = o; });
    const out = { name: g.level.name, fords: (t._river?.fords ?? []).map((f) => f.i), rows: [] };
    if (!water) return out;
    const pos = water.geometry.attributes.position, C = 4;
    const fordPts = (t._river?.fords ?? []).map((fd) => ({ i: fd.i, c: t.center[fd.i] })).filter((f) => f.c);
    for (let s = 0; s < pos.count / C; s++) {
      const x = pos.getX(s * C), z = pos.getZ(s * C), y = pos.getY(s * C);
      if ((t._distToTrackCoarse ? t._distToTrackCoarse(x, z) : 999) > 6) continue;
      const near = fordPts.find((f) => Math.hypot(x - f.c.x, z - f.c.z) < 34);
      if (!near) continue;
      const ni = t.nearestIndex({ x, y: 0, z });
      const d = y - t.center[ni].y;
      if (Math.abs(d) > 2) {
        out.rows.push({ d: +d.toFixed(2), fordI: near.i, ni,
          distFord: +Math.hypot(x - near.c.x, z - near.c.z).toFixed(1),
          deckAtFord: +near.c.y.toFixed(1), deckAtNi: +t.center[ni].y.toFixed(1),
          waterY: +y.toFixed(1),
          distRoad: +(t._distToTrackCoarse ? t._distToTrackCoarse(x, z) : -1).toFixed(1) });
      }
    }
    out.rows.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
    out.rows = out.rows.slice(0, 8);
    return out;
  });
  console.log(`\n=== ${r.name} fords@${JSON.stringify(r.fords)}`);
  for (const b of r.rows) console.log(JSON.stringify(b));
  await p.close();
}
await browser.close();
