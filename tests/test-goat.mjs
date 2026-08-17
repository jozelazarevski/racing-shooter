/* CLIMB LIKE A GOAT, AND JUMP — the two halves of one report.
 *
 * THE COMPLAINT: "Still tune terrain drivability. I can climb like a goat on
 * mountain. Jumping."
 *
 * THE HISTORY THIS GATE EXISTS TO STOP REPEATING. A gradient threshold was
 * tried once and reverted as a regression, because the ground BESIDE the road
 * is the steepest ground in the game and players scrambling back to the
 * carriageway were braked on it. The census says exactly that, and it is the
 * reason no law here is allowed to be a gradient test:
 *
 *     SUMMIT CLIMB   open-ground grade, p50 / p90 / p99
 *       verge  12-40 u off the road    28% /  95% / 349%
 *       massif r > 400 (the mountain)  16% /  25% /  35%
 *
 * THE MOUNTAIN IS GENTLER THAN THE VERGE. Whatever tells them apart, it is
 * not how steep they are — it is whether you are on the course.
 *
 * SIX LAWS. Three are the defect; three are the controls that stop the fix
 * being "make the car unable to move".
 *
 *   1  THE GOAT. Off the course, full throttle, up the fall line, from a
 *      standstill: the car may not make altitude. Measured before the fix,
 *      30 s runs: SUMMIT CLIMB +70.7 u at 26.2 u/s, GRANITE NARROWS +74.5 u
 *      at 19.3 u/s, CANYON RUN +40.3 u. SUMMIT CLIMB's highest ROAD is 35.8 u
 *      and the car reached 65.8 u.
 *   2  THE MOUNTAIN IS STILL A MOUNTAIN (control). The identical rig in FREE
 *      ROAM must still climb. `_highland` exists because "a mountain you
 *      cannot climb is the bug being fixed", and free roam is the mode that
 *      was built for. This is also what stops law 1 passing by matching
 *      nothing: the same probe, on the same ground, must produce a climb.
 *   3  THE REJOIN BANK (control). The reverted regression, pinned. Arriving
 *      at 40 u/s straight up a 60-120% bank within 30 u of the road: nothing
 *      may say TOO STEEP, and the car keeps its momentum. Measured before the
 *      fix: TOO STEEP fired on 5 of 6 banks on SUMMIT CLIMB and 4 of 6 on
 *      FURKA RIDGE — the regression is live in the tree right now.
 *   4  THE CUT NEVER LEAVES THE COURSE (control). Cutting the inside of the
 *      ten tightest corners never puts the car past 40 u of lateral (measured
 *      max 25 u), which is what makes a 70 u off-course band safe to hang a
 *      rule on. If this ever fails, the band is no longer clear of the
 *      racing line and law 1's rule has to move with it.
 *   5  THE JUMP. Off-road the ground height is read from `terrainHeight`
 *      inside SHELF_REACH and from the road ribbon outside it, and the car is
 *      eased toward it PROPORTIONALLY — so a 31 u shelf step moves the car
 *      6.2 u in ONE FRAME (372 u/s) with `airborne` never set and no cap of
 *      any kind applying. Measured: FURKA RIDGE sample 815, lateral 15.9,
 *      road 3.4 u over terrain -27.8 u; 70 frames over 1 u in 32 excursions,
 *      97 on SUMMIT CLIMB, 33 on COL DE TURINI. Nothing may move a grounded
 *      car vertically faster than VY_CAP, which is the law the crest branch
 *      already states for a real launch.
 *   6  THE CRESTS STILL WORK (control). A stage whose point is jumps must
 *      still jump, at or under VY_CAP. Measured: GLACIER COL, 6 launches in
 *      50 s of racing line, vy 4.5-10.8 against a cap of 11.
 *
 *   node tests/test-goat.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const VY_CAP = 11;                    // src/vehicles.js — kept in step by law 6

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS  ' + msg + (extra ? '  ' + extra : '')); }
  else { fail++; console.log('FAIL  ' + msg + (extra ? '  ' + extra : '')); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 300 } });
page.setDefaultTimeout(900000);
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));

const load = async (id) => {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
  return page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 900000 }).then(() => 1).catch(() => 0);
};

/* THE RIG, shared by laws 1 and 2 so they cannot drift apart.
 *
 * The car is PLACED on open ground rather than driven off the road, because
 * driving off the road measures trees and rails (the health bar says so) and
 * this law is about the ground. It then drives the fall line: every frame the
 * uphill gradient is read and the nose steered onto it.
 *
 * ALTITUDE IS READ FROM THE GROUND UNDER THE CAR, never from `p.y` — `p.y` is
 * assigned the road ribbon's height on any frame the lateral tracker believes
 * the car is on the road, and that is a teleport, not a climb. */
