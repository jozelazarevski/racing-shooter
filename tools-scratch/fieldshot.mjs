/* THE WHOLE FIELD IN ONE FRAME, for judging anything that is per-car. Packs
 * the rivals around the player on the racing line and shoots a named camera
 * mode, so "do all the cars have headlights" is a picture rather than an
 * argument.
 *
 *   LEVEL=17 CAM=0 OUT=tools-scratch/shot-field.png node fieldshot.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${process.env.LEVEL ?? 17}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const lit = await p.evaluate(async (cam) => {
  const g = window.__game, t = g.track, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  while (g.camMode !== cam) g.cycleCamera();
  const HOME = Math.floor(t.N * 0.30);
  const hold = () => {
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
  for (let i = 0; i < 80; i++) { hold(); await f(); }
  const rig = [g.player, ...(g.enemies || [])].map((c) => {
    const l = c?.mesh?.userData?.carLights;
    return l ? (l.visible ? 'on' : 'OFF') : 'no rig';
  });
  const lt = g.player.mesh.userData.carLights;
  return { cars: rig.length, rig, opacity: lt ? +lt.material.opacity.toFixed(3) : null };
}, +(process.env.CAM ?? 0));
console.log(JSON.stringify(lit));
await p.screenshot({ path: process.env.OUT || 'tools-scratch/shot-field.png', clip: { x: 0, y: 0, width: 430, height: 720 } });
await b.close();
