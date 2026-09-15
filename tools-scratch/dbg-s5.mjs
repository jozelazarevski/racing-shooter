import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
p.setDefaultTimeout(240000);
await p.goto('http://localhost:8901/?level=74&go=1&unlockall=1', { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 240000 });
const C = await p.evaluate(() => {
  const g = window.__game, t = g.track, pl = g.player;
  g.clock.getDelta = () => 1 / 60;
  g.camMode = 3;
  const big = (t.solids ?? []).filter((s) => (s.r ?? 0) >= 3 && s.r <= 20 && s.y !== -9999)
    .sort((a, b) => b.r - a.r)[0];
  if (!big) return { none: true };
  const ang = Math.atan2(pl.pos.z - big.z, pl.pos.x - big.x);
  pl.placeAt(pl.trackIndex, 0, true);
  pl.pos.set(big.x + Math.cos(ang) * (big.r + 3), pl.pos.y, big.z + Math.sin(ang) * (big.r + 3));
  pl.heading = Math.atan2(big.x - pl.pos.x, big.z - pl.pos.z) + Math.PI;
  pl.vel.set(0, 0, 0);
  let worstIn = 0; const trace = [];
  const top = (big.y ?? t.terrainHeight(big.x, big.z)) + Math.min(14, big.r * 1.6);
  for (let f = 0; f < 90; f++) {
    pl._wedgeT = 0; pl._lostT = 0; g._gateMissT = 0;
    g.frame();
    const cp = g.camera.position;
    const d = Math.hypot(cp.x - big.x, cp.z - big.z);
    if (d < big.r - 0.5 && cp.y < top) {
      worstIn = Math.max(worstIn, big.r - d);
      if (trace.length < 8) trace.push({ f, d: +d.toFixed(1), cy: +cp.y.toFixed(1), top: +top.toFixed(1) });
    }
  }
  return { r: +big.r.toFixed(1), worstIn: +worstIn.toFixed(1), trace };
});
console.log(JSON.stringify(C));
await browser.close();
