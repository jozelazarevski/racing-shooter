/* Generates `src/data/tracks/harbour.json`.
 *
 * The coastal track: a circuit that runs along a shoreline, with a working
 * harbour village on the west shore — quay, jetties, moored boats, houses, a
 * church, a lighthouse on the headland.
 *
 * WHY THIS IS GENERATED. Two reasons, and both are about things that MOVE:
 *
 *   1. The road. Trackside furniture is placed as "12 m left of the racing line
 *      at 34% of a lap", not as coordinates, so it survives the road changing.
 *      Same as the proving ground.
 *   2. The SHORELINE. A track's water is one number and the coast is wherever
 *      the land crosses it, so the shore moves whenever an octave, a ramp or
 *      the level changes. Everything in the village is placed relative to the
 *      shoreline found by marching outwards from dry land — not typed in.
 *
 * The land height here is recomputed from the same octave and ramp definitions
 * the engine uses. That duplication is real, and it is checked rather than
 * trusted: `tools/components-smoke.mjs` loads this track in the actual game and
 * asserts every moored boat is over water at least as deep as its own template
 * demands. If this file and the engine ever disagree, that check fails.
 *
 *   node tools/make-harbour.mjs
 *
 * NOTHING IT PLACES MAY STAND IN THE ROAD, and that is checked here rather than
 * assumed — see "THE GLOBAL CHECK" below. It matters more on this track than on
 * any other, because the village is laid out from the SHORELINE and the circuit
 * runs down the same shore: two independent frames of reference converging on
 * the same strip of land, with nothing until now comparing them. The generator
 * writes no file at all if it fails.
 */
import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import * as THREE from 'three';
import * as esbuild from 'esbuild';

const SAMPLES = 480;
const WATER = -7;
/** Named because the placement code below has to know how wide the road it is
 *  placing beside actually is. It went into `road.halfWidth` as a literal, and a
 *  hay-bale line tapered to 4.9 m off the centreline of a road whose edge is at
 *  7 — a number nothing in this file was in a position to notice. */
const HALF_WIDTH = 7;

// ---- the land ---------------------------------------------------------------
// A coast to the west and a bay to the south, both made by ramps with a
// NEGATIVE slope: the sea is not a shape, it is the land going below the line.
const octaves = [
  { kind: 'product', amp: 6.0, freqX: 0.0085, phaseX: 2.4, fnX: 'sin', freqZ: 0.0095, phaseZ: 0.9, fnZ: 'cos' },
  { kind: 'product', amp: 2.6, freqX: 0.021, phaseX: 0.3, fnX: 'sin', freqZ: 0.024, phaseZ: 1.6, fnZ: 'sin' },
  { kind: 'wave', amp: 1.2, fx: 0.038, fz: 0.045, phase: 2.0 },
];
const ramps = [
  { axis: 'x', beyond: -195, dir: 'lt', slope: -0.155, max: -42 },   // the sea, west
  { axis: 'z', beyond: 250, dir: 'gt', slope: -0.13, max: -30 },     // the bay, south
  { axis: 'x', beyond: 175, dir: 'gt', slope: 0.085, max: 22 },      // hills, east
];

const octaveAt = (o, x, z) => {
  if (o.kind === 'wave') return Math.sin(x * o.fx + z * o.fz + o.phase) * o.amp;
  const fx = o.fnX === 'sin' ? Math.sin : Math.cos;
  const fz = o.fnZ === 'sin' ? Math.sin : Math.cos;
  return fx(x * o.freqX + o.phaseX) * fz(z * o.freqZ + o.phaseZ) * o.amp;
};
const rampAt = (r, x, z) => {
  const v = r.axis === 'x' ? x : z;
  const past = r.dir === 'lt' ? r.beyond - v : v - r.beyond;
  if (past <= 0) return 0;
  const rise = past * r.slope;
  return r.slope < 0 ? Math.max(r.max, rise) : Math.min(r.max, rise);
};
/** Open-country height, before the road is carved in. Away from the road —
 *  which is where the whole village is — this IS the ground. */
const land = (x, z) => octaves.reduce((a, o) => a + octaveAt(o, x, z), 0)
  + ramps.reduce((a, r) => a + rampAt(r, x, z), 0);

const depth = (x, z) => Math.max(0, WATER - land(x, z));

/** March west from dry land to find where the coast crosses the water line. */
function shoreX(z, from = -120) {
  let x = from;
  while (x > -440 && land(x, z) > WATER) x -= 1;
  return x;
}

/** March INLAND from the shore until the ground is `above` metres clear of the
 *  water. A quay wall does not stand at the waterline — it stands at the top of
 *  the bank it retains, with its face going down into the water. Placed at the
 *  shoreline itself the first cut showed 46 cm of coping above the sea and read
 *  as nothing at all. */
function bankX(z, above) {
  let x = shoreX(z);
  while (x < -80 && land(x, z) < WATER + above) x += 1;
  return x;
}

/** March seaward from the shore until the water is at least `want` deep.
 *  Returns null rather than guessing if the bed never gets there — a boat
 *  reported as beached is worth more than a boat quietly placed on a rock. */
function moorAt(z, want, maxOut = 130) {
  const s = shoreX(z);
  for (let d = 3; d < maxOut; d += 1) {
    if (depth(s - d, z) >= want) return { x: Math.round((s - d) * 10) / 10, z, shore: s };
  }
  return null;
}

