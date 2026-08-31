/* Shortcuts, as a test.
 *
 * Rally driving is full of cuts: the inside of a hairpin, over a bank, across
 * a field. They cost grip and they cost time, and that is meant to be the
 * whole price. Two rules used to charge more than that:
 *
 *   1. An ALTITUDE GATE — off the course and >10 u above the nearest road
 *      scrubbed your velocity at 3.2/s. It was added to stop the massif being
 *      climbed, but it also walled off every legitimate line over a rise.
 *   2. A STRAY GATE at 45 u that scrubbed at 3.5/s — hard enough to stop you.
 *
 * (1) is gone. (2) survives, because without it you could drive across the
 * hinterland and rejoin half a stage later, which is not a cut — it is
 * leaving. It moved out to 70 u and down to a drag you can drive against.
 *
 * What this asserts, in order of what actually matters:
 *   - a cut over high ground keeps its speed
 *   - the off-road SLOWDOWN is still there (the user asked to keep it)
 *   - the hinterland still costs you
 *   - the rim wall still holds
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// FURKA RIDGE: a shelf road on a mountain, so "off the course and well above
// the road" is easy to arrange and is exactly what the altitude gate punished.
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=21&go=1&unlockall=1`, { waitUntil: 'load' });
const ready = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 180000 }).then(() => 1).catch(() => 0);
if (!ready) { console.log('SKIP  world never built'); await browser.close(); process.exit(1); }

const r = await p.evaluate(() => {
  const g = window.__game, car = g.player, t = g.track;

  /* Put the car `lat` from the centreline at sample `i`, aim it along the
   * road, hold the throttle down for `secs`, and report what speed it kept.
   * Nothing overwrites the velocity mid-run — an earlier probe did, and it
   * measured its own overwrite instead of the physics. */
  const run = (i, lat, secs) => {
    const pt = t.pointAt(i, lat);
    const ground = t.terrainHeight(pt.x, pt.z);
    car.trackIndex = i; car.lateral = lat;
    car.alive = true; car.health = 100; car.airborne = false;
    car.vy = 0; car._climbRate = 0; car._settleT = 0; car._steepFed = 0;
    car.pos.set(pt.x, ground + 0.4, pt.z); car.y = car.pos.y;
    // Point along the road, then launch at a realistic pace so the test is
    // about what is TAKEN AWAY, not about how fast the car accelerates.
    const nx = t.center[(i + 6) % t.center.length];
    car.heading = Math.atan2(nx.x - pt.x, nx.z - pt.z);
    car.speedAlong = 30;
    car.vel.set(Math.sin(car.heading) * 30, 0, Math.cos(car.heading) * 30);
    // ALL the feeds, not the first one. The hinterland run clips a tree or a
    // rock before the stray gate speaks, and `feed = feed || m` kept only the
    // "TIMBER!" — so the warning fired and the test called it missing.
    const feeds = [];
    const realFeed = g.hud?.feed;
    if (g.hud) g.hud.feed = (m) => { if (feeds.length < 10) feeds.push(m); };
    for (let k = 0; k < secs * 60; k++) {
      car.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    }
    if (g.hud && realFeed) g.hud.feed = realFeed;
    const roadY = t.center[car.trackIndex]?.y ?? 0;
    return { speed: +Math.abs(car.speedAlong).toFixed(1), above: +(car.y - roadY).toFixed(1),
      feed: feeds.join(' | '),
      // r302 (§3.5): NOTHING signals the wild — no scolding, no arrow.
      // Capture any wayfinding node that dares exist.
      arrow: (() => {
        try { g.hud._edgeArrows?.(); } catch { /* headless quirks */ }
        const a = document.querySelector('.gatearrow');
        return !!a && a.style.display !== 'none';
      })() };
  };

  // Baseline: on the road, same throttle, same time.
  const onRoad = run(200, 0, 2.5);

  // A cut: 30 u off the line. On a shelf road that is up the bank, which is
  // where the altitude gate used to fire. Find the sample with the biggest
  // climb so the test lands on the worst case rather than an average one.
  //
  // ON BARE TERRAIN. This run measures the RULES — the stray drag and the
  // dead altitude gate — and it drives a blind straight line, which no
  // player does. Since r209 the switchbacks are railed (test-cornerwalls'
  // law) and the flanks carry rock scatter (fair physics), so every worst-
  // case corridor on this world now ends in masonry or stone and the test
  // was measuring the rock lottery: three different finders, three
  // different rocks, 0.7 m/s each. A player steers around all of that. So
  // the colliders come out for this one run and go straight back — the
  // slope, the drag and the (absent) altitude gate are what remain, and
  // they are exactly what this test owns. The walls' own law is enforced
  // where it lives, in test-cornerwalls and test-edgerails.
  let best = null, flat = null;
  for (let i = 60; i < t.center.length - 60; i += 11) {
    const pt = t.pointAt(i, 30);
    const rise = t.terrainHeight(pt.x, pt.z) - (t.center[i]?.y ?? 0);
    if (!best || rise > best.rise) best = { i, rise: +rise.toFixed(1) };
    if (!flat || Math.abs(rise) < Math.abs(flat.rise)) flat = { i, rise: +rise.toFixed(1) };
  }
  const kept = { obstacles: t.obstacles, solids: t.solids, barriers: t.barriers };
  t.obstacles = []; t.solids = []; t.barriers = [];
  const cut = run(best.i, 30, 2.5);
  // The off-road-is-slower comparison is a CONTROLLED PAIR: same sample, a
  // bank that is level with the road, on the carriageway vs 28 u off it. The
  // old form compared the cut (downhill, once the rocks were out of it)
  // against the road at another sample and measured the hill, not the
  // surface multiplier it says it measures.
  // 2.5 s, and no longer: run() drives a blind straight line, so past a few
  // seconds the "on-road" runner has left the curving carriageway and the
  // pair stops being a pair (measured: 4 s put the road run in the dirt at
  // 20.8 m/s). At 2.5 s from a rolling start the surface multiplier has
  // expressed ~4% — small because both runs are still accelerating, real
  // because it is the same sample, the same slope and the same physics.
  const onFlat = run(flat.i, 0, 2.5);
  const offFlat = run(flat.i, 28, 2.5);
  t.obstacles = kept.obstacles; t.solids = kept.solids; t.barriers = kept.barriers;

  // The hinterland: far enough out that the stray gate is at full strength.
  // FROM EVERY LEG OF THE LAP, not just from sample 200: the gate now
  // believes only a GLOBAL nearest-sample distance (the switchback fix), and
  // `pointAt(200, 140)` on this shelf road is 25.1 u from the leg above it —
  // measured — so the gate was right to stay quiet there and this test was
  // wrong to expect noise. Find a spot that really is out in the wild.
  const globalDist = (x, z) => {
    let m = 1e9;
    for (const c of t.center) { const d = Math.hypot(x - c.x, z - c.z); if (d < m) m = d; }
    return m;
  };
  let farAt = { i: 200, d: 0 };
  for (let i = 60; i < t.center.length - 60; i += 17) {
    const q = t.pointAt(i, 140);
    const d = globalDist(q.x, q.z);
    if (d > farAt.d) farAt = { i, d: +d.toFixed(1) };
  }
  const far = run(farAt.i, 140, 2.5);

  return { onRoad, cut, far, bank: best, onFlat, offFlat, flatAt: flat };
});

