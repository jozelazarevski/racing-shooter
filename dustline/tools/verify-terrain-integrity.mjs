/* IS THERE GROUND UNDER THE WHOLE OF EVERY ROAD — AND DOES ANY ROAD SHARE ITS
 * GROUND WITH ANOTHER STRETCH OF THE SAME LAP?
 *
 * WHAT THIS PREVENTS, IN THE WORDS OF THE PEOPLE IT HAPPENED TO.
 *
 * IGNITE RALLY, BUGS.md #7, RED CENTRE RUN: "There was a hole in the road."
 * An autopilot drove the car 7.43 u below the terrain, then 3.38 u on a later
 * run, and not at all on the one in between. It was not a physics glitch. A
 * jump gorge is a 190 u trench, and the collapse was applied to the road
 * WHEREVER THE TRENCH PASSED UNDER IT — on distance alone, with nothing tying
 * it to the crossing it was designed for. That lap met the trench twice, so it
 * got one designed jump with raised lips and a gap warning, and one bare
 * 21.75 u drop with nothing to read it by. Road surface -0.4, ground under its
 * own centreline -21.2. The owner's words for this family are "if I fall off a
 * cliff... it's doing nothing" and "is the car above the ground beneath it".
 *
 * The report's own conclusion is the reason this file exists:
 *
 *     "The audit could not have caught this, so the audit changed. Nothing
 *      stood in the lane, nothing was drawn wrong, every collider check
 *      passed — the floor simply was not there."
 *
 * Every check dustline already has looks at something else. `verify:track`
 * proves the format lost no coefficient. `verify:sdf` proves the road-distance
 * bake is bit-exact against its own oracle. `verify:worlds` proves nothing
 * moved since the last blessing — it would hash a hole in the road quite
 * happily and call it unchanged. `verify:physics` asks whether a collider
 * matches the thing you can see, for props. None of them walks the road and
 * asks whether there is ground under it.
 *
 * IGNITE RALLY, BUGS.md #3 and #10, and the field-stall dossier in
 * COORDINATION.md: routes crossing themselves at their own height. MOUNTAIN TO
 * SEA has 58 self-crossings within 4 u vertically; driven, the whole rival
 * field parked under its own deck and covered 0.18 of a lap in a minute. The
 * owner photographed the pile at OLIVE CROSSING and wrote "Bridge needs to be
 * raised higher". After a long fixed-step investigation the conclusion recorded
 * in COORDINATION.md is that leg separation at a waist is a ROUTE-AUTHORING
 * decision, not something a builder can patch: two generic rescues were
 * implemented, measured and reverted. So the only thing that can help is a
 * check that refuses the route.
 *
 * WHY THIS IS A STANDING CHECK AND NOT A BUG FIX. The signal in the complaint
 * record is the word "still" — "I can still enter the mountains", "Still can
 * enter", "I still don't see jumping across cracks". Those are not new bugs,
 * they are fixes that did not hold: repaired in one place and left live in
 * another, or repaired and later regressed, with nothing standing to catch
 * either. "I keep on debugging the game non stop for things that can be
 * obviously working." A fix with no gate behind it is a fix with a half-life.
 *
 * WHAT IT MEASURES, AND AGAINST WHAT.
 *
 * Two surfaces exist in a dustline world and they are built by different code:
 *
 *   THE GROUND — `terrain.ts` build(), a lattice of `heightAt` samples at
 *     `world.meshRes`, handed to three.js as the visible terrain AND to Rapier
 *     as the one and only trimesh collider. This is what the car stands on.
 *   THE PAINTED ROAD — the ribbon swept along the loop at `road.samples` x 7
 *     columns, each vertex at `heightAt(x,z) + lift + 0.1`. Visual only. This
 *     is what the player reads as "the road, this wide".
 *
 * Both derive from `heightAt`, at different resolutions, so they agree only
 * where `heightAt` is smooth at the coarser of the two. Where they disagree,
 * the player sees a road the car is not on — which is the same sentence as
 * "there was a hole in the road", said from inside the cockpit instead of from
 * the log.
 *
 * This tool RECONSTRUCTS both meshes from the shipped `Terrain` class (esbuild,
 * then the real evaluators — no reimplementation of the maths) and walks every
 * centreline sample out to the advertised half-width, both sides. Nothing is
 * sampled only at the centre: RED CENTRE RUN's hole was found by walking out
 * from the centreline, and v1's `tests/world-matrix.mjs` does exactly that.
 *
 * THE NUMBERS AND WHERE THEY COME FROM. Not one of them is a taste threshold:
 *
 *   WHEEL RAY = suspension.restLength + suspension.maxTravel + tire.wheelRadius
 *     read from `src/data/car.json`. It is `rayLen` in
 *     `physics/vehicleController.ts` — the exact length of the raycast each
 *     wheel casts downward. Ground further below than this is ground the wheel
 *     cannot find at all: no hit, no spring force, no contact. That is the
 *     dustline spelling of "the floor is not there".
 *   WHEEL DROOP = suspension.sagRatio * suspension.restLength, also from
 *     car.json — the extension left in a wheel that is resting. Ground more
 *     than this below where a wheel expects it has already unloaded that
 *     corner. Reported as a census, not used as a pass line, because a car can
 *     drive a road that is 30 cm out and cannot drive one that is a metre out.
 *   ROAD CLEARANCE = 2 * halfWidth + 4, copied from `validateTrack` in
 *     `trackDef.ts` so this gate and the editor's own validator cannot come to
 *     disagree about what "too close" means.
 *   LAP SEPARATION = 1/12 of the lap. v1's crossing census used "more than 40
 *     samples apart" on 480-sample laps (BUGS.md #3); this is that number
 *     written as a fraction so it survives a change of sample count.
 *   FIELD REACH = the SDF cell diagonal. `Terrain.sdf()` answers with the
 *     nearest-cell value, so the sample it names can be up to one cell diagonal
 *     away from the point that asked. Beyond that it is answering with a
 *     different piece of road.
 *
 * WHAT IT DOES NOT COVER, stated because a check that overclaims is worse than
 * no check:
 *   - It never drives. No car, no Rapier step, no AI. It is a geometry audit of
 *     a built world, which is why it runs in Node in seconds and can sit in the
 *     fast gate. A stall that is physical rather than geometric (COORDINATION's
 *     unresolved field-stall dossier) will not show up here.
 *   - It measures the road corridor only. Ground beyond `halfWidth + blend`,
 *     and the seating of scattered props on it, belong to `verify:physics`.
 *   - It reads the tracks that ship in `src/data/tracks/`. Tracks in
 *     localStorage or packed into a `?t=` link are not visible to it, and
 *     nothing else checks those either — see the loader finding it prints.
 *   - It asks whether the two surfaces AGREE, not whether either is drivable.
 *     A road that dives forty metres in three, with the paint and the ground
 *     agreeing all the way down, passes every check here. Grade, step and
 *     minimum corner radius are a drivability question and this gate does not
 *     ask it.
 *   - The crossing census compares the BAKED CENTRELINE against itself. Two
 *     stretches that stay a road-width apart but are joined by scenery, a wall
 *     or a prop are not its business.
 *   - Rapier's own trimesh is not queried; the collider surface is
 *     reconstructed from the same vertices and indices `build()` hands it. The
 *     reconstruction is pinned to the source below and self-checked at the
 *     lattice nodes, so it cannot silently drift from what the game builds.
 *
 *   cd dustline && node tools/verify-terrain-integrity.mjs
 */
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

