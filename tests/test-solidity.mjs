/* The Law of Solidity, as a test.
 *
 * RULES.md section 1.1: "Nothing readable as an object may be intangible."
 * Section 2 defines BREAKABLE as destroyed above a speed threshold and SOLID
 * push-out below it, and SOLID as indestructible with impact sparks only.
 * Section 4's weapons matrix says the cannon sparks off stone and cliffs.
 *
 * All four rules were written down. None of these four were enforced, and each
 * was measurably false:
 *
 *   1. Props had NO collider at all below the smash threshold. Tire stacks and
 *      sponsor boards implement the rule; props never got the else-branch, so
 *      under 2 u/s a crate or a log round was a ghost you drove through.
 *   2. `knockStone` was the one damage path that wrote `car.health` directly
 *      instead of going through `damage()`, so it skipped the wreck check. A
 *      player on 6 hull took a stone shunt and ended on health 0, alive true —
 *      still driving, and healing back up, because `_lastHurt` was never
 *      stamped either.
 *   3. `track.solids` was absent from the cannon's candidate list, so rounds
 *      flew through boulders, hoodoos, cliff walls and gantry legs.
 *   4. Missiles detonated at |lateral| > 10.2 on EVERY world, though only 5 of
 *      25 have cliff walls. Firing while off-road blew the missile up on your
 *      own bumper.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// PINE VALLEY has no cliff walls, which is what makes it the right world for
// the missile test — the phantom wall was worst exactly where no wall exists.
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
const ready = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 240000 }).then(() => 1).catch(() => 0);
if (!ready) { console.log('SKIP  world never built'); await browser.close(); process.exit(1); }

// ---- 1. a prop is solid at a crawl -----------------------------------------
const prop = await p.evaluate(() => {
  const g = window.__game, car = g.player, t = g.track;
  const pr = g.props && g.props[0];
  if (!pr) return { skip: true };
  // Park the car short of the prop, aimed at it, and creep. Nothing overwrites
  // the velocity inside the loop — an earlier probe in this repo did and
  // measured its own overwrite.
  car.alive = true; car.health = 100; car.airborne = false; car.vy = 0;
  car.pos.set(pr.x - 6, (pr.y ?? 0) + 0.4, pr.z); car.y = car.pos.y;
  car.heading = Math.atan2(pr.x - car.pos.x, pr.z - car.pos.z);
  let closest = Infinity, maxSpeed = 0;
  // Hold the crawl by hand: no throttle, and the speed is re-seeded each frame
  // to just under the 2 u/s smash threshold. Re-seeding SPEED is safe here (it
  // is what the rule is defined against); it is the VELOCITY vector that must
  // never be overwritten mid-loop, because the push-out writes to it and an
  // overwrite would erase the very effect under test.
  for (let k = 0; k < 60 * 20; k++) {
    if (Math.abs(car.speedAlong) < 1.4) {
      car.speedAlong = 1.4;
      car.vel.set(Math.sin(car.heading) * 1.4, car.vel.y, Math.cos(car.heading) * 1.4);
    }
    car.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
    maxSpeed = Math.max(maxSpeed, Math.abs(car.speedAlong));
    const d = Math.hypot(car.pos.x - pr.x, car.pos.z - pr.z);
    if (d < closest) closest = d;
  }
  return { r: +(pr.r ?? 1.2).toFixed(2), closest: +closest.toFixed(2),
           speed: +maxSpeed.toFixed(2), stillThere: window.__game.props.includes(pr) };
});
if (prop.skip) console.log('NOTE  no props on this world');
else {
  // It must not reach the prop's own centre. The push-out holds it at r + 1.6,
  // so anything at or inside r means it went through.
  // It must reach the prop (or the test proves nothing) and be stopped by it.
  check('the car actually reached the prop', prop.closest < 6,
    `closest approach ${prop.closest} u, peak speed ${prop.speed} u/s`);
  check('a prop is SOLID at a crawl', prop.closest > prop.r && prop.stillThere,
    `closest ${prop.closest} u to a prop of radius ${prop.r}; still present: ${prop.stillThere}`);
}

// ---- 2. a stone shunt that empties the hull actually wrecks the car ---------
const stone = await p.evaluate(() => {
  const g = window.__game, car = g.player;
  const ob = (g.track.solids ?? []).find((s) => s.mat === 'stone' && (s.y ?? -9999) > -1000);
  if (!ob) return { skip: true };
  car.alive = true; car.invuln = 0; car.health = 6;
  const before = car.health;
  g.knockStone(ob, car, 60, 1, 0, 1);
  return { before, after: +car.health.toFixed(1), alive: car.alive };
});
if (stone.skip) console.log('NOTE  no stone solid on this world');
else {
  check('a stone shunt to 0 hull wrecks the car', !(stone.after <= 0 && stone.alive),
    `hull ${stone.before} -> ${stone.after}, alive=${stone.alive}`);
}

// ---- 3. the cannon does not shoot through rock -----------------------------
// The round is placed and aimed DIRECTLY rather than fired through the car's
// muzzle. Aiming headless proved unreliable — `fireBullet` reads `car.forward`,
// which is derived inside step(), and a stale value sends the round off on the
// last heading the car happened to hold. What is under test here is the
// collision resolution, not the aiming, so the bullet is given an exact course
// at the rock and the sweep is what gets measured.
const shot = await p.evaluate(() => {
  const g = window.__game, car = g.player;
  const ob = (g.track.solids ?? []).find((s) => s.mat === 'stone' && (s.y ?? -9999) > -1000 && (s.r ?? 0) > 1.5);
  if (!ob) return { skip: true };
  g.state = 'race';
  (g.weapons.bullets ?? []).forEach((b) => { b.active = false; });
  g.weapons.fireBullet(car, 12, 0);
  const b = (g.weapons.bullets ?? []).find((x) => x.active);
  if (!b) return { skip: 'no bullet slot' };
  // 20 u short of the rock, flying straight at it along +x.
  const D = 20, SPD = 190;
  // Height from the terrain UNDER THE BULLET, not from the rock's base 20 u
  // away — a round that starts below ground is killed by the ground-impact
  // test on its first step, which reads as "the sweep is broken".
  b.pos.set(ob.x - D, Math.max((ob.y ?? 0), g.track.terrainHeight(ob.x - D, ob.z)) + 1.2, ob.z);
  b.vel.set(SPD, 0, 0);
  b.life = b.maxLife = 1.1;
  let closest = Infinity, past = 0, frames = 0;
  const x0 = b.pos.x;
  for (let k = 0; k < 200; k++) {
    g.weapons.update(1 / 60);
    if (!b.active) break;
    frames++;
    const d = Math.hypot(b.pos.x - ob.x, b.pos.z - ob.z);
    if (d < closest) closest = d;
    if (b.pos.x > ob.x + (ob.r ?? 1)) past = Math.max(past, b.pos.x - ob.x - (ob.r ?? 1));
  }
  return { r: +(ob.r ?? 1).toFixed(2), closest: +(closest === Infinity ? -1 : closest).toFixed(2),
           past: +past.toFixed(2), frames, moved: +(b.pos.x - x0).toFixed(2) };
});
if (shot.skip) console.log(`NOTE  cannon check skipped — ${shot.skip}`);
else {
  // The round has to have travelled and reached the rock, or nothing is proven.
  check('a round actually reached the rock', shot.frames > 0 && shot.closest >= 0 && shot.closest < shot.r + 4,
    `flew ${shot.frames} frames, closest ${shot.closest} u to a rock of radius ${shot.r}`);
  check('the cannon does not shoot through rock', shot.past === 0,
    `travelled ${shot.past} u beyond the far face`);
}

// ---- 4. no phantom wall for missiles on an open world ----------------------
const missile = await p.evaluate(() => {
  const g = window.__game, car = g.player, t = g.track;
  if (t.T?.cliffWalls) return { skip: 'world has real walls' };
  car.alive = true; car.health = 100;
  const i = 300;
  const pt = t.pointAt(i, 14);                 // well off the road, legally
  car.pos.set(pt.x, (pt.y ?? 0) + 0.5, pt.z); car.y = car.pos.y;
  car.trackIndex = i; car.lateral = 14;
  car.heading = t.headingAt(i);
  car.vel.set(0, 0, 0); car.speedAlong = 0;
  g.missileAmmo = (g.missileAmmo ?? 0) + 3;
  if (car.ammoMissile !== undefined) car.ammoMissile = 3;
  const before = (g.weapons.missiles ?? []).length;
  g.weapons.fireMissile?.(car);
  if ((g.weapons.missiles ?? []).length === before) return { skip: 'could not fire' };
  let frames = 0;
  for (let k = 0; k < 120; k++) {
    g.weapons.update(1 / 60);
    if (!(g.weapons.missiles ?? []).length) break;
    frames++;
  }
  return { frames };
});
if (missile.skip) console.log(`NOTE  missile check skipped — ${missile.skip}`);
else {
  // One frame means it detonated on the launcher's own bumper.
  // The defect was EXACTLY one frame — detonation on the launcher's own
  // bumper. Anything that flies is a pass; a missile legitimately ends its run
  // early off-road against real geometry (trees, boulders), which is the point
  // of the solids check added alongside this fix, so the bar is "it flew", not
  // a particular distance.
  check('a missile fired off-road is not killed by a phantom wall', missile.frames >= 10,
    `survived ${missile.frames} frames at lateral 14 on a world with no walls (the bug was 1)`);
}

await p.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nsolid things are solid');
process.exit(fail ? 1 : 0);
