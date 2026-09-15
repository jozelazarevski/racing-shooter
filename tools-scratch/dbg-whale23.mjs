/* r346 — SERPENT PASS's pod vanished at 2x. Where is the wet ground vs
 * where does _buildWhales search? */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto(`${BASE}/?level=23&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const C = t.T?.coast ?? null;
  const out = { coast: C ? { a: C.a, b: C.b, level: C.level, floor: C.floor } : null,
    whales: (t.animated?.whales ?? []).length, samples: [] };
  if (C) {
    // sample terrain along the coast line and outward from its midpoint
    const [ax, az] = C.a, [bx, bz] = C.b;
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const dx = bx - ax, dz = bz - az;
    const L = Math.hypot(dx, dz) || 1;
    const nx = dz / L, nz = -dx / L;             // one normal
    for (const off of [0, 60, 140, 280, 400, 600, -60, -140, -280, -400]) {
      const x = mx + nx * off, z = mz + nz * off;
      out.samples.push({ off, terr: +t.terrainHeight(x, z).toFixed(1),
        water: t.waterAt ? +t.waterAt(x, z).toFixed(1) : null });
    }
    out.coastLen = +L.toFixed(0);
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