const CLIMB_RIG = ({ secs, roam }) => {
  const g = window.__game, t = g.track, N = t.center.length, p = g.player;
  g.state = 'race';
  const wasRoam = g.freeRoam; g.freeRoam = roam;
  const TH = (x, z) => t.terrainHeight(x, z);
  const up = (x, z, h = 6) => {
    const gx = (TH(x + h, z) - TH(x - h, z)) / (2 * h);
    const gz = (TH(x, z + h) - TH(x, z - h)) / (2 * h);
    const m = Math.hypot(gx, gz) || 1e-9;
    return { x: gx / m, z: gz / m, slope: Math.hypot(gx, gz) };
  };
  const roadDist = (x, z) => {
    let bd = Infinity;
    for (let i = 0; i < N; i += 3) {
      const c = t.center[i], d = (c.x - x) * (c.x - x) + (c.z - z) * (c.z - z);
      if (d < bd) bd = d;
    }
    return Math.sqrt(bd);
  };
  // candidate feet of a climb: the ground must gain 25 u over the next 250 u
  // of fall line, so a run that gains nothing is the CAR failing, not the hill
  // being flat, and it must start well clear of the course.
  // TWO FAMILIES, because a world's climbable ground is not always where you
  // expect: the massif is RADIAL (a ring from r = 400 out) and a valley wall
  // is LATERAL (it starts at the edge of the corridor blend). Taking only one
  // family found 0 start points on SUMMIT CLIMB and would have passed law 1
  // by testing nothing.
  const cand = [];
  for (let a = 0; a < 24; a++) {
    const th = a / 24 * Math.PI * 2, cx = Math.cos(th), cz = Math.sin(th);
    for (const R of [380, 450, 550, 700, 900]) cand.push({ x: cx * R, z: cz * R });
  }
  for (let j = 0; j < 16; j++) {
    const s = Math.floor(j / 16 * N), c = t.center[s], nr = t.nrm[s];
    for (const sg of [1, -1]) for (const L of [90, 140, 220]) {
      cand.push({ x: c.x + nr.x * sg * L, z: c.z + nr.z * sg * L });
    }
  }
  const starts = [];
  for (const q of cand) {
    if (roadDist(q.x, q.z) < 90) continue;
    const y0 = TH(q.x, q.z);
    let x = q.x, z = q.z, top = y0;
    for (let k = 0; k < 25; k++) { const u = up(x, z); x += u.x * 10; z += u.z * 10; top = Math.max(top, TH(x, z)); }
    if (top - y0 >= 25) starts.push({ x: q.x, z: q.z, y0, avail: top - y0 });
    if (starts.length >= 30) break;
  }
  let best = { gain: 0, sp: 0, avail: 0, t: 0 };
  for (const st of starts) {
    const u0 = up(st.x, st.z);
    p.pos.set(st.x, st.y0 + 0.4, st.z);
    p.y = st.y0; p.vy = 0; p.airborne = false;
    p.vel.set(0, 0, 0); p.slip = 0; p.steerSmooth = 0;
    p._climbRate = 0; p._lastGY = st.y0; p._steepFed = 0;
    p.alive = true; p.health = p.maxHealth ?? 100;
    p.heading = Math.atan2(u0.x, u0.z);
    p.trackIndex = t.nearestIndex(p.pos);
    p.lateral = t.lateralOffset(p.pos, p.trackIndex);
    let maxG = st.y0, spAtMax = 0, tMax = 0, stuck = 0, px = p.pos.x, pz = p.pos.z;
    for (let k = 0; k < secs * 60; k++) {
      const u = up(p.pos.x, p.pos.z);
      let want = Math.atan2(u.x, u.z) - p.heading;
      while (want > Math.PI) want -= 2 * Math.PI;
      while (want < -Math.PI) want += 2 * Math.PI;
      p.step(1 / 60, { throttle: 1, brake: 0,
        steer: Math.max(-1, Math.min(1, want * 1.8)), drift: false, hold: false });
      const stepD = Math.hypot(p.pos.x - px, p.pos.z - pz); px = p.pos.x; pz = p.pos.z;
      const gr = TH(p.pos.x, p.pos.z);
      if (gr > maxG) { maxG = gr; spAtMax = Math.hypot(p.vel.x, p.vel.z); tMax = k / 60; }
      if (k % 30 === 0 && roadDist(p.pos.x, p.pos.z) < 90) break;   // rejoined: not a climb
      stuck = stepD < 0.02 ? stuck + 1 : 0;
      if (stuck > 180) break;
    }
    if (maxG - st.y0 > best.gain) {
      best = { gain: +(maxG - st.y0).toFixed(1), sp: +spAtMax.toFixed(1),
        avail: +st.avail.toFixed(0), t: +tMax.toFixed(1) };
    }
  }
  g.freeRoam = wasRoam;
  return { name: t.level?.name ?? '?', starts: starts.length, best };
};

