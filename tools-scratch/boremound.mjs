/* r210's OWN METRIC for "the tunnels are within the mountains": how far does
 * the ground stand ABOVE the road at the bore, measured out along the normal.
 * Run it against two ports to compare builds. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 400, height: 260 } });
page.setDefaultTimeout(600000);
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await page.evaluate(() => {
    const t = window.__game.track;
    const out = [];
    for (const T of (t._tunnels ?? [])) {
      const i = T.mid, c = t.center[i], n = t.nrm[i];
      const row = { mid: i, h: T.h, roadY: +c.y.toFixed(1), over: [] };
      for (const d of [20, 40, 80, 120]) {
        let best = -Infinity;
        for (const s of [1, -1]) {
          const g = t.terrainHeight(c.x + n.x * d * s, c.z + n.z * d * s);
          best = Math.max(best, g - c.y);
        }
        row.over.push(+best.toFixed(1));
      }
      // and the crown: the highest ground within 150 u of the bore mid
      let crown = -Infinity;
      for (let a = 0; a < 16; a++) for (const d of [30, 60, 90, 120, 150]) {
        const g = t.terrainHeight(c.x + Math.cos(a * 0.3927) * d, c.z + Math.sin(a * 0.3927) * d);
        crown = Math.max(crown, g - c.y);
      }
      row.crown = +crown.toFixed(1);
      out.push(row);
    }
    return { name: t.level?.name, out };
  });
  for (const q of r.out) {
    console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(16)} bore@${q.mid} ridge ${q.h}`
      + `  over the road at 20/40/80/120 u: ${q.over.join(' / ')}   crown ${q.crown}`);
  }
}
await b.close();
