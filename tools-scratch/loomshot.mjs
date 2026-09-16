/* THE LOOMING MOUNTAIN, MEASURED THEN PHOTOGRAPHED.
 *
 * `massifloom` says which station has the worst rock over it. This parks there
 * with the race camera and saves the frame, so the number and the picture are
 * the same event. Also prints each offending cone's radius from the world
 * origin, which is how you tell a massif cone (r 400-700) from a skyline one
 * (r 900+) without reading the builder.
 *
 *   LEVEL=66 node loomshot.mjs
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const LV = process.env.LEVEL ?? 66;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 420, height: 760 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${process.env.PORT ?? 8901}/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const worst = await p.evaluate(() => {
  const t = window.__game.track;
  const cones = (t.solids || []).filter((s) => s.prof && s.h > 60);
  let best = null;
  for (let i = 0; i < t.N; i++) {
    const c = t.center[i];
    for (const s of cones) {
      const d = Math.hypot(c.x - s.x, c.z - s.z) - s.r;
      const deg = Math.atan2((s.y + s.h) - (c.y + 1.6), Math.max(1, d)) * 180 / Math.PI;
      if (!best || deg > best.deg) best = { i, d: +d.toFixed(1), deg: +deg.toFixed(1),
        w: +(s.r * 2).toFixed(0), h: +s.h.toFixed(0),
        coneR: +Math.hypot(s.x, s.z).toFixed(0) };
    }
  }
  return best;
});
if (process.env.STATION) {
  const st = +process.env.STATION;
  // an absolute index, never a fraction — 0.35 once indexed center[0.35] and
  // crashed both halves of an A/B
  if (!Number.isInteger(st) || st < 0) throw new Error('STATION must be a whole station index, got ' + process.env.STATION);
  worst.i = st;
}
console.log(JSON.stringify(worst));
await p.evaluate(async ([idx, cam]) => {
  const g = window.__game, t = g.track, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  const want = cam;
  for (let i = 0; i < 12 && g.camMode !== want; i++) g.cycleCamera();
  if (g.camMode !== want) throw new Error('camera mode never reached');
  for (let i = 0; i < 30; i++) {
    const c = t.pointAt(idx, 0);
    pl.heading = t.headingAt(idx); pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.trackIndex = idx; pl.vel.copy(pl.forward).multiplyScalar(14); pl.vy = 0; pl.airborne = false;
    await f();
  }
}, [worst.i, +(process.env.CAM ?? 3)]);
writeFileSync(`tools-scratch/shot-loom${LV}${process.env.TAG ?? ''}.png`, await p.screenshot());
console.log(`wrote tools-scratch/shot-loom${LV}${process.env.TAG ?? ''}.png`);
await b.close();
