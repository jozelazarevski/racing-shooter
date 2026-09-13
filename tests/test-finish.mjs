/* R-FINISH-01 (RALLY_RACE_INTEGRITY.md, P0) — THE LINE ENDS THE RACE.
 *
 * The patch was written from capture R21, where the player crossed at
 * 3:21.7 and the game ran on past 3:23.7 with no results state. It names
 * two candidate causes and says to test both:
 *   1. the respawn placed the car PAST the trigger plane, so the crossing
 *      never happened;
 *   2. the trigger only fires in some states, and the shielded pass was
 *      ignored.
 *
 * r423 measured both at HEAD and neither reproduces. This suite is what
 * those measurements became, so the behaviour cannot regress quietly:
 *
 *   F1  the race reaches its terminal state on the crossing, in five
 *       vehicle states — grounded, airborne, drifting, shielded and
 *       mid-respawn (candidate 2)
 *   F2  ...within the rule's 500 ms (measured: 0 ms, same frame)
 *   F3  the input lock holds afterwards — the car does not drive on
 *   F4  no rescue taken on the closing stretch lands the car past the
 *       trigger plane (candidate 1)
 *
 * NOTE ON THE HARNESS, because seven straw men died getting here:
 *   - throttle/brake/steer/drift are GETTERS on Input.prototype. Assigning
 *     g.input.throttle does nothing at all, silently. Drive `analog`.
 *   - pl.speed is a stale field: it reads back what you last wrote and does
 *     not change under throttle. Never measure motion with it — use real
 *     world-position displacement.
 *   - wrapping pl.step to force throttle lands AFTER the input lock has
 *     zeroed the inputs, so it bypasses the very lock F3 tests.
 *   - a wrapper left on _frameBody leaks into every later case.
 *
 *   node tests/test-finish.mjs
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (c, m, e = '') => { if (c) { pass++; console.log('PASS ', m, e); } else { fail++; console.log('FAIL ', m, e); } };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
const errors = [];
p.on('pageerror', (e) => errors.push(String(e.message)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });

const R = await p.evaluate(async () => {
  const g = window.__game;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
              get elapsedTime() { return elapsed; } };
  const N = g.track.center.length;
  const ORIG_STEP = Object.getPrototypeOf(g.player).step;
  const ORIG_BODY = g._frameBody.bind(g);
  const out = { N, cases: [], rescue: [] };

  const hold = ({ throttle = 0, brake = 0, steer = 0, drift = false }) => {
    g.input.autoThrottle = false; g.input.bothSteer = false;
    g.input.analog.throttle = throttle;
    g.input.analog.brake = brake;
    g.input.analog.steer = steer;
    if (drift) g.input.keys.add('ShiftLeft'); else g.input.keys.delete('ShiftLeft');
  };
  const drive = () => hold({ throttle: 1 });
  const arm = (pl) => {
    pl._cpMask = 0b1111; pl._midCP = true; pl._everCP1 = true;
    pl.lap = g.lapsTotal; pl.finished = false;
  };

  const runCase = (name, setup) => {
    const pl = g.player;
    pl.step = ORIG_STEP;
    g._frameBody = ORIG_BODY;
    hold({});
    g.state = 'race';
    pl.placeAt(Math.floor(N * 0.985), 0, true);
    arm(pl);
    for (let f = 0; f < 30; f++) g._frameBody();
    arm(pl);
    setup(pl, g);
    let endedAt = -1, crossAt = -1, movedAfterM = 0, lastPos = null;
    for (let f = 0; f < 600; f++) {
      const prev = pl.trackIndex;
      g._frameBody();
      if (crossAt < 0 && prev > N * 0.85 && pl.trackIndex < N * 0.15) crossAt = f;
      if (g.state === 'finished' && endedAt < 0) endedAt = f;
      if (endedAt >= 0 && f > endedAt) {
        if (lastPos) movedAfterM += Math.hypot(pl.mesh.position.x - lastPos.x,
                                               pl.mesh.position.z - lastPos.z);
        lastPos = { x: pl.mesh.position.x, z: pl.mesh.position.z };
      }
    }
    return { name, crossed: crossAt >= 0, ended: endedAt >= 0,
      latencyMs: (crossAt >= 0 && endedAt >= 0) ? Math.round((endedAt - crossAt) * 1000 / 60) : null,
      rollOnM: Math.round(movedAfterM) };
  };

  out.cases.push(runCase('grounded', () => drive()));
  out.cases.push(runCase('airborne', (pl) => {
    drive(); pl.airborne = true; pl.mesh.position.y += 6; pl.vel.y = 2;
  }));
  out.cases.push(runCase('drifting', (pl, gg) => {
    // build speed on the throttle, handbrake only in the last metres: a held
    // handbrake from a standing start never reaches the line at all
    drive();
    const body = gg._frameBody.bind(gg);
    gg._frameBody = () => {
      if (pl.trackIndex > N - 3) hold({ throttle: 1, steer: 0, drift: true });
      return body();
    };
  }));
  out.cases.push(runCase('shielded', (pl) => { drive(); pl.invuln = 5; pl.shieldT = 5; }));
  out.cases.push(runCase('mid-respawn', (pl) => { drive(); pl._teleportFrames = 8; }));

  // F4 — candidate 1: can a rescue put the car past the trigger plane?
  {
    const pl = g.player;
    pl.step = ORIG_STEP; g._frameBody = ORIG_BODY; hold({}); g.state = 'race';
    for (const startIdx of [880, 890, 895, 898, 899]) {
      pl.placeAt(startIdx, 0, true);
      arm(pl);
      for (let f = 0; f < 10; f++) g._frameBody();
      const before = pl.trackIndex;
      pl.unstuckCool = 0;
      pl._unstuckReq = true;              // the rescue is a FLAG, not a method
      for (let f = 0; f < 30; f++) g._frameBody();
      const after = pl.trackIndex;
      out.rescue.push({ before, after, pastLine: before > N * 0.85 && after < N * 0.5 });
    }
  }
  return out;
});
await browser.close();

for (const c of R.cases) {
  ok(c.crossed && c.ended, `F1 ${c.name}: crossing ends the race`,
    `crossed=${c.crossed} ended=${c.ended}`);
  if (c.crossed && c.ended) {
    ok(c.latencyMs !== null && c.latencyMs <= 500,
      `F2 ${c.name}: terminal state within 500 ms`, `${c.latencyMs} ms`);
    ok(c.rollOnM <= 15, `F3 ${c.name}: input locked, car does not drive on`,
      `${c.rollOnM} m rolled`);
  }
}
const past = R.rescue.filter((r) => r.pastLine);
ok(past.length === 0, 'F4 no rescue on the closing stretch lands past the trigger plane',
  R.rescue.map((r) => `${r.before}->${r.after}`).join(' '));

if (errors.length) { fail++; console.log('FAIL  page errors:', errors.slice(0, 3)); }
console.log(fail ? `\n${fail} FAILED` : `\n${pass} passed, 0 failed — the line ends the race`);
process.exit(fail ? 1 : 0);
