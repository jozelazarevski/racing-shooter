/* R12 residue probe: (c) AI cutting hairpins off-road — count rival frames
 * with |lateral| > widthAt+1 while inside a corner (|curvature| > 1/60);
 * (d) field evaporation — alive + moving rivals sampled every 10 s over a
 * 240 s race. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  g.clock.getDelta = () => 1 / 30; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const N = t.center.length;
  let cornerFrames = 0, offInCorner = 0;
  const field = [];
  const offenders = new Map();
  for (let k = 0; k < 240 * 30; k++) {
    g.frame();
    if (k % 15 === 0) {
      for (const e of g.enemies) {
        if (!e.alive) continue;
        const curv = Math.abs(t.curvature?.[e.trackIndex] ?? 0);
        if (curv < 1 / 60) continue;
        cornerFrames++;
        if (Math.abs(e.lateral ?? 0) > t.widthAt(e.trackIndex) + 1) {
          offInCorner++;
          offenders.set(e.name ?? '?', (offenders.get(e.name ?? '?') ?? 0) + 1);
        }
      }
    }
    if (k % (10 * 30) === 0) {
      const alive = g.enemies.filter(e => e.alive);
      field.push({ t: k / 30, alive: alive.length,
        moving: alive.filter(e => Math.hypot(e.vel.x, e.vel.z) > 3).length });
    }
  }
  return { name: g.level?.name,
    offPct: +(100 * offInCorner / Math.max(1, cornerFrames)).toFixed(1),
    cornerFrames, offenders: [...offenders.entries()],
    field };
});
console.log(JSON.stringify(r));
await browser.close();