// ---- the circuit ------------------------------------------------------------
// Runs down the coast on the west side, climbs into the hills on the east.
const points = [
  [-30, -260], [110, -252], [225, -196], [278, -92], [268, 20],
  [212, 118], [110, 186], [-20, 214], [-128, 186], [-186, 96],
  [-198, -18], [-176, -130], [-110, -226],
];

const curve = new THREE.CatmullRomCurve3(
  points.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal',
);
const pts = [];
for (let i = 0; i < SAMPLES; i++) pts.push(curve.getPoint(i / SAMPLES));

function beside(t, lat) {
  const i = Math.round(t * SAMPLES) % SAMPLES;
  const p = pts[i];
  const n = pts[(i + 1) % SAMPLES];
  const dx = n.x - p.x, dz = n.z - p.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: p.x + (dz / len) * lat, z: p.z - (dx / len) * lat, heading: Math.atan2(dx, dz) };
}

const props = [];
const r3 = (v) => Math.round(v * 1000) / 1000;
const r1 = (v) => Math.round(v * 10) / 10;
/** One prop, beside the racing line, rounded exactly as it will be stored — so
 *  anything that measures it here measures the numbers that get written. */
const propBeside = (template, t, lat, opts = {}) => {
  const { x, z, heading } = beside(t, lat);
  return { template, x: r1(x), z: r1(z), rot: r3((opts.rot ?? heading) + (opts.turn ?? 0)), scale: opts.scale ?? 1 };
};
const put = (template, t, lat, opts = {}) => { props.push(propBeside(template, t, lat, opts)); };
const putAt = (template, x, z, rot = 0, scale = 1, yOffset = 0) => {
  const p = { template, x: r1(x), z: r1(z), rot: r3(rot), scale };
  if (yOffset) p.yOffset = yOffset;
  props.push(p);
};

// ---- THE GLOBAL CHECK: IS ANYTHING I AM PLACING STANDING IN THE ROAD? --------
//
// v1's `BUGS.md` #1 was 211 solid colliders inside the advertised lane across 29
// of 57 worlds. The count is not the useful part; the SHAPE of the mistake is,
// because it is why there were 211 and not one. Every object was placed against
// a frame of reference that was locally correct — its own centreline sample, in
// v1's case — and never checked against the REST of the lap. On a bend the lap
// curls back under the offset and the object lands in a different stretch of
// road, at the same height, in the racing line.
//
// THIS TRACK MAKES THE SAME MISTAKE A DIFFERENT WAY, which is the useful thing
// to notice about it: the village is not laid out against the road at all. It is
// laid out against the SHORELINE, marched out from dry land, and the circuit
// happens to run down that same shore. `shoreX(24) + 52` is a perfectly sound
// statement about the coast that put a 16 m church 0.22 m from the centreline.
// The farm is worse and simpler — typed-in coordinates that landed on the
// carriageway. Neither is wrong by its own local reasoning; the question that
// catches both cannot be asked locally at all:
//
//    GIVEN THE WHOLE LAP, is any solid thing this file places inside the width
//    the road advertises?
//
// The engine already asks it of SCATTER — `world/build.ts` rejects a site whose
// `terrain.distToRoad(x, z)` is under the layer's `minRoadDist`, off a
// road-distance field baked across the whole map. HAND PLACEMENT went through no
// such gate, here or in the engine.
//
// This is the RULE, checked at the point the mistake is made. `verify-clearance`
// is the RESULT: it loads the built track in the real engine and measures the
// real Rapier colliders. Where the two ever disagree the tool is right, because
// it is reading the world that shipped.

/** Every component template, compiled out of `src/world/props/*.ts`.
 *
 *  Solidity and collider size are NOT restated here. A table of radii in a tool
 *  is a stale number waiting to happen, and it would be a second opinion about a
 *  fact that already has one home — the component file, which `COMPONENTS.md`
 *  and `verify:physics` both treat as the authority. The components are
 *  TypeScript, so esbuild compiles them; it is installed wherever this repo
 *  builds, because vite depends on it. Only `physics` is read — `build()` is
 *  never called, so no geometry, material or texture is constructed. */
async function componentLibrary() {
  // `registry.ts` discovers components with `import.meta.glob`, which is vite's
  // and not node's, so the folder is re-read the same way it is read there. The
  // folder is the roster in both places; there is no list to forget to update.
  const files = readdirSync('src/world/props')
    .filter((f) => f.endsWith('.ts') && !['types.ts', 'registry.ts', 'thumbnail.ts'].includes(f));
  const entry = `${files.map((f, i) => `import t${i} from './src/world/props/${f.slice(0, -3)}';`).join('\n')}
export default [${files.map((_, i) => `t${i}`).join(', ')}];`;
  const bundled = await esbuild.build({
    stdin: { contents: entry, resolveDir: process.cwd(), sourcefile: 'library.ts', loader: 'ts' },
    bundle: true, format: 'esm', write: false, platform: 'node',
  });
  const mod = await import(
    `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`,
  );
  const lib = new Map(mod.default.filter((t) => t?.id && t?.physics).map((t) => [t.id, t]));
  if (lib.size !== files.length) {
    throw new Error(`read ${lib.size} components from ${files.length} files in src/world/props`);
  }
  return lib;
}
const LIBRARY = await componentLibrary();

