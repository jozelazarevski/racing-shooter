/* DOES THE DUEL RIVAL ACTUALLY DRIVE?
 *
 * Reported as "mission duel is broken, opponent cars are frozen".
 *
 * The design intent is explicit and already written down: a DUEL keeps ONE
 * rival and drives it with the real race AI (main.js, `const keepsRival =
 * def.duel || def.pursuit`). `tests/test-missions-duel.mjs` already pins the
 * SHAPE of that — one rival alive, nobody armed, the medal is a margin — and
 * it passes while the rival stands still, because "alive" is a flag and
 * "moving" is a measurement. This file is the measurement. The two are
 * complementary; neither replaces the other.
 *
 * ROOT CAUSE THIS GATE EXISTS TO PIN. Missions ride on the roam machinery, so
 * the constructor sets `freeRoam = true` for `mode=missions`. The per-frame
 * rival step was gated on `!this.freeRoam`, so the one rival a DUEL had just
 * kept, made alive, made visible and named in the HUD feed was never stepped.
 * Drawn every frame, updated never.
 *
 * ---- THREE MEASUREMENT TRAPS THIS FILE IS BUILT AROUND ------------------
 *
 * 1. A FIXED-STEP HARNESS CANNOT ANSWER THIS. Anything owning its own
 *    requestAnimationFrame is never advanced by a `g.frame()` loop and reads
 *    as frozen when it is not. So every law below is measured inside a REAL
 *    rAF chain. The render is stubbed and NOTHING else is: measured on the
 *    CI box, this game renders at 1.28 fps under swiftshader (a blank page
 *    rAFs at 59.8) and `dt` is clamped to 0.05, so game time advances 0.064 s
 *    per real second — a 3 s countdown takes 47 s of wall clock and every
 *    trace is 20x too short to mean anything. With `composer.render` stubbed
 *    the same Game.frame() runs on the same rAF chain in the same order at a
 *    measured 48.9 fps. Pixels are the only thing given up.
 *
 * 2. A START INDEX AGAINST AN END INDEX IS NOT A DISTANCE. It cannot tell
 *    +500 forward through the lap wrap from -400 backward. Travel is
 *    accumulated PER FRAME with a signed shortest-arc delta.
 *
 * 3. "IT MOVED" IS NOT "IT WAS STEPPED", AND THE DIFFERENCE IS THE BUG.
 *    A car can be stepped and not move (wall, kerb, no racing line) and a
 *    mesh can be moved by something other than its own update. So LAW 1
 *    instruments `EnemyCar.prototype.update` and COUNTS THE CALLS rather than
 *    inferring them from position.
 *
 * ---- THE LAWS ----------------------------------------------------------
 *
 *   0. POSITIVE CONTROL — an ordinary race's rivals are stepped and do
 *      circulate. Without it every law below could pass by matching nothing:
 *      a broken harness, a car that never spawns and a world that fails to
 *      build all read as "no movement" too.
 *   1. THE DUEL RIVAL IS STEPPED, on essentially every frame.
 *   2. THE DUEL RIVAL COVERS GROUND — real speed, real distance along the lap.
 *   3. PURSUIT, the other `keepsRival` mode, does the same. Duel and pursuit
 *      share one code path, so this is what says whether a regression is in
 *      the duel branch or in the shared one.
 *   4. A DUEL IS STILL A DUEL — exactly one rival, for the WHOLE run.
 *      This is not decoration. The culled six are set `alive = false` with
 *      `respawnTimer` left at its constructor 0, and the dead branch of
 *      EnemyCar.update is `respawnTimer -= dt; if (<= 0) respawn()`. So the
 *      obvious fix — just drop the `!freeRoam` gate — puts all seven back on
 *      the road on the first frame and a duel silently becomes a race.
 *      Measured directly: stepping the whole field gives 7 alive within 12 s.
 *      This law is what stops that fix being shipped as this one.
 *   5. No page errors. A runtime binding error passes `node --check`.
 *
 * ---- RUNNING -----------------------------------------------------------
 *
 *   node tests/test-duel-rival.mjs
 *
 * PATCH=1 serves a patched `src/main.js` through request interception instead
 * of the tree's own. It exists for one reason: the fix belongs in main.js,
 * this gate was written in a session that did not own that file, and a gate
 * nobody has ever seen go green is not evidence of anything. It is a
 * PROOF-OF-FIX switch, not an escape hatch — it never loosens a threshold,
 * and once the patch is in the tree it should be deleted along with this
 * paragraph.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const PATCH = process.env.PATCH === '1';
const LEVEL = process.env.LEVEL ?? '1';
// 30 s of GAME time. At the measured 48.9 fps with the render stubbed that is
// ~30 s of wall clock too, and it is comfortably more than the ~8 s the AI
// needs to get off the line and up to pace.
const SECONDS = +(process.env.SECONDS ?? 30);

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

// ---- THE PENDING main.js PATCH, for PATCH=1 -------------------------------
const PATCH_FROM = `      if (!this.freeRoam && (this.state === 'race' || this.state === 'finished' || this.state === 'countdown')) {
        for (const e of this.enemies) {`;
const PATCH_TO = `      const rivals = this.freeRoam
        ? (this.missionFoe?.alive ? [this.missionFoe] : [])
        : this.enemies;
      if (rivals.length && (this.state === 'race' || this.state === 'finished' || this.state === 'countdown')) {
        for (const e of rivals) {`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

/** One run: boot, launch `mode`, drive, and report what the rival did. */
async function run(mode) {
  const page = await browser.newPage({ viewport: { width: 640, height: 420 } });
  page.setDefaultTimeout(600000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));

  let patched = null;
  if (PATCH) {
    // A REGEX, NOT A GLOB. index.html asks for `./src/main.js?v=r211`, and `?`
    // is a glob metacharacter in some matchers — a pattern that quietly failed
    // to match would leave the tree's own main.js in place and report the fix
    // as not working. The `patched` assertion below is the belt to this brace.
    await page.route(/\/src\/main\.js/, async (route) => {
      const res = await route.fetch();
      const body = await res.text();
      patched = body.includes(PATCH_FROM);
      // DROP content-length AND content-encoding. The patched body is ~1.9 kB
      // longer than the original, so reusing the upstream content-length
      // truncates the module mid-statement — and a truncated module fails as
      // a syntax error at load, which would look exactly like "the fix broke
      // the game" rather than like a bug in this harness.
      const h = { ...res.headers(), 'content-type': 'text/javascript' };
      delete h['content-length']; delete h['content-encoding'];
      route.fulfill({ status: res.status(), headers: h,
        body: patched ? body.replace(PATCH_FROM, PATCH_TO) : body });
    });
  }

  const urlMode = mode === 'race' ? 'race' : 'missions';
  await page.goto(`${BASE}/?level=${LEVEL}&mode=${urlMode}&unlockall=1`,
    { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });

  const R = await page.evaluate(async ({ mode, SECONDS }) => {
    const g = window.__game, t = g.track, N = t.N;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    g.composer.render = () => {};        // pixels only — see the header

    // COUNT THE CALLS. Observed, not inferred from position.
    const proto = Object.getPrototypeOf(g.enemies[0]);
    const realUpdate = proto.update;
    let foeSteps = 0;
    proto.update = function (dt) {
      if (this === (g.missionFoe ?? g.enemies[0])) foeSteps++;
      return realUpdate.call(this, dt);
    };

    if (mode !== 'race') { g.missionMode = true; g.missionSel = mode; }
    g.startRace();                       // the real player-facing entry point

    // RAIL THE PLAYER ALONG THE RACING LINE. A parked player is not a stuck
    // player and an unsteered car at full throttle just drives off the road,
    // so it gets throttle AND steering. `input.throttle` is a GETTER —
    // assigning to it silently does nothing; `input.analog` is the writable
    // channel. Steering is heading-to-heading: `forward` is
    // (sin h, cos h), so the error is atan2(dx, dz) - heading, wrapped.
    const drive = () => {
      const p = g.player;
      g.input.analog.throttle = 0.6;
      g.input.analog.brake = 0;
      const line = t._raceLine;
      const look = Math.max(8, Math.min(28, Math.round(8 + Math.abs(p.speedAlong) * 0.5)));
      const li = (p.trackIndex + look) % N;
      const aim = t.pointAt(li, line ? line[li] : 0);
      let d = Math.atan2(aim.x - p.pos.x, aim.z - p.pos.z) - p.heading;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      g.input.analog.steer = Math.max(-1, Math.min(1, d * 1.2));
    };

    // signed shortest-arc delta — trap 2 in the header
    const wrapD = (a, b) => { let d = b - a; if (d > N / 2) d -= N; if (d < -N / 2) d += N; return d; };

    let acc = 0, prev = null, frames = 0, maxS = 0, sumS = 0, nS = 0;
    let maxAlive = 0, minAlive = 99;
    const t0 = performance.now();
    while ((performance.now() - t0) / 1000 < SECONDS) {
      drive();
      await frame();
      frames++;
      const nAlive = g.enemies.filter((e) => e.alive).length;
      maxAlive = Math.max(maxAlive, nAlive); minAlive = Math.min(minAlive, nAlive);
      const foe = g.missionFoe ?? g.enemies[0];
      if (foe) {
        if (prev !== null) acc += wrapD(prev, foe.trackIndex);
        prev = foe.trackIndex;
        const s = Math.abs(foe.speedAlong ?? 0);
        maxS = Math.max(maxS, s); sumS += s; nS++;
      }
    }
    proto.update = realUpdate;

    // NORMALISE BY GAME TIME, NOT BY WALL CLOCK. `resetRace` zeroes
    // `raceTime` and the frame loop accumulates the same clamped `dt` the
    // physics runs on, so `lap / raceTime` is a property of the CAR. Wall
    // clock is a property of the box: this suite shares a 4-core runner with
    // other agents and has been measured at both 48.9 fps idle and under 2
    // fps loaded, and `dt` clamps at 0.05 — so a wall-clock threshold turns a
    // busy machine into a red gate.
    const raceT = g.raceTime ?? 0;
    const foe = g.missionFoe ?? g.enemies[0];
    return {
      mode, frames, seconds: +((performance.now() - t0) / 1000).toFixed(1),
      raceT: +raceT.toFixed(1),
      foeName: foe?.name ?? null, foeAlive: !!foe?.alive,
      isMissionFoe: !!g.missionFoe && g.missionFoe === foe,
      foeSteps, stepFrac: frames ? +(foeSteps / frames).toFixed(2) : 0,
      maxAlive, minAlive,
      maxSpeed: +maxS.toFixed(2), avgSpeed: nS ? +(sumS / nS).toFixed(2) : 0,
      lapFrac: +(acc / N).toFixed(3), travel: Math.round(acc),
      lapPerSec: raceT > 0 ? +(acc / N / raceT).toFixed(4) : 0,
      raceLine: t._raceLine ? t._raceLine.length : 0,
      freeRoam: g.freeRoam, missionMode: g.missionMode,
    };
  }, { mode, SECONDS });

  R.errors = errors;
  R.patched = patched;
  await page.close();
  return R;
}

