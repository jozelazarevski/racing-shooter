/* IS ANYTHING STANDING IN THE ROAD?
 *
 * This is v1's worst finding, and it is worth restating exactly, because the
 * shape of the mistake matters more than the count. `BUGS.md` #1: **211
 * colliders inside the advertised drivable lane across 29 of 57 worlds**, and
 * 1,884 objects inside the clearance the road promises. `BUGS.md` #4: dry stone
 * wall runs laid INSIDE the road width — a continuous barrier a metre inside
 * the edge. Two of the seven driving stalls in that report were a car parked
 * against a culvert parapet at lateral 0.1 m, in the middle of the lane.
 *
 * THE MISTAKE WAS MADE EIGHT TIMES IN ONE FILE. Each object was pushed to a
 * fixed lateral offset from ITS OWN centreline sample and never checked against
 * the REST of the centreline. On a bend the lap curls back under the offset, so
 * the object lands in a different stretch of road, at the same height, in the
 * racing line. v1's own code knew this — `_clearsRoad` existed, and three of
 * the eight bad call sites sat directly beneath a sibling that called it
 * correctly, with a comment explaining why.
 *
 * THAT IS WHY THIS CHECK MEASURES THE RESULT AND NOT THE RULE. Every one of
 * those eight sites was "correct" by its own local reasoning. The only question
 * that cannot be answered locally is the one asked here: given the world as it
 * was actually built, is there a solid thing inside the width the road
 * advertises. `tools/components-smoke.mjs` learned this the expensive way — its
 * first version restated the placement rule instead of reading the built world
 * and passed happily with the builder deliberately broken. So this loads every
 * committed track in the real engine, walks the REAL RAPIER COLLIDERS and the
 * REAL INSTANCE MATRICES out of the running game, and measures.
 *
 * WHAT "CLEAR" MEANS, AND WHY THOSE NUMBERS.
 *
 *   gap >= road.halfWidth + CAR_HALF
 *
 * `gap` is the distance from the road CENTRELINE to the nearest point of the
 * collider's footprint — the object's own radius is therefore already spent,
 * which is v1's `lateral >= widthAt + r + carRadius` written as one inequality.
 * `CAR_HALF` is the chassis half-width read out of `data/car.json`, not typed
 * here: a car whose CENTRE is anywhere on the advertised road, pointing along
 * it, sweeps to exactly half a car beyond the edge. So this is the literal
 * promise in RULES.md §3 — "the width the road advertises is always genuinely
 * free at racing speed" — and nothing more generous than it.
 *
 * TWO THINGS INSIDE THAT WIDTH ARE NOT OBSTACLES, and both are BUGS.md #3b,
 * which is the deepest thing in that report: v1's barrier test knew when a car
 * had CLEARED a wall and nothing about a car UNDERNEATH one, so a parapet on a
 * deck ten metres overhead was still a wall in the face of the car driving the
 * leg below it — one world went from 0.18 to 1.09 laps a minute when that was
 * fixed. The same reasoning cuts both ways, so height decides:
 *
 *   - a collider whose TOP is no higher than the road surface plus a kerb is a
 *     surface you drive OVER, not a thing you hit. That is the cattle grid:
 *     bars 0.09 m proud, flush with the lane on purpose.
 *   - a collider whose BOTTOM is above the top of the car is something you
 *     drive UNDER.
 *
 * Both bounds are derived from `data/car.json` below rather than chosen, and
 * both are REPORTED per track, so an exemption can never be silent.
 *
 * AND THE RULE IS CHECKED AS WELL AS THE RESULT — because the result is one
 * seed. Scatter is random: `world/build.ts` rejects a site when
 * `terrain.distToRoad(x, z) < layer.minRoadDist`, so a layer whose
 * `minRoadDist` is too small is AUTHORISED to drop a boulder in the lane and
 * simply has not yet. Reseed the track, or add one to the count, and it will.
 * The floor that rule must clear includes the road, a car, the component's own
 * radius at its largest scale, and the road-distance field's own error — which
 * is measured here rather than assumed, because `Terrain.sdf()` reads the
 * NEAREST GRID CELL of a field baked at `world.sdfRes`, and on a 900 m map at
 * 220 cells that is a 4.1 m cell whose corner is 2.9 m from its centre.
 *
 * THE CHECK IS PROVEN TO BE ABLE TO FAIL. Four synthetic controls are run
 * through the same classifier as the real colliders — a box on the centreline
 * at road height (must read IN THE ROAD), the same box 50 m out (must read
 * clear), a slab 0.05 m proud on the centreline (must read drive-over), and a
 * box 3 m up on the centreline (must read drive-under). A check that has never
 * been seen to fail is not known to work, and the drive-under branch is not
 * exercised by any committed track, so the control is the only thing standing
 * behind it.
 *
 * WHAT THIS DOES NOT COVER, stated plainly:
 *   - Only SOLID colliders. A component with no collider can still be drawn
 *     across the road and this will not say so; `verify-physics.mjs` is what
 *     keeps geometry and collider honest with each other.
 *   - Only the lane the road ADVERTISES. Run-off, the racing line and the AI's
 *     preferred path are not this file's business.
 *   - Only built-in tracks. A track in localStorage or in a `?t=` link is never
 *     seen here.
 *   - Nothing is driven. This is a static audit of a built world; a stall with
 *     no collider on record (BUGS.md #2's four unexplained ones) is invisible
 *     to it.
 *
 *   npx vite build          # the tool serves ../V2 itself
 *   node tools/verify-clearance.mjs
 *   node tools/verify-clearance.mjs --table    # every offender, worst first
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { ensureServer } from './serve.mjs';

const TABLE = process.argv.includes('--table');
const BASE = process.env.BASE || 'http://localhost:8907/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// ---- the car, from the car ---------------------------------------------------
//
// Every number below is derived from `data/car.json`, so retuning the car
// retunes the clearance instead of leaving a stale constant in a tool.
const car = JSON.parse(readFileSync('src/data/car.json', 'utf8'));
const { chassis, suspension: susp, tire } = car;

/** Half the chassis width. A car whose centre is on the advertised road, and
 *  pointing along it, reaches this far past the edge — so this is the whole of
 *  the margin the promise needs. (Turned broadside it would sweep to its half
 *  DIAGONAL, and that figure is reported but not required: a car sideways at
 *  the road edge has already left the racing line.) */