// ---- what "clear" means, and where every number in it comes from -------------
// Derived from `data/car.json` exactly as `tools/verify-clearance.mjs` derives
// them, so retuning the car retunes this and there is no constant here to go
// stale.
const car = JSON.parse(readFileSync('src/data/car.json', 'utf8'));
/** Half the chassis width. A car whose centre is anywhere on the advertised
 *  road, pointing along it, sweeps to exactly this far past the edge. */
const CAR_HALF = car.chassis.halfExtents[0];
/** Chassis floor above the contact patch with the suspension FULLY COMPRESSED:
 *  the tallest thing the car cannot touch. The cattle grid lives under it. */
const STEP = car.tire.wheelRadius - car.suspension.mounts[0][1] - car.chassis.halfExtents[1];
/** Chassis roof above the contact patch at FULL DROOP: the lowest thing the car
 *  can pass beneath. */
const CAR_TOP = car.suspension.restLength + car.suspension.maxTravel + car.tire.wheelRadius
  - car.suspension.mounts[0][1] + car.chassis.halfExtents[1];
/** The promise, in one number: the width the road advertises plus half a car. */
const LANE = HALF_WIDTH + CAR_HALF;

/** A prop's collider footprint in plan, in world space — the same transform
 *  `world/build.ts:addCollider` applies, including the local `centerX`/`centerZ`
 *  offset turned into the instance's frame, because a component that runs OUT
 *  from its origin carries its hitbox with it when it is rotated. Returns null
 *  for anything with no collider: dressing cannot stand in the road. */
function footprintOf(p) {
  const tpl = LIBRARY.get(p.template);
  if (!tpl) throw new Error(`${p.template} is not a component in src/world/props`);
  const rule = tpl.physics;
  const solid = typeof rule.solid === 'function' ? rule.solid(p.scale) : rule.solid;
  const shape = rule.shape(p.scale);
  if (!solid || shape.kind === 'none') return null;
  const ox = shape.centerX ?? 0, oz = shape.centerZ ?? 0;
  const cs = Math.cos(p.rot), sn = Math.sin(p.rot);
  const half = shape.kind === 'box' ? shape.halfExtents[1]
    : shape.kind === 'ball' ? shape.radius : shape.halfHeight;
  // `top` and `bot` are heights above the component's OWN BASE, which is the
  // ground it stands on — or, for a floating one, its waterline.
  const f = {
    x: p.x + ox * cs + oz * sn,
    z: p.z - ox * sn + oz * cs,
    top: shape.centerY + half,
    bot: shape.centerY - half,
  };
  return shape.kind === 'box'
    ? { ...f, kind: 'box', hx: shape.halfExtents[0], hz: shape.halfExtents[2], yaw: p.rot }
    : { ...f, kind: 'disc', rad: shape.radius };
}

const pointToRect = (qx, qz, hx, hz) => Math.hypot(Math.max(Math.abs(qx) - hx, 0), Math.max(Math.abs(qz) - hz, 0));
const pointToSeg = (qx, qz, ax, az, bx, bz) => {
  const vx = bx - ax, vz = bz - az;
  const L = vx * vx + vz * vz;
  let s = L > 0 ? ((qx - ax) * vx + (qz - az) * vz) / L : 0;
  s = s < 0 ? 0 : s > 1 ? 1 : s;
  return Math.hypot(qx - (ax + vx * s), qz - (az + vz * s));
};
// Liang-Barsky. Without it a road running straight THROUGH a building measures a
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

/** Distance from the road CENTRELINE to the nearest point of a footprint,
 *  measured against EVERY segment of the lap — never against the sample the
 *  offset was taken from. A disc spends its radius; a box is measured as the
 *  oriented rectangle it actually is, because a church turned side-on is not a
 *  circle. This is the measurement `verify-clearance.mjs` makes on the built
 *  world, made here on the numbers about to be written. */
function laneGap(f) {
  let best = Infinity;
  for (let i = 0; i < SAMPLES; i++) {
    const a = pts[i], b = pts[(i + 1) % SAMPLES];
    let g;
    if (f.kind === 'box') {
      const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
      const d1x = a.x - f.x, d1z = a.z - f.z, d2x = b.x - f.x, d2z = b.z - f.z;
      const ax = d1x * c - d1z * s, az = d1x * s + d1z * c;
      const bx = d2x * c - d2z * s, bz = d2x * s + d2z * c;
      if (segHitsRect(ax, az, bx, bz, f.hx, f.hz)) g = 0;
      else {
        g = Math.min(pointToRect(ax, az, f.hx, f.hz), pointToRect(bx, bz, f.hx, f.hz));
        for (const [kx, kz] of [[f.hx, f.hz], [f.hx, -f.hz], [-f.hx, f.hz], [-f.hx, -f.hz]]) {
          g = Math.min(g, pointToSeg(kx, kz, ax, az, bx, bz));
        }
      }
    } else {
      g = Math.max(0, pointToSeg(f.x, f.z, a.x, a.z, b.x, b.z) - f.rad);
    }
    if (g < best) best = g;
  }
  return best;
}

