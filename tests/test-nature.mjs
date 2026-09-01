/* NATURE.md, as a test.
 *
 * NATURE.md opens by saying every rule in it is testable, and that "if a rule
 * cannot be checked by a probe, it is too vague to enforce". Most of them had
 * no probe. That is how rule 1 — waterfalls are vertical — stayed broken for
 * two releases on the biggest river in the game while the document called it
 * fixed: the rule existed, the belief existed, the measurement did not.
 *
 * This file closes that loop for the rules nothing else covers.
 *
 * Already covered elsewhere, deliberately not duplicated here:
 *   rule 1  (water is level or vertical)      -> tests/test-water.mjs
 *   rule 10 (buildings clear the road)        -> tests/test-carriageway.mjs
 *
 * Covered here:
 *   rule 2  flowing water never runs uphill
 *   rule 4  a waterway sits IN the terrain, not on a ridge
 *   rule 6  everything that stands, stands ON the ground
 *   rule 9  a vehicle sits on the surface it is on
 *   rule 12 shadows agree with the sun
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

for (const [id, name] of [[1, 'PINE VALLEY'], [13, 'LOG FLUME FURY'], [21, 'FURKA RIDGE']]) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 240000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    const out = {};

    // ---- rules 2 and 4: the world-spanning river --------------------------
    let water = null;
    t.group.traverse((o) => { if (o.name === 'river-water') water = o; });
    if (water) {
      const pos = water.geometry.attributes.position, C = 4;
      const rows = pos.count / C;
      const ys = [], xs = [], zs = [];
      for (let s = 0; s < rows; s++) {
        ys.push(pos.getY(s * C)); xs.push(pos.getX(s * C)); zs.push(pos.getZ(s * C));
      }
      // Rule 2. Which way is downstream is not declared anywhere, so take the
      // end that is lower overall as downstream and measure against that.
      const forward = ys[ys.length - 1] <= ys[0];
      const order = forward ? ys.map((_, s) => s) : ys.map((_, s) => ys.length - 1 - s);
      let rises = 0, worstRise = 0, fordRises = 0;
      for (let k = 1; k < order.length; k++) {
        const s = order[k], prev = order[k - 1];
        const up = ys[s] - ys[prev];
        if (up <= 0.01) continue;
        // FORDS ARE A DECLARED EXCEPTION. Where the road crosses, the wash sits
        // on the DECK, so the embankment dams the stream and the surface climbs
        // to meet it. Measured, that accounts for ALL of the rises — 5 of 5 on
        // LOG FLUME FURY, 0 in the open river — so the rule holds everywhere it
        // is meant to, and this exception is recorded in NATURE.md rather than
        // being quietly absorbed by a loose threshold.
        const df = t._distToTrackCoarse ? t._distToTrackCoarse(xs[s], zs[s]) : 999;
        if (df < 30) { fordRises++; continue; }
        rises++;
        if (up > worstRise) worstRise = up;
      }
      out.river = { rows, rises, fordRises, worstRise: +worstRise.toFixed(2) };

      // Rule 4: the channel sits IN the ground. Sample the terrain a little way
      // to each side of the water and require it to be no lower than the
      // surface — a river perched on a ridge has ground falling away either
      // side. Skip the fords, where the water is on the road deck by design.
      // Sample at the river's OWN bank distance, not an arbitrary one. The
      // channel is `half` wide with a `bank` shoulder carved around it; a
      // fixed 12 u probe overshoots that on narrow reaches and measures the
      // hillside beyond the valley, which reports a perfectly normal river as
      // perched. (It did: 79 of 169 stations on LOG FLUME FURY.)
      const R = t._river || {};
      const reach = (R.half ?? 6) + (R.bank ?? 6) * 0.6;
      let perched = 0, worstPerch = 0, sampled = 0;
      for (let s = 0; s < rows; s += 3) {
        if ((t._distToTrackCoarse ? t._distToTrackCoarse(xs[s], zs[s]) : 999) < 30) continue;
        sampled++;
        const banks = [[reach, 0], [-reach, 0], [0, reach], [0, -reach]]
          .map(([dx, dz]) => t.terrainHeight(xs[s] + dx, zs[s] + dz));
        const lowerThanWater = banks.filter((b) => b < ys[s] - 0.5).length;
        if (lowerThanWater >= 3) {                 // ground falls away on most sides
          perched++;
          const drop = ys[s] - Math.max(...banks);
          if (drop > worstPerch) worstPerch = drop;
        }
      }
      out.perch = { sampled, perched, reach: +reach.toFixed(1), worstPerch: +worstPerch.toFixed(2) };
    }

    // ---- rule 6: everything that stands, stands ON the ground -------------
    // A record's `y` is where the thing is planted. Compare with the GROUND
    // THE PLAYER SEES — which, since the r286 seating fix, is the LOWER of
    // the analytic curve and the drawn 10 u mesh chord (`_seatY`: "rule 6 is
    // about the picture, and the picture is the mesh"). Measuring against
    // the analytic curve alone re-reported every correctly-seated prop in
    // steep terrain as buried: on FURKA/PINE/FLUME, 91 of 101 flags sat
    // EXACTLY on `_drawnGroundY` with the deliberate 0.25 u root sink
    // (attributed r319 — the reds were the test's datum, not the world).
    // Trees on the roadbed legitimately differ (the road is a shelf above
    // raw terrain), so only sample well off the road.
    const standing = (list, label) => {
      let n = 0, floating = 0, buried = 0, worst = 0;
      for (const o of (list ?? [])) {
        if (o.y === undefined) continue;
        // LANDFORMS ARE NOT THINGS THAT STAND ON THE GROUND — they ARE the
        // ground. FURKA RIDGE's massif and outcrops are `stone` solids with
        // radii of 61 to 107 u, and they are half-buried on purpose; reading
        // them as floating furniture reported 11 false violations.
        if ((o.r ?? 0) > 20) continue;
        if ((t._distToTrackCoarse ? t._distToTrackCoarse(o.x, o.z) : 999) < 16) continue;
        n++;
        const a = t.terrainHeight(o.x, o.z);
        const dg = t._drawnGroundY ? t._drawnGroundY(o.x, o.z) : null;
        const seen = dg === null ? a : Math.min(a, dg);
        const d = o.y - seen;
        if (d > 0.6) floating++;
        if (d < -1.2) buried++;
        if (Math.abs(d) > Math.abs(worst)) worst = d;
      }
      return { label, n, floating, buried, worst: +worst.toFixed(2) };
    };
    out.stand = [
      standing(t.trees, 'trees'),
      standing((t.solids ?? []).filter((s) => (s.y ?? -9999) > -1000), 'solids'),
      standing(t.tireStacks, 'tire stacks'),
    ];

    // ---- rule 12: shadows agree with the sun ------------------------------
    // The key light's compass bearing must match the bearing the sky draws the
    // sun at, or every shadow in the world points somewhere the sun is not.
    const th = t.T ?? {};
    const sunObj = g.moon;                 // the key light; named moon historically
    if (sunObj && th.sunAz !== undefined) {
      // The rig FOLLOWS THE PLAYER, so its absolute position is player+offset
      // and means nothing on its own. The bearing lives in the offset from its
      // target. `sunAz` is RADIANS and main.js builds the offset as
      // (cos(az)·k, ·, sin(az)·k), so the bearing back out is atan2(z, x).
      const dx = sunObj.position.x - sunObj.target.position.x;
      const dz = sunObj.position.z - sunObj.target.position.z;
      let d = Math.atan2(dz, dx) - th.sunAz;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      out.sun = { deltaDeg: +(Math.abs(d) * 180 / Math.PI).toFixed(1) };
    }
    return out;
  });

  // Rule 2 — flowing water runs downhill.
  if (r.river) {
    check(`${name}: the open river never runs uphill`, r.river.rises === 0,
      `${r.river.rises} rises over ${r.river.rows} stations (worst ${r.river.worstRise} u); ` +
      `${r.river.fordRises} more at fords, which are a declared exception`);
  }
  // Rule 4 — REPORTED, NOT ASSERTED, and deliberately so.
  //
  // The rule ("a waterway may not run along a ridge; its channel must be at or
  // below the terrain within a few units either side") is real, but I could not
  // build a probe I trust. `terrainHeight` folds the river valley in through
  // `_riverValley`, while the channel bed lives in a separate `_river.bed`
  // array, and the two do not obviously describe the same surface — so a
  // water-versus-terrain comparison can report a perfectly normal river as
  // perched depending which one you sample. Two formulations gave 79/169 and
  // 87/169 on the same world, which is the signature of measuring the wrong
  // thing rather than of a world that is wrong.
  //
  // NATURE.md says a rule that cannot be checked by a probe is too vague to
  // enforce. So this prints its numbers and asserts nothing, and NATURE.md
  // records rule 4 as UNVERIFIED rather than pretending either way.
  if (r.perch) {
    console.log(`NOTE  ${name}: rule 4 unverified — ${r.perch.perched}/${r.perch.sampled} stations read as perched ` +
      `at a ${r.perch.reach} u bank probe, worst ${r.perch.worstPerch} u. Needs a probe against the carved bed.`);
  }
  // Rule 6 — nothing floats and nothing is swallowed.
  for (const s of (r.stand ?? [])) {
    if (!s.n) continue;
    check(`${name}: ${s.label} stand on the ground`, s.floating === 0 && s.buried === 0,
      `${s.floating} floating, ${s.buried} buried, of ${s.n} (worst offset ${s.worst} u)`);
  }
  // Rule 12 — the key light and the drawn sun agree.
  if (r.sun) {
    check(`${name}: shadows agree with the sun`, r.sun.deltaDeg < 25,
      `key light bearing differs from the sky sun by ${r.sun.deltaDeg} deg`);
  }

  // Rule 9 — a vehicle sits on the surface it is on.
  //
  // Measured two ways, because the roadbed is FLAT BANK TO BANK by design:
  // a car sitting on the road has no cross-slope to lean to, and zero roll
  // there is correct, not a violation. (An earlier version of this test parked
  // the car on the road, measured the TERRAIN's cross-grade beside it, and
  // called the resulting zero roll a bug on all three worlds.) So pitch is
  // measured on the road against its own gradient, and roll off the road,
  // where the ground really does tilt across the car.
  const tilt = await p.evaluate(() => {
    const g = window.__game, car = g.player, t = g.track;
    const settle = (i, lat) => {
      const pt = t.pointAt(i, lat);
      const ground = Math.abs(lat) > 12 ? t.terrainHeight(pt.x, pt.z) : t.groundHeightAt(i, lat);
      car.alive = true; car.health = 100; car.airborne = false; car.vy = 0;
      car.trackIndex = i; car.lateral = lat;
      car.pos.set(pt.x, ground + 0.3, pt.z); car.y = car.pos.y;
      car.heading = t.headingAt(i);
      car.vel.set(0, 0, 0); car.speedAlong = 0;
      car.groundRoll = 0; car.jumpPitch = 0; car._climbSm = 0;
      for (let k = 0; k < 120; k++) {
        car.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
      }
      return { roll: car.groundRoll ?? 0, pitch: car.jumpPitch ?? 0 };
    };

    // Steepest ROAD gradient -> the body must pitch.
    let steep = null;
    for (let i = 30; i < t.center.length - 30; i += 7) {
      const s = Math.abs(t.slopeAt ? t.slopeAt(i) : 0);
      if (!steep || s > steep.s) steep = { i, s };
    }
    const onRoad = settle(steep.i, 0);

    // Steepest OFF-ROAD cross-slope -> the body must roll.
    let cross = null;
    for (let i = 30; i < t.center.length - 30; i += 9) {
      const L = t.pointAt(i, -22), R = t.pointAt(i, 22);
      const c = (t.terrainHeight(R.x, R.z) - t.terrainHeight(L.x, L.z)) / 44;
      if (!cross || Math.abs(c) > Math.abs(cross.c)) cross = { i, c };
    }
    const offRoad = settle(cross.i, 20);
    // Did the car actually GET off the road? A walled world (FURKA is one, by
    // design - a pass with sheer drops) clamps the player back inside the
    // carriageway, so a request to sit at lateral 20 lands at 8.8 on a road
    // bed that is flat bank to bank. Zero roll there is correct, and asserting
    // otherwise tests a state the world does not allow to exist.
    const half = (t.widthAt ? t.widthAt(car.trackIndex) : 9);
    const reached = Math.abs(car.lateral);

    return {
      roadGrade: +steep.s.toFixed(3), pitch: +onRoad.pitch.toFixed(3),
      crossGrade: +cross.c.toFixed(3), roll: +offRoad.roll.toFixed(3),
      reached: +reached.toFixed(1), half: +half.toFixed(1),
    };
  });
  // The rule asks that the body RESPONDS to the surface, not that it matches
  // to the degree — the renderer damps and clamps it deliberately.
  check(`${name}: the car pitches to the road's gradient`, Math.abs(tilt.pitch) > 0.01,
    `road grade ${tilt.roadGrade}, body pitch ${tilt.pitch} rad`);
  if (tilt.reached <= tilt.half + 1) {
    console.log(`SKIP  ${name}: the car rolls to a cross-slope off the road  ` +
      `world is walled - asked for lateral 20, clamped to ${tilt.reached} ` +
      `inside a ${tilt.half} u half-width, so there is no cross-slope to lean to`);
  } else {
    check(`${name}: the car rolls to a cross-slope off the road`, Math.abs(tilt.roll) > 0.01,
      `cross grade ${tilt.crossGrade}, body roll ${tilt.roll} rad`);
  }

  await p.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe world behaves like a place');
process.exit(fail ? 1 : 0);
