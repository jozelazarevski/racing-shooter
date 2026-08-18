/* WHAT SHAPE IS THE GROUND WHERE THE RIVER RUNS?
 * SILVERSTONE draws flat farmland with a thin blue ribbon across it, and
 * `terrainHeight` reports -39.6 in the same place. One of those is a 40 u pit
 * nobody can see. Sampled as a profile across the line so the shape is visible
 * rather than inferred from a single worst number. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const [id, cx, cz] = process.argv.slice(2).map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await page.evaluate(([cx, cz]) => {
  const g = window.__game, t = g.track;
  const row = [];
  for (let d = -90; d <= 90; d += 6) row.push([d, +t.terrainHeight(cx + d, cz).toFixed(1)]);
  const col = [];
  for (let d = -90; d <= 90; d += 6) col.push([d, +t.terrainHeight(cx, cz + d).toFixed(1)]);
  const R = t._river;
  return { name: t.level?.name, row, col,
    river: R ? { depth: R.depth, half: R.half, bank: R.bank, cell: R.CELL,
      pts: R.line?.length, near: R.line ? R.line.reduce((a, p) =>
        Math.hypot(p.x - cx, p.z - cz) < Math.hypot(a.x - cx, a.z - cz) ? p : a, R.line[0]) : null } : null };
}, [cx, cz]);
console.log(`${r.name} at (${cx},${cz})`);
console.log('  river spec:', JSON.stringify(r.river));
console.log('  X profile:', r.row.map(([d, h]) => `${d}:${h}`).join(' '));
console.log('  Z profile:', r.col.map(([d, h]) => `${d}:${h}`).join(' '));
await b.close();
