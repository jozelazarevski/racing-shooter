/* P2 PROBE (r330 groundwork, v2.3 §3.3): does a car driven at a 60° face
 * slide back, or hang? Finds genuinely steep wilds faces on mountain
 * worlds, drives the player straight up them at full throttle for 8 s,
 * and reports altitude held vs shed. §3.3's word: above 35° the wheel has
 * no drive and the car slides down instead of hanging.
 *
 *   node tools-scratch/slopehang.mjs 12 22
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 800, height: 520 } });
page.setDefaultTimeout(300000);

for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 90000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    g.startRace?.();
    const f = () => new Promise((r2) => requestAnimationFrame(r2));
    for (let i = 0; i < 600 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};
    // hunt steep wilds faces: sample points 70-110 u off the line, uphill
    // grade over a 14 u look >= 1.4 (54°+)
    const spots = [];
    for (let i = 0; i < N && spots.length < 4; i += 12) {
      const c = t.center[i], c2 = t.center[(i + 1) % N];
      let sx = c2.z - c.z, sz = -(c2.x - c.x);
      const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
      for (const side of [1, -1]) {
        for (const dist of [70, 90, 120, 150]) {
          const x = c.x + sx * side * dist, z = c.z + sz * side * dist;
          const h0 = t.terrainHeight(x, z);
          // uphill direction = terrain gradient
          const E = 4;
          const gx = (t.terrainHeight(x + E, z) - t.terrainHeight(x - E, z)) / (2 * E);
          const gz = (t.terrainHeight(x, z + E) - t.terrainHeight(x, z - E)) / (2 * E);
          const gm = Math.hypot(gx, gz);
          if (gm < 1.0 || gm > 8) continue;
          const ux = gx / gm, uz = gz / gm;
          const far = t.terrainHeight(x + ux * 14, z + uz * 14) - h0;
          if (far / 14 < 0.9) continue;
          spots.push({ x, z, ux, uz, grade: +gm.toFixed(2), i });
          break;
        }
        if (spots.length >= 4) break;
      }
    }
    const runs = [];
    for (const s of spots.slice(0, 3)) {
      // seat the car at the foot, facing uphill, at ~17 u/s (60 km/h)
      p.pos.x = s.x; p.pos.z = s.z;
      p.y = t.terrainHeight(s.x, s.z);
      p.heading = Math.atan2(s.ux, s.uz);
      p.vel.set(s.ux * 17, 0, s.uz * 17);
      p.vy = 0; p.airborne = false; p.invuln = 5; p._lostT = 0; p._wedgeT = 0; p._voidT = 0;
      let peakY = p.y, peakAt = 0, samples = [];
      const y0 = p.y;
      for (let k = 0; k < 8 * 60; k++) {
        g.input.analog = { steer: 0, throttle: 1, brake: 0 };
        g.frame();
        if (p.y > peakY) { peakY = p.y; peakAt = k; }
        if (k % 60 === 59) samples.push(+(p.y - y0).toFixed(1));
        if (!p.alive) break;
      }
      const HOLD = 3 * 60;
      runs.push({ grade: s.grade, climb: +(peakY - y0).toFixed(1), peakAtS: +(peakAt / 60).toFixed(1),
        yBySecond: samples, endY: +(p.y - y0).toFixed(1),
        slidBack: p.y < peakY - 2 || !p.alive, alive: p.alive,
        hangs: peakAt < 8 * 60 - HOLD ? Math.abs(p.y - peakY) < 1.5 : false });
    }
    return { spots: spots.length, runs };
  });
  console.log(`world ${id}:`, JSON.stringify(r));
}
await b.close();