// ---------------------------------------------------------------------------
// the shipped code, compiled and imported — not a copy of it
// ---------------------------------------------------------------------------
//
// `verify-track-format.mjs` set this pattern: esbuild the TypeScript into a
// module Node can import, then drive the real evaluators. A checking tool that
// reimplements the thing it checks is a tool that can agree with itself while
// both are wrong, which is the mistake BUGS.md #1 records eight times over.
const OUT = mkdtempSync(join(tmpdir(), 'dl-terrain-'));
for (const [src, dst] of [['src/tracks/terrain.ts', 'terrain.mjs'], ['src/tracks/trackDef.ts', 'trackDef.mjs']]) {
  const r = spawnSync('npx', ['esbuild', src, '--bundle', '--format=esm', '--platform=node',
    '--log-level=warning', `--outfile=${join(OUT, dst)}`], { encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) { console.error(`esbuild failed on ${src}`); process.exit(1); }
}
const { Terrain } = await import(join(OUT, 'terrain.mjs'));
const { validateTrack } = await import(join(OUT, 'trackDef.mjs'));

const TERRAIN_SRC = readFileSync('src/tracks/terrain.ts', 'utf8');
const REGISTRY_SRC = readFileSync('src/tracks/registry.ts', 'utf8');
const TRACKDEF_SRC = readFileSync('src/tracks/trackDef.ts', 'utf8');

// ---------------------------------------------------------------------------
// 0. the meshes this tool rebuilds are still the meshes the game builds
// ---------------------------------------------------------------------------
//
// Everything below reconstructs `build()`'s two meshes in order to measure
// them. That reconstruction is the one place this tool can go quietly wrong: if
// somebody re-lays the ground lattice or re-columns the ribbon, the measurement
// keeps producing confident numbers about a world that no longer exists. So the
// expressions are pinned to the source. A change to any of them fails HERE,
// with instructions, rather than being absorbed silently.
const PINS = [
  ['ground lattice x', 'const x = (gx / RES - 0.5) * SIZE;'],
  ['ground lattice z', 'const z = (gz / RES - 0.5) * SIZE;'],
  ['ground vertex height', 'verts[o + 1] = this.heightAt(x, z);'],
  ['ground triangulation', 'idx.push(a, d2, b, b, d2, e);'],
  ['the collider IS that lattice', 'ColliderDesc.trimesh(verts, new Uint32Array(idx))'],
  ['ribbon half-width', 'const H = def.road.halfWidth + 0.6;'],
  ['ribbon columns', 'const lats = [-(H + 1.7), -(H - 0.15), -H * 0.5, 0, H * 0.5, H - 0.15, H + 1.7];'],
  ['ribbon lifts', 'const lifts = [-0.3, 0.14, 0.2, 0.26, 0.2, 0.14, -0.3];'],
  ['ribbon vertex height', 'rVerts[o + 1] = this.heightAt(px, pz) + lifts[cIdx] + 0.1;'],
  ['ribbon normal', 'let nx = p2.z - p.z, nz = -(p2.x - p.x);'],
  ['corridor blend', 'const k = THREE.MathUtils.smoothstep(d, def.road.halfWidth, def.road.halfWidth + def.road.blend);'],
];
const drifted = PINS.filter(([, s]) => !TERRAIN_SRC.includes(s)).map(([n]) => n);
check(drifted.length === 0,
  'this tool still reconstructs the meshes terrain.ts actually builds',
  drifted.length ? `${drifted.join(', ')} changed in src/tracks/terrain.ts — the measurements below are `
    + 'about a world the game no longer builds. Update the reconstruction in this file to match, then re-run.'
    : `${PINS.length} expressions pinned`);
if (drifted.length) process.exit(1);

// ---------------------------------------------------------------------------
// budgets, every one of them read from the car or copied from the validator
// ---------------------------------------------------------------------------
const car = JSON.parse(readFileSync('src/data/car.json', 'utf8'));
const WHEEL_RAY = car.suspension.restLength + car.suspension.maxTravel + car.tire.wheelRadius;
const WHEEL_DROOP = car.suspension.sagRatio * car.suspension.restLength;
const LAP_SEPARATION = 1 / 12;              // v1's "40 samples apart" on a 480-sample lap
const RIBBON_LIFT_BASE = 0.1;               // terrain.ts, pinned above

console.log(`car ${JSON.stringify(car.name)}: wheel ray ${WHEEL_RAY.toFixed(3)} m `
  + `(restLength ${car.suspension.restLength} + maxTravel ${car.suspension.maxTravel} + wheelRadius ${car.tire.wheelRadius}), `
  + `resting droop ${WHEEL_DROOP.toFixed(3)} m (sagRatio ${car.suspension.sagRatio} x restLength)\n`);

// ---------------------------------------------------------------------------
// the tracks that ship — the same folder `registry.ts` globs
// ---------------------------------------------------------------------------
const DIR = 'src/data/tracks';
const files = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
const defs = files.map((f) => ({ file: f, def: JSON.parse(readFileSync(join(DIR, f), 'utf8')) }));
check(defs.length > 0, 'there are committed tracks to check', `${defs.length}: ${defs.map((d) => d.def.id).join(', ')}`);

// ---------------------------------------------------------------------------
// DECLARED FLOORLESS GROUND, AND WHY THERE IS NONE
// ---------------------------------------------------------------------------
//
// A jump over a gorge is SUPPOSED to have no floor, so a check that requires
// ground everywhere would eventually be loosened to let one through — and a
// tolerance wide enough for a gorge is wide enough for RED CENTRE RUN's hole.
// v1's fix was to except declared gorges BY DECLARATION. Schema 1 has no such
// declaration: `RoadProfile` has waves and crests, and a crest is a gaussian on
// a continuous surface, so every metre of every dustline road is supposed to be
// solid. These readers are the hook for the day that changes; they are
// UNEXERCISED — no committed track declares anything — and that is stated
// rather than left to look like coverage.
const declaredGaps = (def) => (Array.isArray(def.road.gaps) ? def.road.gaps : []);
const declaredCrossings = (def) => (Array.isArray(def.road.crossings) ? def.road.crossings : []);
const inSpan = (t, spans) => spans.some((g) => (g.from <= g.to
  ? t >= g.from && t <= g.to
  : t >= g.from || t <= g.to));
const totalDeclared = defs.reduce((a, d) => a + declaredGaps(d.def).length + declaredCrossings(d.def).length, 0);

// ---------------------------------------------------------------------------
// per-track measurement
// ---------------------------------------------------------------------------

/** The collider surface: the ground lattice, linearly interpolated inside the
 *  triangle the point falls in. `build()` writes the triangles as
 *  `idx.push(a, d2, b, b, d2, e)`, so the diagonal of every cell runs from
 *  (gx+1, gz) to (gx, gz+1) — the u + v = 1 line. Getting that backwards would
 *  put the measurement on the wrong triangle over half the world. */
function groundMesh(terrain, SIZE, RES) {
  const H = new Float64Array((RES + 1) * (RES + 1));
  for (let gz = 0; gz <= RES; gz++) {
    for (let gx = 0; gx <= RES; gx++) {
      const x = (gx / RES - 0.5) * SIZE;
      const z = (gz / RES - 0.5) * SIZE;
      H[gz * (RES + 1) + gx] = terrain.heightAt(x, z);
    }
  }
  return (x, z) => {
    const fx = (x / SIZE + 0.5) * RES, fz = (z / SIZE + 0.5) * RES;
    const gx = Math.max(0, Math.min(RES - 1, Math.floor(fx)));
    const gz = Math.max(0, Math.min(RES - 1, Math.floor(fz)));
    const u = fx - gx, v = fz - gz;
    const a = H[gz * (RES + 1) + gx], b = H[gz * (RES + 1) + gx + 1];
    const d = H[(gz + 1) * (RES + 1) + gx], e = H[(gz + 1) * (RES + 1) + gx + 1];
    if (u + v <= 1) return a + (b - a) * u + (d - a) * v;
    return e + (d - e) * (1 - u) + (b - e) * (1 - v);
  };
}

const LATERALS = 40;        // 41 stations across the full advertised width
const results = [];

for (const { file, def } of defs) {
  const terrain = new Terrain(def);
  const SIZE = def.world.size, RES = def.world.meshRes, hw = def.road.halfWidth;
  const ground = groundMesh(terrain, SIZE, RES);
  const pts = terrain.roadPoints, N = pts.length;
  const lapLen = pts.reduce((a, p, i) => a + Math.hypot(p.x - pts[(i + 1) % N].x, p.z - pts[(i + 1) % N].z), 0);
  const spacing = lapLen / N;

  // THE INTERPOLANT MUST BE THE SURFACE. At a lattice node the reconstruction
  // has no interpolating to do and must return `heightAt` exactly; if it does
  // not, the cell indexing is off by one and every number below is fiction.
  let nodeErr = 0;
  for (let k = 0; k < 400; k++) {
    const gx = 2 + ((k * 7) % (RES - 4)), gz = 2 + ((k * 13) % (RES - 4));
    const x = (gx / RES - 0.5) * SIZE, z = (gz / RES - 0.5) * SIZE;
    nodeErr = Math.max(nodeErr, Math.abs(ground(x, z) - terrain.heightAt(x, z)));
  }

  // the ribbon's own columns, exactly as build() lays them out
  const RH = hw + 0.6;
  const lats = [-(RH + 1.7), -(RH - 0.15), -RH * 0.5, 0, RH * 0.5, RH - 0.15, RH + 1.7];
  const lifts = [-0.3, 0.14, 0.2, 0.26, 0.2, 0.14, -0.3];

  const gaps = declaredGaps(def);
  let worstFloat = { v: -Infinity }, worstBury = { v: -Infinity };
  let worstReport = { v: -Infinity };           // |heightAt - ground|: what the game is told vs what is there
  let pastDroop = 0, pastRay = 0, stations = 0, exempt = 0;
  let flooded = 0, worstFlood = { v: -Infinity };
  const water = def.water ? def.water.level : null;

  for (let i = 0; i < N; i++) {
    const t = i / N;
    const p = pts[i], p2 = pts[(i + 1) % N];
    let nx = p2.z - p.z, nz = -(p2.x - p.x);
    const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    const skip = inSpan(t, gaps);
    // ribbon column heights at this station
    const vy = lats.map((l, c) => terrain.heightAt(p.x + nx * l, p.z + nz * l) + lifts[c] + RIBBON_LIFT_BASE);

    for (let k = 0; k <= LATERALS; k++) {
      const l = (k / LATERALS - 0.5) * 2 * hw;
      const x = p.x + nx * l, z = p.z + nz * l;
      stations++;
      if (skip) { exempt++; continue; }
      // the painted surface here, interpolated across the ribbon quad exactly
      // as the strip's triangles do along a station
      let c = 0; while (c < lats.length - 2 && lats[c + 1] < l) c++;
      const fr = (l - lats[c]) / (lats[c + 1] - lats[c]);
      const ribbon = vy[c] + (vy[c + 1] - vy[c]) * fr;
      const lift = lifts[c] + (lifts[c + 1] - lifts[c]) * fr + RIBBON_LIFT_BASE;
      const g = ground(x, z);
      const reported = terrain.heightAt(x, z);

      // FLOAT: the painted road standing clear of the ground under it. The
      // ribbon is DESIGNED to sit `lift` proud of the ground, so only the
      // excess over that counts as separation.
      const float = (ribbon - g) - lift;
      if (float > worstFloat.v) worstFloat = { v: float, i, l, ribbon, g, lift };
      if (-float > worstBury.v) worstBury = { v: -float, i, l, ribbon, g };
      if (Math.abs(float) > WHEEL_DROOP) pastDroop++;
      if (Math.abs(float) > WHEEL_RAY) pastRay++;

      const rep = Math.abs(reported - g);
      if (rep > worstReport.v) worstReport = { v: rep, i, l, reported, g };

      if (water !== null) {
        const depth = water - Math.min(ribbon, g);
        if (depth > 0) { flooded++; if (depth > worstFlood.v) worstFlood = { v: depth, i, l }; }
      }
    }
  }

  // ---- does any stretch of road answer for another? ----
  //
  // `heightAt` reads the road profile at the lap fraction the distance field
  // hands back, and that fraction is the nearest baked sample to the NEAREST
  // CELL CENTRE — so it can name a sample up to one cell diagonal away. Where
  // the lap does not approach itself, "one cell diagonal away in space" is also
  // "a few samples away along the lap" and the profile lands where it was
  // written. Where the lap DOES pass near itself, the nearest sample can belong
  // to a completely different stretch, and then that stretch's crest is applied
  // here — the same sentence as RED CENTRE RUN's, reached by a different road.
  const R = def.world.sdfRes;
  const cell = SIZE / (R - 1);
  const FIELD_REACH = cell * Math.SQRT2;
  const field = terrain.sdfField;
  const tAt = (x, z) => {
    const gx = Math.max(0, Math.min(R - 1, Math.round((x / SIZE + 0.5) * (R - 1))));
    const gz = Math.max(0, Math.min(R - 1, Math.round((z / SIZE + 0.5) * (R - 1))));
    return field.t[gz * R + gx];
  };
  let worstAlias = { m: -Infinity };
  for (let i = 0; i < N; i++) {
    const got = tAt(pts[i].x, pts[i].z);
    let d = Math.abs(got - i / N);
    if (d > 0.5) d = 1 - d;
    const m = d * lapLen;                       // how far along the lap the answer came from
    if (m > worstAlias.m) worstAlias = { m, i, own: i / N, got };
  }

  // ---- two stretches of lap on the same ground ----
  const clear = hw * 2 + 4;                     // the expression validateTrack uses
  const minSepSamples = Math.max(2, Math.round(N * LAP_SEPARATION));
  const crossings = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + minSepSamples; j < N; j++) {
      if (N - (j - i) < minSepSamples) continue;
      const a = pts[i], b = pts[j];
      const pd = Math.hypot(b.x - a.x, b.z - a.z);
      if (pd >= clear) continue;
      const dy = Math.abs(terrain.heightAt(a.x, a.z) - terrain.heightAt(b.x, b.z));
      crossings.push({ i, j, pd, dy });
    }
  }
  const declaredX = declaredCrossings(def);
  const undeclared = crossings.filter((c) => !declaredX.some((d) => Math.abs(d.a - c.i / N) < 0.02 && Math.abs(d.b - c.j / N) < 0.02));
  const worstX = undeclared.slice().sort((a, b) => a.pd - b.pd)[0] ?? null;

  results.push({
    file, def, id: def.id, name: def.name, hw, N, lapLen, spacing, cell, RES, SIZE,
    nodeErr, worstFloat, worstBury, worstReport, pastDroop, pastRay, stations, exempt,
    flooded, worstFlood, water, worstAlias, FIELD_REACH,
    crossings: crossings.length, undeclared: undeclared.length, worstX, clear, minSepSamples,
    issues: validateTrack(def),
  });
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

