/* WHAT IS THE CAMERA LOOKING AT THROUGH THE BLACK PIXELS?
 * Elimination ruled out the cockpit, the whole car, the shadows and the
 * road+terrain — nothing removes the black — and the canvas covers the whole
 * viewport. So the question is no longer "which object is dark" but "does the
 * camera hit anything at all down there". Unproject a few pixels down the
 * frame and report the first thing each ray meets, with its distance. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=12&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
const r = await p.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game, pl = g.player, t = g.track;
  g.startRace?.(); g.setDriverView(true);
  const frame = () => new Promise((r2) => requestAnimationFrame(r2));
  const HOME = Math.floor(t.N * 0.30);
  for (let k = 0; k < 22; k++) {
    const c = t.pointAt(HOME, 0);
    pl.heading = t.headingAt(HOME); pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.vy = 0; pl.airborne = false; pl.trackIndex = HOME;
    pl.vel.copy(pl.forward).multiplyScalar(34);
    await frame();
  }
  const list = [];
  g.scene.traverse((o) => { if ((o.isMesh || o.isInstancedMesh) && o.geometry && o.visible) list.push(o); });
  const rc = new THREE.Raycaster();
  const out = [];
  for (const yf of [0.45, 0.60, 0.70, 0.80, 0.92]) {
    const ndc = new THREE.Vector2(0, 1 - yf * 2);
    rc.setFromCamera(ndc, g.camera);
    rc.far = 3000;
    let hit = null;
    try { hit = rc.intersectObjects(list, false)[0]; } catch (e) { hit = null; }
    out.push({ yf, hit: hit ? (hit.object.name || hit.object.geometry.type) : null,
      dist: hit ? +hit.distance.toFixed(1) : null,
      y: hit ? +hit.point.y.toFixed(1) : null });
  }
  return { out, camY: +g.camera.position.y.toFixed(2), carY: +pl.pos.y.toFixed(2),
    near: g.camera.near, far: g.camera.far, fog: g.scene.fog
      ? { color: '#' + g.scene.fog.color.getHexString(), near: g.scene.fog.near, far: g.scene.fog.far } : null };
});
console.log(`camera y ${r.camY} (car ${r.carY})  near ${r.near} far ${r.far}`);
console.log(`fog: ${r.fog ? `${r.fog.color} ${r.fog.near}..${r.fog.far}` : 'none'}`);
for (const q of r.out) {
  console.log(`  ${(q.yf * 100).toFixed(0).padStart(3)}% down the frame -> `
    + (q.hit ? `${q.hit} at ${q.dist} u, y ${q.y}` : 'NOTHING — the ray leaves the world'));
}
await b.close();
