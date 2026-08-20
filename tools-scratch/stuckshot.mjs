/* PHOTOGRAPH THE PLACE A CAR GETS STUCK, AND SAY WHY IT CANNOT LEAVE.
 *
 * Driving CANYON RUN at full throttle without steering ends with the car at
 * sample 52, lateral -35.9, speed 0 — motionless, well outside a wall whose
 * clamp line is at widthAt + 0.55 (about 9.55). That is the reported frame:
 * 2 km/h, last place, rock on every side.
 *
 * Take the shot from the camera the report used, then interrogate the spot:
 * the ground height under the car against the road's, the wall profile at that
 * station, whether the clamp thinks there is a wall there at all, and whether
 * full throttle in any direction moves the car at all.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 4);
const OUT = process.env.OUT ?? '/tmp/stuck';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const info = await page.evaluate(() => {
  const g = window.__game, t = g.track, p = g.player;
  const CN = g.constructor.CAM_NAMES ?? [];
  const ci = CN.indexOf('TOP-DOWN'); if (ci >= 0) g.camMode = ci;
  g.clock.getDelta = () => 1 / 60;
  g._autoQuality = () => {};
  const real = g.composer.render.bind(g.composer);
  window.__real = real;
  g.composer.render = () => {};
  const trail = [];
  for (let f = 0; f < 2400; f++) {
    g.input.analog.throttle = 1;
    g.frame();
    if (f % 60 === 0) trail.push([f, p.trackIndex, +(p.speed ?? 0).toFixed(1), +p.lateral.toFixed(1)]);
  }
  real();
  const i = p.trackIndex;
  const prof = t._cliffProfile(i, Math.sign(p.lateral) || 1);
  const before = { x: p.pos.x, z: p.pos.z };
  // can it get out? full throttle, every heading, two seconds each
  let bestMove = 0, bestHead = null;
  for (let k = 0; k < 8; k++) {
    p.pos.set(before.x, p.pos.y, before.z);
    p.speed = 0; p.vel?.set?.(0, 0, 0);
    p.heading = k * Math.PI / 4;
    for (let f = 0; f < 120; f++) { g.input.analog.throttle = 1; g.frame(); }
    const moved = Math.hypot(p.pos.x - before.x, p.pos.z - before.z);
    if (moved > bestMove) { bestMove = moved; bestHead = k * 45; }
  }
  return { name: g.level?.name, trail: trail.slice(-8),
    stuckAt: i, lateral: +p.lateral.toFixed(1),
    clampLine: +((t.widthAt?.(i) ?? 9) + 0.55).toFixed(2),
    wallHeightHere: +prof.h.toFixed(2), wallBase: +prof.base.toFixed(2),
    roadY: +t.center[i].y.toFixed(2), groundY: +t.terrainHeight(before.x, before.z).toFixed(2),
    carY: +p.pos.y.toFixed(2),
    bestEscape: { moved: +bestMove.toFixed(1), heading: bestHead } };
});
await page.screenshot({ path: `${OUT}/stuck-L${ID}.png` });
console.log(JSON.stringify(info, null, 1));
await b.close();
