/* "I can still drive in trees" — the DRIVE test, not the geometry test.
 *
 * Puts the player just outside a dense stand, aims him into it, holds full
 * throttle for 6 s and reports how deep he gets and how fast he is still
 * going. A car that is stopped by wood ends a few metres in at a crawl; a
 * car that drives through the forest ends tens of metres in, still moving.
 *
 * Driven through g.input.analog + g._frameBody() — calling pl.step() beside
 * _frameBody() double-integrates and the result is overwritten.
 *
 *   node tools-scratch/dbg-treedrive.mjs 0 12 47
 */
import { chromium } from 'playwright-core';
const A = process.argv.slice(2).map(Number).filter(Number.isFinite);
const USE = A.length ? A : [0, 12, 47];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);

for (const lv of USE) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`,
    { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.player && window.__game?.track?.center?.length,
    undefined, { timeout: 600000 });
  console.log(JSON.stringify(await p.evaluate(async () => {
    const g = window.__game, t = g.track, pl = g.player;
    // find the densest patch of registered wood within reach of the road
    let best = null;
    const STEP = Math.max(1, Math.round(t.center.length / 60));
    for (let i = 0; i < t.center.length; i += STEP) {
      for (const side of [1, -1]) {
        const q = t.pointAt(i, (t.widthAt(i) + 16) * side);
        let n = 0;
        for (const tr of t.camTreesNear(q.x, q.z)) {
          if (!(tr.r > 0)) continue;
          if (Math.hypot(tr.x - q.x, tr.z - q.z) < 14) n++;
        }
        if (!best || n > best.n) best = { n, i, side, x: q.x, z: q.z };
      }
    }
    // Seat the car with placeAt, never by writing pos: the wrap-count work
    // put the placement law INSIDE placeAt and callers pass a seat. Writing
    // pos directly leaves trackIndex stale and groundHeightAt then reads an
    // undefined centre sample — which is exactly how this probe first failed.
    // Use the harness pattern dbg-lapincome proved out, not an invention:
    //   - force the countdown to expire rather than stepping through it,
    //   - drive with analog.steer/throttle/brake (NOT {x,y} — that shape is
    //     ignored, which is why an earlier cut of this probe sat at 0 km/h
    //     for its whole run and looked like a physics bug),
    //   - call _frameBody() with no dt; it takes its own.
    for (let f = 0; f < 400 && g.state !== 'race'; f++) { g.countdown = 0.01; g._frameBody(); }
    pl.placeAt(best.i, 0);
    pl.vel.set(0, 0, 0);
    pl.boostTimer = 0;
    const road = { x: pl.pos.x, z: pl.pos.z };
    pl.heading = Math.atan2(best.x - road.x, best.z - road.z);
    const x0 = pl.pos.x, z0 = pl.pos.z;
    let maxDepth = 0, entered = 0, peakKmh = 0;
    for (let f = 0; f < 360 && g.state === 'race'; f++) {
      g.input.analog.steer = 0;
      g.input.analog.throttle = 1;
      g.input.analog.brake = 0;
      g._frameBody();
      if (!Number.isFinite(pl.pos.x)) break;
      const d = Math.hypot(pl.pos.x - x0, pl.pos.z - z0);
      if (d > maxDepth) maxDepth = d;
      peakKmh = Math.max(peakKmh, Math.hypot(pl.vel.x, pl.vel.z) * 3.6);
      let inWood = 0;
      for (const tr of t.camTreesNear(pl.pos.x, pl.pos.z)) {
        if (!(tr.r > 0)) continue;
        if (Math.hypot(tr.x - pl.pos.x, tr.z - pl.pos.z) < 10) inWood++;
      }
      if (inWood >= 3) entered++;
    }
    const kmh = Math.hypot(pl.vel.x, pl.vel.z) * 3.6;
    return { world: t.level?.name, standDensity: best.n,
      travelledU: +maxDepth.toFixed(1),
      framesInsideWood: entered, peakKmh: +peakKmh.toFixed(1),
      finalKmh: +kmh.toFixed(1),
      offRoadU: +t._distToTrack(pl.pos.x, pl.pos.z).toFixed(1) };
  }, undefined)));
}
await b.close();
