/* THE GLACIER, MEASURED THEN PHOTOGRAPHED.
 *
 * `glacierloom` says which slab leans hardest over the lap. This parks at the
 * station where that slab is both worst AND actually AHEAD of the car (a slab
 * behind your head is not what fills the frame), then saves the race-camera
 * frame — so the number and the picture are the same event.
 *
 * FAILS LOUDLY if there is no 'glacier' mesh on the level.
 *
 *   LEVEL=66 TAG=-before node glacshot.mjs
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const LV = process.env.LEVEL ?? 66;
const PORT = process.env.PORT ?? '8912';
// THE CAMERA'S OWN HALF-ANGLE, NOT AN ARBITRARY CONE. The race camera is a 56
// degree VERTICAL fov on a portrait viewport, so the horizontal half-angle is
// about 18 degrees: a slab picked as "ahead" at 45 degrees off the nose is off
// the side of the picture, which is how the first cut of this shot came back
// with 0.00% of the frame drawn by a glacier that was plainly on the skyline.
const FOV = +(process.env.FOV ?? 16);        // half-angle the slab must sit within
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 800 } });
p.setDefaultTimeout(900000);
await p.goto(`http://localhost:${PORT}/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:900000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:900000 });
const worst = await p.evaluate(async (FOV) => {
  const THREE = await import('three');
  const t = window.__game.track;
  const mesh = t.group.children.find((o) => o.name === 'glacier');
  if (!mesh) return { err: "no InstancedMesh named 'glacier'" };
  const pos = mesh.geometry.attributes.position;
  const m = new THREE.Matrix4(), P = new THREE.Vector3();
  const q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3();
  let best = null, live = 0;
  for (let k = 0; k < mesh.count; k++) {
    mesh.getMatrixAt(k, m); m.decompose(P, q, sc);
    if (P.y < -9999 || sc.x < 1e-3) continue;
    live++;
    let top = -1e9, maxr = 0;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m);
      if (v.y > top) top = v.y;
      const rr = Math.hypot(v.x - P.x, v.z - P.z);
      if (rr > maxr) maxr = rr;
    }
    for (let i = 0; i < t.N; i++) {
      const c = t.center[i];
      const dx = P.x - c.x, dz = P.z - c.z;
      const d = Math.hypot(dx, dz) - maxr;
      // is the slab ahead? road heading vs bearing to the slab
      const hd = t.headingAt(i);
      const fx = Math.sin(hd), fz = Math.cos(hd);
      const L = Math.hypot(dx, dz) || 1;
      const cosA = (fx * dx + fz * dz) / L;
      if (cosA < Math.cos(FOV * Math.PI / 180)) continue;
      const deg = Math.atan2(top - (c.y + 1.6), Math.max(1, d)) * 180 / Math.PI;
      if (!best || deg > best.deg) best = { k, i, d: +d.toFixed(1), deg: +deg.toFixed(1),
        w: +(maxr * 2).toFixed(0), top: +top.toFixed(0), slabR: +Math.hypot(P.x, P.z).toFixed(0) };
    }
  }
  return best ? { ...best, live, count: mesh.count } : { err: `no slab within ${FOV} deg of any road heading`, live, count: mesh.count };
}, FOV);
console.log(JSON.stringify(worst));
if (worst.err) { console.log('PROBE FAILED: ' + worst.err); await b.close(); process.exit(2); }
const idx = process.env.STATION ? +process.env.STATION : worst.i;
await p.evaluate(async (idx) => {
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
const out = `tools-scratch/shot-glacier${LV}${process.env.TAG ?? ''}.png`;
writeFileSync(out, await p.screenshot());
// ...AND IS THE ICE ACTUALLY IN THE PICTURE? "No slab leans over the road" is
// also what deleting the glacier would report, so measure the share of the
// FRAME the mesh draws: render the scene by hand, read the pixels, hide the
// mesh, render and read again, diff.
//
// THE FIRST CUT OF THIS TOOK TWO page.screenshot()s AND REPORTED 61% — which
// is not the glacier, it is the car driving on between the two shots. Both
// renders have to happen inside ONE task with nothing stepping the world in
// between, and readPixels is the only way to get the buffer back without
// preserveDrawingBuffer.
const share = await p.evaluate(() => {
  const g = window.__game;
  const m = g.track.group.children.find((o) => o.name === 'glacier');
  if (!m) return { err: "no InstancedMesh named 'glacier'" };
  const gl = g.renderer.getContext();
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  // THROUGH THE COMPOSER, WHICH IS HOW THE GAME DRAWS. Calling
  // renderer.render() directly left the render target the last pass had bound
  // still bound, so nothing reached the default framebuffer and readPixels
  // returned the same stale bytes twice: 0.00%, on a frame with ice plainly
  // in it. The probe said so out loud, which is the only reason it was caught.
  const grab = () => {
    g.composer.render();
    const b = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b);
    return b;
  };
  const A = grab();
  m.visible = false;
  const B = grab();
  m.visible = true;
  let n = 0;
  for (let i = 0; i < A.length; i += 4) {
    if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1])
      + Math.abs(A[i + 2] - B[i + 2]) > 12) n++;
  }
  return { pct: +(100 * n / (w * h)).toFixed(2), w, h };
});
if (share.err) { console.log('PROBE FAILED: ' + share.err); await b.close(); process.exit(2); }
console.log(`wrote ${out} at station ${idx}; glacier draws ${share.pct}% of the ${share.w}x${share.h} frame`);
if (share.pct < 0.05) console.log('THE GLACIER IS NOT IN THIS FRAME — the shot proves nothing');
await b.close();
