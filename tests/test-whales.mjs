/* WHALES, BREACHING.
 *
 * The sea is the biggest thing in a coast world and the only one that never
 * did anything. A pod out past the shoreline is scenery, and the two ways
 * scenery like this goes wrong are both easy to measure:
 *
 *   it gets in the way — a whale near enough to matter to a car is a whale
 *   you would have to collide with, so they must sit well out to sea and well
 *   off the racing line;
 *
 *   and it never stops — a row of animals bobbing on a loop reads as an
 *   effect, not a place. A breach is one arc and then nothing for twenty
 *   seconds, so most of the time there should be nothing to see.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
// SEA CLIFF RUN — the world built around its coast, and the one that asks for
// the biggest pod
await page.goto(`${BASE}/?level=60&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(() => {
  const g = window.__game, t = g.track;
  const W = t.animated.whales;
  const out = { n: W.length, level: t.T.coast ? (t.T.coast.level ?? -2) : null };
  if (!W.length) return out;

  // how far out to sea, and how far from the racing line?
  out.minSeaward = Infinity; out.minToRoad = Infinity;
  for (const w of W) {
    const s = t._coastSide(w.g.position.x, w.g.position.z);
    out.minSeaward = Math.min(out.minSeaward, s);
    out.minToRoad = Math.min(out.minToRoad, t._distToTrack(w.g.position.x, w.g.position.z));
  }
  out.minSeaward = +out.minSeaward.toFixed(1);
  out.minToRoad = +out.minToRoad.toFixed(1);

  // and none of them is a collider — this is scenery, not an obstacle
  out.asSolid = (t.solids || []).filter((s) =>
    W.some((w) => Math.hypot(s.x - w.g.position.x, s.z - w.g.position.z) < 20)).length;

  // WALK A MINUTE OF CLOCK. Count how much of it each whale spends out of the
  // water, and how high the best breach got.
  let up = 0, samples = 0, peak = -Infinity, everVisible = 0;
  for (let k = 0; k < 600; k++) {
    t.update(1 / 10, k / 10);
    for (const w of W) {
      samples++;
      if (w.g.visible) {
        up++;
        peak = Math.max(peak, w.g.position.y);
        if (w.g.position.y > out.level) everVisible++;
      }
    }
  }
  out.upFraction = +(up / samples).toFixed(3);
  out.peakAbove = +(peak - out.level).toFixed(1);
  out.brokeSurface = everVisible > 0;
  out.tris = (() => {
    let n = 0;
    for (const w of W) w.g.traverse((o) => {
      if (o.isMesh && o.geometry?.index) n += o.geometry.index.count / 3;
      else if (o.isMesh) n += (o.geometry?.attributes?.position?.count ?? 0) / 3;
    });
    return Math.round(n);
  })();
  return out;
});

console.log(`\n--- SEA CLIFF RUN: ${R.n} whales, sea level ${R.level} ---`);
ok(R.n >= 3, 'a pod is built on a coast world', R.n);
ok(R.minSeaward > 60,
  'they swim well out to sea, not in the shallows', `nearest ${R.minSeaward} u seaward`);
ok(R.minToRoad > 120,
  'and nowhere near the racing line', `nearest ${R.minToRoad} u from the road`);
ok(R.asSolid === 0, 'none of them is a collider — scenery, not an obstacle', R.asSolid);
ok(R.brokeSurface, 'a whale does break the surface');
ok(R.peakAbove > 3, 'a breach clears the water properly', `${R.peakAbove} u above the sea`);
ok(R.upFraction > 0.02 && R.upFraction < 0.45,
  'but the sea is empty most of the time — a breach is rare, not a loop',
  `out of the water ${(R.upFraction * 100).toFixed(1)}% of the time`);
ok(R.tris < 900, 'the whole pod is cheap', `${R.tris} triangles`);

// a world with no coast must not grow whales, or try to
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const inland = await page.evaluate(() => {
  const t = window.__game.track;
  t.update(1 / 60, 12);
  return { whales: t.animated.whales.length, coast: !!t.T.coast };
});
ok(!inland.coast && inland.whales === 0,
  'an inland world grows none, and ticking it is still safe', JSON.stringify(inland));

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
