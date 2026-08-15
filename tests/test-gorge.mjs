/* THE GORGE JUMP, AND THE THREE THINGS WRONG WITH IT.
 *
 * Reported as "jumping the gorge is not good, needs fixing", alongside
 * "canyon run is not playable, too many bugs on the road" and a photograph of
 * a car standing inside a canyon wall. Driving the shipped AI across CANYON
 * RUN at r177 and logging every crossing found all three of those in one
 * feature:
 *
 *  1. THE RAMP CRESTED SHORT OF THE EDGE. The launch lip was placed at
 *     `gapS`, a count derived from the chasm's span, while the road surface
 *     actually ended wherever the geometric carve said it did. The two
 *     disagreed by two samples, leaving a 2.1 u DROP between the crest and the
 *     rim: the car was thrown up 8 u before the edge, landed in the dip, and
 *     left the lip with no upward speed. Whether a car flew came down to
 *     whether it happened to still be in the air when it reached the rim —
 *     measured, FIVE OF SEVEN rivals failed that coin flip every lap.
 *
 *  2. FAILING COST NOTHING. `groundHeightAt` follows the carve, so a car that
 *     came up short did not fall — it DROVE the U, twenty-six metres down,
 *     along, and out the far side at 62-66 u/s, unchanged. The chasm was a
 *     free alternative line, not the price of missing the jump.
 *
 *  3. THE TRENCH CUT THE ROAD IN PLACES NOBODY PUT A JUMP. A gorge is 190 u
 *     long either side of the crossing — that length is what makes it read as
 *     a canyon — and on a closed circuit it crosses other legs of the same
 *     lap. CANYON RUN carried THREE unramped holes besides its two jumps
 *     (samples 40-44, 238-241, 492-497 of 900); RED CENTRE RUN one 32 u hole
 *     at 95-106. No ramp, no rim, no warning.
 *
 * Every assertion here is measured off the built world or driven in the
 * engine. The pass mark for the jump itself is the FIELD, not one car: a jump
 * that half the grid falls into is not a jump.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const WORLDS = [4, 32];        // every level whose tune carries `gorgeJump`
const VY_CAP = 11;             // vehicles.js — a car will not launch above this

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 420 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));

for (const lv of WORLDS) {
  await page.goto(`${BASE}/?level=${lv}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });

  // ---- what got built -----------------------------------------------------
  const built = await page.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length;
    const G = t._jumpGorges ?? [];
    // every run of missing roadway on the whole lap
    const runs = []; let cur = null;
    for (let i = 0; i < N; i++) {
      if (t._jumpCut?.[i] > 0.5) { if (!cur) { cur = [i, i]; runs.push(cur); } else cur[1] = i; }
      else cur = null;
    }
    const atAJump = (r) => G.some((x) => t._circDist(r[0], x.i) <= 10);
    return {
      level: g.level?.name, N, seg: t.segLen, count: G.length,
      stray: runs.filter((r) => !atAJump(r)).map((r) => `${r[0]}-${r[1]}`),
      gorges: G.map((x) => {
        const jA = (x.i - x.rimA + N) % N, jB = (x.i + x.rimB) % N;
        const yA = t.groundHeightAt(jA, 0), yB = t.groundHeightAt(jB, 0);
        // the climb over the LAST sample into the lip is what the launch
        // coherence check reads — steeper than VY_CAP allows and the car does
        // not launch harder, it does not launch at all
        const prev = t.groundHeightAt((jA - 1 + N) % N, 0);
        return { i: x.i, rimA: x.rimA, rimB: x.rimB,
          drop: +(yA - yB).toFixed(2),          // + = landing below take-off
          grade: +((yA - prev) / t.segLen).toFixed(3),
          gapU: +((x.rimA + x.rimB) * t.segLen).toFixed(1) };
      }),
    };
  });

  console.log(`\n===== ${built.level} — ${built.count} gorge(s) =====`);
  ok(built.count > 0, `${built.level}: the world actually has a jump`, `${built.count}`);
  ok(built.stray.length === 0,
    `${built.level}: the roadway is missing ONLY at the jumps`,
    built.stray.length ? `bare holes at samples ${built.stray.join(', ')}` : '');
  for (const G of built.gorges) {
    console.log(`  gorge@${G.i}: ${G.gapU} u gap, landing ${G.drop} u below take-off, ${G.grade} into the lip`);
    // The landing is BELOW the take-off on purpose. vy is capped, the gap is
    // fixed, so how far the car may fall on the way over is the only margin
    // the jump has left to give; a landing that stood higher than the take-off
    // (2.9 u higher, as it did) is one no launch can pay for.
    ok(G.drop > 1 && G.drop < 2.4,
      `  gorge@${G.i}: the landing sits below the take-off, the way a jump is built`,
      `${G.drop} u`);
    ok(G.grade > 0.04, `  gorge@${G.i}: the approach really is a ramp`, `${G.grade}`);
    // 62 u/s is what the field actually arrives at; grade x speed is the climb
    // rate the launch is refused above
    ok(G.grade * 62 < VY_CAP,
      `  gorge@${G.i}: and not so steep that the car refuses to launch`,
      `${(G.grade * 62).toFixed(1)} u/s vs cap ${VY_CAP}`);
  }

  // ---- and then drive the whole field over it -----------------------------
  const flown = await page.evaluate(async () => {
    const g = window.__game, t = g.track, N = t.center.length;
    g.clock.getDelta = () => 1 / 60;              // fixed step...
    if (g.composer) g.composer.render = () => {}; // ...and no rendering
    const gorges = t._jumpGorges ?? [];
    const cars = [g.player, ...g.enemies];
    const seen = new Map();
    const dOf = (i, gi) => ((i - gi + N + N / 2) % N) - N / 2;
    // A crossing is REGISTERED at d = -6, six samples before the lip, so the
    // run cannot stop the moment the last one appears — the last car would be
    // scored on its approach and counted as never having left the ground.
    const want = (cars.length - 1) * gorges.length;
    let after = -1;
    for (let f = 0; f < 4200; f++) {
      g.frame();
      for (let k = 1; k < cars.length; k++) {            // rivals: they drive
        const c = cars[k];
        if (!c?.alive) continue;
        for (const G of gorges) {
          const d = dOf(c.trackIndex, G.i);
          if (d < -6 || d > 10) continue;
          const key = `${k}:${G.i}`;
          if (!seen.has(key)) seen.set(key, { gorge: G.i, floorY: G.floorY, minY: Infinity, air: false });
          const r = seen.get(key);
          r.minY = Math.min(r.minY, c.y);
          if (c.airborne) r.air = true;
        }
      }
      if (seen.size >= want) { if (after < 0) after = f; if (f > after + 150) break; }
    }
    const all = [...seen.values()];
    return { crossings: all.length,
      fell: all.filter((r) => r.minY < r.floorY + 10).length,
      flew: all.filter((r) => r.air).length };
  });
  console.log(`  ${flown.crossings} crossings driven: ${flown.flew} flew, ${flown.fell} fell in`);
  ok(flown.crossings >= 7, `${built.level}: the field actually reached the jump`,
    `${flown.crossings}`);
  ok(flown.fell === 0, `${built.level}: and NOT ONE of them fell in`, `${flown.fell} fell`);
  ok(flown.flew === flown.crossings,
    `${built.level}: every one of them left the ground`, `${flown.flew}/${flown.crossings}`);
}

// ---- missing it has to cost something --------------------------------------
await page.goto(`${BASE}/?level=4&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const cost = await page.evaluate(async () => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  if (g.composer) g.composer.render = () => {};
  const G = t._jumpGorges[0];
  const p = g.player;
  const out = { lipY: +G.lipY.toFixed(1), exit: (G.i + G.rimB + 3) % N };
  // the footprint test answers for a point on the chasm floor, and not for
  // one on the roadway either side of it
  out.floorIsChasm = !!t.jumpChasmAt(t.center[G.i].x, t.center[G.i].z);
  const off = (G.i - G.rimA - 6 + N) % N;
  out.roadIsNot = !t.jumpChasmAt(t.center[off].x, t.center[off].z);
  // drop the player in
  p.pos.set(t.center[G.i].x, G.floorY + 1, t.center[G.i].z);
  p.y = G.floorY + 1; p.vy = 0; p.airborne = false; p.trackIndex = G.i;
  p.alive = true; p.outOfHulls = false;
  const hullsBefore = g.hullsLeft ?? null;
  for (let f = 0; f < 20 && p.alive; f++) g.frame();
  out.wrecked = !p.alive;
  out.putBackAt = p.trackIndex;
  out.putBackOnRoad = (t._jumpCut?.[p.trackIndex] ?? 0) < 0.5;
  out.hullsBefore = hullsBefore;
  return out;
});
// ---- you jump it, or you do not pass -----------------------------------
// Asked for in exactly those terms: "can you jump, or if it doesn't jump it
// should wreck — so it must jump to pass the road." r179 priced falling in at
// nine metres under the lip, and nine metres was still a room to move about
// in: with the field slowed to 31 u/s, twelve of fourteen dropped in and only
// ONE wrecked. The rest bounced around inside the gorge. What this pins is
// that DROVE OUT is no longer one of the outcomes, at any speed.
const verdicts = await page.evaluate(async ({ scales }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  if (g.composer) g.composer.render = () => {};
  const base = g.enemies.map((e) => e.baseMaxSpeed);
  const out = [];
  for (const sc of scales) {
    g.enemies.forEach((e, i) => { e.baseMaxSpeed = base[i] * sc; });
    g.startRace();
    const dOf = (i, gi) => ((i - gi + N + N / 2) % N) - N / 2;
    const rec = new Map();
    for (let f = 0; f < 9000; f++) {
      g.frame();
      for (let k = 0; k < g.enemies.length; k++) {
        const c = g.enemies[k];
        for (const G of t._jumpGorges) {
          const key = `${k}:${G.i}`;
          const r = rec.get(key);
          const d = dOf(c.trackIndex, G.i);
          if (!r) {
            if (c.alive && d >= -G.rimA - 2 && d <= 0) {
              rec.set(key, { sank: false, sp: Math.hypot(c.vel.x, c.vel.z) });
            }
            continue;
          }
          if (r.verdict) continue;
          if (!c.alive) { r.verdict = 'wrecked'; continue; }
          if (c.y < G.landY - 3) r.sank = true;
          if (d > G.rimB + 6) r.verdict = r.sank ? 'drove out' : 'cleared';
        }
      }
    }
    const all = [...rec.values()];
    out.push({ scale: sc, n: all.length,
      speed: +(all.reduce((a, r) => a + r.sp, 0) / Math.max(1, all.length)).toFixed(1),
      cleared: all.filter((r) => r.verdict === 'cleared').length,
      wrecked: all.filter((r) => r.verdict === 'wrecked').length,
      droveOut: all.filter((r) => r.verdict === 'drove out').length,
      open: all.filter((r) => !r.verdict).length });
  }
  return out;
}, { scales: [1.0, 0.62, 0.4] });

console.log('\n===== jump it, or do not pass =====');
for (const v of verdicts) {
  console.log(`  at ${v.speed} u/s: ${v.cleared} cleared, ${v.wrecked} wrecked, ${v.droveOut} drove out`);
}
const fast = verdicts[0], mid = verdicts[1], slow = verdicts[2];
ok(verdicts.every((v) => v.open === 0),
  'every crossing reaches a verdict', JSON.stringify(verdicts.map((v) => v.open)));
ok(verdicts.every((v) => v.droveOut === 0),
  'NOBODY drives out of the gorge — that outcome does not exist any more',
  JSON.stringify(verdicts.map((v) => `${v.speed}:${v.droveOut}`)));
ok(fast.cleared === fast.n && fast.wrecked === 0,
  'at racing pace the whole field jumps it', `${fast.cleared}/${fast.n} at ${fast.speed} u/s`);
ok(mid.cleared === mid.n,
  'and a mid-pack car still makes it', `${mid.cleared}/${mid.n} at ${mid.speed} u/s`);
ok(slow.wrecked === slow.n,
  'come at it too slowly and it wrecks you — every time, not sometimes',
  `${slow.wrecked}/${slow.n} at ${slow.speed} u/s`);

console.log(`\n===== missing it =====`);
ok(cost.floorIsChasm && cost.roadIsNot,
  'the chasm footprint is the hole and not the road either side of it',
  JSON.stringify({ floor: cost.floorIsChasm, road: cost.roadIsNot }));
ok(cost.wrecked, 'a car on the chasm floor is wrecked, not driven out at speed');
ok(cost.putBackAt === cost.exit && cost.putBackOnRoad,
  'and it is handed back to the far rim — never respawned into the hole it fell in',
  JSON.stringify({ at: cost.putBackAt, want: cost.exit, onRoad: cost.putBackOnRoad }));

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
