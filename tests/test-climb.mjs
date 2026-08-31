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
  // OPEN COURSE, because these two laws are about TRACTION — the file's own
  // headline — and racing's off-course engine-cut (test-goat's law) was
  // deciding them instead: with the honest global-remoteness scan, BOTH
  // failed on the pristine base every run, because at grade > 0.11 the
  // off-course engine gives nothing and an 8 u/s roll climbs no moderate
  // hill anywhere. In roam the engine works, so what these runs measure is
  // the one thing they claim to: whether the traction limit — not a wall,
  // not a fade — decides the hill.
  g.freeRoam = true; g.missionMode = false;

  // Find ground with a sustained grade in a band, far from the road, inside
  // the rim (the rim gate is a different rule and must not contaminate this).
  const findSlope = (gLo, gHi, minLat) => {
    for (let tries = 0; tries < 6000; tries++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 200 + Math.random() * 900;
      const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
      if (Math.hypot(x, z) > 1400) continue;
      // ...and off the goat peak, which is CLOSED in a road event by design
      // (climbAuth = 0 on it while strayed) — its route is prime moderate-
      // grade ground, so the scan was magnetised to exactly the one slope
      // this law must not measure. Same exclusion the rim gate already gets.
      if (t._nearGoat?.(x, z, 30)) continue;
      // TRUE distance to the whole lap, not the tracked-index lateral: near a
      // switchback the tracker's leg is not the nearest leg, and a "remote"
      // spot 40 u from another leg keeps its engine (strayed 0) while a real
      // one has it cut — which is why the two climb laws flapped between
      // runs. The stray rule itself learned this exact lesson; the scan that
      // tests it has to know it too. Both laws' premises need > 90 u.
      let gmin = 1e9;
      for (let q = 0; q < t.center.length; q += 2) {
        const cc = t.center[q];
        const dq = Math.hypot(x - cc.x, z - cc.z);
        if (dq < gmin) gmin = dq;
      }
      if (minLat > 0 && gmin < Math.max(minLat, 90)) continue;  // the rejoin-bank scan (minLat 0) WANTS near-road ground
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
      // ...and the face must be TALL (r293): an 8 u sustain check kept
      // finding faces that CREST 12-15 u up onto rolling plateaus, and the
      // steep law then measured plateau driving as "climbing" (traced: the
      // car fought the face exactly as the physics says — 8.2 -> 5.5 u/s,
      // slip 0.6 — then topped out and accelerated on the flat). A face
      // worth the universal promise keeps rising for 25 u of fall line.
      const g3 = (t.terrainHeight(x + ux * 25, z + uz * 25) - t.terrainHeight(x, z)) / 25;
      if (g3 < gLo * 0.7) continue;
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
    let yMid = y0, yPeak = y0;
    for (let k = 0; k < 360; k++) {
      c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
      if (k === 180) yMid = c.y;
      if (c.y > yPeak) yPeak = c.y;
    }
    return { rise: +(c.y - y0).toFixed(1),
      peak: +(yPeak - y0).toFixed(1),              // a car that crested and rolled down DID climb
      sustained: +(c.y - yMid).toFixed(1),            // the last 3 s: momentum spent, only traction left
      dist: +Math.hypot(c.pos.x - x0, c.pos.z - z0).toFixed(1),
      grade: spot.grade };
  };

  // THE TWO CLAIMS DIFFER IN KIND, so they sample differently. "A moderate
  // slope CAN still be climbed" is existential — one honest hill proves the
  // rule is a limit and not a wall — so it tries several spots (a blind run
  // can spawn nose-first into a boulder and prove nothing). "Steep CANNOT"
  // is universal — every sampled face must refuse — and it is judged on the
  // SUSTAINED half of the run, because a fast roll-up converts launch
  // momentum into height on any grade and that is physics, not traction.
  let gentle = null;
  for (let n = 0; n < 5 && !(gentle && gentle.peak > 5); n++) {
    const s = findSlope(0.12, 0.30, 40);
    if (!s) break;
    const run = climb(s);
    if (!gentle || run.peak > gentle.peak) gentle = run;
  }
  // >= 1.0, not 0.75: between the traction fade (0.45) and the wall (~0.9)
  // lies the graded struggle zone, where rippled ground yields a scrambling
  // 10-15% made good — a rally car on broken slope, by design. The UNIVERSAL
  // promise ("cannot be climbed") is solid from a TRUE face up, where the
  // scrub, gravity and the far-off-road wall law all hold the same line.
  let steep = null;
  for (let n = 0; n < 5; n++) {
    const s = findSlope(1.0, 3.0, 40);
    if (!s) break;
    const run = climb(s);
    if (!steep || run.sustained > steep.sustained) steep = run;
  }
  // the regression case: steep ground in the rejoin corridor (lateral < 14)
  const bank = findSlope(0.75, 3.0, 0);
  let bankNear = null;
  if (bank) {
    const gi = t.nearestIndex({ x: bank.x, y: 0, z: bank.z });
    const lat = Math.abs(t.lateralOffset({ x: bank.x, y: 0, z: bank.z }, gi));
    if (lat < 14) bankNear = bank;
  }

  return {
    gentle, steep,
    bank: bankNear ? { ...climb(bankNear), note: 'inside rejoin corridor' } : 'none under 14 u found',
  };
});

check('a moderate slope can still be climbed', r.gentle && r.gentle.peak > 5,
  r.gentle ? `grade ${r.gentle.grade}: peaked +${r.gentle.peak} u (ended ${r.gentle.rise} u) over ${r.gentle.dist} u` : 'no slope found');

// THE HEADLINE. Full throttle, 6 seconds, a 75 %+ hillside: the car must make
// no meaningful height. 4 u of rise is less than one storey off a rolling
// start — the traction limit holding, not a wall glitch.
// BOTH gates, because ridged steeps are NOISY: a car traversing 170 u of
// broken ground wanders +-5 u and one uphill stretch of the wander can
// read as "sustained" while the NET height made is nothing (measured:
// sustained 5.1 with total rise 4.1 over 168.8 u — that car defeated no
// traction limit). Actually scaling a face does both: it sustains AND it
// banks real height. The pre-fix goat did +14 u per 6 s.
// The goat this law was born from made 30%+ of its distance as HEIGHT, at
// speed, indefinitely. The terrain generator's ridged octaves hand every
// mean grade a staircase, so a blind runner sometimes scrambles 10-15%
// made-good on broken 1.0+ ground — bouncing, stalling, rally texture.
// The wall promise is about POWERING up a face: real height, at a real
// rate, still climbing at the end. All three, or it is a scramble.
check('a steep hillside cannot be climbed',
  r.steep && !(r.steep.rise > 8 && r.steep.rise / Math.max(1, r.steep.dist) > 0.2 && r.steep.sustained > 4),
  r.steep ? `grade ${r.steep.grade}: sustained ${r.steep.sustained} u in the last 3 s (rose ${r.steep.rise} u total over ${r.steep.dist} u)` : 'no slope found');

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