/** Distance from the centreline to a bare POINT, for the things that have no
 *  collider to measure. Nothing in the lane check turns on this — dressing
 *  cannot stop a car — but a fence post standing on the centreline is still
 *  drawn through the windscreen, and the two runs below are reported with it. */
function pointGap(x, z) {
  let best = Infinity;
  for (let i = 0; i < SAMPLES; i++) {
    const a = pts[i], b = pts[(i + 1) % SAMPLES];
    best = Math.min(best, pointToSeg(x, z, a.x, a.z, b.x, b.z));
  }
  return best;
}

/** How much clear air to leave beyond the promise when something is put at the
 *  verge ON PURPOSE. The measurement needs none — `laneGap` is exact and the
 *  audit re-measures the same number — but a bale whose face sits on the lane
 *  edge to the millimetre is one road tweak away from being inside it, and that
 *  should surface as a build error, not as a shipped track. A quarter of the
 *  half-car the promise is built on. */
const VERGE_MARGIN = CAR_HALF / 4;

/** The least lateral offset at which `template` stands entirely outside the lane
 *  at lap fraction `t`, on `side` (+1 left of the direction of travel).
 *
 *  FOUND BY MEASURING, not by adding the component's radius to the road's
 *  half-width, because those are not the same number: the lap curls back under
 *  its own normal, so a thing pushed `lat` metres out from one sample can be
 *  much less than `lat` from the next stretch of the same road. That difference
 *  IS v1's #1. Searched on the 0.1 m grid the track file stores coordinates on,
 *  so the answer returned is the answer that gets written. */
function verge(template, t, side, opts = {}) {
  for (let step = 0; step < 400; step++) {
    const lat = r1(LANE + step * 0.1);
    const f = footprintOf(propBeside(template, t, side * lat, opts));
    if (!f) return lat;                                   // dressing: nothing to keep out
    if (laneGap(f) >= LANE + VERGE_MARGIN) return lat;
  }
  throw new Error(`nothing within 40 m of the lane puts ${template} clear of it at t=${t}`);
}

/** Every solid thing this file placed, measured against the whole lap. */
function auditLane(placed) {
  const inRoad = [], exempt = [];
  let measured = 0;
  for (const p of placed) {
    const f = footprintOf(p);
    if (!f) continue;
    measured++;
    const gap = laneGap(f);
    if (gap >= LANE) continue;
    // Two things inside the lane are not obstacles, and HEIGHT decides which —
    // `BUGS.md` #3b, where v1's barrier test knew when a car had cleared a wall
    // and nothing about a car underneath one. Measured here in the component's
    // OWN frame, whose base is the ground it stands on; for anything actually on
    // the carriageway that ground IS the road, and `verify-clearance.mjs`
    // re-decides it against the real road profile, which is the only place the
    // answer is exact.
    if (f.top <= STEP) {
      exempt.push(`${p.template} at (${p.x}, ${p.z}) — driven over, ${f.top.toFixed(2)} m proud`);
    } else if (f.bot >= CAR_TOP) {
      exempt.push(`${p.template} at (${p.x}, ${p.z}) — driven under, ${f.bot.toFixed(2)} m up`);
    } else {
      inRoad.push(`${p.template} at (${p.x}, ${p.z}) — gap ${gap.toFixed(2)} m of the ${LANE.toFixed(2)} m promised`);
    }
  }
  return { inRoad, exempt, measured };
}

// A jetty's deck runs along its own +Z, so this yaw points it out to sea.
const SEAWARD = -Math.PI / 2;

// ---- start / finish ---------------------------------------------------------
put('startGantry', 0.0, 0);
put('pitBuilding', 0.04, 25);
put('grandstand', 0.09, 27, { turn: Math.PI, scale: 1.05 });
for (const t of [0.015, 0.055, 0.095]) put('lightMast', t, -23);
for (let i = 0; i < 10; i++) put('marshalPost', i / 10 + 0.035, -11);

// ---- trackside --------------------------------------------------------------
for (let i = 0; i < 12; i++) put('guardrail', 0.17 + i * 0.0092, 12.5);   // outside of the sweeper
for (let i = 0; i < 8; i++) put('tyreStack', 0.305 + i * 0.004, 11);
put('chevronSign', 0.295, 13.5, { scale: 1.1 });
put('chevronSign', 0.302, 13.5, { scale: 1.1 });
// TAPERED TO THE VERGE, NOT ACROSS IT. This was five bales stepping from 8.5 m
// to 4.9 m off the centreline, on a road whose edge is at 7 and whose promise
// runs to 7.95: all five stood inside the advertised lane and `verify-clearance`
// found every one. The taper is what makes a line of bales read as a line rather
// than a fence, so it is kept — but it now runs OUTWARDS from the verge, and the
// verge is measured against the whole lap instead of assumed to be `lat` metres
// from the sample the offset came off.
for (let i = 0; i < 5; i++) {
  const t = 0.46 + i * 0.0035;
  put('hayBale', t, verge('hayBale', t, +1) + (4 - i) * 0.9);
}
for (let i = 0; i < 6; i++) put('barrierBlock', 0.60 + i * 0.005, 10.5);
for (let i = 0; i < 10; i++) put('cone', 0.75 + i * 0.0055, 7.4 - i * 0.14);
put('watchtower', 0.33, -17);

