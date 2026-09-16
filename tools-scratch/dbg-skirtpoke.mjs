/* Shard hypothesis 2: road-skirt triangles poking ABOVE the deck. Sample
 * every skirt vertex; count those inside the carriageway footprint that
 * rise above the road surface there. */
import { chromium } from 'playwright-core';
const LEVELS = (process.env.LEVELS ?? '66').split(',').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const lvl of LEVELS) {
  const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    const out = { name: g.level?.name, skirts: 0, pokes: 0, worst: 0, spots: [] };
    t.group.traverse((o) => {
      if (!o.isMesh || !/skirt/.test(o.name || '')) return;
      out.skirts++;
      const pos = o.geometry?.attributes?.position;
      if (!pos) return;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) + o.position.x, y = pos.getY(i) + o.position.y,
          z = pos.getZ(i) + o.position.z;
        const s = t._nearestSample(x, z);
        if (s.d > t.widthAt(s.i) - 0.5) continue;   // outside the deck proper
        const over = y - t.center[s.i].y;
        if (over > 0.15) {
          out.pokes++;
          if (over > out.worst) out.worst = +over.toFixed(2);
          if (out.spots.length < 6) out.spots.push({ i: s.i, over: +over.toFixed(2), d: +s.d.toFixed(1) });
        }
      }
    });
    return out;
  });
  console.log(JSON.stringify(r));
  await p.close();
}
await browser.close();
