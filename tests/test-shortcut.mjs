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
    let feed = '';
    const realFeed = g.hud?.feed;
    if (g.hud) g.hud.feed = (m) => { feed = feed || m; };
    for (let k = 0; k < secs * 60; k++) {
      car.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    }
    if (g.hud && realFeed) g.hud.feed = realFeed;
    const roadY = t.center[car.trackIndex]?.y ?? 0;
    return { speed: +Math.abs(car.speedAlong).toFixed(1), above: +(car.y - roadY).toFixed(1), feed };
  };

  // Baseline: on the road, same throttle, same time.
  const onRoad = run(200, 0, 2.5);

  // A cut: 30 u off the line. On a shelf road that is up the bank, which is
  // where the altitude gate used to fire. Find the sample with the biggest
  // climb so the test lands on the worst case rather than an average one.
  let best = null;
  for (let i = 60; i < t.center.length - 60; i += 11) {
    const pt = t.pointAt(i, 30);
    const rise = t.terrainHeight(pt.x, pt.z) - (t.center[i]?.y ?? 0);
    if (!best || rise > best.rise) best = { i, rise: +rise.toFixed(1) };
  }
  const cut = run(best.i, 30, 2.5);

  // The hinterland: far enough out that the stray gate is at full strength.
  const far = run(200, 140, 2.5);

  return { onRoad, cut, far, bank: best };
});

// The point of the change: a cut over high ground is not stopped. It is
// slower than the road — that is the slowdown, and it should be — but it is
// still driving, not a handbrake.
check('a cut 30 u off the line over a bank keeps driving', r.cut.speed > 12,
  `${r.cut.speed} m/s at +${r.cut.above} u above the road (bank rises ${r.bank.rise} u at sample ${r.bank.i})`);
check('the cut is not punished with a warning', !/OFF THE COURSE/.test(r.cut.feed),
  r.cut.feed ? `got "${r.cut.feed}"` : 'no feed');

// ...and the slowdown the user asked to keep is still measurably there.
check('off-road is still slower than the road', r.cut.speed < r.onRoad.speed * 0.95,
  `off-road ${r.cut.speed} vs road ${r.onRoad.speed} m/s`);

// Leaving is still not free.
check('the hinterland still costs you', r.far.speed < r.cut.speed,
  `140 u out: ${r.far.speed} vs 30 u out: ${r.cut.speed} m/s`);
check('the hinterland still warns you', /OFF THE COURSE/.test(r.far.feed),
  r.far.feed || 'no feed');

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