const CAR_HALF = chassis.halfExtents[0];
const CAR_DIAG = Math.hypot(chassis.halfExtents[0], chassis.halfExtents[2]);

/** Height of the chassis floor above the contact patch with the suspension
 *  FULLY COMPRESSED — mount at one wheel radius, chassis centre a mount offset
 *  above that, floor half a chassis below. Anything shorter than this cannot
 *  reach the body of the car even on a landing, and it is also about a kerb:
 *  a third of the 0.36 m wheel that has to roll over it. */
const STEP = tire.wheelRadius - susp.mounts[0][1] - chassis.halfExtents[1];

/** Height of the chassis roof above the contact patch with the suspension at
 *  FULL DROOP — the tallest the car ever is with its wheels on the ground.
 *  A collider whose underside is above this is something the car passes under,
 *  which is exactly the test v1's barrier code was missing (BUGS.md #3b). */
const CAR_TOP = susp.restLength + susp.maxTravel + tire.wheelRadius
  - susp.mounts[0][1] + chassis.halfExtents[1];

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

const stopServer = await ensureServer(BASE, '../V2');
const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 900, height: 600 } });

console.log(`car: half-width ${CAR_HALF} m (half-diagonal ${CAR_DIAG.toFixed(2)}), `
  + `drive-over step ${STEP.toFixed(2)} m, roof ${CAR_TOP.toFixed(2)} m — all from data/car.json\n`);

// ---- the library, from the editor -------------------------------------------
//
// Which components are solid, how big they get, and where their collider sits
// relative to their origin. Taken from the templates themselves because that is
// where the answer lives; `components-smoke.mjs` is what proves the declaration
// and the built world agree, and `verify-physics.mjs` proves the collider and
// the geometry agree. Used here for two things only: naming an offender, and
// working out the largest a scatter layer's component can get.
const edPage = await ctx.newPage();
const edErrors = [];
edPage.on('pageerror', (e) => edErrors.push(e.message.split('\n')[0]));
await edPage.goto(`${BASE}editor.html`, { waitUntil: 'load' });
await edPage.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 90000 });