// ---- THE STONE QUAY ---------------------------------------------------------
//
// The village stood on a SAND BEACH. A working harbour with a fishing fleet and
// three jetties does not have a beach where its quay should be — boats come
// alongside stone, and everything the marine set builds (steps, ladders,
// capstans, a crane) is furniture for a wall that was not there.
//
// The wall is laid in its own 7.8 m modules along the shoreline found for the
// MIDDLE of each module rather than its end, so a run follows a curved coast
// instead of stepping away from it. `quayWall` runs along its local +X, so
// yawing it a quarter turn lays it along z.
const QUAY_FROM = -96, QUAY_TO = 108, QUAY_MOD = 7.8;
const ALONGSHORE = Math.PI / 2;
for (let z = QUAY_FROM; z <= QUAY_TO; z += QUAY_MOD) {
  const zc = z + QUAY_MOD / 2;
  putAt('quayWall', bankX(zc, 1.9), zc, ALONGSHORE, 1);
}

// Steps down the face where boats come alongside, and ladders between them.
for (const z of [-58, 2, 58]) putAt('quaySteps', bankX(z, 1.9), z, SEAWARD, 1);
for (const z of [-76, -30, 26, 84]) putAt('dockLadder', bankX(z, 1.9) - 0.6, z, SEAWARD, 1);

// The slipway: the one place a hull can be brought out of the water.
putAt('slipway', shoreX(-118) + 3, -118, SEAWARD, 1);
putAt('boatShed', shoreX(-118) + 26, -118, ALONGSHORE, 1);

// THE MOLE, and the beacon on the end of it. Laid across the northern approach
// so the moorings sit inside sheltered water, which is the whole reason a
// harbour is where it is. `breakwater` is 26 m of dressed stone per module.
for (let k = 0; k < 4; k++) {
  putAt('breakwater', shoreX(-150) - 4 - k * 25.6, -150 + k * 3, ALONGSHORE + 0.12, 1);
}
// lifted onto the mole's cap, which stands 1.25 m above the water
putAt('beacon', shoreX(-150) - 4 - 3.6 * 25.6, -150 + 3.4 * 3, 0, 1, 1.25);

// Working gear on the wall itself.
putAt('harbourCrane', bankX(-16, 1.9) + 4.5, -16, ALONGSHORE, 1);
putAt('netLoft', bankX(40, 1.9) + 12, 40, Math.PI / 2, 1);
for (const z of [-66, -8, 46]) putAt('capstan', bankX(z, 1.9) + 4.5, z, 0, 1);

// Quay furniture follows the shoreline, so it stays on the shore if the land
// or the water level is edited afterwards.
const moorings = [];
for (let z = -70; z <= 90; z += 10) {
  const s = shoreX(z);
  putAt('mooringPost', bankX(z, 1.9) + 2.2, z, 0, 1);
  moorings.push({ z, s });
}

// Three jetties, each with boats moored off the end of it. The big boat
// alternates KIND the way the v1 marina's population does — a basin of nothing
// but masts is a picket fence, so a third of that fleet carries no rig at all.
const BIG = ['sailboat', 'fishingBoat', 'launch'];
[-52, 6, 62].forEach((z, i) => {
  const s = shoreX(z);
  putAt('jetty', s + 2, z, SEAWARD, 1.05);
  const big = moorAt(z + 4, 2.0);
  if (big) putAt(BIG[i], big.x - 6, big.z, Math.PI / 2 + 0.12, 1);
  const small = moorAt(z - 6, 0.6);
  if (small) putAt('rowboat', small.x, small.z, Math.PI / 2 - 0.3, 1);
});

// Loose boats along the rest of the frontage.
for (const z of [-84, -26, 34, 78, 104]) {
  const m = moorAt(z, 0.6);
  if (m) putAt('rowboat', m.x, m.z, Math.PI / 2 + (z % 3) * 0.2, 0.95);
}
for (const [z, want, tpl] of [[-104, 2.2, 'fishingBoat'], [126, 2.4, 'sailboat'],
  [-140, 2.0, 'fishingBoat'], [90, 1.8, 'launch'], [-122, 2.2, 'sailboat']]) {
  const m = moorAt(z, want);
  if (m) putAt(tpl, m.x - 10, m.z, Math.PI / 2 - 0.2, 1);
}

// Pots and gear on the hard.
for (const z of [-60, -44, 14, 52, 70]) putAt('lobsterPots', shoreX(z) + 6.5, z, z * 0.03, 1);
for (const z of [-36, 24]) putAt('crate', shoreX(z) + 8, z, 0.4, 1);
putAt('oilDrum', shoreX(-30) + 9, -30, 0, 1);

// ---- THE VILLAGE ------------------------------------------------------------
// A front row facing the water, a back row behind it, and the church on the
// rise between the village and the road. Set back from the shore by a fixed
// margin so raising the tide floods the beach and not the parlour.
// A VILLAGE OF THREE HOUSES IS A VILLAGE OF ONE HOUSE — the lesson recorded in
// the v1 template table, which is why there are eleven dwelling archetypes to
// draw from. The front row walks through them instead of repeating two.
const FRONT = ['townhouse', 'cottage', 'towerhouse', 'cottageHipped', 'townhouse',
  'cottageLong', 'towerhouse', 'cottage', 'halfTimbered'];