console.log(`duel-rival: BASE=${BASE} level=${LEVEL} ${SECONDS}s per run`
  + (PATCH ? '  [PATCH=1 — pending main.js fix served by interception]' : ''));

const race = await run('race');
const duel = await run('duel');
const pursuit = await run('pursuit');

const show = (R) => console.log(
  `  ${R.mode.padEnd(8)} rival="${R.foeName}" stepped ${R.foeSteps}/${R.frames} frames (${R.stepFrac})`
  + `  speed max ${R.maxSpeed} avg ${R.avgSpeed}  travel ${R.travel} idx = ${R.lapFrac} lap`
  + ` in ${R.raceT}s race time = ${R.lapPerSec} lap/s`
  + `  alive ${R.minAlive}-${R.maxAlive}  freeRoam=${R.freeRoam}`);
console.log('');
for (const R of [race, duel, pursuit]) show(R);
console.log('');

if (PATCH) {
  ok(duel.patched === true,
    'PATCH=1 actually found and replaced the gate it targets — a patch that '
    + 'matched nothing would make every law below meaningless',
    `matched=${duel.patched}`);
}

// ---- LAW 0: POSITIVE CONTROL ---------------------------------------------
// Measured on PINE VALLEY, 30 s: 1203 steps in 1399 frames (0.86 — the
// shortfall is the frames before `startRace` and the 3 s countdown, where
// rivals get syncMesh(0) instead), max speed 42.65, travel 0.462 lap.
// Floors sit well under each so the control is not a target to code towards.
ok(race.foeSteps > race.frames * 0.5,
  'CONTROL: an ordinary race steps its rivals every frame — if this fails the '
  + 'harness is broken and nothing below means anything',
  `${race.foeSteps}/${race.frames}`);
