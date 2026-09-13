/* HOW MUCH BONNET SHOULD THE SEAT SHOW?
 *
 * TWO MEASUREMENT LESSONS ARE BAKED IN, BOTH PAID FOR HERE:
 *
 * 1. COVERAGE IS COUNTED IN PIXELS, NOT PROJECTED VERTICES. The first cut
 *    rasterised the car's vertices into an occupancy grid and reported ~8%
 *    while the phone screenshot plainly showed ~30%. Vertices are not area.
 *    Now the player's materials are swapped for a flat key colour, one frame is
 *    rendered, and the key pixels are COUNTED off the canvas. Ground truth.
 *
 * 2. THE RAIL MUST SET HEIGHT. Setting only pos.x/pos.z drops the car through
 *    the world — the first cut reported eye heights of -1.56 and +9.56 on a
 *    cabin that sits at 2.4, i.e. every number came from a car in freefall.
 *    pointAt carries the road's y; the car is seated on it each step.
 *
 * 3. EVERY TUNE IS MEASURED AT THE SAME PLACE ON THE LAP. The second cut railed
 *    the car onward between rows, so each tune was read at a different road
 *    pitch and crest. The car is now pinned to a FIXED station on every frame
 *    INCLUDING the measurement frames — parking once was not enough, physics
 *    carried it three stations on before the pixels were read.
 *
 * 4. SWEEP WHAT THE CODE ACTUALLY USES. The third cut swept eye height and
 *    forward offset across 3x and 7x ranges and moved coverage by 4 points,
 *    because BOTH SATURATE AGAINST THEIR OWN CLAMPS: eyeY read an identical
 *    2.51 for up=0.50 and up=0.65, and fwd 0.40/0.70/1.00 produced byte-
 *    identical rows (Math.min(0.45, cabL * fwd)). Sweeping a value the code
 *    throws away measures nothing. The lever is where the camera AIMS.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 932 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });

const rows = await p.evaluate(async () => {
  const g = window.__game, pl = g.player, t = g.track;
  g.startRace?.(); g.setDriverView(true);
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  // ON THE ROAD, AT SPEED, AND AT THE RIGHT HEIGHT.
  const rail = async (n) => {
    for (let k = 0; k < n; k++) {
      const nx = (pl.trackIndex + 4) % t.N, c = t.pointAt(nx, 0);
      pl.heading = t.headingAt(nx);
      pl.pos.x = c.x; pl.pos.z = c.z;
      if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
      pl.vy = 0; pl.airborne = false;
      pl.vel.copy(pl.forward).multiplyScalar(38); pl.trackIndex = nx;
      await frame();
    }
  };
  await rail(30);

  // ---- pixel coverage of the player's own bodywork -------------------------
  const KEY = { r: 255, g: 0, b: 255 };
  const saved = [];
  const paint = (on) => {
    pl.mesh.traverse((o) => {
      if (!o.geometry || !o.material) return;
      if (on) {
        saved.push([o, o.material]);
        const M = o.material.constructor === Array ? o.material[0] : o.material;
        const flat = new M.constructor({ color: 0xff00ff });
        if ('map' in flat) flat.map = null;
        if ('transparent' in flat) flat.transparent = false;
        o.material = flat;
      }
    });
    if (!on) { for (const [o, m] of saved) o.material = m; saved.length = 0; }
  };
  const cover = async (pin) => {
    paint(true);
    await pin(); await frame(); await pin(); await frame();
    const src = g.renderer?.domElement ?? document.querySelector('canvas');
    const c2 = document.createElement('canvas');
    c2.width = 215; c2.height = 466;                    // half res is plenty
    const cx = c2.getContext('2d');
    cx.drawImage(src, 0, 0, c2.width, c2.height);
    const d = cx.getImageData(0, 0, c2.width, c2.height).data;
    let hit = 0, top = c2.height;
    for (let y = 0; y < c2.height; y++) {
      for (let x = 0; x < c2.width; x++) {
        const i = (y * c2.width + x) * 4;
        if (d[i] > 180 && d[i + 1] < 90 && d[i + 2] > 180) { hit++; if (y < top) top = y; }
      }
    }
    paint(false);
    await frame();
    return { cover: +(hit / (c2.width * c2.height) * 100).toFixed(1),
      top: +(top / c2.height * 100).toFixed(1) };
  };

  // FIXED STATION for every reading — a straight, mid-lap, away from the grid.
  const HOME = Math.floor(t.N * 0.18);
  const pin = async () => {
    const c = t.pointAt(HOME, 0);
    pl.heading = t.headingAt(HOME);
    pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.vy = 0; pl.airborne = false;
    pl.vel.copy(pl.forward).multiplyScalar(38);
    pl.trackIndex = HOME;
  };
  const settle = async (n) => { for (let k = 0; k < n; k++) { await pin(); await frame(); } };
  const out = [];
  // lookH is the height above the road the view aims at, and it is the only one
  // of the three that is not clamped into irrelevance.
  for (const lookH of [1.15, 2.5, 4.0, 6.0, 8.0]) {
    for (const up of [0.20, 0.45]) {
      g._driverTune = { up, fwd: 0.14, lookH };
      await settle(12);
      const c = await cover(pin);
      out.push({ up, fwd: lookH, ...c, eye: +g.camera.position.y.toFixed(2),
        carY: +pl.pos.y.toFixed(2), idx: pl.trackIndex });
    }
  }
  return out;
});
console.log('  up  lookH | bonnet covers  horizon at  eyeY  carY  idx   (target 12-18%)');
const idx = new Set(rows.map((r) => r.idx));
for (const r of rows) {
  const sane = Math.abs(r.eye - r.carY) < 4;
  const target = r.cover >= 12 && r.cover <= 18 ? '  <-- target' : '';
  console.log(`  ${r.up.toFixed(2)} ${r.fwd.toFixed(2)} | ${String(r.cover).padStart(6)}% `
    + ` ${String(r.top).padStart(9)}%  ${String(r.eye).padStart(6)} ${String(r.carY).padStart(6)} ${r.idx}`
    + (sane ? target : '   <-- IMPLAUSIBLE, car not seated'));
}
console.log(idx.size === 1
  ? `\nall rows measured at station ${[...idx][0]} — comparable`
  : `\nWARNING: rows span ${idx.size} stations, the comparison is confounded`);
await b.close();
