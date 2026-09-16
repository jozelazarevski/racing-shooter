import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto(`${BASE}/?level=12&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  let raw = 0, sustained = 0, dry = 0;
  const cands = [];
  for (let i = 0; i < N; i += 8) {
    const c = t.center[i], c2 = t.center[(i + 1) % N];
    let sx = c2.z - c.z, sz = -(c2.x - c.x);
    const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    for (const side of [1, -1]) for (const dist of [70, 90, 120, 155, 195]) {
      const x = c.x + sx * side * dist, z = c.z + sz * side * dist;
      const E = 4;
      const gx = (t.terrainHeight(x + E, z) - t.terrainHeight(x - E, z)) / (2 * E);
      const gz = (t.terrainHeight(x, z + E) - t.terrainHeight(x, z - E)) / (2 * E);
      const gm = Math.hypot(gx, gz);
      if (gm < 1.4 || gm > 5) continue;
      raw++;
      const ux = gx / gm, uz = gz / gm;
      if ((t.terrainHeight(x + ux * 14, z + uz * 14) - t.terrainHeight(x, z)) / 14 < 1.0) continue;
      sustained++;
      const wet = t.waterAt && (t.waterAt(x, z) > 0
        || t.waterAt(x - ux * 12, z - uz * 12) > 0 || t.waterAt(x + ux * 20, z + uz * 20) > 0);
      if (wet) continue;
      dry++;
      if (cands.length < 8) cands.push({ i, dist, grade: +gm.toFixed(2),
        terr: +t.terrainHeight(x, z).toFixed(1), x: +x.toFixed(0), z: +z.toFixed(0) });
    }
  }
  return { raw, sustained, dry, cands };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
