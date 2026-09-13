/* DUMP THE ROSTER'S GEOMETRY ONCE SO CAR TUNING CAN BE ITERATED IN MILLISECONDS.
 *
 * `paceEstimate` (main.js) is a pure function of a car's stats and a world's
 * (ds, curvature, slope, surface) profile. Re-rating the roster therefore needs
 * no browser at all — but GETTING the profile does, because a world only
 * exists once Track has built it, and a build takes ~2 minutes under headless
 * GL. Rating 8 cars over 60 worlds by page-load is a 2-hour loop, which is not
 * a loop you can tune a car catalogue in.
 *
 * So: build each world once, write its profile to JSON, and let
 * `tool-pace-rate.mjs` re-rate any candidate stat table against the dump
 * instantly. The dump is derived data and is NOT committed.
 *
 *   node tests/tool-pace-dump.mjs [--worlds 1-21] [--out pace.json]
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i >= 0 ? process.argv[i + 1] : d;
};
const spec = arg('--worlds', '1-21');
const OUT = arg('--out', 'pace-dump.json');
const [lo, hi] = spec.includes('-') ? spec.split('-').map(Number) : [Number(spec), Number(spec)];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
page.setDefaultTimeout(600000);

const worlds = [];
for (let lvl = lo; lvl <= hi; lvl++) {
  await page.goto(`${BASE}/index.html?level=${lvl}&unlockall=1`,
    { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const w = await page.evaluate(() => {
    const g = window.__game, t = g.track;
    const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
    // EXACTLY the sampling paceEstimate uses (every 2nd sample, 2 ahead), so a
    // rating computed off this dump is the rating the game computes.
    const seg = [];
    for (let i = 0; i < t.N; i += 2) {
      const a = t.center[i], c = t.center[(i + 2) % t.N];
      const ds = Math.hypot(c.x - a.x, c.z - a.z) || 1;
      seg.push([
        +ds.toFixed(4),
        +(Math.abs(wrap(t.headingAt((i + 2) % t.N) - t.headingAt(i))) / ds).toFixed(6),
        +((c.y - a.y) / ds).toFixed(5),
      ]);
    }
    return { id: g.level.id, name: g.level.name, theme: g.level.theme,
      surface: t.T?.surface ?? null, seg };
  });
  worlds.push(w);
  console.log(`  ${String(w.id).padStart(2)} ${w.name.padEnd(20)} ${w.seg.length} segments, ${w.surface ?? 'dry'}`);
}
await browser.close();
writeFileSync(OUT, JSON.stringify({ worlds }));
console.log(`\nwrote ${OUT} — ${worlds.length} worlds`);
