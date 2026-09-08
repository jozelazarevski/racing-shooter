/* Teleport the player to the most tree-dense station and photograph the
 * stand — the evergreen-rule census (owner 2026-09-08: "pine trees are never
 * not green"). */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 68);
const OUT = process.env.OUT ?? `/tmp/evergreen-${LVL}.png`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 800, height: 480 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 240000 });
const info = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 300 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // most tree-dense station (pines preferred)
  let best = 0, bestScore = -1;
  for (let i = 0; i < N; i += 4) {
    const c = t.center[i];
    let sc = 0;
    for (const tr of t.trees ?? []) {
      const d = Math.hypot(tr.x - c.x, tr.z - c.z);
      if (d < 45) sc += (tr.kind === 'pine' || tr.kind === 'larch') ? 2 : 1;
    }
    if (sc > bestScore) { bestScore = sc; best = i; }
  }
  const c = t.center[best];
  const car = g.player;
  car.pos.x = c.x; car.pos.z = c.z; car.pos.y = c.y + 0.5;
  car.vel.x = car.vel.y = car.vel.z = 0;
  car.trackIndex = best;
  car.heading = t.headingAt(best);
  for (let k = 0; k < 45; k++) g.frame();
  return { world: g.level?.name, station: best, score: bestScore };
});
await p.screenshot({ path: OUT, timeout: 120000 });
console.log(JSON.stringify(info), OUT);
await browser.close();
