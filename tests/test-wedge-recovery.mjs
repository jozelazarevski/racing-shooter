/* A CAR HELD AT FULL THROTTLE THAT IS NOT MOVING IS STUCK, NOT EXPLORING.
 *
 * Reported with a photograph of the player's car parked on the face of a
 * chasm below a lakeside road, speedometer reading 0, with no way out:
 * "I still see this."
 *
 * The recovery net only rescued cars that were UNDER the terrain or at a
 * non-finite coordinate. It had deliberately stopped caring how far from the
 * road you are — "go and look at that mountain" is a thing the world is big
 * enough to allow — but that left the middle case unhandled: on the ground,
 * finite, visible, and on a face too steep to climb with no room to turn
 * around. The game was still running; the player simply could not play it.
 *
 * The tell is the INPUT, not the position: full throttle and no motion,
 * sustained for five seconds. That cannot happen while driving, and it cannot
 * be triggered by parking somewhere scenic — an idle car is never touched,
 * whatever it is parked on.
 *
 * Both directions are checked, because a rescue that fires during normal
 * racing is worse than the softlock it fixes.
 *
 * WHY THE PINNED CASE IS SIMULATED RATHER THAN DRIVEN INTO. Two attempts to
 * build the trap out of real terrain both failed, and the failures are worth
 * recording because they say something good about the game: a steep face is
 * not a trap (at full throttle the car simply drove off it, in 1.25 s), and
 * nor is a mountain (the wall-peel logic slides the car along the rock at
 * 19 u/s rather than letting it stick). The real trap in the photograph is a
 * multi-face gully — pinned from several sides at once — which cannot be
 * constructed deterministically from a route's own geometry. So the net's
 * CONDITION is exercised directly: the car is held motionless, which is what
 * being wedged means physically, and the rescue must fire on schedule. The
 * two false-positive checks below use real physics, because those are the
 * ones that would hurt if they were wrong.
 *
 *   node tests/test-wedge-recovery.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg, extra); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(300000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=20&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.__game, null, { timeout: 120000 });
await page.click('#start-btn');
await page.evaluate(() => { window.__game.countdown = 0.01; });
await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 60000 });

const r = await page.evaluate(async () => {
  const g = window.__game, t = g.track;
  // fixed step, no rendering — the only way to measure this headlessly (see
  // test-field-stalls.mjs for why wall-clock probes lie here)
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
    get elapsedTime() { return elapsed; } };

  // `throttle`/`brake`/`steer` are GETTERS on Input — assigning them is a
  // silent no-op, which is exactly how the first version of this test came
  // back green-ish with a car that never moved at all. The virtual joystick's
  // `analog` is the writable source the getters read, and nothing zeroes it
  // headless (only the touch-end handler does).
  const hold = (throttle) => {
    g.input.analog.throttle = throttle;
    g.input.analog.brake = 0;
    g.input.analog.steer = 0;
  };

  // A REAL WEDGE, NOT A STEEP HILL. The first version of this test picked the
  // steepest ground it could find and called "the car moved 25 u" a rescue —
  // but at full throttle the car simply DROVE OFF the slope, in 1.25 s, and
  // the test reported a recovery that had not happened. A gradient is not a
  // trap; an immovable object is. So the car is set nose-first against a big
  // stone solid (a mountain), which is exactly the geometry the player's
  // photograph shows, and every claim below is measured off the RECOVERED
  // event itself rather than off displacement.
  const big = (t.solids ?? []).filter((s) => s.mat === 'stone' && s.r > 20)
    .sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))[0];
  if (!big) return { none: true };
  const ang = Math.atan2(big.z, big.x);
  const spot = {
    x: big.x + Math.cos(ang) * (big.r + 2.0),
    z: big.z + Math.sin(ang) * (big.r + 2.0),
  };
  spot.y = t.terrainHeight(spot.x, spot.z);
  // facing INTO the rock
  const face = Math.atan2(-(big.x - spot.x), -(big.z - spot.z));

  let rescues = 0;
  const realFeed = g.hud.feed.bind(g.hud);
  g.hud.feed = (msg, kind) => { if (msg === 'RECOVERED') rescues++; return realFeed(msg, kind); };

  const place = () => {
    const p = g.player;
    p.alive = true; p.health = p.maxHealth; p.mesh.visible = true;
    p.respawnTimer = 0; p.invuln = 999;
    p.pos.set(spot.x, spot.y, spot.z);
    p.y = spot.y; p.vel.set(0, 0, 0); p.speed = 0; p.airborne = false;
    p.heading = face;
    p._wedgeT = 0; p._lostT = 0;
  };

  // PINNED: the physics resolves to no motion, however hard the car pushes.
  //
  // The absorption has to happen INSIDE step(), because that is where a real
  // collision resolves it and because the recovery net reads the velocity
  // AFTER step returns. Zeroing it around the frame instead — the obvious
  // way, and the way this was written first — lets step re-accelerate the car
  // before the net ever looks, so the net correctly saw a moving car and the
  // test reported a fix that works as broken.
  const pin = (p) => {
    const orig = p.step.bind(p);
    p.step = (dt2, inp) => { orig(dt2, inp); p.vel.set(0, 0, 0); p.speed = 0; };
    return () => { delete p.step; };
  };

  place();
  hold(1);
  rescues = 0;
  let recoveredAt = -1;
  let unpin = pin(g.player);
  for (let f = 0; f < 720; f++) {            // 12 game-seconds
    g._frameBody();
    if (recoveredAt < 0 && rescues > 0) recoveredAt = f / 60;
    if (f % 120 === 0) await new Promise((rs) => setTimeout(rs, 0));
  }
  unpin();
  const stuck = { recoveredAt };

  // ---- PINNED THE SAME WAY, throttle RELEASED: must never be moved --------
  // This is the sightseeing case: a car standing still somewhere impossible
  // is a choice, and the net must not overrule it.
  const p = g.player;
  place();
  hold(0);
  rescues = 0;
  unpin = pin(p);
  for (let f = 0; f < 900; f++) {            // 15 game-seconds parked
    g._frameBody();
    if (f % 120 === 0) await new Promise((rs) => setTimeout(rs, 0));
  }
  unpin();
  const parkedRescues = rescues;

  // ---- and normal racing must never trip it --------------------------------
  p.placeAt(0, 0, true);
  p.vel.set(0, 0, 0); p._wedgeT = 0;
  hold(1);
  rescues = 0;
  let maxWedgeT = 0;
  for (let f = 0; f < 1800; f++) {           // 30 game-seconds of driving
    g._frameBody();
    maxWedgeT = Math.max(maxWedgeT, p._wedgeT ?? 0);
    if (f % 120 === 0) await new Promise((rs) => setTimeout(rs, 0));
  }
  const drove = Math.hypot(p.vel.x, p.vel.z);

  return { world: g.level.name, rockR: +big.r.toFixed(0),
    recoveredAt: stuck.recoveredAt,
    parkedRescues, raceRescues: rescues,
    maxWedgeT: +maxWedgeT.toFixed(1), drove: +drove.toFixed(0) };
});

if (r.none) { ok(false, 'the world has a big stone solid to wedge against'); }
else {
  console.log(`${r.world}: pinned nose-first against a ${r.rockR} u stone solid`);
  ok(r.recoveredAt >= 4.5 && r.recoveredAt <= 8,
    'a car wedged at full throttle is rescued at the five-second mark',
    `RECOVERED fired at ${r.recoveredAt}s`);
  ok(r.parkedRescues === 0,
    'a car PARKED in the same impossible spot is left alone — sightseeing is not a fault',
    `${r.parkedRescues} rescues in 15 s with the throttle released`);
  ok(r.raceRescues === 0 && r.maxWedgeT < 5,
    'normal racing never trips the rescue',
    `30 s of driving: ${r.raceRescues} rescues, longest stall ${r.maxWedgeT}s, ending at ${r.drove} u/s`);
}
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
