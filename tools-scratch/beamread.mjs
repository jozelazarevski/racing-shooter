/* HOW MUCH HEADLIGHT SURVIVES, PER CAMERA. Reported from a phone: "all cars
 * need to have headlights." Every car's rig reports `visible: true` on a dark
 * world, and from the overhead cameras — including TOP-DOWN, which is the
 * DEFAULT — none of them appears to have any.
 *
 * The cause is `fadeCarLights`: it dims the shared lamp material by how far
 * down the camera is looking, because a beam lying flat on the road, seen from
 * straight above, reads as a painted puddle rather than as light. Right idea,
 * and it is currently taking the whole read away well before straight down.
 *
 * Measured by ELIMINATION, which is exact: render, hide every car's rig,
 * render again, and the pixels that changed ARE the headlights. Reports the
 * count and the total light they add, per camera mode, with the material
 * opacity `fadeCarLights` settled on so a tune can be traced to a number.
 *
 *   LEVEL=17 node beamread.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 760 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${process.env.LEVEL ?? 17}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(async () => {
  const g = window.__game, t = g.track, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  const HOME = Math.floor(t.N * 0.30);
  window.__hold = () => {
    const c = t.pointAt(HOME, 0);
    pl.heading = t.headingAt(HOME); pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.vy = 0; pl.airborne = false; pl.trackIndex = HOME; pl.vel.copy(pl.forward).multiplyScalar(20);
    (g.enemies || []).forEach((e, i) => {
      const k = HOME + 5 + i * 5, lat = (i % 2 ? 1 : -1) * (2.6 + (i % 3) * 2.6);
      const c2 = t.pointAt(k, lat);
      e.pos.x = c2.x; e.pos.z = c2.z;
      if (Number.isFinite(c2.y)) { e.pos.y = c2.y; e.y = c2.y; }
      e.heading = t.headingAt(k); e.trackIndex = k;
    });
  };
  // `which` = null for every car, or an index into [player, ...enemies] to
  // toggle exactly one. Per-car is the question the report actually asks:
  // "all cars need headlights" is about whether a RIVAL's lamps read, not
  // about whether the frame has light in it somewhere.
  window.__cars = () => [g.player, ...(g.enemies || [])];
  window.__rig = (on, which) => {
    window.__cars().forEach((c, i) => {
      if (which != null && i !== which) return;
      const lt = c?.mesh?.userData?.carLights;
      if (lt) lt.visible = on;
    });
  };
});
const shot = async () => (await p.screenshot({ clip: { x: 0, y: 0, width: 430, height: 640 } })).toString('base64');
const NAMES = ['TOP-DOWN', 'TOP FAR', 'TRAIL', 'CHASE', 'DRIVER', 'CHASE FAR'];
const out = [];
for (const cam of (process.env.CAMS ?? '0,2,3').split(',').map(Number)) {
  await p.evaluate(async (c) => {
    const g = window.__game;
    const f = () => new Promise((r) => requestAnimationFrame(r));
    while (g.camMode !== c) g.cycleCamera();
    for (let i = 0; i < 45; i++) { window.__hold(); await f(); }
  }, cam);
  await p.evaluate(async () => { const f = () => new Promise((r) => requestAnimationFrame(r)); window.__rig(true); window.__hold(); await f(); window.__hold(); await f(); });
  const on = await shot();
  const opacity = await p.evaluate(() => {
    const g = window.__game;
    const lt = g.player.mesh.userData.carLights;
    return { opacity: +lt.material.opacity.toFixed(3),
      down: +Math.abs(new (g.camera.position.constructor)(0, 0, -1).applyQuaternion(g.camera.quaternion).y).toFixed(3) };
  });
  await p.evaluate(async (w) => { const f = () => new Promise((r) => requestAnimationFrame(r)); window.__rig(false, w); window.__hold(); await f(); window.__hold(); await f(); }, process.env.CAR ? +process.env.CAR : null);
  const off = await shot();
  const r = await p.evaluate(async ([a, c]) => {
    const load = async (d) => {
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = 'data:image/png;base64,' + d; });
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      cv.getContext('2d').drawImage(img, 0, 0);
      return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    };
    const A = await load(a), B = await load(c);
    let n = 0, sum = 0, px = A.length / 4;
    for (let i = 0; i < A.length; i += 4) {
      const d = (A[i] - B[i]) + (A[i+1] - B[i+1]) + (A[i+2] - B[i+2]);
      if (d > 12) { n++; sum += d / 3; }
    }
    window.__rig(true, null);
    return { litPx: n, litPct: +(100 * n / px).toFixed(2), meanGain: n ? +(sum / n).toFixed(1) : 0 };
  }, [on, off]);
  out.push({ cam, name: NAMES[cam], ...opacity, ...r });
}
console.log(JSON.stringify(out, null, 1));
await b.close();