const BACK = ['cottageLong', 'stoneCottage', 'cottage', 'chalet', 'cottageHipped'];
const front = [-80, -61, -42, -23, -4, 15, 34, 53, 72];
front.forEach((z, i) => {
  const s = shoreX(z);
  putAt(FRONT[i], s + 17 + (i % 2) * 3, z, Math.PI / 2, 0.95 + (i % 4) * 0.05);
});
[-68, -40, -14, 16, 46].forEach((z, i) => {
  const s = shoreX(z);
  putAt(BACK[i], s + 38 + (i % 2) * 4, z, Math.PI / 2, 1);
});
for (const z of [-70, -30, 10, 50]) putAt('streetLamp', shoreX(z) + 26, z, 0, 1);
putAt('wellHouse', shoreX(-10) + 27, -10, 0.4, 1.1);
putAt('marketStall', shoreX(2) + 25, 2, Math.PI / 2, 1);
putAt('marketStall', shoreX(-4) + 26, -4, Math.PI / 2, 1.05);
putAt('kiosk', shoreX(-20) + 27, -20, Math.PI / 2, 1);
// THE CHURCH IS THE ONE BUILDING THE ROAD CAN REACH, and at `shoreX + 52` the
// road reached it: 0.22 m from the centreline, a 16 m tower with an 11 m wall
// standing across the racing line — the single worst thing on any committed
// track and exactly v1's #1. Nothing about the statement was wrong as a
// statement about the COAST; it was never a statement about the road.
//
// Pulled back to `shoreX + 40`, which puts its wall 12.2 m off the centreline —
// the same standoff the guardrails run at on the far side of the lap, and clear
// of the back row of the village at `shoreX + 38 .. + 42` in Z. It is still on
// the rise between the village and the road, which is where a church goes; there
// is only about 12 m of corridor there and this is the honest use of it.
putAt('church', shoreX(24) + 40, 24, Math.PI / 2, 1.05);
putAt('oak', shoreX(36) + 46, 36, 0, 1.4);
putAt('oak', shoreX(-52) + 44, -52, 0, 1.2);

// ---- the headland lighthouse ------------------------------------------------
// Put on the northern point, where the coast turns — the far end of the map
// from the village, so it is the thing you see over the water from the quay.
{
  const z = -168;
  putAt('lighthouse', shoreX(z) + 5, z, 0, 1);
  putAt('shed', shoreX(z) + 22, z + 14, 0.5, 0.9);
  putAt('mooringPost', shoreX(z - 12) + 1.5, z - 12, 0, 1);
}

// ---- THE VINEYARD, on the eastern slope --------------------------------------
//
// Put where the land is: the third ramp lifts everything east of x = 175, and a
// vineyard belongs on a slope. TERRACED, because that is what a slope forces —
// each terrace is a retaining wall with its rows planted behind it, and the
// rows run ALONG the contour rather than down it, which is both what a grower
// does and what stops the whole planting reading as a hatch pattern.
//
// `vineRow` runs along its local +Z and `terraceWall` along its local +X, so a
// contour running north-south takes the rows unrotated and the walls a quarter
// turn. The 2.9 m row spacing is v1's own from `_buildVineRows`.
const VINE_ROW_PITCH = 2.9;
// INLAND OF THE ROAD, NOT ACROSS IT. The first placement ran the terraces from
// x = 232 to 326 and the circuit passes through x ~ 272 on this stretch, so the
// road went straight through the middle of the planting. Vine rows are not
// solid, so it drove fine and looked absurd. Everything now starts beyond
// x = 318, which is 45 m clear of the carriageway at its nearest.
const TERRACES = [
  { x: 320, z0: -84, rows: 7, len: 6 },
  { x: 350, z0: -66, rows: 8, len: 6 },
  { x: 382, z0: -46, rows: 7, len: 5 },
];
for (const T of TERRACES) {
  // the wall holding the step up, laid in 6 m modules along the contour
  for (let k = 0; k < T.len + 1; k++) {
    putAt('terraceWall', T.x - 5, T.z0 + k * 6.1, Math.PI / 2, 1);
  }
  for (let r = 0; r < T.rows; r++) {
    const x = T.x + r * VINE_ROW_PITCH;
    for (let k = 0; k < T.len; k++) putAt('vineRow', x, T.z0 + k * 8.3, 0, 1);
    // an anchor post at each end of the row, which is what a trellis needs to
    // pull against and what makes a row read as a row from the road
    putAt('trellisPost', x, T.z0 - 1.4, 0, 1);
    putAt('trellisPost', x, T.z0 + T.len * 8.3 + 1.4, 0, 1);
  }
}
// The working end of it, at the foot of the lowest terrace.
putAt('winePress', 312, -26, 0.5, 1);
putAt('barrelStack', 308, -32, 0.2, 1);
putAt('barrelStack', 308, -35, 0.2, 1);
putAt('farmhouseL', 306, -52, 1.2, 1);
putAt('shed', 310, -16, 1.2, 0.95);
for (let i = 0; i < 6; i++) putAt('oliveTree', 330 + (i % 3) * 16, 30 + Math.floor(i / 3) * 18, 0, 1.1);
for (let i = 0; i < 8; i++) putAt('orchardTree', 336 + (i % 4) * 10, 84 + Math.floor(i / 4) * 10, 0, 1);
for (let i = 0; i < 5; i++) putAt('cropRow', 330 + i * 4, 130, 0, 1);
putAt('scarecrow', 338, 140, 0.7, 1);