const library = await edPage.evaluate(() => {
  const e = window.__editor;
  const out = {};
  for (const id of e.templateIds()) {
    const t = e.getTemplate(id);
    const [lo, hi] = t.authoring.scale;
    const solidAt = (s) => (typeof t.physics.solid === 'function' ? t.physics.solid(s) : t.physics.solid);
    const radAt = (s) => {
      const sh = t.physics.shape(s);
      if (sh.kind === 'none') return 0;
      // circumradius in plan: the largest a footprint can be at any yaw
      return sh.kind === 'box' ? Math.hypot(sh.halfExtents[0], sh.halfExtents[2]) : sh.radius;
    };
    out[id] = { scale: [lo, hi], solid: solidAt(lo) || solidAt(hi), rAt: { [lo]: radAt(lo), [hi]: radAt(hi) } };
  }
  return out;
});
const trackIds = await edPage.evaluate(() => window.__editor.builtInTracks().map((t) => t.id));
await edPage.close();

const solidTemplates = Object.entries(library).filter(([, v]) => v.solid).map(([k]) => k);
check(trackIds.length > 0 && solidTemplates.length > 0,
  'the roster and the library were read',
  `${trackIds.length} built-in tracks, ${solidTemplates.length} of ${Object.keys(library).length} components solid`);
check(edErrors.length === 0, 'no page errors reading the library', edErrors.slice(0, 3).join(' | '));

