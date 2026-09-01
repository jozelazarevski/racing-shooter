/* r320 — CLIFF FALLS ARE PAID FOR (phone report: car rolled off the PIKES
 * PEAK shelf and reached the ravine floor at full hull — "Should be wrecked
 * at this kind of falls"). The off-road ease had no airborne entry, so a
 * slow roll off any wall rappelled down at VY_CAP, and onLand never priced
 * the drop.
 *
 *   C1  the report, replayed: past the deck of the big shelf the car goes
 *       BALLISTIC and the bottom of a 30 u wall is a wreck (stock car)
 *   C2  a designed-jump landing (under the 22 u/s free ceiling) still
 *       costs nothing
 *   C3  the hard-landing band still prices without wrecking
 *   C4  LONG-TRAVEL DAMPERS still move the bar: the same impact that
 *       wrecks a stock car is survivable at damper level 5
 *   C5  rivals are untouched by the edge law (they never leave the road)
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=25&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, car = g.player;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }

  // the biggest shelf on the report's world: road furthest above the verge
  let shelf = null;
  for (let i = 40; i < t.center.length - 40; i += 5) {
    const pt = t.pointAt(i, 20);
    const gap = t.center[i].y - t.terrainHeight(pt.x, pt.z);
    if (!shelf || gap > shelf.gap) shelf = { i, gap: +gap.toFixed(1) };
  }

  const park = (lat, y) => {
    const pt = t.pointAt(shelf.i, lat);
    car.trackIndex = shelf.i; car.lateral = lat;
    car.alive = true; car.health = car.maxHealth; car.invuln = 0;
    car.pos.set(pt.x, y, pt.z); car.y = y;
    car.vel.set(0, 0, 0); car.speedAlong = 0;
    car.airborne = false; car.vy = 0;
    car._climbRate = 0; car._settleT = 0; car._lastGY = y; car._airT = 0;
  };

  // ---- C1: the report — one step past the deck, at deck height ----
  park(17, t.center[shelf.i].y + 0.3);
  let wentAir = false;
  for (let k = 0; k < 240 && car.alive; k++) {
    car.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
    if (car.airborne) wentAir = true;
  }
  const c1 = { wentAir, alive: car.alive, hp: Math.round(car.health) };

  // staged landings on the deck: airborne just above the road with a chosen vy
  const land = (vy, damperLvl = 0) => {
    park(0, t.groundHeightAt(shelf.i, 0) + 0.5);
    car.damperLvl = damperLvl;
    car.airborne = true; car.vy = vy;
    for (let k = 0; k < 10 && car.airborne; k++) {
      car.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
    }
    const out = { hp: Math.round(car.health), alive: car.alive };
    car.damperLvl = 0;
    return out;
  };
  const c2 = land(-18);            // designed-jump band: free to 22
  const c3 = land(-30);            // hard landing: priced, survivable
  const c4stock = land(-41);       // the cliff: wrecks a stock car...
  const c4damped = land(-41, 5);   // ...and is survivable on level-5 dampers

  // ---- C5: a rival at the same spot never takes the edge exit ----
  const e = g.enemies[0];
  e.alive = true; e.health = 100;
  const ept = t.pointAt(shelf.i, 17);
  e.trackIndex = shelf.i; e.lateral = 17;
  e.pos.set(ept.x, t.center[shelf.i].y + 0.3, ept.z); e.y = e.pos.y;
  let eAir = false;
  for (let k = 0; k < 60; k++) { e.update(1 / 60); if (e.airborne) eAir = true; }
  const c5 = { air: eAir, alive: e.alive };

  return { shelf, c1, c2, c3, c4stock, c4damped, c5, maxHp: car.maxHealth };
});

check('C1  past the deck the car goes ballistic and the wall is a wreck',
  r.c1.wentAir && !r.c1.alive,
  `shelf ${r.shelf.gap} u at sample ${r.shelf.i}; airborne ${r.c1.wentAir}, hp ${r.c1.hp}, alive ${r.c1.alive}`);
check('C2  a designed-jump landing is still free', r.c2.hp === Math.round(r.maxHp) && r.c2.alive,
  `vy 18 left hp ${r.c2.hp}/${r.maxHp}`);
check('C3  the hard-landing band prices without wrecking',
  r.c3.alive && r.c3.hp < Math.round(r.maxHp) && r.c3.hp > 0,
  `vy 30 left hp ${r.c3.hp}/${r.maxHp}`);
check('C4  the cliff wrecks a stock car outright', !r.c4stock.alive,
  `vy 41 stock: alive ${r.c4stock.alive}`);
check('C4  level-5 dampers still move the bar', r.c4damped.alive && r.c4damped.hp > 0,
  `vy 41 on dampers 5: hp ${r.c4damped.hp}`);
check('C5  a rival at the same edge never takes the exit', !r.c5.air && r.c5.alive,
  `airborne ${r.c5.air}`);
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe cliff collects');
process.exit(fail ? 1 : 0);