// The point of the change: a cut over high ground is not stopped. It is
// slower than the road — that is the slowdown, and it should be — but it is
// still driving, not a handbrake.
check('a cut 30 u off the line over a bank keeps driving', r.cut.speed > 12,
  `${r.cut.speed} m/s at +${r.cut.above} u above the road (bank rises ${r.bank.rise} u at sample ${r.bank.i})`);
check('the cut is not punished with a warning', !/OFF THE COURSE/.test(r.cut.feed),
  r.cut.feed ? `got "${r.cut.feed}"` : 'no feed');

// ...and the slowdown the user asked to keep is still measurably there.
check('off-road is still slower than the road', r.offFlat.speed < r.onFlat.speed * 0.98,
  `off-road ${r.offFlat.speed} vs road ${r.onFlat.speed} m/s, level bank at sample ${r.flatAt.i}`);

// Leaving is still not free.
check('the hinterland still costs you', r.far.speed < r.cut.speed,
  `140 u out: ${r.far.speed} vs 30 u out: ${r.cut.speed} m/s`);
// r302 (CLAUDE.md v1.2 §3.5): the wild is SILENT. The r301 gate arrow is
// erased along with the scolding it replaced — off course is handled by
// the route's own grace-and-return, with no on-screen indicator at all.
check('the hinterland is silent — no scolding, no arrow, no banner',
  r.far.arrow === false && !/OFF THE COURSE|WRONG WAY|TURN BACK/.test(r.far.feed),
  `arrow=${r.far.arrow}${r.far.feed ? `, feed "${r.far.feed}"` : ''}`);

// The rim wall is a separate rule and must survive all of this. It only
// engages PAST RIM_RADIUS (1620), so start just outside it — an earlier draft
// of this test started at 1000, watched the car drive happily on, and blamed
// the code for a boundary it had not reached.
const rim = await p.evaluate(() => {
  const g = window.__game, car = g.player;
  const R = 1650;
  car.alive = true; car.health = 100; car.airborne = false;
  car.pos.set(R, g.track.terrainHeight(R, 0) + 0.4, 0); car.y = car.pos.y;
  car.heading = Math.PI / 2;            // pointing further out
  car.speedAlong = 30; car.vel.set(30, 0, 0);
  const start = Math.hypot(car.pos.x, car.pos.z);
  for (let k = 0; k < 180; k++) {
    car.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
  }
  return { start: +start.toFixed(0), end: +Math.hypot(car.pos.x, car.pos.z).toFixed(0) };
});
check('the world still has an edge', rim.end - rim.start < 60,
  `radius ${rim.start} -> ${rim.end} after 3 s at full throttle outward`);

await p.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nshortcuts are open, leaving still is not');
process.exit(fail ? 1 : 0);