ok(race.lapPerSec > 0.006 && race.maxSpeed > 20,
  'CONTROL: and they circulate — measured 0.462 lap in 30 s of race time '
  + '(0.0154 lap/s) at up to 42.65 u/s',
  `${race.lapPerSec} lap/s, max ${race.maxSpeed} u/s`);
// Rule 4 of tests/README: a check conditional on finding something to measure
// must assert separately that it DID. If the run never got out of the
// countdown — which is what a badly loaded box does — every distance below is
// legitimately zero and would fail for the wrong reason.
ok(race.raceT > 10 && duel.raceT > 10 && pursuit.raceT > 10,
  'the three runs each got more than 10 s of RACE TIME, so the distances below '
  + 'are measuring a race and not a countdown',
  `race ${race.raceT}s, duel ${duel.raceT}s, pursuit ${pursuit.raceT}s`);

// ---- LAW 1: THE DUEL RIVAL IS STEPPED ------------------------------------
// Measured BEFORE the fix: 0 calls in 1498 frames — not "few", none.
ok(duel.foeSteps > duel.frames * 0.5,
  'LAW 1: a DUEL steps its rival — it is drawn every frame, so it must be '
  + 'updated every frame (measured before the fix: 0 calls in 1498 frames)',
  `${duel.foeSteps}/${duel.frames} frames`);