for (const r of results) {
  console.log(`\n--- ${r.name} (${r.file}) — lap ${r.lapLen.toFixed(0)} m over ${r.N} samples `
    + `(${r.spacing.toFixed(2)} m apart), advertised half-width ${r.hw} m, ground lattice ${(r.SIZE / r.RES).toFixed(2)} m, `
    + `distance field ${r.cell.toFixed(2)} m`);
  console.log(`    ${r.stations.toLocaleString()} stations walked across the full width`
    + (r.exempt ? `, ${r.exempt} inside a declared gap` : ''));

  check(r.nodeErr < 1e-9,
    `${r.id}: the reconstructed ground is the ground`,
    `worst |interpolant - heightAt| at a lattice node ${r.nodeErr.toExponential(2)} m`);

  // 1. THE FLOOR UNDER THE ADVERTISED WIDTH
  const sep = Math.max(r.worstFloat.v, r.worstBury.v);
  check(sep <= WHEEL_RAY,
    `${r.id}: there is ground under the whole advertised width`,
    `worst separation between the painted road and the ground under it ${sep.toFixed(3)} m `
    + `(${((sep / WHEEL_RAY) * 100).toFixed(0)}% of a ${WHEEL_RAY.toFixed(2)} m wheel ray) — `
    + `road floats ${r.worstFloat.v.toFixed(3)} m clear at sample ${r.worstFloat.i} lateral ${r.worstFloat.l.toFixed(2)} `
    + `(painted ${r.worstFloat.ribbon.toFixed(2)}, ground ${r.worstFloat.g.toFixed(2)}), `
    + `buried ${r.worstBury.v.toFixed(3)} m at sample ${r.worstBury.i} lateral ${r.worstBury.l.toFixed(2)}`
    + (sep > WHEEL_RAY
      ? `. A wheel set on the painted road there casts ${WHEEL_RAY.toFixed(2)} m and finds NOTHING. `
        + 'If this is the corridor edge rather than a designed feature, the cause is resolution, not authoring: '
        + '`Terrain.sdf()` answers with the value of the nearest CELL '
        + `(${r.cell.toFixed(2)} m here), so a lattice node genuinely inside the ${r.hw} m half-width can be told it is `
        + 'outside, be blended toward the hills, and drag the corridor edge down with it. Two remedies, both '
        + 'MEASURED WITH THIS TOOL on DUSTBOWL LOOP (worst separation 1.262 m as committed): bilinear interpolation '
        + 'of `d` in `sdf()` alone -> 0.953 m at no extra memory and no change of resolution; world.sdfRes 220 -> 330 '
        + '-> 0.801 m for a bake of 25 -> 45 ms. Both take every committed track green. Note it is NOT monotone in '
        + 'sdfRes — 440 measured 0.927 m, worse than 330 — because this is a sampling phase artifact, so re-measure '
        + 'rather than assume a bigger number is better; and sdfRes 880 costs 348 ms of bake against the editor\'s '
        + '~121 ms rebuild budget.'
      : ''));
  console.log(`    of ${r.stations.toLocaleString()} stations, ${r.pastDroop} are past the ${WHEEL_DROOP.toFixed(3)} m `
    + `a resting wheel can droop (${((r.pastDroop / r.stations) * 100).toFixed(2)}%), ${r.pastRay} past the wheel ray`);
  console.log(`    what the game is TOLD the ground is, vs what is there: worst ${r.worstReport.v.toFixed(3)} m `
    + `at sample ${r.worstReport.i} lateral ${r.worstReport.l.toFixed(2)} `
    + `(heightAt ${r.worstReport.reported.toFixed(2)}, mesh ${r.worstReport.g.toFixed(2)}) — `
    + 'heightAt is what seats every prop, bakes the AI line and places the grid');

  // 2. NO STRETCH OF ROAD WEARS ANOTHER STRETCH'S PROFILE
  check(r.worstAlias.m <= r.FIELD_REACH,
    `${r.id}: every stretch of road gets its own profile`,
    `the distance field answers each centreline sample with a lap fraction from at most `
    + `${r.worstAlias.m.toFixed(2)} m away along the lap (field reach is one cell diagonal, ${r.FIELD_REACH.toFixed(2)} m)`
    + (r.worstAlias.m > r.FIELD_REACH
      ? `. Sample ${r.worstAlias.i} (t=${r.worstAlias.own.toFixed(4)}) is being given t=${r.worstAlias.got.toFixed(4)}, `
        + 'so the crests and waves authored for THAT part of the lap are being applied HERE. This is exactly '
        + "v1's `_jumpCut`: a profile feature landing on a second stretch of the same lap on proximity alone."
      : ''));

  // 3. NO TWO STRETCHES OF LAP ON THE SAME GROUND
  check(r.undeclared === 0,
    `${r.id}: no two stretches of the lap share ground`,
    r.undeclared === 0
      ? `0 pairs at least ${r.minSepSamples} samples apart come within ${r.clear.toFixed(0)} m in plan`
      : `${r.undeclared} pairs of stretches at least ${r.minSepSamples} samples apart come within ${r.clear.toFixed(0)} m `
        + `in plan; closest is samples ${r.worstX.i} and ${r.worstX.j} at ${r.worstX.pd.toFixed(1)} m apart with `
        + `${r.worstX.dy.toFixed(2)} m of height between them. THE ENGINE HAS NO OVERPASS: heightAt(x, z) returns one `
        + 'height per plan position and the collider is a trimesh of it, so a crossing cannot be lifted — it is at '
        + 'grade by construction, whatever the sketch says. This is MOUNTAIN TO SEA (58 crossings within 4 u, the '
        + 'whole field parked under its own deck) and OLIVE CROSSING ("Bridge needs to be raised higher"). '
        + 'COORDINATION.md records two generic builder rescues tried and reverted: separate the legs in the ROUTE.');

  // 4. WATER
  if (r.water === null) {
    console.log('    no standing water on this track');
  } else {
    const warned = r.issues.some((i) => i.message.includes('water level'));
    check(r.flooded === 0,
      `${r.id}: the water does not stand on the road`,
      r.flooded === 0
        ? `level ${r.water}, road clear of it everywhere across the width`
        : `${r.flooded} stations of road are under the level ${r.water}, worst ${r.worstFlood.v.toFixed(2)} m deep at `
          + `sample ${r.worstFlood.i} lateral ${r.worstFlood.l.toFixed(2)}`);
    // Is the validator's own warning telling the truth about this track?
    check(!(r.flooded > 0 && !warned),
      `${r.id}: validateTrack sees the flooding this gate sees`,
      r.flooded > 0
        ? (warned ? 'both agree the lap is flooded' : 'THE VALIDATOR IS SILENT ON A FLOODED LAP. Its floor is '
          + '`waves.reduce((a, w) => a - Math.abs(w.amp), 0)` — the wave amplitudes only. Crests are not in that sum, '
          + 'so a crest with a negative height digs the road below the floor the validator believes in.')
        : (warned ? 'validator warns, measurement finds no flooding — conservative, its floor is a lower bound on the '
          + 'road profile rather than the profile\'s actual minimum' : 'neither finds flooding'));
  }
}

