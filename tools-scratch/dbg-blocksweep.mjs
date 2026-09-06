/* Roster-wide carriageway-blocker sweep: any solid whose collider reaches the
 * pavement is a scale-4 trap. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
p.setDefaultTimeout(300000);
let bad = 0;
for (let lvl = 0; lvl < 78; lvl++) {
  try {
    await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load' });
    await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
    const r = await p.evaluate(() => {
      const g = window.__game, t = g.track;
      const blockers = [];
      for (const s of t.solids) {
        if (!(s.r > 3)) continue;
        const ns = t._nearestSample(s.x, s.z);
        const w = t.widthAt?.(ns.i) ?? 9;
        if (ns.d < s.r + w + 1) blockers.push({ r: +s.r.toFixed(1), d: +ns.d.toFixed(1),
          mat: s.mat, idx: ns.i });
      }
      blockers.sort((a, b) => (a.d - a.r) - (b.d - b.r));
      return { name: g.level?.name, n: blockers.length, worst: blockers.slice(0, 3) };
    });
    if (r.n > 0) { bad++; console.log(`BLOCKED ${lvl} ${r.name}: ${r.n}  ${JSON.stringify(r.worst)}`); }
  } catch (e) { console.log(`ERR ${lvl}: ${String(e).slice(0, 100)}`); bad++; }
}
console.log(bad ? `${bad} worlds with blockers/errors` : 'all 78 worlds clear');
await browser.close();
process.exit(bad ? 1 : 0);
