/* Bridge audit: every deck/bridge/ramp-ish mesh — world position, size, tilt,
 * and whether its ends sit on the ground or hang. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 32);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const gy = (x, z) => (t._drawnGroundY ? t._drawnGroundY(x, z) : null) ?? t.terrainHeight(x, z);
  const out = [];
  g.scene.traverse((o) => {
    if (!o.isMesh) return;
    const nm = (o.name || '').toLowerCase();
    const named = /bridge|deck|overpass|ramp|kicker|flyover|span|pier|parapet/.test(nm);
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox;
    const e = o.matrixWorld.elements;
    const sx = Math.hypot(e[0], e[1], e[2]), sy = Math.hypot(e[4], e[5], e[6]), sz = Math.hypot(e[8], e[9], e[10]);
    const size = { x: +((bb.max.x - bb.min.x) * sx).toFixed(1),
      y: +((bb.max.y - bb.min.y) * sy).toFixed(1), z: +((bb.max.z - bb.min.z) * sz).toFixed(1) };
    if (Math.max(size.x, size.z) < 14) return;
    if (size.y > 25) return;                    // terrain/massif, not a deck
    // world up of the object: third column of the rotation
    const upY = e[5] / (sy || 1);
    const wx = e[12], wy = e[13], wz = e[14];
    const s9 = t._nearestSample(wx, wz);
    if (s9.d > 140) return;
    if (!named && Math.min(size.x, size.z) > 60) return;   // ground patches
    out.push({ name: o.name || (named ? o.type : 'UNNAMED'), size,
      pos: { x: Math.round(wx), y: +wy.toFixed(1), z: Math.round(wz) },
      tiltDeg: +(Math.acos(Math.min(1, Math.abs(upY))) * 180 / Math.PI).toFixed(0),
      groundY: +gy(wx, wz).toFixed(1), aboveGround: +(wy - gy(wx, wz)).toFixed(1),
      distToRoad: +s9.d.toFixed(0), station: s9.i, count: o.isInstancedMesh ? o.count : 1 });
  });
  return { world: g.level?.name, N: t.center.length,
    gorges: (t._jumpGorges ?? []).length, overpasses: (t._overpasses ?? []).length,
    heroBridge: !!t.T.heroBridge, items: out.sort((a, b) => a.distToRoad - b.distToRoad).slice(0, 14) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
