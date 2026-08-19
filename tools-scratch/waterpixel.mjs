/* IS THERE WATER AT THIS POINT — IN PIXELS.
 *
 * Six geometry-level corrections into the river audit, three renders aimed at
 * "water 5 u over the carriageway" have come back as dry tarmac, and each time
 * the answer was another property of the mesh I had not asked about (tails,
 * rim, pinched rows, water under a deck, per-vertex alpha). Enough. This puts
 * the camera at a known place, projects the point onto the frame, and READS
 * THE PIXEL — the same rule `eyesweep.mjs` established for the car: coverage is
 * counted in pixels, not inferred from vertices.
 *
 * It reports the pixel under the point and the bluest pixel in a small patch
 * around it, so "the water is 3 px to the left" cannot read as "no water".
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '/tmp/waterpx';
const ISO = !!process.env.ISOLATE;
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 900, height: 520 } });
page.setDefaultTimeout(600000);
for (const arg of process.argv.slice(2)) {
  const id = Number(arg.split('@')[0]);
  const [X, Z] = arg.split('@')[1].split(',').map(Number);
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  await page.evaluate((v) => { window.__isolate = v; }, ISO);
  const r = await page.evaluate(async ([X, Z]) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    g.hud?.hide?.();
    // the highest water vertex within 8 u, and the road under the point
    let wmesh = null;
    t.group.traverse((o) => { if (o.name === 'river-water' && o.geometry) wmesh = o; });
    let wy = null, alpha = null;
    if (wmesh) {
      wmesh.updateMatrixWorld(true);
      const pa = wmesh.geometry.attributes.position, ca = wmesh.geometry.attributes.color;
      const m = wmesh.matrixWorld.elements;
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
        const wx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const wyy = m[1] * x + m[5] * y + m[9] * z + m[13];
        const wz = m[2] * x + m[6] * y + m[10] * z + m[14];
        if (Math.hypot(wx - X, wz - Z) > 8) continue;
        if (wy == null || wyy > wy) { wy = wyy; alpha = ca && ca.itemSize === 4 ? ca.getW(i) : 1; }
      }
    }
    // ISOLATE THE WATER. The blue-pixel test just picked a blue RIVAL CAR out
    // of the start grid and called it a river — the sixth false positive in a
    // row from asking an indirect question. Everything except the water mesh
    // is hidden, so a blue shape in the frame can only be the river.
    if (window.__isolate) {
      g.scene.traverse((o) => {
        if (!o.isMesh && !o.isInstancedMesh && !o.isPoints && !o.isLine) return;
        o.__wasVis = o.visible;
        o.visible = (o === wmesh);
      });
      if (g.scene.background) { g.__bg = g.scene.background; g.scene.background = null; }
      if (g.scene.fog) { g.__fog = g.scene.fog; g.scene.fog = null; }
    }
    const gy = t.terrainHeight(X, Z);
    const aim = new THREE.Vector3(X, wy != null ? wy : gy, Z);
    // stand off 30 u to the side, 10 u up from the AIM POINT itself
    g.camera.position.set(X + 30, aim.y + 10, Z + 30);
    g.camera.lookAt(aim);
    g.camera.updateMatrixWorld(true);
    g.composer.render();
    const cv = g.renderer.domElement;
    const c = document.createElement('canvas');
    c.width = cv.width; c.height = cv.height;
    c.getContext('2d').drawImage(cv, 0, 0);
    const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const p = aim.clone().project(g.camera);
    const sx = Math.round((p.x * 0.5 + 0.5) * c.width);
    const sy = Math.round((-p.y * 0.5 + 0.5) * c.height);
    const at = (x, y) => { const i = (y * c.width + x) * 4; return [px[i], px[i + 1], px[i + 2]]; };
    let here = null, bluest = null, bs = -1e9, lit = 0;
    if (sx >= 0 && sx < c.width && sy >= 0 && sy < c.height) {
      here = at(sx, sy);
      for (let dy = -22; dy <= 22; dy++) for (let dx = -22; dx <= 22; dx++) {
        const x = sx + dx, y = sy + dy;
        if (x < 0 || y < 0 || x >= c.width || y >= c.height) continue;
        const q = at(x, y);
        const score = q[2] - (q[0] + q[1]) / 2;      // blue over the others
        if (score > bs) { bs = score; bluest = q; }
      }
      for (let i = 0; i < px.length; i += 4) if (px[i] + px[i + 1] + px[i + 2] > 30) lit++;
    }
    if (window.__isolate) {
      g.scene.traverse((o) => { if (o.__wasVis !== undefined) o.visible = o.__wasVis; });
      if (g.__bg) g.scene.background = g.__bg;
      if (g.__fog) g.scene.fog = g.__fog;
    }
    return { name: t.level?.name, wy: wy == null ? null : +wy.toFixed(2), alpha,
      ground: +gy.toFixed(2),
      road: +t.groundHeightAt(t.nearestIndex(aim), t.lateralOffset(aim, t.nearestIndex(aim))).toFixed(2),
      roadDist: Math.round(t._distToTrack(X, Z)),
      screen: [sx, sy], here, bluest, blueScore: Math.round(bs),
      litPct: +(lit / (c.width * c.height) * 100).toFixed(2) };
  }, [X, Z]);
  await page.screenshot({ path: `${OUT}/L${String(id).padStart(2, '0')}-${X}_${Z}.png` });
  console.log(`${id} ${(r.name ?? '?').padEnd(18)} (${X},${Z})  water y ${r.wy} (alpha ${r.alpha})  `
    + `ground ${r.ground}  road ${r.road}  ${r.roadDist} u out\n`
    + `      pixel at the point ${JSON.stringify(r.here)}   bluest within 22 px ${JSON.stringify(r.bluest)} (blue-over-rest ${r.blueScore})`
    + (ISO ? `   |  ISOLATED: ${r.litPct}% of the frame has anything drawn in it` : ''));
}
await b.close();
