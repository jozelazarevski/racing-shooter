/* WHAT THE BLACK LOWER HALF OF THE DRIVER'S VIEW ACTUALLY IS — by raycast,
 * not by hiding things. _driverCamera FORCES visibility flags every frame
 * (car on, cockpit on, hood off), so any hide-and-diff in this mode fights
 * the camera and reports contradictions — measured: hiding the whole car
 * changed 2.2% while hiding its own child cockpit "changed" 59.8%, and an
 * already-invisible hood part "changed" 58%. Rays are immune: cast through a
 * grid of lower-half pixels and name the first mesh each one hits, with
 * distance, against the parts table of the player's own mesh.
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 420, height: 760 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=${process.env.LEVEL ?? 1}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const r = await p.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
  for (let i = 0; i < 12 && g.camMode !== 4; i++) g.cycleCamera();
  if (g.camMode !== 4) throw new Error('driver mode never reached');
  for (let i = 0; i < 8; i++) { pl.vel.set(0, 0, 0); await f(); }
  // name every part of the player's car so a hit can say which box it was
  const label = new Map();
  pl.mesh.traverse((o) => {
    if (!o.isMesh) return;
    let tag = 'car:';
    const ud = pl.mesh.userData;
    if (o === ud.cockpit || ud.cockpit?.children?.includes?.(o)) tag = 'cockpit:';
    if ((ud._hoodParts ?? []).includes(o)) tag = 'hood:';
    if ((ud.wheels ?? []).includes(o)) tag = 'wheelrim:';
    const size = o.geometry?.boundingBox ?? null;
    label.set(o, tag + (o.name || o.geometry?.type || 'Mesh')
      + '@y' + (o.position?.y?.toFixed?.(2) ?? '?'));
  });
  const ray = new THREE.Raycaster();
  ray.near = 0.01; ray.far = 500;
  ray.camera = g.camera;
  const v = new THREE.Vector3();
  const hits = {};
  let none = 0, total = 0;
  for (let iy = 0; iy < 7; iy++) {
    for (let ix = 0; ix < 9; ix++) {
      const nx = (ix / 8) * 2 - 1;
      const ny = -0.15 - (iy / 6) * 0.8;              // lower half only
      v.set(nx, ny, 0.5).unproject(g.camera).sub(g.camera.position).normalize();
      ray.set(g.camera.position, v);
      const xs = ray.intersectObjects(g.scene.children, true)
        .filter((h) => h.object.visible !== false);
      total++;
      const first = xs[0];
      if (!first) { none++; continue; }
      const k = (label.get(first.object) ?? (first.object.name || first.object.type))
        + ' @' + (first.distance < 1 ? first.distance.toFixed(2) : Math.round(first.distance));
      hits[k] = (hits[k] || 0) + 1;
    }
  }
  return { eye: g.camera.position.toArray().map((x) => +x.toFixed(2)),
    none, total,
    top: Object.entries(hits).sort((a, c) => c[1] - a[1]).slice(0, 10) };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