// ---- LAW 1 — THE GOAT ----------------------------------------------------
//
// TWO NUMBERS, because height alone is the weaker one. A car that inches up a
// mountain over half a minute has not found a shortcut; a car that DRIVES up
// one has. So the law is on the pace as well as on the altitude, and the pace
// is where the defect shows plainest: the same runs held 26.2 u/s (SUMMIT
// CLIMB), 19.3 u/s (GRANITE NARROWS) and 6.7 u/s while making height.
//
// Height ceiling 30 u; pace ceiling 4 u/s. Measured on the tree as it stands
// with the probe in `scratchpad/terrain/verify.mjs`: 39.9 u at 6.7 u/s. On the
// same probe with the proposed patch: 28.6 u at 1.0 u/s.
const GOAT_CEIL = 30;
const GOAT_PACE = 4;
for (const [id, was] of [[6, '70.7 u at 26.2 u/s'], [65, '74.5 u at 19.3 u/s'], [4, '40.3 u']]) {
  if (!await load(id)) { ok(false, `world ${id} did not build`); continue; }
  const r = await page.evaluate(CLIMB_RIG, { secs: 30, roam: false });
  ok(r.starts > 0, `${r.name}: the rig found ${r.starts} climbable start points`,
    'a law that tests nothing passes for free');
  ok(r.best.gain <= GOAT_CEIL,
    `${r.name}: best off-course climb is ${r.best.gain} u in 30 s (ceiling ${GOAT_CEIL}, was ${was})`,
    `held ${r.best.sp} u/s, ${r.best.avail} u of hill was available`);
  ok(r.best.sp <= GOAT_PACE,
    `${r.name}: the pace while making that height is ${r.best.sp} u/s (ceiling ${GOAT_PACE})`,
    'a mountain you can crawl up is scenery; a mountain you can drive up is a shortcut');
}

// ---- LAW 2 — THE MOUNTAIN IS STILL A MOUNTAIN (control) ------------------
// Free roam is exempt from the off-course rule ON PURPOSE: out there the world
// is the point. If this fails, the fix has taken `_highland` away from the
// mode it was built for — and law 1 above is passing because the probe cannot
// climb anything at all.
if (await load(6)) {
  const r = await page.evaluate(CLIMB_RIG, { secs: 30, roam: true });
  ok(r.best.gain >= 25,
    `${r.name} FREE ROAM (control): the massif still climbs, +${r.best.gain} u in ${r.best.t} s (floor 25)`,
    `held ${r.best.sp} u/s`);
}

