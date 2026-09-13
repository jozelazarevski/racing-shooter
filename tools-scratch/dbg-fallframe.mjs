/* C-D probe: launch the player off a drop; sample NDC every frame of the
 * fall; report worst |ndc| and frames off-center while airborne+falling. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.resetRace(); g.startRace?.();
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.camMode = 3;
  // find the biggest outward drop on the lap: sample lateral +25u height delta
  let best = null;
  for (let i = 0; i < N; i += 6) {
    const c = t.center[i], nv = t.nrm[i];
    for (const s of [1, -1]) {
      const hx = c.x + nv.x * 30 * s, hz = c.z + nv.z * 30 * s;
      const drop = c.y - t.terrainHeight(hx, hz);
      if (!best || drop > best.drop) best = { i, s, drop };
    }
  }
  const c = t.center[best.i], nv = t.nrm[best.i];
  const car = g.player;
  car.pos.set(c.x, c.y + 0.5, c.z); car.y = c.y + 0.5;
  car.heading = Math.atan2(nv.x * best.s, nv.z * best.s);
  car.vel.set(nv.x * best.s * 26, 0, nv.z * best.s * 26);
  // settle the camera behind the new spot for a few frames, then fall
  for (let k = 0; k < 30; k++) { g.input.analog.throttle = 1; g.frame(); }
  let frames = 0, seen = 0, worst = 0, fell = false, minVy = 0;
  for (let k = 0; k < 60 * 8; k++) {
    g.input.analog.throttle = 1;
    g.frame();
    const vy = car.vy ?? car.vel.y ?? 0;
    if (vy < minVy) minVy = vy;
    if (vy < -9) {
      fell = true; frames++;
      const v = car.mesh.position.clone().project(g.camera);
      const m = Math.max(Math.abs(v.x), Math.abs(v.y));
      if (m < 1 && v.z < 1) seen++;
      if (m > worst) worst = m;
    }
    if (fell && (vy >= -1 || !car.alive)) break;
  }
  return { world: g.level?.name, drop: +best.drop.toFixed(1), fell, fallFrames: frames,
    seenPct: frames ? +(100 * seen / frames).toFixed(1) : null,
    worstNdc: +worst.toFixed(2), minVy: +minVy.toFixed(1), alive: car.alive };
});
console.log(JSON.stringify(r));
await browser.close();
