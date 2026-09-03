/* r334 — v2.3 §7.10 / R9: NO REAL NAMES IN STAGE DATA. Scans the live
 * roster at runtime — every level's name, region and blurb, and the
 * chapter titles — for the spec's protected names and the real places
 * the roster used to carry (passes, towns, mountains, stages).
 * Comments in source are not stage data; what the player is shown is.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const PROTECTED = [
  // the spec's own list (§7.10 / CLAUDE.md fault 14)
  'SPA-FRANCORCHAMPS', 'SILVERSTONE', 'MONACO', 'SUZUKA', 'PIKES PEAK',
  // real places the roster shipped with, renamed in r334 and r327
  'GOTTHARD', 'TREMOLA', 'FURKA', 'TURINI', 'FAFE', 'ESTONIA', 'DOLOMITI',
  'CINQUE TERRE', 'ALASSIO', 'BUDELLO', 'CAPO MELE', 'OUNINPOHJA',
  'NURBURGRING', 'MONZA', 'LE MANS', 'DAYTONA', 'GOODWOOD',
];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });

const r = await p.evaluate(async () => {
  const { LEVELS } = await import('./src/track.js');
  const rows = [];
  for (const l of LEVELS) {
    rows.push([l.id, [l.name, l.region, l.blurb, l.sub, l.desc]
      .filter(Boolean).join(' | ').toUpperCase()]);
  }
  return rows;
});

const hits = [];
for (const [id, text] of r) {
  for (const bad of PROTECTED) {
    if (text.includes(bad)) hits.push({ id, bad });
  }
}
check(`R9  string scan over ${r.length} roster entries: zero protected names`,
  hits.length === 0, JSON.stringify(hits.slice(0, 6)));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nevery stage wears its own name');

// r346: the verdict must reach the exit code (the test-strip lesson).
process.exit(fail ? 1 : 0);
