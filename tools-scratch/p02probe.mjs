import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=2&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const out = {};
  out.p2 = { K: window.__DRIVING?.patch02?.contactDamageK,
    th: window.__DRIVING?.patch02?.contactDamageThresholdMs,
    cap: window.__DRIVING?.patch02?.contactDamageCapPerHit,
    glance: window.__DRIVING?.patch02?.contactGlanceSquare };
  out.plating = c.plating;
  out.telemetryIs = g.telemetry === undefined ? 'undefined' : 'set';
  // 200 km/h head-on, watched closely
  g.state = 'race'; g.raceTime = 30; c.invuln = 0; c.alive = true; c.health = 100;
  c._wdmgAt = -9; c._wdmgSum = 0;
  const rock = { x: 0, z: 0, r: 3, mat: 'stone' };
  g.onSolidCrash(rock, c, 55.6, 1, 0, 1.0);
  out.loss200 = +(100 - c.health).toFixed(2);
  out.wdmgSum = c._wdmgSum;
  // cliff rescue with a spy on telemetry.log
  const calls = [];
  const orig = g.telemetry?.log?.bind(g.telemetry);
  if (g.telemetry) g.telemetry.log = (k, d) => { calls.push(k); orig(k, d); };
  const idx6 = 120, ci6 = t.center[idx6], rimY = ci6.y + 20;
  const thReal = t.terrainHeight.bind(t);
  t.terrainHeight = () => rimY;
  c.alive = true; c.airborne = false; c.vy = 0;
  c.pos.set(ci6.x + 40, rimY + 0.3, ci6.z); c.y = c.pos.y;
  c.trackIndex = idx6; c.vel.set(0, 0, 0);
  c._cliffT = 2.0; c._wedgeT = 0; c._lostT = 0; c.unstuckCool = 5;
  g.freeRoam = false;
  c.update(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, fire: false,
    justPressed: () => false, justReleased: () => false });
  t.terrainHeight = thReal;
  if (g.telemetry && orig) g.telemetry.log = orig;
  out.rescue = { cliffT: c._cliffT, y: +c.y.toFixed(1), rimY: +rimY.toFixed(1), calls };
  out.dump = (window.__rally?.dump?.() ?? '').split('\n').slice(-8);
  return out;
});
console.log(JSON.stringify(r, null, 1));
await p.close(); await browser.close();
