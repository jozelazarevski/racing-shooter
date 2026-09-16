/* Owner: "Turning on 80kmph+ is really hard. Is that normal?"
 * Measures the steering law directly: hold the car at each speed (velocity
 * renormalized every frame), full steer, no handbrake, and read the
 * steady-state yaw rate -> turning radius, slip, over-budget feed and the
 * speed-shaped cap multiplier. offroadSkill pinned to 1 so leaving the
 * ribbon during the circle does not change grip; rescue timers cleared so
 * no mid-measure teleport. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const STEER = Number(process.env.STEER ?? 1);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 800, height: 520 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=${process.env.LEVEL ?? 1}&go=1&fresh=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 120000 });

const rows = await p.evaluate((steerIn) => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const pl = g.player;
  pl.offroadSkill = 1;
  const out = [];
  const dt = 1 / 60;
  for (const kmh of [40, 60, 80, 100, 120, 140, 160, 180]) {
    const v = kmh / 3.6;
    pl.placeAt(40, 0);
    pl.vel.set(Math.sin(pl.heading) * v, 0, Math.cos(pl.heading) * v);
    let omegaAcc = 0, omegaN = 0, slipMax = 0, over = 0, capM = 0, grip = 0;
    for (let i = 0; i < 150; i++) {
      const hv = Math.hypot(pl.vel.x, pl.vel.z);
      if (hv > 0.1) { pl.vel.x *= v / hv; pl.vel.z *= v / hv; }
      else pl.vel.set(Math.sin(pl.heading) * v, 0, Math.cos(pl.heading) * v);
      pl._lostT = 0; pl._cliffT = 0; pl._wedgeT = 0; pl._bogT = 0;
      const hb = pl.heading;
      pl.step(dt, { throttle: 1, brake: 0, steer: steerIn, drift: false, hold: false });
      let dh = pl.heading - hb;
      while (dh > Math.PI) dh -= 2 * Math.PI;
      while (dh < -Math.PI) dh += 2 * Math.PI;
      if (i >= 60) { omegaAcc += dh / dt; omegaN++; }
      slipMax = Math.max(slipMax, pl.slip);
      over = Math.max(over, pl._overGrip ?? 0);
      capM = pl._yawCapM ?? capM;
      grip = pl._gripBudget ?? grip;
    }
    const omega = Math.abs(omegaAcc / omegaN);
    out.push({ kmh,
      omegaDegS: +(omega * 180 / Math.PI).toFixed(1),
      radiusM: omega > 1e-4 ? +(v / omega).toFixed(1) : Infinity,
      t90degS: omega > 1e-4 ? +((Math.PI / 2) / omega).toFixed(2) : Infinity,
      slipMax: +slipMax.toFixed(2), overMax: +over.toFixed(2),
      capM: +capM.toFixed(2), grip: +grip.toFixed(2) });
  }
  return { car: g.cars?.selected, world: g.level?.name, surf: g.track?.T?.surface, out };
}, STEER);
console.log(`car=${rows.car} world=${rows.world} surf=${rows.surf} steer=${STEER}`);
console.log('kmh  omega°/s  radius_m  t90°_s  slipMax  overMax  capM  grip');
for (const r of rows.out) {
  console.log(String(r.kmh).padEnd(5) + String(r.omegaDegS).padEnd(10)
    + String(r.radiusM).padEnd(10) + String(r.t90degS).padEnd(8)
    + String(r.slipMax).padEnd(9) + String(r.overMax).padEnd(9)
    + String(r.capM).padEnd(6) + r.grip);
}
await browser.close();
