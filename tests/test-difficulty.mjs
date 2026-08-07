/* Difficulty, as a test.
 *
 * THE DEFECT: the two knobs pointed opposite ways. Rival pace is
 * `baseMaxSpeed * aiSpeed * max(0.7, band)`, and `band` scales with
 * `rubberBand` — which ran BACKWARDS against `aiSpeed`. EASY carried the
 * biggest catch-up boost (1.25) and HARD the smallest (0.75), so at the moment
 * the player was leading — exactly when a difficulty setting is meant to bite —
 * the three tiers converged to within 11% of each other against a nominal
 * spread of 25%. Measured, the best HARD rival was only 15% quicker than the
 * best EASY one, and a stand-in player holding THREE-QUARTER throttle finished
 * P1 of 6 on all three tiers.
 *
 * `aiSpeed` also turned out to be a weak lever: rivals corner at
 * `vMax = sqrt(aLat / curvature)` and aLat carried aiSpeed, so under the square
 * root a 16% raise bought 7.7% of corner speed — exactly the 7% of race
 * distance it produced. Hence `aiCorner`, a separate lateral-grip knob, which
 * is what actually sets a tier's pace because corners are where the time is.
 *
 * WHAT THIS ASSERTS is the SHAPE of the ladder, not exact distances — terrain
 * differs per world and a distance target would be a change-detector. The
 * player stand-in is a perfect-line robot that never lifts, so its absolute
 * margin flatters it; the rival-to-rival comparison is the honest part and is
 * what the ordering checks rest on.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const run = async (page, diff, skill) => page.evaluate(({ diff, skill }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  const D = (window.__DIFFS ?? {})[diff];          // the SHIPPING table, not a copy
  if (D) g.difficulty = D;
  g.state = 'race';
  const car = g.player;
  const all = [car, ...(g.enemies ?? [])];
  all.forEach((c, k) => {
    const slot = t.gridSlot ? t.gridSlot(k) : { index: 10 + k * 3, lateral: (k % 2 ? 3.6 : -3.6) };
    const pt = t.pointAt(slot.index, slot.lateral);
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(slot.index, slot.lateral) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = slot.index; c.lateral = slot.lateral;
    c.heading = t.headingAt(slot.index);
    c.vel.set(0, 0, 0); c.speedAlong = 0;
  });
  const SECS = 70, dt = 1 / 60;
  let dist = 0, lastIdx = car.trackIndex;
  const rd = new Array((g.enemies ?? []).length).fill(0);
  const rl = (g.enemies ?? []).map((e) => e.trackIndex);
  const adv = (cur, prev) => { let d = cur - prev; if (d > N / 2) d -= N; if (d < -N / 2) d += N; return d; };
  for (let k = 0; k < SECS * 60; k++) {
    const i = car.trackIndex, aim = t.center[(i + 8) % N];
    let a = Math.atan2(aim.x - car.pos.x, aim.z - car.pos.z) - car.heading;
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    const prevIdx = car.trackIndex;
    car.step(dt, { throttle: skill, brake: 0, steer: Math.max(-1, Math.min(1, a * 2)), drift: false, hold: false });
    // THE PLAYER HAS TO LAP TOO. Without this the stand-in's `_wraps` stays 0
    // while the rivals' rises, so once they complete a lap
    // `gap = player.progress - this.progress` FLIPS SIGN — silently inverting
    // the rubber band and every gap-gated branch (defence, nitro) for the rest
    // of the run. This harness shipped with that bug in r88, so the difficulty
    // numbers in that release were measured through an inverted band.
    car.checkLap?.(prevIdx);
    dist += adv(car.trackIndex, lastIdx); lastIdx = car.trackIndex;
    (g.enemies ?? []).forEach((e, n) => {
      if (!e.alive) return;
      e.update?.(dt);
      rd[n] += adv(e.trackIndex, rl[n]); rl[n] = e.trackIndex;
    });
  }
  const best = Math.max(0, ...rd);
  return { player: Math.round(dist), best: Math.round(best), place: rd.filter((d) => d > dist).length + 1 };
}, { diff, skill });

for (const [id, name] of [[1, 'PINE VALLEY'], [21, 'FURKA RIDGE']]) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 240000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  // A SLOW run, where the catch-up band is idle and the tiers show their true
  // pace. Measuring the spread while the player runs away understates it by
  // construction now that the band scales the CORNER budget: EASY's rivals are
  // designed to close up and HARD's are designed not to, so under domination
  // the tiers converge on purpose. At 0.6 throttle nobody is running away.
  const eSlow = await run(p, 'easy', 0.6);
  const hSlow = await run(p, 'hard', 0.6);

  const e = await run(p, 'easy', 0.75);
  const n = await run(p, 'normal', 0.75);
  const h = await run(p, 'hard', 0.75);
  const hFast = await run(p, 'hard', 1.0);

  // 1. THE LADDER IS A LADDER. This is the one the old numbers failed: with the
  //    band inverted, HARD rivals were barely quicker than EASY ones.
  check(`${name}: rival pace rises with difficulty`, e.best < n.best && n.best < h.best,
    `easy ${e.best} < normal ${n.best} < hard ${h.best}`);

  // 2. The tiers must be far enough apart to feel different — but the RATIO is
  //    a proxy, and on a tight track it misfires. A rival's no-slip lateral
  //    limit is about 54 m/s^2, and HARD's grip budget runs 47.8-95.7, so HARD
  //    is already asking for more grip than the car has and slip caps it. On a
  //    mountain road where EASY still has headroom and HARD does not, the tiers
  //    compress against PHYSICS, not against bad tuning: FURKA measured 10%
  //    while PINE VALLEY measured 26% on the same build.
  //
  //    So the floor is 10%, and the check that actually carries the meaning is
  //    the OUTCOME pair below — EASY winnable, HARD not — which held on both
  //    worlds throughout.
  const spread = hSlow.best / Math.max(1, eSlow.best);
  check(`${name}: EASY to HARD is a real gap`, spread >= 1.15,
    `with the band idle, hard is ${(spread * 100 - 100).toFixed(0)}% faster than easy`);

  // 2b. The tiers must produce DIFFERENT RESULTS for the same drive. This is
  //     the property a ratio was standing in for, and it is not fooled by a
  //     track where both ends saturate.
  check(`${name}: the same drive gets a different result per tier`,
    e.place === 1 && h.place > 1,
    `same 75% throttle drive: EASY P${e.place}, NORMAL P${n.place}, HARD P${h.place}`);

  // 3. HARD PUNISHES A SLOPPY LAP. A three-quarter-throttle drive must not
  //    stroll to victory — that was true on every tier before.
  check(`${name}: HARD beats a sloppy drive`, h.best > h.player * 0.97,
    `at 75% throttle the player made ${h.player} against a best rival of ${h.best} (P${h.place})`);

  // 4. ...but a clean lap must still win, or HARD is not a difficulty, it is a
  //    wall. The stand-in drives a perfect line, so this is a weak upper bound
  //    rather than proof a human can win.
  check(`${name}: HARD is still winnable clean`, hFast.player > hFast.best,
    `at full throttle ${hFast.player} vs ${hFast.best} (P${hFast.place})`);

  // 5. EASY has to stay casual-winnable — the whole point of it.
  check(`${name}: EASY stays casual-winnable`, e.place === 1 && e.player > e.best,
    `at 75% throttle ${e.player} vs ${e.best} (P${e.place})`);

  await p.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe ladder is a ladder');
process.exit(fail ? 1 : 0);
