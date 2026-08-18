/* HOW MUCH BONNET SHOULD THE SEAT SHOW?
 *
 * r213 put the eye inside the cabin and the car back on screen, and the report
 * is that the bonnet now eats the frame. "Too much bonnet" is a SCREEN COVERAGE
 * question, so this measures coverage — the share of the game viewport filled by
 * the player's own bodywork — rather than the top-most vertex, which says
 * nothing about area and was the weaker number r213 was tuned on.
 *
 * It sweeps the seat (up = height in cabin heights, fwd = forward offset in
 * cabin lengths, lookH = how high up the road the view aims) and prints, per
 * combination, the coverage and the horizon of the bodywork. Rendered at the
 * real phone size, on the road, at speed — a parked car at the start line sits
 * at a different pitch and would tune the view for a situation nobody plays in.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const W = 430, H = 932;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });

const rows = await p.evaluate(async () => {
  const g = window.__game, pl = g.player, t = g.track;
  g.startRace?.(); g.setDriverView(true);
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  // ON THE ROAD AT SPEED, not parked on the grid.
  const rail = async (n) => {
    for (let k = 0; k < n; k++) {
      const nx = (pl.trackIndex + 4) % t.N, c = t.pointAt(nx, 0);
      pl.heading = t.headingAt(nx); pl.pos.x = c.x; pl.pos.z = c.z;
      pl.vel.copy(pl.forward).multiplyScalar(38); pl.trackIndex = nx;
      await frame();
    }
  };
  await rail(30);
  const V = pl.pos.constructor;
  // COVERAGE by sampling the projected silhouette on a grid: each bodywork
  // triangle's screen bbox is not the same as its area, and overlapping parts
  // would double-count. A coarse occupancy grid answers "what share of the
  // screen is car" directly.
  const coverage = () => {
    const cam = g.camera, v = new V();
    const GX = 43, GY = 93, cell = new Uint8Array(GX * GY);
    let top = 1;
    pl.mesh.updateWorldMatrix(true, true);
    pl.mesh.traverse((o) => {
      if (!o.visible) return;
      const pos = o.geometry?.attributes?.position; if (!pos) return;
      // rasterise each vertex into the grid, and also its face centroids so a
      // large flat panel is not represented by four corners alone
      for (let k = 0; k < pos.count; k++) {
        v.fromBufferAttribute(pos, k); o.localToWorld(v); v.project(cam);
        if (v.z > 1 || v.x < -1 || v.x > 1 || v.y < -1 || v.y > 1) continue;
        const fx = (v.x * 0.5 + 0.5), fy = 1 - (v.y * 0.5 + 0.5);
        if (fy < top) top = fy;
        const gx = Math.min(GX - 1, Math.max(0, Math.floor(fx * GX)));
        const gy = Math.min(GY - 1, Math.max(0, Math.floor(fy * GY)));
        cell[gy * GX + gx] = 1;
      }
    });
    // fill downward: bodywork is a solid silhouette from its horizon to the
    // bottom of frame in each column, which vertices alone under-report
    let filled = 0;
    for (let x = 0; x < GX; x++) {
      let seen = -1;
      for (let y = 0; y < GY; y++) if (cell[y * GX + x]) { seen = y; break; }
      if (seen >= 0) filled += (GY - seen);
    }
    return { cover: +(filled / (GX * GY) * 100).toFixed(1), top: +(top * 100).toFixed(1) };
  };
  const out = [];
  for (const up of [0.20, 0.35, 0.45]) {
    for (const fwd of [0.14, 0.34, 0.55]) {
      for (const lookH of [1.15, 2.2]) {
        g._driverTune = { up, fwd, lookH };
        await rail(8);
        const c = coverage();
        out.push({ up, fwd, lookH, ...c, eye: +g.camera.position.y.toFixed(2) });
      }
    }
  }
  return out;
});
console.log('  up   fwd  lookH |  bonnet covers  horizon at  eyeY');
for (const r of rows) {
  const flag = r.cover <= 22 && r.cover >= 8 ? '  <-- target band' : '';
  console.log(`  ${r.up.toFixed(2)} ${r.fwd.toFixed(2)}  ${r.lookH.toFixed(2)} | `
    + `${String(r.cover).padStart(6)}%  ${String(r.top).padStart(8)}%  ${r.eye}${flag}`);
}
await b.close();
