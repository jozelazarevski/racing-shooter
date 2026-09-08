/* Sea visibility from the road: at every coastal station (water within 300u on
 * one side), march the drawn ground along the seaward transect from an eye 2u
 * over the road and ask whether the water surface is ever in the clear — i.e.
 * no terrain rises above the sightline before it reaches the waterline.
 * Reports the share of coastal stations that can SEE their own bay. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 29);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length, C = t.T.coast;
  if (!C) return { none: true };
  const lvl = C.level ?? -2;
  const gy = (x, z) => (t._drawnGroundY ? t._drawnGroundY(x, z) : null) ?? t.terrainHeight(x, z);
  let coastal = 0, visible = 0, maxWall = 0;
  for (let i = 0; i < N; i += 3) {
    const c = t.center[i], n = t.nrm[i];
    let side = 0, waterD = 0;
    for (const sd of [1, -1]) {
      for (let d = 40; d <= 300; d += 10) {
        if (gy(c.x + n.x * d * sd, c.z + n.z * d * sd) < lvl + 0.5) { side = sd; waterD = d; break; }
      }
      if (side) break;
    }
    if (!side) continue;
    coastal++;
    const eyeY = c.y + 2;
    let clear = true, wall = 0;
    for (let d = 10; d < waterD; d += 5) {
      const g = gy(c.x + n.x * d * side, c.z + n.z * d * side);
      // sightline from the eye down to the water surface at waterD
      const line = eyeY + (lvl - eyeY) * (d / waterD);
      if (g > line) { clear = false; wall = Math.max(wall, g - line); }
    }
    if (clear) visible++; else maxWall = Math.max(maxWall, wall);
  }
  return { world: window.__game.level?.name, coastal, visible,
    pct: coastal ? Math.round(100 * visible / coastal) : 0,
    worstWallOverSightline: +maxWall.toFixed(1) };
});
console.log(JSON.stringify(r));
await browser.close();