// ---- ROAD FURNITURE, round the lap ------------------------------------------
// The pieces that tell you a road is a road someone maintains rather than a
// ribbon: distance stones, a fingerpost at the junction, a warning board on the
// approach to the tightest corner, a grid where the lane leaves the fields, and
// a telegraph line that follows the route.
for (let i = 0; i < 8; i++) put('milestone', i / 8 + 0.012, -9.5, { turn: Math.PI / 2 });
put('signpost', 0.205, -11);
put('roadSign', 0.285, -11);
put('roadSign', 0.62, -11);
put('busShelter', 0.16, -12.5, { turn: Math.PI });
put('cattleGrid', 0.53, 0);
// A telegraph line: EVENLY SPACED and unrotated, because a jittered line stops
// being a line — the component's own file says so and sets randomYaw false.
for (let i = 0; i < 26; i++) put('telegraphPole', i / 26 + 0.006, -15, { turn: 0 });

// ---- the farm, inland east --------------------------------------------------
putAt('windmill', 330, -60, 0.4, 1);
putAt('farmhouse', 300, 40, 0.9, 1);
putAt('barn', 336, 66, 0.9, 1.05);
putAt('shed', 312, 88, 0.9, 0.95);
// THE FENCE STARTED ON THE ROAD. `[268, 20]` is a control point of the circuit,
// typed into two places in this file, and the first post of this run stood on
// the centreline — 0.0 m. It is `fenceRun`, which is deliberately not solid, so
// no collider check can see it and the car drives through it; it is simply drawn
// through the windscreen instead. The line and its relationship to the farm are
// right, so the run keeps both and starts two modules further up it, which puts
// the nearest post 13.4 m out.
for (let i = 2; i < 10; i++) putAt('fenceRun', 268 + i * 8 * Math.cos(0.9), 20 + i * 8 * Math.sin(0.9), 0.9, 1);
putAt('waterTower', 372, 128, 0, 1);
putAt('silo', 356, 42, 0, 1);
// TYPED-IN COORDINATES ON THE CARRIAGEWAY. `(268, -108)` sat 0.68 m from the
// centreline of the run down to the southern hairpin — a 9 m farmhouse in the
// road, and the only member of this farm anywhere near it: everything else here
// is out at x 292..372. Moved to `(300, -130)`, which is 24.5 m clear, still the
// lone steading on the southern land, and no longer the closest solid thing on
// the track by a factor of thirty.
putAt('farmhouseL', 300, -130, 2.2, 1);
putAt('logPile', 292, 74, 0.9, 1.1);
// Same defect as the fence run, and the one v1 recorded separately as `BUGS.md`
// #4 — dry stone wall laid INSIDE the road width. The first module stood 6.9 m
// from the centreline of a road whose edge is at 7, so it ran through the
// carriageway; `stoneWall` is not solid, so again nothing could stop the car and
// nothing could see it. The run keeps its line and its angle and starts one
// module further along, putting the nearest wall 13.7 m out.
for (let i = 1; i < 7; i++) putAt('stoneWall', 250 + i * 8 * Math.cos(2.1), -150 + i * 8 * Math.sin(2.1), 2.1, 1);