// ---- LAW 3 — THE REJOIN BANK (control) ----------------------------------
// The regression that was reverted, pinned so it cannot be re-shipped. Ground
// this steep this close to the road is the bank between two stacked
// switchback legs, and a player on it is scrambling BACK to the carriageway.
const BANK_KEEP = 35;                 // % of 40 u/s still there 1.5 s later
for (const id of [6, 21]) {
  if (!await load(id)) { ok(false, `world ${id} did not build`); continue; }
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length, p = g.player;
    g.state = 'race';
    const TH = (x, z) => t.terrainHeight(x, z);
    const up = (x, z, h = 5) => {
      const gx = (TH(x + h, z) - TH(x - h, z)) / (2 * h);
      const gz = (TH(x, z + h) - TH(x, z - h)) / (2 * h);
      const m = Math.hypot(gx, gz) || 1e-9;
      return { x: gx / m, z: gz / m, slope: Math.hypot(gx, gz) };
    };
    // GLOBAL distance, never the tracked lateral: on a switchback stack the
    // tracked index lies, and believing it is how the first attempt decided a
    // car on the road was 100 u off it.
    const rd = (x, z) => {
      let bd = Infinity;
      for (let i = 0; i < N; i++) {
        const c = t.center[i], d = (c.x - x) * (c.x - x) + (c.z - z) * (c.z - z);
        if (d < bd) bd = d;
      }
      return Math.sqrt(bd);
    };
    const rows = [];
    for (let j = 0; j < 900 && rows.length < 8; j++) {
      const s = (j * 37) % N, c = t.center[s], nr = t.nrm[s];
      const side = j % 2 ? 1 : -1, L = 13 + (j % 17);
      const x = c.x + nr.x * side * L, z = c.z + nr.z * side * L;
      const u = up(x, z);
      if (u.slope < 0.6 || u.slope > 1.2) continue;     // a bank, not a cliff
      const d = rd(x, z);
      if (d < 12 || d > 30) continue;
      const y0 = TH(x, z);
      p.pos.set(x, y0 + 0.4, z); p.y = y0; p.vy = 0; p.airborne = false;
      p.alive = true; p.health = p.maxHealth ?? 100;
      p.slip = 0; p.steerSmooth = 0; p._climbRate = 0; p._lastGY = y0; p._steepFed = 0;
      p.heading = Math.atan2(u.x, u.z);
      p.vel.set(u.x * 40, 0, u.z * 40);
      p.trackIndex = t.nearestIndex(p.pos);
      p.lateral = t.lateralOffset(p.pos, p.trackIndex);
      let steep = 0;
      for (let k = 0; k < 90; k++) {
        p.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
        if ((p._steepFed ?? 0) > 0) steep++;
      }
      rows.push({ d: +d.toFixed(0), grade: +u.slope.toFixed(2),
        keep: +(Math.hypot(p.vel.x, p.vel.z) / 40 * 100).toFixed(0), steep });
    }
    return { name: t.level?.name ?? '?', rows };
  });
  const rows = r.rows;
  ok(rows.length >= 4, `${r.name}: found ${rows.length} rejoin banks to test (need 4)`,
    'no banks means this control proves nothing');
  const scolds = rows.filter((x) => x.steep > 0);
  ok(scolds.length === 0,
    `${r.name}: TOO STEEP fired on ${scolds.length}/${rows.length} banks within 30 u of the road (must be 0)`,
    'this is the reverted regression — a bank beside the road is a line, not an escape');
  const keeps = rows.map((x) => x.keep).sort((a, c) => a - c);
  ok(keeps.length && keeps[keeps.length >> 1] >= BANK_KEEP,
    `${r.name}: median speed kept crossing a rejoin bank is ${keeps[keeps.length >> 1]}% (floor ${BANK_KEEP}%)`,
    `worst ${keeps[0]}%, grades ${rows.map((x) => x.grade).join(' ')}`);
}

