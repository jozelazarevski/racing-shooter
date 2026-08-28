/* THE MOUNTAIN RING, IN A RACE FRAME, before and after a change to the walk.
 *
 * The point of the picture is the RANGE, so this does not photograph wherever
 * the car happens to point: it reads the massif's live instance matrices,
 * finds the road station nearest the ring's own bearing, parks the car there
 * with the race actually running, and aims the race camera from the driver's
 * seat along that bearing. Two files come out — the raw canvas (the world) and
 * the page (the world with the HUD over it) — so "the mountains are still
 * there" and "this is a frame of the game" are the same event.
 *
 * FAILS LOUDLY when there is no massif mesh, when every cone was dropped, or
 * when the race never starts. A blank ridge is the regression this exists to
 * catch, and a probe that shoots an empty sky and says nothing is worse than
 * no probe at all.
 *
 *   PORT=8914 LEVEL=66 TAG=-before node massifframe.mjs
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const PORT = process.env.PORT ?? 8914, LV = process.env.LEVEL ?? 66;
const TAG = process.env.TAG ?? '';
const W = '/tmp/claude-0/-home-user-racing-shooter/f9cadee5-74f9-591d-ae2a-5f09dba759d5/scratchpad/wt4';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(900000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(`http://localhost:${PORT}/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:900000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:900000 });
const info = await p.evaluate(async () => {
  const THREE = await import('three');
  const t = window.__game.track, M = t.T.massif;
  let mesh = null;
  t.group.traverse((o) => { if (o.name === 'massif') mesh = o; });
  if (!mesh) return { err: 'no InstancedMesh named massif on this level' };
  const m = new THREE.Matrix4(), pos = new THREE.Vector3();
  const q = new THREE.Quaternion(), sc = new THREE.Vector3();
  const live = [];
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, m); m.decompose(pos, q, sc);
    if (pos.y < -9999) continue;
    live.push({ x: pos.x, y: pos.y, z: pos.z, w: Math.round(sc.x), h: Math.round(sc.y),
      r: Math.round(Math.hypot(pos.x, pos.z)) });
  }
  if (!live.length) return { err: 'every massif cone was dropped out of sight' };
  // A RING HAS NO USEFUL CENTROID. `spread: 6.0` puts cones all the way round,
  // so their mean is the world origin and a camera aimed at it looks at the
  // lap, not at a mountain. Aim at ONE cone instead: the station/cone pair
  // that subtends the largest angle, which is the biggest piece of rock any
  // driver on this lap ever sees.
  let bi = 0, best = -1e9, cx = 0, cz = 0, bh = 0;
  for (let i = 0; i < t.N; i++) {
    const c = t.center[i];
    for (const o of live) {
      const d = Math.max(1, Math.hypot(c.x - o.x, c.z - o.z) - o.w * 0.5);
      const deg = Math.atan2(o.h, d) * 180 / Math.PI;
      if (deg > best) { best = deg; bi = i; cx = o.x; cz = o.z; bh = o.h; }
    }
  }
  return { i: bi, deg: +best.toFixed(1), n: live.length, want: M.count, cx, cz, bh,
    rs: live.map((o) => o.r).sort((a, c) => a - c),
    ws: live.map((o) => o.w).sort((a, c) => a - c),
    hs: live.map((o) => o.h).sort((a, c) => a - c) };
});
if (info.err) { console.log('FAIL:', info.err); await b.close(); process.exit(1); }
console.log(JSON.stringify(info));
const url = await p.evaluate(async ([idx, cx, cz, bh]) => {
  const g = window.__game, t = g.track, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
  if (g.state !== 'race') throw new Error('race never started: state=' + g.state);
  for (let i = 0; i < 24; i++) {
    const c = t.pointAt(idx, 0);
    pl.heading = t.headingAt(idx); pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.trackIndex = idx; pl.vel.copy(pl.forward).multiplyScalar(12); pl.vy = 0; pl.airborne = false;
    await f();
  }
  // from the driver's seat, looking along the ring's bearing. The race is
  // running underneath this - it is the game's own camera, aimed.
  const c = t.pointAt(idx, 0);
  const dx = cx - c.x, dz = cz - c.z, L = Math.hypot(dx, dz) || 1;
  g.camera.position.set(c.x - (dx / L) * 30, c.y + 10, c.z - (dz / L) * 30);
  g.camera.lookAt(cx, c.y + bh * 0.45, cz);
  g.camera.updateProjectionMatrix();
  g.renderer.render(g.scene, g.camera);
  return g.renderer.domElement.toDataURL('image/png');
}, [info.i, info.cx, info.cz, info.bh]);
writeFileSync(`${W}/tools-scratch/massif-${LV}${TAG}.png`, Buffer.from(url.split(',')[1], 'base64'));
console.log(`wrote tools-scratch/massif-${LV}${TAG}.png`);
if (errs.length) { console.log('errors:', errs.slice(0, 3)); process.exit(1); }
await b.close();
