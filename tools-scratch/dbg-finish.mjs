/* R-FINISH-01 probe: does crossing the finish line end the race, in every
 * vehicle state?  Measurement only — no fix, no claim beyond what it prints.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8921';
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
  const out = { lapsTotal: g.lapsTotal, N, cases: [] };

  // put the car on the last stretch with every lap gate already down, so the
  // only thing under test is the crossing itself
  const arm = (pl) => {
    pl._cpMask = 0b1111; pl._midCP = true; pl._everCP1 = true;
    pl.lap = g.lapsTotal;              // this crossing is the finishing one
    pl.finished = false;
  };

  const ORIG_STEP = Object.getPrototypeOf(g.player).step;
  const ORIG_BODY = g._frameBody.bind(g);

  const runCase = (name, setup, entrySpeed = 40) => {
    const pl = g.player;
    pl.step = ORIG_STEP;                 // undo any previous case's wrapper
    // …and put _frameBody back: cases 3 and 6 wrap it, and a wrapper left in
    // place re-armed the drift hold inside every later case. Cases 4-6 still
    // crossed, but their roll-on read 0 m instead of 3 m — contamination I
    // introduced, not a change in the game.
    g._frameBody = ORIG_BODY;
    hold({ throttle: 0, brake: 0, steer: 0, drift: false });
    g.state = 'race';
    pl.placeAt(Math.floor(N * 0.985), 0, true);   // ~13 indices short of the line
    arm(pl);
    for (let f = 0; f < 30; f++) g._frameBody();  // let the teleport guard clear
    arm(pl);
    pl.speed = entrySpeed;               // rolling, so the line arrives shortly
    const before = { lap: pl.lap, idx: pl.trackIndex };
    setup(pl, g);
    let endedAtFrame = -1, crossFrame = -1, speedAtCross = 0;
    let speedAfter = null, movedAfterM = 0, idxAtEnd = null, lastPos = null;
    for (let f = 0; f < 600; f++) {
      const prev = pl.trackIndex;
      g._frameBody();
      if (crossFrame < 0 && prev > N * 0.85 && pl.trackIndex < N * 0.15) {
        crossFrame = f; speedAtCross = pl.speed;
      }
      if (g.state === 'finished' && endedAtFrame < 0) { endedAtFrame = f; idxAtEnd = pl.trackIndex; }
      // 2 s after the terminal state: is the car still being driven?
      if (endedAtFrame >= 0 && f === endedAtFrame + 120) speedAfter = pl.speed;
      // REAL displacement, not the integral of a speed field that may simply
      // be stale after the car stops being stepped. rollOn=42m came out of
      // integrating pl.speed while the track index sat at 0 and the car had
      // not moved a metre.
      if (endedAtFrame >= 0 && f > endedAtFrame) {
        if (lastPos) movedAfterM += Math.hypot(pl.mesh.position.x - lastPos.x,
                                               pl.mesh.position.z - lastPos.z);
        lastPos = { x: pl.mesh.position.x, z: pl.mesh.position.z };
      }
    }
    return {
      name, before, crossed: crossFrame >= 0,
      lapAfter: pl.lap, idxAfter: pl.trackIndex, stateAfter: g.state,
      // THE number the rule is about: crossing -> terminal state
      latencyMs: (crossFrame >= 0 && endedAtFrame >= 0)
        ? Math.round((endedAtFrame - crossFrame) * 1000 / 60) : null,
      speedAtCross: Math.round(speedAtCross),
      speedAfter2s: speedAfter === null ? null : Math.round(speedAfter),
      rollOnM: Math.round(movedAfterM),
      ended: endedAtFrame >= 0,
    };
  };

  // DRIVE THROUGH THE GAME'S OWN INPUT LAYER. Wrapping pl.step and forcing
  // throttle there lands AFTER `controlsLive` has zeroed the inputs, so it
  // bypasses the very input lock the rule is about and the car sails on at
  // full speed looking like a defect. Setting g.input is what a player does.
  // throttle/brake/steer/drift are GETTERS on Input.prototype, so assigning
  // g.input.throttle = 1 does nothing at all (silently, in a non-strict
  // evaluate) — which is why the whole roster of cases suddenly showed a car
  // that never moved. The getters read `analog` and the key set, so that is
  // what a scripted driver has to set.
  const hold = ({ throttle = 0, brake = 0, steer = 0, drift = false }) => {
    g.input.autoThrottle = false;
    g.input.bothSteer = false;
    g.input.analog.throttle = throttle;
    g.input.analog.brake = brake;
    g.input.analog.steer = steer;
    if (drift) g.input.keys.add('ShiftLeft'); else g.input.keys.delete('ShiftLeft');
  };
  const drive = () => hold({ throttle: 1 });

  out.cases.push(runCase('1 grounded', () => { drive(); }));
  out.cases.push(runCase('2 airborne', (pl) => { drive(); pl.airborne = true; pl.mesh.position.y += 6; pl.vel.y = 2; }));
  // The handbrake from a standing start never gets the car to the line, and
  // `entrySpeed` could not help: pl.speed is a stale field, so assigning it
  // does nothing. Build speed on the throttle first and pull the handbrake
  // only in the last few metres — which is what crossing the line in a drift
  // actually looks like.
  out.cases.push(runCase('3 drifting', (pl, gg) => {
    hold({ throttle: 1, steer: 0, drift: false });
    const body = gg._frameBody.bind(gg);
    gg._frameBody = () => {
      if (pl.trackIndex > gg.track.center.length - 3) {
        hold({ throttle: 1, steer: 0, drift: true });   // no steer scrub
      }
      return body();
    };
  }));
  out.cases.push(runCase('4 shielded', (pl) => { drive(); pl.invuln = 5; pl.shieldT = 5; }));
  out.cases.push(runCase('5 mid-respawn', (pl) => { drive(); pl._teleportFrames = 8; }));
  // case 6 rewritten: pausing stops the physics, so the car never reaches the
  // line and the case proves nothing. What the `controlsLive` veto actually
  // needs is a state flip AT the moment of crossing — flip it when the car is
  // within two indices of the line, while it is still moving.
  // case 6: flip the state BEFORE the update that will cross the line, so the
  // `controlsLive` veto is genuinely in force on the crossing frame. Flipping
  // it inside step is too late — controlsLive was already read that frame.
  out.cases.push(runCase('6 controlsLive veto', (pl, gg) => {
    drive();
    const body = gg._frameBody.bind(gg);
    gg._frameBody = () => {
      if (pl.trackIndex > gg.track.center.length - 4) gg.state = 'countdown';
      return body();
    };
  }));
  // ---- case 7: THE CAPTURED SYMPTOM. The patch's own root-cause note says
  // the respawn may have placed the car PAST the trigger plane, so the
  // crossing never happened and the race ran on. Measure where a rescue
  // taken just short of the line actually lands, and whether the race can
  // still be finished afterwards.
  {
    const pl = g.player;
    pl.step = ORIG_STEP;
    g.state = 'race';
    const landings = [];
    for (const startIdx of [880, 890, 895, 898, 899]) {
      pl.placeAt(startIdx, 0, true);
      arm(pl);
      for (let f = 0; f < 10; f++) g._frameBody();
      const before = pl.trackIndex;
      // there is no rescue METHOD — the request is a flag the update reads
      // (`input.justPressed('KeyR') || this._unstuckReq`), which is why the
      // first cut of this case called nothing at all and every car "landed"
      // exactly where it started.
      pl.unstuckCool = 0;
      pl._unstuckReq = true;
      for (let f = 0; f < 30; f++) g._frameBody();
      const after = pl.trackIndex;
      landings.push({ before, after,
        pastLine: after < N * 0.5 && before > N * 0.85,
        metresToLine: Math.round(((N - after) % N) * (g.track.segLen ?? 4)) });
    }
    out.rescue = landings;
    out.rescueIsFlag = true;
  }
  return out;
});
await browser.close();
console.log('lapsTotal', R.lapsTotal, 'N', R.N);
for (const c of R.cases) {
  console.log(`${c.name.padEnd(26)} crossed=${String(c.crossed).padEnd(5)} ended=${String(c.ended).padEnd(5)} latency=${c.latencyMs === null ? '   n/a' : String(c.latencyMs).padStart(4) + 'ms'}  lap ${c.before.lap}->${c.lapAfter}  rollOn=${c.rollOnM}m  idxEnd=${c.idxAfter}  state=${c.stateAfter}`);
}
console.log('\nrescue near the line (via _unstuckReq):');
for (const r of (R.rescue || [])) {
  console.log(`  from idx ${String(r.before).padStart(3)} -> ${String(r.after).padStart(3)}  pastLine=${r.pastLine}  ${r.metresToLine} m short of the line`);
}
if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 3));