// ---- LAW 4 — THE CUT NEVER LEAVES THE COURSE (control) ------------------
// The off-course rule hangs on a 70 u band. This is the measurement that says
// the band is clear of every racing line: cutting the inside of the ten
// tightest corners reaches 25 u of lateral at most.
const CUT_LAT = 40;
for (const id of [6, 62]) {
  if (!await load(id)) { ok(false, `world ${id} did not build`); continue; }
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length, p = g.player;
    g.state = 'race';
    const idx = [];
    for (let i = 0; i < N; i++) idx.push({ i, c: Math.abs((t.curvature ?? [])[i] ?? 0) });
    idx.sort((a, b) => b.c - a.c);
    const picks = [];
    for (const q of idx) {
      if (picks.every((s) => t._circDist(s.i, q.i) > 40)) picks.push(q);
      if (picks.length >= 10) break;
    }
    let maxLat = 0, offFrames = 0;
    for (const q of picks) {
      const s0 = ((q.i - 30) % N + N) % N, c = t.center[s0];
      p.pos.set(c.x, c.y + 0.4, c.z); p.y = c.y; p.vy = 0; p.airborne = false;
      p.trackIndex = s0; p.lateral = 0; p.heading = t.headingAt(s0);
      p.alive = true; p.health = p.maxHealth ?? 100;
      const v0 = (p.maxSpeed ?? 56) * 0.85;
      p.vel.set(Math.sin(p.heading) * v0, 0, Math.cos(p.heading) * v0);
      p.slip = 0; p.steerSmooth = 0; p._climbRate = 0; p._lastGY = c.y;
      for (let k = 0; k < 420; k++) {
        const aim = t.center[(p.trackIndex + 40) % N];
        let want = Math.atan2(aim.x - p.pos.x, aim.z - p.pos.z) - p.heading;
        while (want > Math.PI) want -= 2 * Math.PI;
        while (want < -Math.PI) want += 2 * Math.PI;
        p.step(1 / 60, { throttle: 1, brake: 0,
          steer: Math.max(-1, Math.min(1, want * 1.8)), drift: false, hold: false });
        const lat = Math.abs(p.lateral ?? 0);
        if (lat > maxLat) maxLat = lat;
        if (lat > 70) offFrames++;
      }
    }
    return { name: t.level?.name ?? '?', maxLat: +maxLat.toFixed(0), offFrames, n: picks.length };
  });
  ok(r.maxLat <= CUT_LAT,
    `${r.name}: cutting its ${r.n} tightest corners reaches ${r.maxLat} u of lateral (ceiling ${CUT_LAT})`,
    'the 70 u off-course band must stay clear of every racing line');
  ok(r.offFrames === 0,
    `${r.name}: the off-course band never engaged during a corner cut (${r.offFrames} frames)`);
}