// ---------------------------------------------------------------------------
// what stops a bad track reaching the game — and what does not
// ---------------------------------------------------------------------------
//
// This section exists because of the specific question "can the check be
// bypassed by a track loaded from JSON rather than authored in the editor". It
// can, completely: `validateTrack` is imported by `editor/main.ts` alone, and
// `trackErrors` is consulted on exactly one loader path — the packed `?t=` link.
// A `.json` dropped into `src/data/tracks/` is globbed straight into `BUILT_IN`
// behind a filter that checks for the STRINGS 'id' and 'road' and nothing else.
// So for a shipped track this gate is not a second opinion; it is the only one.
const validatedPaths = /trackErrors\(def\)\.length \? null : def/.test(REGISTRY_SRC);
const builtInFilter = /'id' in t && 'road' in t/.test(REGISTRY_SRC);
console.log('\n--- what checks a track before the game builds it');
console.log(`    packed ?t= links run trackErrors: ${validatedPaths ? 'yes' : 'NO'}`);
console.log(`    built-in JSON is filtered on shape only ('id' in t && 'road' in t): ${builtInFilter ? 'yes' : 'no'}`);
console.log('    built-ins, ?track=<id> and localStorage tracks run no validation at all');

const errs = results.flatMap((r) => r.issues.filter((i) => i.level === 'error').map((i) => `${r.id}: ${i.message}`));
check(errs.length === 0,
  'no committed track carries a validateTrack error (nothing at runtime would stop one)',
  errs.slice(0, 3).join(' | '));