// ---- every track, in the real game ------------------------------------------
const summary = [];
for (const id of trackIds) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));
  await page.goto(`${BASE}index.html?track=${encodeURIComponent(id)}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__dust?.track, null, { timeout: 180000 });

  const r = await page.evaluate((args) => {
    const { CAR_HALF, STEP, CAR_TOP, library } = args;
    const d = window.__dust;
    const terrain = d.terrain;
    const def = d.track;
    const half = def.road.halfWidth;
    const NEED = half + CAR_HALF;

    // THE CENTRELINE THE ENGINE ITSELF BAKED. `Terrain` samples the track's
    // closed Catmull-Rom once and every road answer in the game — the surface,
    // the distance field, the lap fraction — comes off these points. Rebuilding
    // the curve here would be a second opinion about where the road is, which
    // is the one thing this check must not have.
    const pts = terrain.roadPts;
    if (!pts || !pts.length) return { fatal: 'terrain.roadPts is gone — this tool can no longer find the road' };
    const n = pts.length;
    const px = new Float64Array(n), pz = new Float64Array(n);
    for (let i = 0; i < n; i++) { px[i] = pts[i].x; pz[i] = pts[i].z; }

    // ---- plan geometry ------------------------------------------------------
    const segPoint = (qx, qz, i) => {
      const ax = px[i], az = pz[i], bx = px[(i + 1) % n], bz = pz[(i + 1) % n];
      const vx = bx - ax, vz = bz - az;
      const L = vx * vx + vz * vz;
      let s = L > 0 ? ((qx - ax) * vx + (qz - az) * vz) / L : 0;
      s = s < 0 ? 0 : s > 1 ? 1 : s;
      return { x: ax + vx * s, z: az + vz * s };
    };
    const distToCentreline = (qx, qz) => {
      let best = Infinity, at = 0;
      for (let i = 0; i < n; i++) {
        const c = segPoint(qx, qz, i);
        const dd = Math.hypot(qx - c.x, qz - c.z);
        if (dd < best) { best = dd; at = i; }
      }
      return { d: best, at };
    };
    const pointToRect = (qx, qz, hx, hz) => Math.hypot(Math.max(Math.abs(qx) - hx, 0), Math.max(Math.abs(qz) - hz, 0));
    const pointToSeg = (qx, qz, ax, az, bx, bz) => {
      const vx = bx - ax, vz = bz - az;
      const L = vx * vx + vz * vz;
      let s = L > 0 ? ((qx - ax) * vx + (qz - az) * vz) / L : 0;
      s = s < 0 ? 0 : s > 1 ? 1 : s;
      return Math.hypot(qx - (ax + vx * s), qz - (az + vz * s));
    };
    // Liang-Barsky: does the segment touch the axis-aligned rectangle at all?
    // Without this a road running straight THROUGH a building measures a
    // positive distance, because neither endpoint nor any corner is close.
    const segHitsRect = (ax, az, bx, bz, hx, hz) => {
      let t0 = 0, t1 = 1;
      const dx = bx - ax, dz = bz - az;
      const clip = (p, q) => {
        if (p === 0) return q >= 0;
        const t = q / p;
        if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
        return true;
      };
      return clip(-dx, ax + hx) && clip(dx, hx - ax) && clip(-dz, az + hz) && clip(dz, hz - az);
    };

    /** Distance from the centreline to the nearest point of a footprint.
     *  A disc spends its radius; a box is measured as the oriented rectangle it
     *  actually is, because a 16 m barn turned 45 degrees is not a circle. */
    const gapOf = (f) => {
      let best = Infinity, at = 0;
      if (f.kind === 'box') {
        const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          const d1x = px[i] - f.x, d1z = pz[i] - f.z, d2x = px[j] - f.x, d2z = pz[j] - f.z;
          const ax = d1x * c - d1z * s, az = d1x * s + d1z * c;
          const bx = d2x * c - d2z * s, bz = d2x * s + d2z * c;
          let g;
          if (segHitsRect(ax, az, bx, bz, f.hx, f.hz)) g = 0;
          else {
            g = Math.min(pointToRect(ax, az, f.hx, f.hz), pointToRect(bx, bz, f.hx, f.hz));
            for (const [kx, kz] of [[f.hx, f.hz], [f.hx, -f.hz], [-f.hx, f.hz], [-f.hx, -f.hz]]) {
              g = Math.min(g, pointToSeg(kx, kz, ax, az, bx, bz));
            }
          }
          if (g < best) { best = g; at = i; }
        }
      } else {
        for (let i = 0; i < n; i++) {
          const c = segPoint(f.x, f.z, i);
          const g = Math.max(0, Math.hypot(f.x - c.x, f.z - c.z) - f.rad);
          if (g < best) { best = g; at = i; }
        }
      }
      return { gap: best, at };
    };

    /** THE CLASSIFIER. One function, used for the real colliders and for the
     *  synthetic controls, so the controls prove the thing that runs. */
    const classify = (f) => {
      const { gap, at } = gapOf(f);
      if (gap >= NEED) return { verdict: 'clear', gap, at, roadY: null };
      // The reference height is the ROAD, at the point on the centreline
      // nearest this footprint — not the ground under the object, which in a
      // ditch is metres below the carriageway the promise is about.
      const c = segPoint(f.x, f.z, at);
      const roadY = terrain.heightAt(c.x, c.z);
      if (f.top <= roadY + STEP) return { verdict: 'over', gap, at, roadY };
      if (f.bot >= roadY + CAR_TOP) return { verdict: 'under', gap, at, roadY };
      return { verdict: 'in-road', gap, at, roadY };
    };

    // ---- the instances, read out of the built world -------------------------
    // Every component InstancedMesh is named "<template>:<part>" by
    // `world/build.ts` precisely so tools can find them. Only solid templates
    // are kept as naming candidates: 4,000 grass tufts are nearest to
    // everything and would put their name on a grandstand.
    let root = d.fx?.mesh;
    while (root && root.parent) root = root.parent;
    if (!root || !root.isScene) return { fatal: 'could not reach the scene graph from __dust' };
    const inst = [];
    let instTotal = 0;
    root.traverse((o) => {
      if (!o.isInstancedMesh || !o.name.includes(':')) return;
      const tpl = o.name.slice(0, o.name.indexOf(':'));
      const a = o.instanceMatrix.array;
      instTotal += o.count;
      if (!library[tpl]?.solid) return;
      for (let i = 0; i < o.count; i++) {
        const b = i * 16;
        inst.push({ tpl, x: a[b + 12], z: a[b + 14] });
      }
    });
    // which of them were put there BY HAND? `def.props` stores x/z to 0.1 m and
    // `build.ts` uses them verbatim, so the instance matrix carries them back.
    const placedKey = new Set((def.props ?? []).map((p) => `${p.template}|${p.x.toFixed(1)}|${p.z.toFixed(1)}`));
    for (const it of inst) it.placed = placedKey.has(`${it.tpl}|${it.x.toFixed(1)}|${it.z.toFixed(1)}`);

    // ---- the colliders, read out of the running physics world ---------------
    const rows = [];
    d.world.forEachCollider((c) => {
      const body = c.parent();
      if (!body || !body.isFixed()) return;          // the cars are dynamic
      const sh = c.shape;
      // The terrain is the one collider with its own vertex buffer. Named by
      // what it IS rather than by a ShapeType number, because components-smoke
      // guessed those numbers wrong once and silently dropped every ball.
      if (sh.vertices) return;
      const t = c.translation(), q = c.rotation();
      const yaw = Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
      let f;
      if (sh.halfExtents) {
        f = { kind: 'box', hx: sh.halfExtents.x, hz: sh.halfExtents.z, hy: sh.halfExtents.y };
      } else if (sh.halfHeight !== undefined) {
        f = { kind: 'cylinder', rad: sh.radius, hy: sh.halfHeight };
      } else {
        f = { kind: 'ball', rad: sh.radius, hy: sh.radius };
      }
      f.x = t.x; f.z = t.z; f.yaw = yaw; f.top = t.y + f.hy; f.bot = t.y - f.hy;
      const v = classify(f);
      let name = '?', nd = Infinity, placed = null;
      for (const it of inst) {
        const dd = Math.hypot(it.x - f.x, it.z - f.z);
        if (dd < nd) { nd = dd; name = it.tpl; placed = it.placed; }
      }
      rows.push({
        ...v, name, nd, placed,
        kind: f.kind, x: f.x, z: f.z, top: f.top, bot: f.bot,
        r: f.kind === 'box' ? Math.hypot(f.hx, f.hz) : f.rad,
      });
    });

    // ---- controls: prove the classifier can reach every verdict --------------
    const station = Math.floor(n * 0.37);
    const cx = px[station], cz = pz[station];
    const roadHere = terrain.heightAt(cx, cz);
    // 50 m out along the local normal is comfortably off any road
    let nx = pz[(station + 1) % n] - cz, nz = -(px[(station + 1) % n] - cx);
    const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    const box = (x, z, baseY, h) => ({
      kind: 'box', hx: 1, hz: 1, hy: h / 2, yaw: 0.3, x, z, top: baseY + h, bot: baseY,
    });
    const controls = {
      inRoad: classify(box(cx, cz, roadHere, 1.5)).verdict,
      clear: classify(box(cx + nx * 50, cz + nz * 50, roadHere, 1.5)).verdict,
      over: classify(box(cx, cz, roadHere - 0.5, 0.55)).verdict,          // top 0.05 proud
      under: classify(box(cx, cz, roadHere + 3, 1.5)).verdict,
    };
    // and the ruler itself, in two legs.
    //
    // EXACT LEG: a centreline sample is on the centreline, so it must measure
    // zero. Nothing about the road's shape can excuse a non-zero answer here,
    // so this one is checked to the millimetre.
    //
    // LATERAL LEG: a point pushed `half` metres along the NORMAL OF ONE SEGMENT
    // should measure `half` — except that the road curls, so on the inside of a
    // bend another stretch of the same lap is a little nearer, and the reading
    // comes back slightly SHORT. That is not instrument error: it is the exact
    // effect this whole file exists to catch, in miniature. So the reading is
    // required to be at most `half` (over-reading would be a real fault) and no
    // more than CURL below it.
    let rulerZero = 0, rulerCurl = 0, rulerOver = 0;
    for (let k = 0; k < 24; k++) {
      const i = Math.floor((k / 24) * n);
      rulerZero = Math.max(rulerZero, distToCentreline(px[i], pz[i]).d);
      let ux = pz[(i + 1) % n] - pz[i], uz = -(px[(i + 1) % n] - px[i]);
      const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
      const q = distToCentreline(px[i] + ux * half, pz[i] + uz * half);
      rulerCurl = Math.max(rulerCurl, half - q.d);
      rulerOver = Math.max(rulerOver, q.d - half);
    }

    // ---- how wrong can the field the placement rule consults be? ------------
    // `Terrain.sdf()` rounds to the nearest cell of a field baked at
    // world.sdfRes and returns that cell's distance-to-nearest-ROAD-SAMPLE.
    // Both steps can only make the answer LOOK BIGGER than the truth, which is
    // the dangerous direction: scatter accepts a site it should have rejected.
    // Measured at the worst-case query point of every near-road cell — the cell
    // corner, half a cell away in each axis — so this is deterministic and is
    // the worst case by construction, not by sampling luck.
    const S = def.world.size, R = def.world.sdfRes;
    const cell = S / (R - 1);
    let overReport = 0, overAt = null;
    for (let gz = 0; gz < R - 1; gz++) {
      for (let gx = 0; gx < R - 1; gx++) {
        const qx = (gx / (R - 1) - 0.5) * S + cell / 2;
        const qz = (gz / (R - 1) - 0.5) * S + cell / 2;
        if (terrain.distToRoad(qx, qz) > 60) continue;          // only near the road matters
        const exact = distToCentreline(qx, qz).d;
        const o = terrain.distToRoad(qx, qz) - exact;
        if (o > overReport) { overReport = o; overAt = { x: +qx.toFixed(1), z: +qz.toFixed(1), exact: +exact.toFixed(2) }; }
      }
    }

    // ---- the authoring floor every scatter layer must clear -----------------
    const layers = def.scenery.map((l) => {
      const tpl = library[l.template];
      if (!tpl || !tpl.solid) return { tpl: l.template, solid: false, minRoadDist: l.minRoadDist };
      const hi = (l.scale ?? tpl.scale)[1];
      // footprint radius scales with the instance scale, so the template's own
      // radius at its own top scale carries to whatever the layer asks for
      const perScale = Math.max(...Object.entries(tpl.rAt).map(([s, r]) => r / Number(s)));
      const rMax = perScale * hi;
      const floor = half + CAR_HALF + rMax + overReport;
      return { tpl: l.template, solid: true, minRoadDist: l.minRoadDist, rMax, floor, slack: l.minRoadDist - floor };
    });

    rows.sort((a, b) => a.gap - b.gap);
    return {
      id: def.id, half, samples: def.road.samples, roadPts: n,
      sdfRes: R, cell, overReport, overAt, rulerZero, rulerCurl, rulerOver, controls,
      solids: rows.length, instTotal, instSolid: inst.length,
      inRoad: rows.filter((x) => x.verdict === 'in-road'),
      over: rows.filter((x) => x.verdict === 'over'),
      under: rows.filter((x) => x.verdict === 'under'),
      worstClear: rows.find((x) => x.verdict === 'clear')?.gap ?? null,
      layers,
    };
  }, { CAR_HALF, STEP, CAR_TOP, library });

  await page.close();

  if (r.fatal) {
    check(false, `${id}: the world could be read`, r.fatal);
    summary.push({ id, fatal: r.fatal });
    continue;
  }
  console.log(`\n--- ${r.id} — half-width ${r.half} m, needs ${(r.half + CAR_HALF).toFixed(2)} m of clearance; `
    + `${r.solids} solid colliders, ${r.instSolid} solid instances of ${r.instTotal} drawn`);

  // 1. THE INSTRUMENT. Everything below is a distance, so the distance has to
  //    be right before any of it means anything.
  // CURL is the only slack allowed, and 0.10 m is a tenth of the car-width
  // margin the verdict turns on — small enough that no verdict can turn on it,
  // and large enough to cover the road curling under its own normal.
  const CURL = 0.10;
  check(r.roadPts === r.samples && r.rulerZero < 0.001 && r.rulerOver < 0.001 && r.rulerCurl < CURL,
    `${r.id}: the ruler agrees with the road`,
    `${r.roadPts} centreline samples (def says ${r.samples}); a sample measures `
    + `${(r.rulerZero * 1000).toFixed(2)} mm from the centreline; a point ${r.half} m along the normal `
    + `reads ${(r.rulerCurl * 1000).toFixed(1)} mm short (the lap curling back, allowed ${CURL * 1000} mm) `
    + `and ${(r.rulerOver * 1000).toFixed(1)} mm long`);

  // 2. THE POSITIVE CONTROL. A check nobody has watched fail is not a check.
  const c = r.controls;
  check(c.inRoad === 'in-road' && c.clear === 'clear' && c.over === 'over' && c.under === 'under',
    `${r.id}: the classifier reaches every verdict on synthetic controls`,
    `on-centreline=${c.inRoad} 50m-out=${c.clear} 0.05m-proud=${c.over} 3m-up=${c.under}`);

  // 3. THE FINDING ITSELF.
  const named = (x) => `${x.name}${x.placed ? ' [placed]' : ' [scattered]'}`
    + `${x.nd > 2 ? `?~${x.nd.toFixed(1)}m` : ''} at (${x.x.toFixed(0)}, ${x.z.toFixed(0)}) `
    + `gap ${x.gap.toFixed(2)} m, ${(x.top - x.bot).toFixed(1)} m tall`;
  check(r.solids > 0 && r.instSolid > 0,
    `${r.id}: there was something to measure`, `${r.solids} colliders, ${r.instSolid} instances`);
  // The emptiness guard is repeated inside this check on purpose: a world with
  // no colliders in it must never be able to print a green "nothing stands in
  // the road". That sentence is the whole product of this file, and it has to
  // be false when nothing was looked at.
  check(r.inRoad.length === 0 && r.solids > 0,
    `${r.id}: nothing solid stands in the advertised lane`,
    r.solids === 0 ? 'NOTHING WAS MEASURED — this world built no component colliders at all'
      : r.inRoad.length
        ? `${r.inRoad.length} inside ${(r.half + CAR_HALF).toFixed(2)} m — ${r.inRoad.slice(0, 4).map(named).join('; ')}`
        + (r.inRoad.length > 4 ? ` (+${r.inRoad.length - 4} more, --table for all)` : '')
        : `closest solid thing is ${r.worstClear === null ? 'n/a' : `${r.worstClear.toFixed(2)} m`} from the centreline`);

  // 4. THE EXEMPTIONS, OUT LOUD. Anything let through on height is listed, so
  //    "it is flush with the road" is a claim on the record rather than silence.
  const exempt = [...r.over.map((x) => `${x.name} (over, ${(x.top - x.roadY).toFixed(2)} m proud)`),
    ...r.under.map((x) => `${x.name} (under, ${(x.bot - x.roadY).toFixed(2)} m up)`)];
  console.log(`      ${exempt.length} exempted on height${exempt.length ? `: ${exempt.join(', ')}` : ''}`);

  // 5. THE RULE, NOT JUST THIS SEED.
  const tight = r.layers.filter((l) => l.solid && l.slack < 0);
  check(tight.length === 0,
    `${r.id}: every scatter layer's minRoadDist would keep its component out of the lane at ANY seed`,
    tight.length
      ? tight.map((l) => `${l.tpl} minRoadDist ${l.minRoadDist} < ${l.floor.toFixed(2)} `
        + `(= ${r.half} road + ${CAR_HALF} car + ${l.rMax.toFixed(2)} its own radius + ${r.overReport.toFixed(2)} field error)`).join('; ')
      : `${r.layers.filter((l) => l.solid).length} solid layers, thinnest margin `
        + `${Math.min(...r.layers.filter((l) => l.solid).map((l) => l.slack)).toFixed(2)} m`);
  console.log(`      road-distance field: ${r.sdfRes}² over ${(r.cell).toFixed(2)} m cells, over-reports by up to `
    + `${r.overReport.toFixed(2)} m${r.overAt ? ` (at ${r.overAt.x}, ${r.overAt.z}, truly ${r.overAt.exact} m out)` : ''}`);

  check(errors.length === 0, `${r.id}: no page errors while measuring`, errors.slice(0, 3).join(' | '));

  if (TABLE) {
    for (const x of [...r.inRoad, ...r.over, ...r.under]) {
      console.log(`      ${x.verdict.padEnd(8)} gap ${x.gap.toFixed(2).padStart(6)}  ${x.kind.padEnd(8)} `
        + `r ${x.r.toFixed(2).padStart(5)}  y ${x.bot.toFixed(2)}..${x.top.toFixed(2)} road ${x.roadY?.toFixed(2)}  ${named(x)}`);
    }
  }
  summary.push(r);
}

const totalIn = summary.reduce((a, s) => a + (s.inRoad?.length ?? 0), 0);
const sideways = summary.reduce((a, s) => a + (s.inRoad ?? []).concat(s.over ?? [], s.under ?? []).length, 0);
console.log(`\n${summary.length} tracks, ${totalIn} solid colliders inside the lane the road advertises, `
  + `${sideways - totalIn} let through on height.`);
console.log(`(For reference only, not required: a car turned broadside sweeps to ${CAR_DIAG.toFixed(2)} m, `
  + 'so a clearance between that and half a car is legal here and still reachable by a spinning car.)');

await browser.close();
await stopServer();
console.log(fails ? `\n${fails} FAILED` : '\nnothing is standing in the road');
process.exit(fails ? 1 : 0);
