/* THE AUTUMN WOOD AND THE LEAF WAKE, driven rather than posed.
 *
 * Two claims to check and neither is a screenshot on its own: that the wood is
 * actually thicker (tree instance count and how much of the frame trunks own),
 * and that driving through the litter throws leaves (live particle count while
 * moving, against the same car standing still on the same world).
 *
 * The standing-still control is the part that matters: the ambient leaf fall
 * was raised at the same time, so a probe that only counts particles while
 * driving cannot tell the wake from the weather.
 *
 *   LEVELS=68,72 node autumnrun.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 420, height: 760 } });
p.setDefaultTimeout(600000);
for (const lv of (process.env.LEVELS ?? '68,72').split(',')) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
  const r = await p.evaluate(async () => {
    const g = window.__game, t = g.track, pl = g.player;
    g.startRace?.();
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
    if (g.state !== 'race') throw new Error('race never started');
    let trees = 0;
    t.group.traverse((o) => {
      if (o.isInstancedMesh && /tree|trunk|foliage|canopy/i.test(o.name || '')) trees += o.count;
    });
    // the pool is a ring buffer with no live counter — a particle is live
    // while its life is positive, so count that directly
    const lifeArr = g.particles?.life;
    if (!lifeArr?.length) throw new Error('cannot read the particle pool');
    const live = () => { let n = 0;
      for (let i = 0; i < lifeArr.length; i++) if (lifeArr[i] > 0) n++;
      return n; };
    // STANDING STILL: ambient leaf fall only
    for (let i = 0; i < 40; i++) {
      if (g.input?.analog) { g.input.analog.throttle = 0; g.input.analog.steer = 0; }
      pl.vel.set(0, 0, 0); await f();
    }
    let still = 0, ns = 0;
    for (let i = 0; i < 24; i++) { pl.vel.set(0, 0, 0); await f(); still += live(); ns++; }
    // DRIVING: ambient + whatever the car throws up
    for (let i = 0; i < 30; i++) { if (g.input?.analog) g.input.analog.throttle = 1; await f(); }
    let mov = 0, nm = 0, spd = 0;
    for (let i = 0; i < 24; i++) {
      if (g.input?.analog) g.input.analog.throttle = 1;
      await f(); mov += live(); nm++; spd += pl.vel.length();
    }
    return { name: t.T?.name ?? '', weather: t.theme?.weather?.type ?? null,
      treeInstances: trees, still: +(still / ns).toFixed(1),
      moving: +(mov / nm).toFixed(1), speed: +(spd / nm).toFixed(1) };
  });
  console.log(`L${lv} ${String(r.name).padEnd(14)} weather=${r.weather} trees=${r.treeInstances}`
    + `  particles: still ${r.still} -> moving ${r.moving} at ${r.speed} u/s`);
}
await b.close();
