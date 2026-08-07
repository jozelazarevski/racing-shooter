/* TOO STEEP CANNOT BE CLIMBED — AND EVERYTHING ELSE STILL CAN BE.
 *
 * THE COMPLAINT: "Climbing the hills needs to be appropriate with the
 * inclination. Too steep can't be climbed."
 *
 * It was true everywhere except the world rim: the car's height is pinned to
 * the ground under it, so away from the rim gate it would drive up any face
 * at any angle. The fix is the traction limit — past ~0.40 of grade the
 * wheels cannot hold, speed scrubs and gravity's slope component pushes back.
 *
 * THE HISTORY THIS TEST GUARDS BOTH SIDES OF: an earlier gradient gate
 * shipped as a regression, braking players on the near-vertical banks BESIDE
 * a switchback stack — ground they were scrambling across to rejoin the road.
 * So this asserts three things, and the third matters as much as the first:
 *
 *   1. a steep hillside far from the road cannot be climbed
 *   2. a moderate slope still can be — the rule is a limit, not a wall
 *   3. the rejoin corridor beside the road is untouched, however steep
 *
 * All probes step the real physics with real inputs; nothing is mocked.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// FURKA RIDGE: a mountain world with genuinely steep flanks off the course.
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=21&go=1&unlockall=1`, { waitUntil: 'load' });
const ok = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 }).then(() => 1).catch(() => 0);
if (!ok) { console.log('SKIP  world did not build'); process.exit(1); }

const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race';

  // Find ground with a sustained grade in a band, far from the road, inside
  // the rim (the rim gate is a different rule and must not contaminate this).
  const findSlope = (gLo, gHi, minLat) => {
    for (let tries = 0; tries < 6000; tries++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 200 + Math.random() * 900;
      const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
      if (Math.hypot(x, z) > 1400) continue;
      const gi = t.nearestIndex({ x, y: 0, z });
      if (Math.abs(t.lateralOffset({ x, y: 0, z }, gi)) < minLat) continue;
      // grade along the local uphill direction, sustained over two samples
      const e = 4;
      const gx = (t.terrainHeight(x + e, z) - t.terrainHeight(x - e, z)) / (2 * e);
      const gz = (t.terrainHeight(x, z + e) - t.terrainHeight(x, z - e)) / (2 * e);
      const grade = Math.hypot(gx, gz);
      if (grade < gLo || grade > gHi) continue;
      const ux = gx / grade, uz = gz / grade;
      const g2 = (t.terrainHeight(x + ux * 8, z + uz * 8) - t.terrainHeight(x, z)) / 8;
      if (g2 < gLo || g2 > gHi) continue;
      return { x, z, ux, uz, grade: +grade.toFixed(2) };
    }
    return null;
  };

  // Drive straight uphill at full throttle for 6 simulated seconds and report
  // the height actually gained.
  const climb = (spot) => {
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    c.pos.set(spot.x, t.terrainHeight(spot.x, spot.z) + 0.3, spot.z);
    c.y = c.pos.y;
    c.heading = Math.atan2(spot.ux, spot.uz);
    c.vel.set(spot.ux * 8, 0, spot.uz * 8);           // rolling start uphill
    c.trackIndex = t.nearestIndex(c.pos);
    const y0 = c.y, x0 = c.pos.x, z0 = c.pos.z;
    for (let k = 0; k < 360; k++) {
      c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    }
    return { rise: +(c.y - y0).toFixed(1),
      dist: +Math.hypot(c.pos.x - x0, c.pos.z - z0).toFixed(1),
      grade: spot.grade };
  };

  const gentle = findSlope(0.12, 0.30, 40);
  const steep = findSlope(0.75, 3.0, 40);
  // the regression case: steep ground in the rejoin corridor (lateral < 14)
  const bank = findSlope(0.75, 3.0, 0);
  let bankNear = null;
  if (bank) {
    const gi = t.nearestIndex({ x: bank.x, y: 0, z: bank.z });
    const lat = Math.abs(t.lateralOffset({ x: bank.x, y: 0, z: bank.z }, gi));
    if (lat < 14) bankNear = bank;
  }

  return {
    gentle: gentle ? climb(gentle) : null,
    steep: steep ? climb(steep) : null,
    bank: bankNear ? { ...climb(bankNear), note: 'inside rejoin corridor' } : 'none under 14 u found',
  };
});

check('a moderate slope can still be climbed', r.gentle && r.gentle.rise > 5,
  r.gentle ? `grade ${r.gentle.grade}: rose ${r.gentle.rise} u over ${r.gentle.dist} u` : 'no slope found');

// THE HEADLINE. Full throttle, 6 seconds, a 75 %+ hillside: the car must make
// no meaningful height. 4 u of rise is less than one storey off a rolling
// start — the traction limit holding, not a wall glitch.
check('a steep hillside cannot be climbed', r.steep && r.steep.rise < 4,
  r.steep ? `grade ${r.steep.grade}: rose ${r.steep.rise} u over ${r.steep.dist} u at full throttle` : 'no slope found');

// The bank beside the road is NOT gated, however steep — the shipped
// regression this rule must never repeat. If no such bank exists on this
// world the note says so rather than passing silently.
if (r.bank && r.bank.rise !== undefined) {
  check('the rejoin bank beside the road is untouched', r.bank.rise > 4,
    `grade ${r.bank.grade}: rose ${r.bank.rise} u (${r.bank.note})`);
} else {
  console.log(`NOTE  no steep bank inside the rejoin corridor on this world (${r.bank})`);
}

await p.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe hill decides');
process.exit(fail ? 1 : 0);
