/* Roster-wide census: trees whose trunk disc stands inside any carriageway
 * (distToTrack < widthAt + 1.7 car radius + a small margin). Builds are
 * level-seeded, so a hit here is deterministic, not dice. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', () => {});
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const ids = await p.evaluate(() =>
  window.__game.chapters().flatMap((c) => c.levels).map((l) => l.id));
const bad = [];
for (const id of ids) {
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
    await p.waitForFunction(() => window.__game?.track?.center && window.__game.level?.id === Number(new URLSearchParams(location.search).get('level')), undefined, { timeout: 300000 });
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
        const solid = (tr.s ?? 1) >= 1.0 && tr.kind !== 'cactus' && tr.kind !== 'snag';
        if (dist < w + 1.7) hits.push({ i: bi, dist: +dist.toFixed(1), w, kind: tr.kind, s: tr.s, solid });
      }
      return { world: g.level?.name, hits: hits.slice(0, 8), n: hits.length };
    });
    if (r.n) bad.push(r);
    process.stdout.write('.');
  } catch (e) { process.stdout.write('x'); }
}
console.log('');
for (const b of bad) console.log(b.world, b.n, JSON.stringify(b.hits.slice(0, 4)));
console.log(`${bad.length} worlds with trees in the carriageway`);
await browser.close();
