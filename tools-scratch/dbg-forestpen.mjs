/* Forest penetration: aim the car perpendicular into the densest verge stand
 * and hold full throttle; log distance-from-road and speed over 6 s. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 1);
const WEAVE = !!process.env.WEAVE, MEDIAN = !!process.env.MEDIAN;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
p.setDefaultTimeout(300000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(({ WEAVE9, MEDIAN9 }) => {
  const g = window.__game, t = g.track, N = t.center.length, c = g.player;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 400 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // densest carpet belt beside the road: count camTrees within 30u of the
  // verge point per station, pick the max side
  let best = { i: 60, side: 1, n: -1 };
  window.__median9 = MEDIAN9; window.__cand9 = [];
  for (let i = 30; i < N; i += 6) {
    const cst = t.center[i], nv = t.nrm[i];
    for (const sd of [1, -1]) {
      const vx = cst.x + nv.x * (t.widthAt(i) + 14) * sd, vz = cst.z + nv.z * (t.widthAt(i) + 14) * sd;
      const n9 = t.camTreesNear ? t.camTreesNear(vx, vz).length : 0;
      if (window.__median9) { window.__cand9.push({ i, side: sd, n: n9 }); }
      else if (n9 > best.n) best = { i, side: sd, n: n9 };
    }
  }
  if (MEDIAN9) {
    const cs = window.__cand9.filter((x) => x.n > 4).sort((a, b) => a.n - b.n);
    if (cs.length) best = cs[Math.floor(cs.length / 2)];
  }
  const i0 = best.i, cst = t.center[i0], nv = t.nrm[i0];
  c.pos.set(cst.x, cst.y + 0.5, cst.z);
  c.trackIndex = i0;
  c.heading = Math.atan2(nv.x * best.side, nv.z * best.side);   // straight into the stand
  c.vel.set(0, 0, 0);
  const log = [];
  for (let k = 0; k < 360; k++) {
    g.input.analog.throttle = 1;
    g.input.analog.steer = WEAVE9 ? Math.sin(k / 22) * 0.55 : 0;
    g.input.analog.brake = 0;
    c._wedgeT = 0; c._lostT = 0; g._gateMissT = 0;
    g.frame();
    if (k % 30 === 29) {
      const d = Math.hypot(c.pos.x - cst.x, c.pos.z - cst.z);
      log.push({ t: +((k + 1) / 60).toFixed(1), d: +d.toFixed(1),
        kmh: +(Math.hypot(c.vel.x, c.vel.z) * 3.6).toFixed(0) });
    }
  }
  const dFinal = Math.hypot(c.pos.x - cst.x, c.pos.z - cst.z);
  return { world: g.level?.name, station: i0, belt: best.n, weave: WEAVE9,
    penetration: +(dFinal - t.widthAt(i0)).toFixed(1), log };
}, { WEAVE9: WEAVE, MEDIAN9: MEDIAN });
console.log(JSON.stringify(r));
await browser.close();
