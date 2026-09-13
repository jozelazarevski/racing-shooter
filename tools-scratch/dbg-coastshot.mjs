/* Stand the car at the most seaward-facing coast station, point it at the
 * water, and photograph what the driver sees toward the sea. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 29);
const OUT = process.env.OUT ?? `/tmp/coast-${LVL}.png`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 800, height: 480 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 240000 });
const info = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length, c = g.player;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 300 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const C = t.T.coast;
  const gy = (x, z) => (t._drawnGroundY ? t._drawnGroundY(x, z) : null) ?? t.terrainHeight(x, z);
  // station where water is closest on one side
  let best = null;
  for (let i = 0; i < N; i += 5) {
    const cs = t.center[i], n = t.nrm[i];
    for (const sd of [1, -1]) {
      for (let d = 60; d <= 300; d += 20) {
        if (gy(cs.x + n.x * d * sd, cs.z + n.z * d * sd) < (C.level ?? -2) + 0.5) {
          if (!best || d < best.d) best = { i, sd, d };
          break;
        }
      }
    }
  }
  if (!best) return { none: true };
  const cs = t.center[best.i], n = t.nrm[best.i];
  c.pos.set(cs.x, cs.y + 0.5, cs.z);
  c.trackIndex = best.i;
  c.heading = Math.atan2(n.x * best.sd, n.z * best.sd);
  c.vel.set(0, 0, 0);
  for (let k = 0; k < 50; k++) { c._wedgeT = 0; c._lostT = 0; g._gateMissT = 0; g.frame(); }
  return { world: g.level?.name, station: best.i, waterAt: best.d, side: best.sd };
});
await p.screenshot({ path: OUT, timeout: 120000 });
console.log(JSON.stringify(info), OUT);
await browser.close();
