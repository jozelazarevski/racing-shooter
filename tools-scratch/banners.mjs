/* SPONSOR BOARDS AGAINST THE CARRIAGEWAY, PER WORLD.
 *
 * `_buildBanners` places each board at `pointAt(i, boardOff * side)` — an
 * offset along ONE sample's normal — and then builds it. There is no
 * `_clearsRoad` and no `_distToTrack`, so on any world where the lap comes
 * back on itself a board placed correctly beside its own leg can stand in the
 * middle of another. That is the defect `_buildProps` documents at length
 * ("an offset is not a distance": the FURKA RIDGE cabin, the 38 tyre stacks).
 *
 * This measures the banners directly rather than by walking the scene, so it
 * is cheap enough to run over the whole roster as an acceptance test.
 *
 *   node tools-scratch/banners.mjs             # every world
 *   node tools-scratch/banners.mjs 34 37       # only these
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const only = process.argv.slice(2).map(Number).filter(Boolean);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const roster = await page.evaluate(async () => {
  const { LEVELS } = await import('./src/track.js');
  return LEVELS.map((l) => ({ id: l.id, name: l.name }));
});
const worlds = only.length ? roster.filter((l) => only.includes(l.id)) : roster;

let tot = 0, bad = 0, worstAll = 0, dirty = 0;
for (const lv of worlds) {
  await page.goto(`${BASE}/?level=${lv.id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${lv.name}`); continue; }
  const r = await page.evaluate(() => {
    const t = window.__game.track;
    const V = new (t.center[0].constructor)();
    const out = [];
    // `_buildGuardFence` pushes its bays into the SAME array with kind:'fence'.
    // A guard rail belongs at the road edge — that is what it is for — so
    // counting it here would bury the sponsor boards under its own bays
    // (FURKA RIDGE: 10 boards, 91 fence bays, all in one array).
    for (const bn of (t.banners ?? [])) {
      if (bn.kind === 'fence') continue;
      // the board is 9 u wide on two posts at +-4: measure the whole span,
      // not the centre, or a board straddling the road reads as clear
      let worst = -Infinity, at = 0, lat = 0;
      const h = bn.heading ?? 0;
      for (const off of [-4.5, -2.25, 0, 2.25, 4.5]) {   // the board is 9 u wide
        const x = bn.x + Math.cos(h) * off, z = bn.z - Math.sin(h) * off;
        const d = t._distToTrack(x, z);
        V.set(x, 0, z);
        const i = t.nearestIndex(V);
        const bite = t.widthAt(i) - d;
        if (bite > worst) { worst = bite; at = i; lat = d; }
      }
      out.push({ bite: +worst.toFixed(2), i: at, lat: +lat.toFixed(2),
        half: +t.widthAt(at).toFixed(2), dead: !!bn.dead });
    }
    return { n: out.length, on: out.filter((o) => o.bite > 0.3).sort((a, b) => b.bite - a.bite) };
  });
  tot += r.n; bad += r.on.length;
  if (r.on.length) { dirty++; worstAll = Math.max(worstAll, r.on[0].bite); }
  console.log(`${r.on.length ? '••' : '  '} ${String(lv.id).padStart(2)} ${lv.name.padEnd(22)}`
    + `${String(r.n).padStart(3)} boards  `
    + (r.on.length
      ? `${r.on.length} IN THE CARRIAGEWAY, worst ${r.on[0].bite} u into ${r.on[0].half} u `
        + `(sample ${r.on[0].i}, ${r.on[0].lat} u from the road)`
      : 'all clear'));
}
console.log(`\n===== ${bad} of ${tot} boards stand in a carriageway, on ${dirty} worlds; worst bite ${worstAll.toFixed(2)} u =====`);
await b.close();
