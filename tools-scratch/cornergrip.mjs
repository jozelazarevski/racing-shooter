/* HOW HARD CAN YOU CORNER, REALLY. Flat ground, set speed, full lock, 3 s:
 * report the turn radius, the sustained lateral acceleration, the slip the
 * state machine saw, and the speed kept. The player's complaint in numbers:
 * "I can turn sharp curves with 180 km/h" — this is the instrument for it,
 * before and after the grip budget.
 *   node tools-scratch/cornergrip.mjs
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
await p.goto(`${BASE}/?level=26&mode=roam&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });  // SAFARI PLAINS: flat savanna
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 120000 });
const r = await p.evaluate(async () => {
  const g = window.__game, t = g.track, pl = g.player;
  g.clock.getDelta = () => 1 / 60;
  if (g.composer) g.composer.render = () => {};
  const rows = [];
  for (const kmh of [60, 100, 140, 180]) {
    const v = kmh / 3.6;
    // a flat spot well off the road
    const c = t.pointAt(200, 0);
    const sx = c.x + 60, sz = c.z + 60;
    pl.pos.set(sx, t.terrainHeight(sx, sz) + 0.5, sz); pl.y = pl.pos.y;
    pl.trackIndex = t.nearestIndex(pl.pos);
    pl.heading = 0; pl.vel.set(0, 0, v * 1); pl.vel.set(Math.sin(0) * v, 0, Math.cos(0) * v);
    pl.vy = 0; pl.airborne = false; pl.alive = true; pl.health = 100; pl.slip = 0;
    // ENTRY, not average: a sharp curve is decided in its first second. The
    // 3 s window follows so the settled state (a slide, a donut, a recovery)
    // is on the record too, but the number that answers "can I turn sharp at
    // 180" is the entry radius.
    let velTurnEntry = 0, velTurn = 0, maxSlip = 0, driftPeak = 0,
      prevVelH = Math.atan2(pl.vel.x, pl.vel.z);
    for (let k = 0; k < 180; k++) {                      // 3 s
      g.input.analog.steer = 1; g.input.analog.throttle = 1; g.input.analog.brake = 0;
      g.frame();
      const vh = Math.atan2(pl.vel.x, pl.vel.z);
      let dv = vh - prevVelH;
      while (dv > Math.PI) dv -= 2 * Math.PI; while (dv < -Math.PI) dv += 2 * Math.PI;
      velTurn += dv; prevVelH = vh;
      if (k < 60) velTurnEntry += dv;
      let da = pl.heading - vh;
      while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      driftPeak = Math.max(driftPeak, Math.abs(da));
      if (pl.slip > maxSlip) maxSlip = pl.slip;
    }
    const vEnd = pl.vel.length();
    const entryRate = Math.abs(velTurnEntry);            // rad/s over the first 1 s
    rows.push({ kmh, entryRadius: +(entryRate > 0.02 ? v / entryRate : 9999).toFixed(0),
      entryALat: +(v * entryRate).toFixed(1), driftPeakDeg: +(driftPeak * 180 / Math.PI).toFixed(0),
      maxSlip: +maxSlip.toFixed(2), kmhEnd: +(vEnd * 3.6).toFixed(0) });
  }
  return rows;
});
console.log('full lock, 3 s each  (aLat u/s²: ~10 is a real car at 1g)');
for (const q of r) console.log('  ', JSON.stringify(q));
await b.close();
