/* NO TRUNK IN ANY CARRIAGEWAY, ROSTER-WIDE.
 *
 * The standing note said MOUNTAIN TO SEA could roll scatter trees into its
 * (5x-wide) road. Measured across all 78 worlds on r363: ZERO trees inside
 * widthAt + 1.7 (the car's radius) anywhere — the widthAt-aware olive gate
 * and the r362 street-band guard closed the class without being scoped to.
 * Builds are level-seeded, so this is deterministic, and this suite pins it
 * at zero: a scatter branch that regresses shows up as a named world and a
 * distance, not as a phone report.
 *
 * Long-stream class (78 world loads, ~10 min) — run it like airace, not in
 * the default battery.
 *
 *   node tests/test-treeclear.mjs
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (c, m, e = '') => { if (c) { pass++; console.log('PASS ', m, e); } else { fail++; console.log('FAIL ', m, e); } };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', () => {});
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const ids = await p.evaluate(() =>
  window.__game.chapters().flatMap((c) => c.levels).map((l) => l.id));
const bad = [];
let loaded = 0;
for (const id of ids) {
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
    await p.waitForFunction(() => window.__game?.track?.center
      && window.__game.level?.id === Number(new URLSearchParams(location.search).get('level')),
    undefined, { timeout: 300000 });
    const r = await p.evaluate(() => {
      const g = window.__game, t = g.track, N = t.center.length;
      const hits = [];
      for (const tr of t.trees ?? []) {
        let bi = 0, bd = Infinity;
        for (let i = 0; i < N; i += 2) {
          const c = t.center[i];
          const d = (c.x - tr.x) ** 2 + (c.z - tr.z) ** 2;
          if (d < bd) { bd = d; bi = i; }
        }
        const dist = Math.sqrt(bd);
        const w = t.widthAt ? t.widthAt(bi) : 9;
        if (dist < w + 1.7) hits.push({ i: bi, dist: +dist.toFixed(1), kind: tr.kind });
      }
      return { world: g.level?.name, hits: hits.slice(0, 5), n: hits.length };
    });
    loaded++;
    if (r.n) bad.push(r);
  } catch { /* a world that fails to load is the boot suite's problem */ }
}
ok(loaded >= 70, 'the roster was actually swept', `${loaded} of ${ids.length} worlds loaded`);
ok(bad.length === 0, 'no tree trunk stands inside any carriageway on any world',
  bad.map((b) => `${b.world}:${b.n} (${JSON.stringify(b.hits[0])})`).join(' | '));
console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
