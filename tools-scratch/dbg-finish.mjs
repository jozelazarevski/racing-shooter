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

  const runCase = (name, setup) => {
    // fresh-ish state each time
    g.state = 'race';
    const pl = g.player;
    pl.placeAt(Math.floor(N * 0.93), 0, true);
    arm(pl);
    for (let f = 0; f < 20; f++) g._frameBody();   // let any teleport guard clear
    arm(pl);
    const before = { state: g.state, lap: pl.lap, idx: pl.trackIndex };
    setup(pl, g);
    let endedAtFrame = -1;
    for (let f = 0; f < 240; f++) {
      g._frameBody();
      if (g.state === 'finished' && endedAtFrame < 0) endedAtFrame = f;
    }
    return {
      name, before,
      lapAfter: pl.lap, idxAfter: pl.trackIndex, stateAfter: g.state,
      endedAtFrame, endedMs: endedAtFrame < 0 ? null : Math.round(endedAtFrame * 1000 / 60),
    };
  };

  const drive = (pl) => {
    // full throttle straight ahead, whatever the input layer thinks
    pl._probeDrive = true;
    const step = pl.step.bind(pl);
    pl.step = (dt, inp) => step(dt, { ...inp, throttle: 1, brake: 0 });
  };

  out.cases.push(runCase('1 grounded', (pl) => { drive(pl); }));
  out.cases.push(runCase('2 airborne', (pl) => { drive(pl); pl.airborne = true; pl.mesh.position.y += 6; pl.vel.y = 2; }));
  out.cases.push(runCase('3 drifting', (pl) => {
    const step = pl.step.bind(pl);
    pl.step = (dt, inp) => step(dt, { ...inp, throttle: 1, drift: true, steer: 0.6 });
  }));
  out.cases.push(runCase('4 shielded', (pl) => { drive(pl); pl.invuln = 5; pl.shieldT = 5; }));
  out.cases.push(runCase('5 mid-respawn', (pl) => { drive(pl); pl._teleportFrames = 8; }));
  out.cases.push(runCase('6 state=paused at the line', (pl, gg) => { drive(pl); gg.state = 'paused'; }));
  return out;
});
await browser.close();
console.log('lapsTotal', R.lapsTotal, 'N', R.N);
for (const c of R.cases) {
  console.log(`${c.name.padEnd(28)} state=${String(c.stateAfter).padEnd(9)} lap ${c.before.lap}->${c.lapAfter}  idx ${c.before.idx}->${c.idxAfter}  ended=${c.endedMs === null ? 'NEVER' : c.endedMs + 'ms'}`);
}
if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 3));
