// r364 probe: the owner's exact complaint. Drive OFF the road up the hillside,
// stop, sit there. The game must not touch the car.
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 120)));
await p.goto(`${BASE}/?level=${process.env.LEVEL ?? 32}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 }); // PIKES-style mountain world id 32
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, pl = g.player, t = g.track;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.resetRace(); g.startRace?.();
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // walk sideways off the road until the terrain is 12+ u above the route
  // aim the car at rising ground and DRIVE up it like a player would,
  // then let go of everything and sit. Only the idle window is judged.
  let bidx = 0, bestRise = 0, bestA = 0;
  for (let idx = 10; idx < t.center.length; idx += 10) {
    const ci = t.center[idx];
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const h = t.terrainHeight(ci.x + Math.cos(a) * 45, ci.z + Math.sin(a) * 45);
      const rise = h - ci.y;
      if (rise > bestRise && rise < 40) { bestRise = rise; bidx = idx; bestA = a; }
    }
  }
  if (bestRise < 8) return { skip: 'no climbable rise found' };
  const ci = t.center[bidx];
  pl.pos.set(ci.x, ci.y + 0.4, ci.z); pl.y = pl.pos.y;
  pl.vel.set(0, 0, 0); pl.vy = 0; pl.airborne = false; pl.trackIndex = bidx;
  pl.heading = Math.atan2(Math.sin(bestA), Math.cos(bestA));
  // heading convention: aim via velocity — just steer with physics: point
  // the car by setting heading directly (game uses heading for drive dir)
  const evsAll = [];
  const rawLog = g.telemetry?.log?.bind(g.telemetry);
  if (rawLog) g.telemetry.log = (k, d) => { evsAll.push({ k, idle: window.__idle ?? false }); return rawLog(k, d); };
  window.__idle = false;
  for (let f = 0; f < 300; f++) {           // 5 s of climbing
    g.input.analog.steer = 0; g.input.analog.throttle = 1; g.input.analog.brake = 0;
    g.frame();
  }
  const climbY = pl.y - ci.y;
  const cx = pl.pos.x, cz = pl.pos.z;
  window.__idle = true;
  let maxJump = 0, prevX = cx, prevZ = cz;
  for (let f = 0; f < 420; f++) {           // 7 s idle — old net fired at 2 s
    g.input.analog.steer = 0; g.input.analog.throttle = 0; g.input.analog.brake = 0;
    g.frame();
    const j = Math.hypot(pl.pos.x - prevX, pl.pos.z - prevZ);
    maxJump = Math.max(maxJump, j);
    prevX = pl.pos.x; prevZ = pl.pos.z;
  }
  const idleReturns = evsAll.filter((e) => e.idle && (e.k === 'return' || e.k === 'unstuck' || e.k === 'void')).length;
  return { rise: bestRise.toFixed(1), climbY: climbY.toFixed(1),
    idleDrift: Math.hypot(pl.pos.x - cx, pl.pos.z - cz).toFixed(1),
    maxIdleJump: maxJump.toFixed(2), idleReturns, alive: pl.alive,
    evs: evsAll.filter((e) => ['return', 'unstuck', 'void', 'offmesh'].includes(e.k)) };
});
console.log(JSON.stringify(r));
await browser.close();
