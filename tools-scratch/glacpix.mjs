/* IS THE GLACIER IN THE FRAME AT ALL, AND WHY DOES THE DIFF SAY 0?
 *
 * `glacshot`'s share measure reported 0.00% on a frame with pale ice plainly
 * in it, which is either a lying probe or a misread picture. This settles it
 * three ways at one station:
 *   1. readPixels after a composer render — is the buffer even populated?
 *   2. the instance matrices projected through the live camera — how many
 *      slabs land inside the frustum, and where on the screen;
 *   3. a page screenshot with the mesh hidden, written next to the normal one,
 *      so the answer can be checked by eye.
 *
 *   LEVEL=66 STATION=206 node glacpix.mjs
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const LV = process.env.LEVEL ?? 66, PORT = process.env.PORT ?? '8912';
const ST = +(process.env.STATION ?? 206);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 800 } });
p.setDefaultTimeout(900000);
await p.goto(`http://localhost:${PORT}/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:900000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:900000 });
const pin = async (idx) => p.evaluate(async (idx) => {
  const g = window.__game, t = g.track, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
  while (g.camMode !== 3) g.cycleCamera();
  for (let i = 0; i < 40; i++) {
    const c = t.pointAt(idx, 0);
    pl.heading = t.headingAt(idx); pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.trackIndex = idx; pl.vel.copy(pl.forward).multiplyScalar(14); pl.vy = 0; pl.airborne = false;
    await f();
  }
}, idx);
await pin(ST);
writeFileSync(`tools-scratch/shot-glacpix${LV}-shown.png`, await p.screenshot());
const r = await p.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game, t = g.track;
  const mesh = t.group.children.find((o) => o.name === 'glacier');
  if (!mesh) return { err: "no InstancedMesh named 'glacier'" };
  // 1. does readPixels give us anything?
  const gl = g.renderer.getContext();
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  g.composer.render();
  const A = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, A);
  let sum = 0, nz = 0;
  for (let i = 0; i < A.length; i += 4) { sum += A[i]; if (A[i] || A[i + 1] || A[i + 2]) nz++; }
  // 2. where are the slabs on screen?
  g.camera.updateMatrixWorld();
  const m = new THREE.Matrix4(), P = new THREE.Vector3();
  const q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3();
  const rows = [];
  for (let k = 0; k < mesh.count; k++) {
    mesh.getMatrixAt(k, m); m.decompose(P, q, sc);
    if (P.y < -9999) continue;
    v.copy(P).project(g.camera);
    const dist = P.distanceTo(g.camera.position);
    rows.push({ k, x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(3),
      dist: +dist.toFixed(0),
      inFrustum: Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z > -1 && v.z < 1 });
  }
  return { w, h, meanR: +(sum / (w * h)).toFixed(1), nonBlackPct: +(100 * nz / (w * h)).toFixed(1),
    visible: mesh.visible, frustumCulled: mesh.frustumCulled,
    far: g.camera.far, fogFar: g.scene.fog?.far ?? null,
    inFrame: rows.filter((o) => o.inFrustum).length, rows };
});
if (r.err) { console.log('PROBE FAILED: ' + r.err); await b.close(); process.exit(2); }
console.log(JSON.stringify({ ...r, rows: undefined }, null, 1));
for (const o of r.rows) console.log(`   slab ${o.k}: ndc ${o.x},${o.y} z=${o.z} dist ${o.dist} ${o.inFrustum ? 'IN FRAME' : ''}`);
if (r.nonBlackPct < 1) console.log('READPIXELS CAME BACK BLACK — the share measure was reading nothing');
await p.evaluate(() => {
  window.__game.track.group.children.find((o) => o.name === 'glacier').visible = false;
});
await pin(ST);
writeFileSync(`tools-scratch/shot-glacpix${LV}-hidden.png`, await p.screenshot());
console.log('wrote shot-glacpix' + LV + '-shown.png and -hidden.png');
await b.close();
