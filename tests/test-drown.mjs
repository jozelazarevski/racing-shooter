/* GOING UNDER IS A WRECK.
 *
 * Deep water used to be free driving: the seabed is ground, ground is
 * drivable, so a car that went off a coast road carried on along the bottom
 * of the bay with the waves over its roof.
 *
 * The risk in fixing that is the opposite failure — drowning people at a
 * river ford, which is the one place the world tells you to drive through
 * water. So this suite checks BOTH directions on every coastal world it can.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
// AEGEAN BLUE: a coast world with a sea and a shoreline road
await page.goto(`${BASE}/?level=51&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game, t = g.track;
  const out = {};
  const p = g.player;
  const step = (n = 60) => {
    for (let i = 0; i < n; i++) {
      p.update(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false,
        fire: false, justPressed: () => false });
    }
  };
  const revive = () => {
    p.alive = true; p.health = p.maxHealth; p.mesh.visible = true;
    p.respawnTimer = 0; p.invuln = 0;
  };

  out.hasSea = !!t.T.coast;
  out.seaLevel = t.T.coast ? (t.T.coast.level ?? -2) : null;
  out.hullHeight = +(p.mesh.userData.hullHeight ?? -1).toFixed(2);

  // ---- the query itself ---------------------------------------------------
  // a point well out to sea vs a point on the road
  const c = t.center[0];
  const C = t.T.coast;
  const abx = C.b[0] - C.a[0], abz = C.b[1] - C.a[1];
  const L = Math.hypot(abx, abz);
  const nx = abz / L, nz = -abx / L;                 // seaward normal
  const mid = { x: (C.a[0] + C.b[0]) / 2, z: (C.a[1] + C.b[1]) / 2 };
  const seaPt = { x: mid.x + nx * 260, z: mid.z + nz * 260 };
  out.wetOffshore = t.waterTopAt(seaPt.x, seaPt.z);
  out.dryOnRoad = t.waterTopAt(c.x, c.z);

  // ---- DROWN: put the car on the sea bed well offshore --------------------
  g.state = 'race';
  revive();
  p.pos.set(seaPt.x, t.terrainHeight(seaPt.x, seaPt.z), seaPt.z);
  p.y = p.pos.y;
  p.vel.set(0, 0, 0); p.speed = 0; p.airborne = false;
  p.trackIndex = t.nearestIndex(p.pos);
  out.bedY = +p.y.toFixed(2);
  out.roofY = +(p.y + p.mesh.userData.hullHeight).toFixed(2);
  step(30);
  out.drowned = !p.alive;

  // ---- and it is NOT an explosion ----------------------------------------
  out.huskCount = (g.husks || []).length;

  // ---- SURVIVE: a river ford is meant to be driven through ---------------
  revive();
  let fordTested = 0, fordDrowned = 0;
  for (const f of (t.fords || []).slice(0, 3)) {
    revive();
    const fp = t.center[f.i];
    p.pos.set(fp.x, t.groundHeightAt(f.i, 0), fp.z);
    p.y = p.pos.y;
    p.vel.set(0, 0, 0); p.speed = 0; p.airborne = false;
    p.trackIndex = f.i;
    step(30);
    fordTested++;
    if (!p.alive) fordDrowned++;
  }
  out.fordTested = fordTested;
  out.fordDrowned = fordDrowned;

  // ---- SURVIVE: the whole racing line, start to finish -------------------
  revive();
  let lineDrowned = 0;
  for (let i = 0; i < t.center.length; i += 6) {
    revive();
    const q = t.center[i];
    p.pos.set(q.x, t.groundHeightAt(i, 0), q.z);
    p.y = p.pos.y;
    p.vel.set(0, 0, 0); p.speed = 0; p.airborne = false;
    p.trackIndex = i;
    step(4);
    if (!p.alive) lineDrowned++;
  }
  out.lineDrowned = lineDrowned;
  out.lineSamples = Math.ceil(t.center.length / 6);

  revive();
  g.state = 'title';
  return out;
});

console.log('\n--- drowning ---');
ok(R.hasSea, 'the test world has a sea', String(R.hasSea));
ok(R.hullHeight > 1.5, 'the car reports a real roofline, not the fallback', R.hullHeight);
ok(R.wetOffshore > -Infinity && R.wetOffshore === R.seaLevel,
  'waterTopAt finds the sea offshore', `${R.wetOffshore} vs level ${R.seaLevel}`);
ok(R.dryOnRoad === -Infinity, 'and finds no water on the road', R.dryOnRoad);
ok(R.roofY < R.wetOffshore,
  'the offshore test spot really is over the roof', `roof ${R.roofY} < sea ${R.wetOffshore}`);
ok(R.drowned, 'a car fully under the surface is wrecked');
ok(R.huskCount === 0, 'it sinks rather than detonating — no husk left floating', R.huskCount);
ok(R.fordTested === 0 || R.fordDrowned === 0,
  'a river ford does NOT drown you', `${R.fordDrowned}/${R.fordTested} fords`);
ok(R.lineDrowned === 0,
  'nowhere on the racing line drowns you', `${R.lineDrowned}/${R.lineSamples} samples`);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