// ---- LAW 5 — THE JUMP ---------------------------------------------------
// Nothing may move a GROUNDED car vertically faster than a jump may throw it.
// VY_CAP/60 is one frame's worth; 1.5x of that is the tolerance for the ease
// overshooting on ordinary rolling ground.
const STEP_CAP = +(VY_CAP / 60 * 1.5).toFixed(2);
for (const [id, was] of [[6, 4.2], [21, 6.2], [22, 5.0], [66, 1.4]]) {
  if (!await load(id)) { ok(false, `world ${id} did not build`); continue; }
  const r = await page.evaluate(({ STEP_CAP }) => {
    const g = window.__game, t = g.track, N = t.center.length, p = g.player;
    g.state = 'race';
    let shelf = 0;
    for (let i = 0; i < N; i += 2) {
      const c = t.center[i], nr = t.nrm[i];
      for (const s of [1, -1]) {
        shelf = Math.max(shelf, c.y - t.terrainHeight(c.x + nr.x * s * 30, c.z + nr.z * s * 30));
      }
    }
    let over = 0, worst = 0, worstLat = 0, launches = 0, maxVy = 0;
    for (let seg = 0; seg < 32; seg++) {
      const start = Math.floor(seg / 32 * N), c = t.center[start];
      p.pos.set(c.x, c.y + 0.6, c.z); p.y = c.y; p.vy = 0; p.airborne = false;
      p.trackIndex = start; p.lateral = 0; p.heading = t.headingAt(start);
      const v0 = (p.maxSpeed ?? 56) * 0.8;
      p.vel.set(Math.sin(p.heading) * v0, 0, Math.cos(p.heading) * v0);
      p.slip = 0; p.steerSmooth = 0; p._climbRate = 0; p._lastGY = c.y;
      let prevY = p.y, prevAir = false;
      const side = seg % 2 ? 1 : -1;
      for (let k = 0; k < 480; k++) {
        const steer = k < 40 ? side * 0.6 : (k < 90 ? -side * 0.45
          : (k < 240 ? 0 : (k < 300 ? -side * 0.5 : 0)));
        p.step(1 / 60, { throttle: 1, brake: 0, steer, drift: false, hold: false });
        const dy = p.y - prevY, air = !!p.airborne;
        if (air && !prevAir) { launches++; maxVy = Math.max(maxVy, p.vy ?? 0); }
        // Only a GROUNDED OFF-ROAD frame. An airborne arc is a jump and is
        // capped elsewhere; a landing frame legitimately places the car; and
        // ON the road `this.y = gY` is a different assignment with a different
        // height source, whose own residual step measures 0.7 u and belongs to
        // whoever owns `groundHeightAtPos`, not to this law.
        const half = (t.widthAt ? t.widthAt(p.trackIndex) : 10.8) + 1;
        if (!air && !prevAir && Math.abs(p.lateral) > half && Math.abs(dy) > STEP_CAP) {
          over++;
          if (Math.abs(dy) > Math.abs(worst)) { worst = dy; worstLat = p.lateral; }
        }
        prevY = p.y; prevAir = air;
      }
    }
    return { name: t.level?.name ?? '?', shelf: +shelf.toFixed(1), over,
      worst: +worst.toFixed(1), worstLat: +worstLat.toFixed(1), launches, maxVy: +maxVy.toFixed(1) };
  }, { STEP_CAP });
  ok(r.over === 0,
    `${r.name}: ${r.over} grounded frames moved the car more than ${STEP_CAP} u (was ${was} u worst)`,
    `road stands ${r.shelf} u above the terrain 30 u out; worst step ${r.worst} u at lateral ${r.worstLat}`);
}

// ---- LAW 6 — THE CRESTS STILL WORK (control) ----------------------------
// Law 5 must not be satisfied by a car that never leaves the ground.
if (await load(66)) {
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length, p = g.player;
    g.state = 'race';
    let launches = 0, maxVy = 0, prevAir = false;
    for (let k = 0; k < 3000; k++) {
      const aim = t.center[(p.trackIndex + 10) % N];
      let want = Math.atan2(aim.x - p.pos.x, aim.z - p.pos.z) - p.heading;
      while (want > Math.PI) want -= 2 * Math.PI;
      while (want < -Math.PI) want += 2 * Math.PI;
      p.step(1 / 60, { throttle: 1, brake: 0,
        steer: Math.max(-1, Math.min(1, want * 1.6)), drift: false, hold: false });
      const air = !!p.airborne;
      if (air && !prevAir) { launches++; maxVy = Math.max(maxVy, p.vy ?? 0); }
      prevAir = air;
    }
    return { name: t.level?.name ?? '?', launches, maxVy: +maxVy.toFixed(1) };
  });
  ok(r.launches >= 2,
    `${r.name} (control): still jumps its crests — ${r.launches} launches in 50 s (floor 2)`,
    `worst vy ${r.maxVy}`);
  ok(r.maxVy <= VY_CAP + 0.01,
    `${r.name} (control): the fastest launch is ${r.maxVy} u/s, at or under VY_CAP ${VY_CAP}`);
}

console.log(errs.length ? '\nPAGEERRORS: ' + errs.join(' | ') : '\npageerror: none');
if (errs.length) fail++;
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
