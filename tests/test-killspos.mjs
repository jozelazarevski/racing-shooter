/* v1.5 PHASE 2 (r311): §3.6 progress-based stuck + §6.10 kills affect position.
 *
 *   P1  a rival destroyed mid-race holds ~4 s, then respawns at the gate it
 *       last passed, still owing the next — and the killer's position
 *       improves or holds (Q22)
 *   P2  §3.6: a car making NO along-track progress with throttle held is
 *       rescued at stuckDetectS even while its bodywork slides metres
 *       sideways (the creep that defeated the old 6 m displacement anchor)
 *   P3  ...and an honest slow crawl that IS progressing is never touched
 *
 *   node tests/test-killspos.mjs
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
  const g = window.__game, pl = g.player, t = g.track, N = t.center.length;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  const evs = [];
  const rl = g.telemetry.log.bind(g.telemetry);
  g.telemetry.log = (k, d) => { evs.push({ k, ...d }); return rl(k, d); };
  for (let f = 0; f < 600; f++) g._frameBody();       // 10 s of racing settles the field

  // ---- P1: kill the rival directly ahead of the player -------------------
  const ahead = g.enemies.filter((e) => e.alive && e.progress > pl.progress)
    .sort((a, b) => a.progress - b.progress)[0] ?? g.enemies.find((e) => e.alive);
  const lastGate = ((ahead._nextGate ?? 0) - 1 + g.route.gates.length) % g.route.gates.length;
  const victimWasAhead = ahead.progress > pl.progress;
  const victimProgBefore = ahead.progress;
  const rankBefore = g.playerRank;
  ahead.damage(9999, pl, true);
  const deadAt = g.raceTime;
  let held = 0;
  for (let f = 0; f < 400 && !ahead.alive; f++) { g._frameBody(); held = g.raceTime - deadAt; }
  // MASTER FIX-8b: the wreck re-enters BEHIND THE PLAYER (>= 150 m back,
  // clamped at the lap line), not at its own last gate. Measure against
  // the player at the respawn moment.
  const behindM = (pl.trackIndex - ahead.trackIndex) * (t.segLen ?? 4);
  const atLapLineClamp = ahead.trackIndex === 0;
  const oweGate = g.route.gates.find((q) => q.si > ahead.trackIndex) ?? g.route.gates[0];
  for (let f = 0; f < 60; f++) g._frameBody();
  return {
    p1: {
      destroyedEv: evs.some((e) => e.k === 'rivalDestroyed'),
      returnEv: evs.filter((e) => e.k === 'return' && e.reason === 'kill').length,
      held: +held.toFixed(2), behindM: +behindM.toFixed(0), atLapLineClamp,
      owes: ahead._nextGate, oweGate: oweGate.id, tailPace: (ahead._tailPaceT ?? 0) > 0,
      rankBefore, rankAfter: g.playerRank,
      victimWasAhead, victimNowBehind: ahead.progress < pl.progress,
      victimProgBefore: +victimProgBefore.toFixed(3),
      victimProgAfter: +ahead.progress.toFixed(3),
    },
  };
});
ok(R.p1.destroyedEv && R.p1.returnEv >= 1,
  'P1 a rival kill logs rivalDestroyed and a kill-return (Q22 telemetry)',
  `destroyed=${R.p1.destroyedEv}, returns=${R.p1.returnEv}`);
ok(R.p1.held >= 3.8 && R.p1.held <= 5.5,
  'P1 the destroyed rival holds ~4.0 s before coming back',
  `${R.p1.held}s`);
// MASTER FIX-8b (supersedes the r311 last-gate law): the wreck re-enters
// BEHIND THE PLAYER, >= 150 m back or clamped at the lap line, owing the
// gate ahead of its new position, at tail pace.
ok((R.p1.behindM >= 140 || R.p1.atLapLineClamp) && R.p1.owes === R.p1.oweGate && R.p1.tailPace,
  'P1 it respawns >= 150 m behind the player at tail pace (FIX-8b)',
  `${R.p1.behindM} m behind${R.p1.atLapLineClamp ? ' (lap-line clamp)' : ''}, owes gate ${R.p1.owes}, tailPace ${R.p1.tailPace}`);
// Q22's mechanism, rig-honestly: the kill CONFISCATES the victim's
// progress back to its last gate (position is progress-anchored, so the
// killer gains exactly the ground the victim loses). Absolute rank here
// measures this rig's parked player, and "drops behind the killer" only
// holds when the victim was within a gate of them - neither is the law.
ok(R.p1.victimProgAfter < R.p1.victimProgBefore - 0.001,
  'P1 the kill confiscates the victim\'s progress back to its last gate',
  `progress ${R.p1.victimProgBefore} -> ${R.p1.victimProgAfter} (rank context ${R.p1.rankBefore}->${R.p1.rankAfter}, rig parks through the hold)`);

// ---- P2/P3: the progress-based stuck law -----------------------------------
const S = await p.evaluate(async () => {
  const g = window.__game, pl = g.player, t = g.track, N = t.center.length;
  let rescues = 0;
  const rl = g.telemetry.log.bind(g.telemetry);
  g.telemetry.log = (k, d) => { if (k === 'unstuck') rescues++; return rl(k, d); };
  // P2: NO along-track progress, sliding SIDEWAYS 3 m/s with throttle held —
  // the creep that cleared the old 6 m anchor in under 2.5 s and defeated it
  const anchor = (pl.trackIndex + Math.floor(N / 3)) % N;
  pl.placeAt(anchor, 0, true);
  const c0 = t.center[anchor], n0 = t.nrm[anchor];
  g.input.analog.throttle = 1;
  rescues = 0;
  let firedAt = -1, lat = 0;
  const orig = pl.step.bind(pl);
  pl.step = (dt, inp) => {
    orig(dt, inp);
    lat += 3 * dt;                     // bodywork slides outward, course-progress zero
    pl.pos.set(c0.x + n0.x * (2 + lat), c0.y, c0.z + n0.z * (2 + lat));
    pl.y = c0.y; pl.vel.set(0, 0, 0);
  };
  for (let f = 0; f < 300; f++) {
    g._frameBody();
    if (firedAt < 0 && rescues > 0) firedAt = f / 60;
  }
  pl.step = orig;
  const p2 = { firedAt: +firedAt.toFixed(2), slid: +lat.toFixed(1) };
  // P3: an honest 2 m/s crawl ALONG the course, throttle held, never
  // touched by the 2.5 s zero-progress wedge. The old rig snapped pos to
  // the CENTER SAMPLE each frame, so the fractional-progress meter (r358)
  // read frac 0 and alongW froze for a whole segLen between crossings —
  // 2.0-2.8 s of apparent standstill, and the wedge fired on a rig
  // artifact. The crawl now moves CONTINUOUSLY between samples, as a real
  // crawling car does. (MASTER FIX-7, §5.5, will make ANY < 8 km/h crawl
  // stuck at 6 s — this check gets rewritten to that law when FIX-7
  // lands on the rebuilt geometry.)
  pl.placeAt(anchor, 0, true); pl.vel.set(0, 0, 0);
  rescues = 0;
  const orig2 = pl.step.bind(pl);
  let s = 0;
  pl.step = (dt, inp) => {
    orig2(dt, inp);
    s += 2 * dt / (t.segLen ?? 4);     // crawl forward 2 m/s along the lap
    const i = (anchor + Math.floor(s)) % N, i2 = (i + 1) % N;
    const fr = s - Math.floor(s);
    const c = t.center[i], c2 = t.center[i2];
    pl.pos.set(c.x + (c2.x - c.x) * fr, c.y + (c2.y - c.y) * fr, c.z + (c2.z - c.z) * fr);
    pl.y = pl.pos.y; pl.trackIndex = i; pl.vel.set(0, 0, 0);
  };
  for (let f = 0; f < 360; f++) g._frameBody();       // 6 s of crawling
  pl.step = orig2;
  g.input.analog.throttle = 0;
  return { p2, p3: { rescues } };
});
ok(S.p2.firedAt > 0 && S.p2.firedAt <= 3.5,
  'P2 zero course-progress with throttle held is STUCK at ~2.5 s — sideways metres do not defeat it',
  `rescued at ${S.p2.firedAt}s having slid ${S.p2.slid} m sideways (the old anchor never fired here)`);
ok(S.p3.rescues === 0,
  'P3 an honest 2 m/s crawl that IS progressing is never touched by the wedge',
  `${S.p3.rescues} rescues in 6 s`);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
