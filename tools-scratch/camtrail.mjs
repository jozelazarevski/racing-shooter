/* WHERE DOES THE CAMERA GO WRONG, over a whole run rather than at a pose I
 * chose. Reported from a phone on CANYON RUN: half the frame a flat cliff and
 * the car shoved into the bottom-right corner behind the buttons — at 11 km/h,
 * hull 77, 8th of 8, i.e. after repeatedly hitting things.
 *
 * Parking the car at chosen lateral offsets did NOT reproduce it: the car
 * carries its own `WALL_LIMIT` clamp, so a teleport off the road is snapped
 * back inside the barrier before the camera ever sees it, and every pose I
 * picked put the car dead centre. So drive it the way the report was made —
 * throttle pinned, no steering, into the walls of a canyon — and log EVERY
 * frame: where the car lands in NDC, where the camera is, and how far each of
 * them is off the centreline. Then read the worst frames.
 *
 *   LEVEL=4 SECS=40 node camtrail.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${process.env.LEVEL ?? 4}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const out = await p.evaluate(async (secs) => {
  const g = window.__game, t = g.track, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  const log = [];
  const t0 = performance.now();
  while (performance.now() - t0 < secs * 1000) {
    if (g.input?.analog) { g.input.analog.throttle = 1; g.input.analog.steer = 0; g.input.analog.brake = 0; }
    await f();
    const v = pl.mesh.position.clone().project(g.camera);
    const ci = t.nearestIndex(pl.pos, pl.trackIndex);
    const cci = t.nearestIndex(g.camera.position, pl.trackIndex);
    log.push({
      t: +((performance.now() - t0) / 1000).toFixed(1),
      ndc: [+v.x.toFixed(2), +v.y.toFixed(2)],
      carLat: +t.lateralOffset(pl.pos, ci).toFixed(1),
      camLat: +t.lateralOffset(g.camera.position, cci).toFixed(1),
      camY: +g.camera.position.y.toFixed(1),
      carY: +pl.pos.y.toFixed(1),
      groundAtCam: +(t.terrainHeight?.(g.camera.position.x, g.camera.position.z) ?? NaN).toFixed(1),
      spd: +pl.vel.length().toFixed(0),
      idxGap: Math.abs(((cci - ci + t.N + t.N / 2) % t.N) - t.N / 2),
    });
  }
  return log;
}, +(process.env.SECS ?? 40));
const bad = out.filter((r) => Math.abs(r.ndc[0]) > 0.3 || r.ndc[1] < -0.92 || r.camY < r.groundAtCam);
console.log(`frames ${out.length}   |ndcX|>0.3 or car at the very bottom or camera under ground: ${bad.length}`);
console.log('worst by |ndcX|:');
for (const r of [...out].sort((a, c) => Math.abs(c.ndc[0]) - Math.abs(a.ndc[0])).slice(0, 8)) console.log(' ', JSON.stringify(r));
console.log('camera below the ground it stands on:');
for (const r of out.filter((r2) => r2.camY < r2.groundAtCam).slice(0, 5)) console.log(' ', JSON.stringify(r));
console.log('max |camLat|', Math.max(...out.map((r) => Math.abs(r.camLat))).toFixed(1),
  '  max |carLat|', Math.max(...out.map((r) => Math.abs(r.carLat))).toFixed(1),
  '  max idxGap', Math.max(...out.map((r) => r.idxGap)));
await b.close();
