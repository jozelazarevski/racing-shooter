/* CLIFF KNOT — the drawn route, and the scaling that was asked for by name.
 *
 * The sketch is a KNOT: a top hairpin, two long horizontal straights, a
 * north-south strand crossing BOTH of them (labelled "Tunels"), a right-hand
 * strand crossing the lower one ("Bridge"), a lobe out on the water ("Sea
 * clifs") and a big pointed loop across the bottom.
 *
 * A layout like that fails in two ways, and the first trace of it failed both:
 * strands end up lying on top of each other, and the crossings pile elevation
 * into a short run and make a wall. So this suite measures the things a knot
 * has to get right rather than eyeballing the shape:
 *
 *   - it is the size of a circuit, not a sketch
 *   - the crossings the drawing labels actually exist as crossings
 *   - two strands never run ALONGSIDE each other inside a road's width
 *   - the ramps over those crossings stay drivable
 *   - the sea is where the cliffs are supposed to be
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
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=59&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
const built = await page.waitForFunction(
  () => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
ok(built, 'CLIFF KNOT builds at all');

if (built) {
  const R = await page.evaluate(() => {
    const g = window.__game, t = g.track, n = t.center.length;
    let lap = 0, worst = 0, over30 = 0, lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) {
      const a = t.center[i], c = t.center[(i + 1) % n];
      const run = Math.hypot(c.x - a.x, c.z - a.z);
      lap += run; lo = Math.min(lo, a.y); hi = Math.max(hi, a.y);
      if (run < 0.01) continue;
      const gr = Math.abs(c.y - a.y) / run;
      if (gr > worst) worst = gr;
      if (gr > 0.30) over30++;
    }
    // A CROSSING IS NOT A CORRIDOR.
    //
    // Two strands that cross pass at distance zero by definition, and they are
    // close and still roughly aligned for a little way either side of it — so
    // both "nearest approach" and "nearest approach between near-parallel
    // strands" just rediscover the overpasses. A first cut used the latter and
    // failed the route for its own bridge.
    //
    // What actually ruins a knot is a SUSTAINED corridor: two carriageways
    // side by side for long enough to drive along. So measure the run — how
    // many consecutive stations have another strand within a road's width —
    // and let a brief convergence through.
    const NEAR = 18;                        // two half-widths
    let run = 0, worstRun = 0, worstAt = null, para = Infinity, paraAt = null;
    for (let i = 0; i < n; i++) {
      let close = false;
      for (let j = 0; j < n; j += 2) {
        const gap = Math.min(Math.abs(i - j), n - Math.abs(i - j));
        if (gap < 60) continue;
        const d = Math.hypot(t.center[i].x - t.center[j].x, t.center[i].z - t.center[j].z);
        if (d > NEAR) continue;
        const dot = Math.abs(t.tan[i].x * t.tan[j].x + t.tan[i].z * t.tan[j].z);
        if (dot <= 0.8) continue;
        close = true;
        if (d < para) { para = d; paraAt = [i, j]; }
      }
      if (close) { run++; if (run > worstRun) { worstRun = run; worstAt = i; } }
      else run = 0;
    }
    const worstRunU = worstRun * t.segLen;
    // how far is the sea from the closest the lap gets to it?
    let seaGap = Infinity;
    const C = t.T.coast;
    if (C) {
      for (let i = 0; i < n; i++) {
        const s = t._coastSide(t.center[i].x, t.center[i].z);
        if (-s < seaGap) seaGap = -s;
      }
    }
    return {
      name: g.level.name, n, lap: Math.round(lap), rise: +(hi - lo).toFixed(1),
      worst: +(worst * 100).toFixed(1), over30,
      overpasses: (t._overpasses || []).length,
      tunnels: (t._tunnels || []).length,
      para: +para.toFixed(1), paraAt,
      corridor: +worstRunU.toFixed(0), corridorAt: worstAt,
      hasSea: !!C, seaGap: +seaGap.toFixed(1),
      startLateral: +Math.abs(g.player.lateral ?? 0).toFixed(2),
      startAbove: +(g.player.y - t.groundHeightAt(g.player.trackIndex, g.player.lateral)).toFixed(2),
    };
  });

  console.log(`\n--- ${R.name} --- ${R.lap} u lap, ${R.rise} u of rise, `
    + `${R.overpasses} crossings, worst grade ${R.worst}%`);

  ok(R.lap > 1400 && R.lap < 2400,
    'it is the size of a circuit — mid-roster, not a sketch blown up', `${R.lap} u`);
  ok(R.overpasses >= 4,
    'the drawn crossings are real crossings: three tunnels and a bridge',
    `${R.overpasses} found`);
  ok(R.tunnels >= 1, 'and the bored tunnel through the hill exists', R.tunnels);
  ok(R.corridor <= 40,
    'no two strands run alongside each other for a drivable distance',
    `longest side-by-side corridor ${R.corridor} u (closest ${R.para} u at `
    + `${JSON.stringify(R.paraAt)})`);
  ok(R.over30 === 0,
    'no ramp over a crossing exceeds 30% — the MOUNTAIN TO SEA failure',
    `${R.over30} samples`);
  ok(R.worst < 30, 'and the worst grade anywhere is drivable', `${R.worst}%`);
  ok(R.hasSea, 'the cliff side has a sea to be a cliff over');
  ok(R.hasSea && R.seaGap < 90,
    'and the lap actually reaches it', `closest approach ${R.seaGap} u`);
  ok(R.startLateral < 6, 'the player starts on the road', R.startLateral);
  ok(Math.abs(R.startAbove) < 1.5, 'and on the ground', R.startAbove);
}

ok(errors.length === 0, 'built without a page error', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