// ---- LAW 2: AND IT COVERS GROUND -----------------------------------------
// Measured WITH the fix over 40 s: max 45.89 u/s, avg 36.58, 0.778 lap of
// travel = 0.0195 lap per second of race time, against the race control's
// 0.0154. The floors are 0.006 lap/s and 20 u/s — roughly a third of both
// measurements, far enough below to survive a slower world or a first-corner
// mistake, and nowhere a frozen car can reach.
ok(duel.lapPerSec > 0.006,
  'LAW 2: and it covers ground — distance ALONG THE LAP, accumulated per '
  + 'frame (measured 0.0195 lap/s with the fix, 0.0000 without; the race '
  + 'control runs 0.0154)',
  `${duel.lapPerSec} lap/s (${duel.lapFrac} lap in ${duel.raceT}s)`);
ok(duel.maxSpeed > 20,
  'LAW 2: at racing speed, not a crawl — measured max 45.89 u/s with the fix',
  `max ${duel.maxSpeed} u/s`);
ok(duel.raceLine > 0,
  'LAW 2: and the AI has a racing line to follow. It is built lazily INSIDE '
  + 'EnemyCar.update, so a rival that is never stepped never gets one — '
  + 'measured _raceLine.length 0 before the fix, 900 after',
  `_raceLine=${duel.raceLine}`);

// ---- LAW 3: PURSUIT, THE OTHER keepsRival MODE ---------------------------
ok(pursuit.foeSteps > pursuit.frames * 0.5 && pursuit.lapPerSec > 0.006,
  'LAW 3: PURSUIT drives its runner too — duel and pursuit share one rival '
  + 'path, so this is what says whether a break is in the duel branch or in '
  + 'the shared one (both measured 0 steps before the fix)',
  `${pursuit.foeSteps}/${pursuit.frames} frames, ${pursuit.lapPerSec} lap/s`);

// ---- LAW 4: A DUEL IS STILL A DUEL ---------------------------------------
// Stepping the whole field instead of just `missionFoe` respawns the culled
// six on frame 1 (respawnTimer starts at 0): measured 7 alive within 12 s.
ok(duel.maxAlive === 1 && duel.minAlive === 1,
  'LAW 4: exactly ONE rival for the WHOLE run — the culled six start with '
  + 'respawnTimer 0, so stepping the field instead of the mission foe brings '
  + 'all seven back (measured: 7 alive within 12 s) and a duel becomes a race',
  `alive ranged ${duel.minAlive}-${duel.maxAlive}`);
ok(duel.isMissionFoe && duel.foeAlive,
  'LAW 4: and the car being measured is the one the mission named as the foe — '
  + 'the same object the HUD feed announces',
  `isMissionFoe=${duel.isMissionFoe} alive=${duel.foeAlive}`);

// ---- LAW 5: pageerror ----------------------------------------------------
const allErr = [...race.errors, ...duel.errors, ...pursuit.errors];
ok(allErr.length === 0, 'LAW 5: no page errors in any of the three runs',
  allErr.slice(0, 3).join('\n'));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
