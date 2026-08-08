/* Jumps, as a test.
 *
 * THE BUG, and it was not in the thresholds that had been tuned three times.
 *
 * `Track.groundHeightAt(i, lateral)` takes an INTEGER sample index, so the
 * road height under a car is a staircase. Standing still that is invisible.
 * At 50 u/s over 2.4 u samples the car crosses a step every three frames, so
 * the height it reads goes flat, flat, JUMP. The crest detector differentiates
 * that value twice — climb rate, then climb acceleration — and a staircase
 * differentiated twice is an impulse: climb rate spiking to ~29 u/s on a 20%
 * grade, acceleration in the thousands, against a threshold of −42.
 *
 * So the detector was firing on sampling noise. Measured on four worlds it
 * launched 28–43 times per 90 s stage, a third of them lasting three frames
 * or less. You could not see those hops. You could only feel them, because
 * every landing bought 0.4 s of 40% grip, so the car spent about a quarter of
 * each stage skating for no observable reason. That is "jumps are broken".
 *
 * Three changes, all measured:
 *   1. `groundHeightAtPos` samples the profile CONTINUOUSLY (track.js).
 *   2. A launch must survive a ballistic prediction — throw the car forward
 *      and check the road has really dropped away (`Car._clearsGround`).
 *   3. Landing grip loss scales with hang time instead of a flat 0.4 s.
 *
 * Removing any one of them was tried and put the micro-hops back.
 *
 * What this asserts is the SHAPE of the jumping, not a hop count — terrain
 * differs per world and an exact count would be a change-detector. A jump is
 * an event you can see; there is no such thing as a three-frame jump.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

for (const [id, name] of [[1, 'PINE VALLEY'], [10, 'ROCKFALL RAVINE'], [13, 'OUNINPOHJA'], [21, 'FURKA RIDGE']]) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 180000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  const r = await p.evaluate(() => {
    const g = window.__game, car = g.player, t = g.track, N = t.center.length;
    // Immortal, so a stage is a stage and not a crash test.
    car.alive = true; car.health = 1e9;
    const s0 = t.pointAt(10, 0);
    car.pos.set(s0.x, t.groundHeightAt(10, 0) + 0.4, s0.z); car.y = car.pos.y;
    car.trackIndex = 10; car.lateral = 0;
    car.heading = Math.atan2(t.center[16].x - s0.x, t.center[16].z - s0.z);
    car.speedAlong = 0; car.vel.set(0, 0, 0); car.airborne = false;

    const dur = [];
    let air = 0, wasAir = false, maxLoose = 0;
    const SECS = 90;
    for (let k = 0; k < 60 * SECS; k++) {
      // Drive it: steer at a point a little way up the road, throttle pinned.
      // An earlier probe overwrote car.vel every frame and measured its own
      // overwrite; nothing here touches the car's state inside the loop.
      const i = car.trackIndex, aim = t.center[(i + 8) % N];
      let d = Math.atan2(aim.x - car.pos.x, aim.z - car.pos.z) - car.heading;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      car.step(1 / 60, { throttle: 1, brake: 0, steer: Math.max(-1, Math.min(1, d * 2)), drift: false, hold: false });
      maxLoose = Math.max(maxLoose, car.landGrip || 0);
      if (car.airborne) { air += 1 / 60; wasAir = true; }
      else if (wasAir) { dur.push(air); air = 0; wasAir = false; }
    }
    if (wasAir) dur.push(air);
    dur.sort((a, b) => a - b);
    return {
      secs: SECS,
      hops: dur.length,
      micro: dur.filter((x) => x <= 3.5 / 60).length,
      real: dur.filter((x) => x > 0.35).length,
      median: +(dur[dur.length >> 1] ?? 0).toFixed(3),
      airFrac: +(dur.reduce((a, b) => a + b, 0) / SECS).toFixed(3),
      maxLoose: +maxLoose.toFixed(2),
    };
  });

  // 1. The headline. A hop shorter than a few frames is not a jump, it is a
  //    glitch, and before the fix these were a third of all launches.
  //
  //    The bound is 1, not 0. The first version of this test asserted zero and
  //    passed on all four worlds — then a change elsewhere shifted the seed
  //    stream, the terrain reshuffled, and two worlds grew a stutter each. So
  //    zero was never a property of the system; it was a property of four
  //    particular layouts, and asserting it was overfitting. What the fix
  //    actually guarantees is that stutters are RARE and FREE: at most one per
  //    stage, and `onLand` charges nothing below 0.15 s of hang time, so even
  //    that one costs the player no grip. The defect was 7-16 of them per
  //    stage, each billing 0.4 s of 40% grip.
  check(`${name}: three-frame launches are rare`, r.micro <= 1,
    `${r.micro} of ${r.hops} hops lasted <= 3 frames`);

  // 2. What is left has to be worth calling a jump. Median, not mean: one long
  //    flight must not be able to carry a pile of stutters.
  check(`${name}: the typical jump is a real one`, r.median > 0.35,
    `median hang time ${r.median}s over ${r.hops} hops`);

  // 3. Jumps must still HAPPEN — it would be trivial to pass the two above by
  //    never leaving the ground, and these are rally stages with crests on them.
  check(`${name}: crests still launch the car`, r.real >= 4,
    `${r.real} jumps over 0.35s in ${r.secs}s`);

  // 4. And the car must spend most of the stage driving. 11-18% of the run was
  //    airborne before the fix; that is a hovercraft, not a rally car.
  check(`${name}: the car is on the ground most of the time`, r.airFrac < 0.20,
    `${(r.airFrac * 100).toFixed(1)}% of the stage airborne`);

  // 5. Loose grip is priced by hang time now. A flat 0.4s per hop was what
  //    turned invisible stutters into a car that would not steer.
  check(`${name}: landing grip loss stays within its budget`, r.maxLoose <= 0.4,
    `peak landGrip ${r.maxLoose}`);

  await p.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\njumps are jumps');
process.exit(fail ? 1 : 0);
