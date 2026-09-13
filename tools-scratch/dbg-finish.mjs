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

  const runCase = (name, setup) => {
    const pl = g.player;
    pl.step = ORIG_STEP;                 // undo any previous case's wrapper
    g.state = 'race';
    pl.placeAt(Math.floor(N * 0.985), 0, true);   // ~13 indices short of the line
    arm(pl);
    for (let f = 0; f < 30; f++) g._frameBody();  // let the teleport guard clear
    arm(pl);
    pl.speed = 40;                       // rolling, so the line arrives in ~1 s
    const before = { lap: pl.lap, idx: pl.trackIndex };
    setup(pl, g);
    let endedAtFrame = -1, crossFrame = -1, speedAtCross = 0;
    let speedAfter = null, movedAfterM = 0, idxAtEnd = null;
    for (let f = 0; f < 600; f++) {
      const prev = pl.trackIndex;
      g._frameBody();
      if (crossFrame < 0 && prev > N * 0.85 && pl.trackIndex < N * 0.15) {
        crossFrame = f; speedAtCross = pl.speed;
      }
      if (g.state === 'finished' && endedAtFrame < 0) { endedAtFrame = f; idxAtEnd = pl.trackIndex; }
      // 2 s after the terminal state: is the car still being driven?
      if (endedAtFrame >= 0 && f === endedAtFrame + 120) speedAfter = pl.speed;
      if (endedAtFrame >= 0 && f > endedAtFrame) movedAfterM += Math.abs(pl.speed) / 3.6 / 60;
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

  const drive = (pl) => {
    const base = pl.step.bind(pl);
    pl.step = (dt, inp) => base(dt, { ...inp, throttle: 1, brake: 0 });
  };

  out.cases.push(runCase('1 grounded', (pl) => { drive(pl); }));
  out.cases.push(runCase('2 airborne', (pl) => { drive(pl); pl.airborne = true; pl.mesh.position.y += 6; pl.vel.y = 2; }));
  out.cases.push(runCase('3 drifting', (pl) => {
    const base = pl.step.bind(pl);
    pl.step = (dt, inp) => base(dt, { ...inp, throttle: 1, drift: true, steer: 0.12 });
  }));
  out.cases.push(runCase('4 shielded', (pl) => { drive(pl); pl.invuln = 5; pl.shieldT = 5; }));
  out.cases.push(runCase('5 mid-respawn', (pl) => { drive(pl); pl._teleportFrames = 8; }));
  // case 6 rewritten: pausing stops the physics, so the car never reaches the
  // line and the case proves nothing. What the `controlsLive` veto actually
  // needs is a state flip AT the moment of crossing — flip it when the car is
  // within two indices of the line, while it is still moving.
  out.cases.push(runCase('6 state flips at the line', (pl, gg) => {
    const base = pl.step.bind(pl);
    pl.step = (dt, inp) => {
      if (pl.trackIndex > gg.track.center.length - 3) gg.state = 'countdown';
      return base(dt, { ...inp, throttle: 1, brake: 0 });
    };
  }));
  return out;
});
await browser.close();
console.log('lapsTotal', R.lapsTotal, 'N', R.N);
for (const c of R.cases) {
  console.log(`${c.name.padEnd(26)} crossed=${String(c.crossed).padEnd(5)} ended=${String(c.ended).padEnd(5)} latency=${c.latencyMs === null ? '   n/a' : String(c.latencyMs).padStart(4) + 'ms'}  lap ${c.before.lap}->${c.lapAfter}  vCross=${c.speedAtCross}  v+2s=${c.speedAfter2s}  rollOn=${c.rollOnM}m  state=${c.stateAfter}`);
}
if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 3));