// The merge warning is the one validateTrack's own comment calls an error:
// "The engine has no overpass concept, so this is an error rather than a note."
// The code emits `level: 'warning'`, `trackErrors` filters warnings out, and the
// loader therefore accepts a track whose two runs of road occupy one another's
// ground. Until that severity matches its comment, this is the thing standing
// in for it — and it works on the SAMPLED centreline, where validateTrack only
// compares control points and so cannot see a spline that crosses between them.
const saysError = /so this is an error rather than a note/.test(TRACKDEF_SRC);
const isWarning = /message: `control points \$\{i\} and \$\{j\}/.test(TRACKDEF_SRC)
  && /level: 'warning',\n\s+at: j,/.test(TRACKDEF_SRC);
console.log(`\n    trackDef.ts's merge check: comment says error (${saysError}), code emits warning (${isWarning})`);
const merges = results.flatMap((r) => r.issues.filter((i) => i.message.includes('closer than a road width')).map((i) => `${r.id}: ${i.message}`));
check(merges.length === 0,
  'no committed track has control points closer than a road width',
  merges.length ? `${merges.slice(0, 2).join(' | ')} — emitted as a WARNING, so the loader accepts it` : 'checked against validateTrack itself');

console.log(`\n    declared floorless spans / declared crossings across all tracks: ${totalDeclared}`);
console.log('    schema 1 has no field for either, so the exemption readers in this file are UNEXERCISED:');
console.log('    every metre of every committed road is required to be solid, and every self-approach fails.');

console.log(fails
  ? `\n${fails} FAILED — a road here is not standing on the ground it advertises`
  : '\nevery committed road has ground under its whole width, wears its own profile, and shares it with nothing');
process.exit(fails ? 1 : 0);
