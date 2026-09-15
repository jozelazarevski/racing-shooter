/* E-25 (r431), owner: "Don't auto reset unless I press sos."
 *
 * The risky half is the VOID watchdog: with it gone for the player, a car
 * under the terrain stays there. That is only acceptable if SOS still works
 * from down there, so this asserts BOTH halves — nothing pulls the car out
 * on its own, and the button does.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 320 } });
p.setDefaultTimeout(600000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 140)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const R = await p.evaluate(async () => {
  const g = window.__game, pl = g.player, t = g.track;
  // COUNT THE ACTION, NOT THE LOG. The first cut counted `void` telemetry
  // records and reported 282 "automatic returns" in six seconds — but the
  // void RECORD is deliberately kept (it is still a §3.1 failure worth
  // logging); what E-25 removes is the RETURN. Wrap the thing that moves
  // the car instead, and count the button separately.
  let moved = 0, unstucks = 0;
  const rtg = g.returnToGate.bind(g);
  g.returnToGate = (car, gate, why) => { if (car === pl) moved++; return rtg(car, gate, why); };
  let voidLogs = 0;
  const rl = g.telemetry.log.bind(g.telemetry);
  g.telemetry.log = (k, d) => {
    if (k === 'void') voidLogs++;
    if (k === 'unstuck') unstucks++;
    return rl(k, d);
  };
  const sink = () => {                       // hold the car well under the ground
    const gy = t.terrainHeight(pl.pos.x, pl.pos.z);
    pl.pos.y = gy - 30; pl.y = gy - 30; pl.vel.set(0, 0, 0); pl.vy = 0;
  };
  pl.invuln = 999; g.deaths = 0;
  sink(); returns = 0;
  const orig = pl.step.bind(pl);
  pl.step = (dt, inp) => { orig(dt, inp); sink(); };
  for (let f = 0; f < 360; f++) g._frameBody();          // 6 s buried
  const buriedFor = +(t.terrainHeight(pl.pos.x, pl.pos.z) - pl.y).toFixed(1);
  const autoOut = moved, voidRecords = voidLogs;
  pl.step = orig;                                        // stop forcing it under
  pl._unstuckReq = true; pl.unstuckCool = 0;
  for (let f = 0; f < 180; f++) g._frameBody();
  const depthAfter = +(t.terrainHeight(pl.pos.x, pl.pos.z) - pl.y).toFixed(1);
  return { buriedFor, autoOut, voidRecords, afterButton: unstucks, depthAfter };
});
await b.close();
const ok = (c, m, x) => console.log((c ? 'PASS  ' : 'FAIL  ') + m + (x ? '  ' + x : ''));
ok(R.buriedFor > 20, 'setup: the car really was held under the terrain', `${R.buriedFor} u deep`);
ok(R.autoOut === 0, 'E-25: 6 s buried under the terrain returns the player ZERO times', `${R.autoOut} automatic returns`);
ok(R.afterButton > 0, 'E-25: the SOS button still works from under the terrain (no soft-lock)', `${R.afterButton} unstuck after the press`);
ok(R.voidRecords >= 1 && R.voidRecords <= 3, 'the void record still fires, ONCE per burial, not per frame', `${R.voidRecords} records in 6 s buried`);
ok(R.depthAfter < 5, 'E-25: and it puts the car back on the surface', `${R.depthAfter} u below ground after`);
ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
