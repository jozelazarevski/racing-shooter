/* #20: can an honest run-up clear ROCKFALL RAVINE's gorge jump?
 * Drive the actual approach with the pure-pursuit driver from 400 samples
 * back, full commitment on the final straight, and report the crossing. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=10&go=1&unlockall=1', { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const g = window.__game, t = g.track, c = g.player, N = t.center.length;
  g.startRace?.();
  const f = () => new Promise((r2) => requestAnimationFrame(r2));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) { g.countdown = 0.01; g.frame(); }
  g.clock.getDelta = () => 1/60; if (g.composer) g.composer.render = () => {};
  const G = t._jumpGorges?.[0];
  if (!G) return { fail: 'no jump gorge' };
  // gorge midpoint index: nearest center sample to the gorge centre
  let gi = 0, bd = 1e9;
  for (let i = 0; i < N; i++) {
    const d = Math.hypot(t.center[i].x - G.x, t.center[i].z - G.z);
    if (d < bd) { bd = d; gi = i; }
  }
  const wrap = (a) => { while (a > Math.PI) a -= 2*Math.PI; while (a < -Math.PI) a += 2*Math.PI; return a; };
  const clamp = (v,a,z) => Math.max(a, Math.min(z, v));
  const runs = [];
  for (const back of [400, 250]) {
    const s = (gi - back + N) % N;
    c.placeAt(s, 0, true);
    c.invuln = 0; c.health = c.maxHealth;
    let crossed = false, wrecked = false, kmhAtCrest = 0, maxAirT = 0, airT = 0, fellIn = false;
    for (let k = 0; k < 60 * 40; k++) {
      const speed = c.vel.length();
      const look = Math.max(3, Math.round((9 + speed * 0.45) / (t.segLen ?? 3)));
      const li = (c.trackIndex + look) % N;
      const a2 = t.center[li];
      const err = wrap(Math.atan2(a2.x - c.pos.x, a2.z - c.pos.z) - c.heading);
      const distToCrest = ((gi - c.trackIndex + N) % N);
      // commit on the approach: no braking in the last 60 samples
      const K2 = 10;
      const turn = Math.abs(wrap(t.headingAt((c.trackIndex + K2) % N) - t.headingAt(c.trackIndex)));
      const vmax = distToCrest < 60 || distToCrest > N - 40 ? 99 : clamp(Math.sqrt(15 * (30 / Math.max(0.06, turn))), 14, 60);
      g.input.analog = { steer: clamp(err * 1.8, -1, 1), throttle: speed < vmax ? 1 : 0, brake: speed > vmax + 4 ? 1 : 0 };
      if (distToCrest < 4 || distToCrest > N - 4) kmhAtCrest = Math.max(kmhAtCrest, Math.round(speed * 3.6));
      g.frame();
      if (c.airborne) { airT += 1/60; maxAirT = Math.max(maxAirT, airT); } else airT = 0;
      if (!c.alive) { wrecked = true; break; }
      if (c.y < (G.floorY ?? -20) + 4) fellIn = true;
      const past = ((c.trackIndex - gi + N) % N);
      if (past > 8 && past < 200 && !c.airborne && c.alive) { crossed = true; break; }
    }
    runs.push({ back, crossed, wrecked, fellIn, kmhAtCrest, maxAirT: +maxAirT.toFixed(2),
      returns: c._lastReturnT ?? null });
  }
  return { gorgeAt: gi, floorY: G.floorY, runs };
});
console.log(JSON.stringify(r));
await b.close();
