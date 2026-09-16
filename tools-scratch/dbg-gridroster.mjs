/* THE GRID ACROSS THE ROSTER (r409). gridSlot() now converts metres through
 * each world's own segLen, so the only thing that varies is segLen. Boots a
 * spread of worlds and reports the row gap, the depth and whether all eight
 * slots are distinct. */
import { chromium } from 'playwright-core';
const LEVELS = process.env.LEVELS ? process.env.LEVELS.split(',').map(Number)
  : [0, 5, 12, 21, 30, 41, 52, 63, 71, 77];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);
const rows = [];
for (const L of LEVELS) {
  await p.goto(`http://localhost:8901/?level=${L}&go=1&unlockall=1`,
    { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  rows.push(await p.evaluate(() => {
    const t = window.__game.track, seg = t.segLen;
    const s = []; for (let k = 0; k < 8; k++) s.push(t.gridSlot(k));
    const uniq = new Set(s.map((q) => `${q.index}:${q.lateral}`)).size;
    const N = t.center.length;
    const back = (q) => ((N - q.index) % N) * seg;
    return { world: window.__game.level?.name, seg: +seg.toFixed(2),
      poleBackM: +back(s[0]).toFixed(1), rowGapM: +(back(s[2]) - back(s[0])).toFixed(1),
      depthM: +(back(s[6]) - back(s[0])).toFixed(1), uniq };
  }));
}
for (const r of rows) console.log(
  `${(r.world ?? '?').padEnd(22)} seg ${String(r.seg).padStart(5)}  pole ${String(r.poleBackM).padStart(5)} m  row ${String(r.rowGapM).padStart(5)} m  depth ${String(r.depthM).padStart(5)} m  slots ${r.uniq}/8`);
const bad = rows.filter((r) => r.uniq !== 8 || r.rowGapM < 5 || r.rowGapM > 16 || r.depthM > 50);
console.log(bad.length ? `GRID: FAILED (${bad.length})` : 'GRID: PASSED');
await browser.close();