const track = {
  schema: 1,
  id: 'harbour',
  name: 'HARBOUR POINT',
  author: 'dustline',
  notes: 'Generated by tools/make-harbour.mjs. The coastal track: a sea made by '
    + 'ramping the land below the water level, a working harbour village placed '
    + 'relative to the shoreline rather than by coordinates, and the marine and '
    + 'settlement component sets as content.',
  seed: 1852,

  world: { size: 900, meshRes: 224, sdfRes: 220 },
  road: { points, halfWidth: HALF_WIDTH, blend: 17, samples: SAMPLES },
  start: { padRadius: 46, padSurface: 'tarmac', tuningRings: false },

  terrain: {
    octaves,
    ramps,
    road: {
      waves: [{ amp: 2.2, cycles: 3, phase: 0.4 }, { amp: 0.9, cycles: 6, phase: 2.6 }],
      crests: [{ at: 0.42, height: 3.4, width: 0.00036 }],
    },
  },

  water: { level: WATER, color: '#3f8aa4', deep: '#124a66', deepAt: 8, opacity: 0.8 },

  surfaces: {
    road: 'tarmac',
    offroad: 'gravel',
    bands: [
      { from: 0.34, to: 0.55, surface: 'gravel' },
      { from: 0.66, to: 0.74, surface: 'mud' },
    ],
    zones: [
      {
        // The beach and the sea bed. Sand under water is what makes shallows
        // read as shallows rather than as a flooded field.
        id: 'foreshore',
        surface: 'sand',
        onRoad: false,
        offRoad: true,
        any: [
          // Pulled back from -215 to the waterline. A working harbour does not
          // have a BEACH where its quay is: with the sand reaching 40 m inland
          // the whole village stood on it, which is a seaside resort.
          { kind: 'halfPlane', axis: 'x', op: 'lt', value: -252 },
          { kind: 'halfPlane', axis: 'z', op: 'gt', value: 268 },
        ],
      },
      {
        // BARE HILLTOP, NOT SNOW. The east ramp tops out at +22 and the octaves
        // add ten on top, so a snow line at 19 put a white cap on the hill the
        // vineyard is planted on — snow above a Mediterranean harbour with
        // olives and vines under it. The horizon peaks still carry snow; they
        // are three quarters of a kilometre away and a different climate.
        id: 'hilltop',
        surface: 'gravel',
        onRoad: false,
        offRoad: true,
        any: [{ kind: 'aboveHeight', height: 24 }],
      },
    ],
  },

  scenery: [
    // GROUND COVER FIRST, and in the thousands. Everything else in the
    // library stands ON the ground; without this the ground itself is a
    // painted plane, and the eye has no scale between a rock and the horizon.
    { template: 'grassTuft', count: 4000, minRoadDist: 6, maxRoadDist: 60, minSpawnDist: 30, spread: 0.98 },
    { template: 'pine', count: 110, minRoadDist: 15, minSpawnDist: 70, spread: 0.93 },
    { template: 'oak', count: 80, minRoadDist: 15, minSpawnDist: 70, spread: 0.92 },
    { template: 'willow', count: 40, minRoadDist: 12, minSpawnDist: 60, spread: 0.95 },
    { template: 'bush', count: 160, minRoadDist: 12, minSpawnDist: 60, spread: 0.95 },
    { template: 'reeds', count: 120, minRoadDist: 12, minSpawnDist: 60, spread: 0.95 },
    { template: 'rock', count: 100, minRoadDist: 13, minSpawnDist: 65, spread: 0.95 },
    { template: 'scree', count: 50, minRoadDist: 13, minSpawnDist: 65, spread: 0.95 },
    { template: 'stoneWall', count: 55, minRoadDist: 14, minSpawnDist: 70, spread: 0.9 },
    { template: 'lobsterPots', count: 24, minRoadDist: 8, minSpawnDist: 60, spread: 0.98 },
    { template: 'buoy', count: 22, minRoadDist: 6, minSpawnDist: 60, spread: 0.98 },
  ],

  props,

  sky: {
    stops: ['#2a6fb8', '#6fa6d6', '#c6dcea', '#e4e2d2'],
    fogColor: '#c6dcea',
    fogNear: 280,
    fogFar: 1060,
    hemiSky: '#d4ecff',
    hemiGround: '#5c7060',
    hemiIntensity: 1.0,
    sunColor: '#fff3da',
    sunIntensity: 2.3,
    sunDir: [-90, 90, -30],
    mountains: { count: 22, radius: 680, height: 95, snowline: 0.1 },
    clouds: 18,
  },
};

// ---- nothing is written until nothing is in the road -------------------------
const audit = auditLane(props);
// The emptiness guard is here on purpose and is repeated in the condition below:
// a run that measured nothing must never be able to print a clean bill of
// health. That sentence is the whole product of this check.
if (audit.measured === 0) {
  console.error('NOTHING SOLID WAS MEASURED — the component library did not load, so the road check proved nothing');
  process.exit(1);
}
if (audit.inRoad.length) {
  console.error(`${audit.inRoad.length} solid component(s) stand inside the ${LANE.toFixed(2)} m the road `
    + `advertises (half-width ${HALF_WIDTH} + half a car ${CAR_HALF}) — harbour.json NOT written:`);
  for (const line of audit.inRoad) console.error(`  ${line}`);
  process.exit(1);
}

writeFileSync('src/data/tracks/harbour.json', `${JSON.stringify(track, null, 2)}\n`);

const FLOATS = ['rowboat', 'fishingBoat', 'sailboat', 'launch'];
const afloat = props.filter((p) => FLOATS.includes(p.template));
const shallow = afloat.filter((p) => depth(p.x, p.z) < 0.4);
console.log(`wrote harbour.json — ${props.length} placed components, `
  + `${track.scenery.length} scatter layers, ${afloat.length} boats`);
console.log(`shoreline at z=0 is x=${shoreX(0)}; deepest water ${Math.max(
  ...[-400, -350, -300].map((x) => depth(x, 0))).toFixed(1)} m`);
console.log(`${audit.measured} solid components measured against all ${SAMPLES} centreline samples: `
  + `every one clear of ${LANE.toFixed(2)} m; ${audit.exempt.length} exempt on height`
  + `${audit.exempt.length ? ` — ${audit.exempt.join(', ')}` : ''}`);
// The two runs with no collider at all, reported because no gate can see them:
// `verify-clearance` measures solid colliders, so a fence or a wall drawn
// through the carriageway is invisible to it and visible to the driver.
const NO_COLLIDER = ['fenceRun', 'stoneWall'];
const drawnClose = props
  .filter((p) => NO_COLLIDER.includes(p.template))
  .map((p) => ({ p, d: pointGap(p.x, p.z) }))
  .sort((a, b) => a.d - b.d)[0];
console.log(`nearest non-solid run to the centreline: ${drawnClose.p.template} at `
  + `(${drawnClose.p.x}, ${drawnClose.p.z}), ${drawnClose.d.toFixed(1)} m — nothing checks these, so they are printed`);
if (shallow.length) {
  console.error(`${shallow.length} boat(s) are aground: `
    + shallow.map((p) => `${p.template}@(${p.x},${p.z})`).join(' '));
  process.exit(1);
}
