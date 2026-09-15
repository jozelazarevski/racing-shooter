/* Generates `src/data/tracks/proving-ground.json`.
 *
 * A second built-in track whose job is to exercise the component library as
 * CONTENT rather than as a test: every category is represented, trackside
 * furniture is placed relative to the racing line rather than sprinkled at
 * random, and the structures sit where structures actually go.
 *
 * It is generated rather than hand-written because placing 120 props by typing
 * coordinates is exactly the work the editor exists to remove — and because
 * anything positioned relative to the road has to be RECOMPUTED when the road
 * moves. Regenerate with:
 *
 *   node tools/make-proving-ground.mjs
 *
 * Edit it afterwards in the editor like any other track; this only makes the
 * starting point.
 *
 * NOTHING IT PLACES MAY STAND IN THE ROAD, and that is checked here rather than
 * assumed — see "THE GLOBAL CHECK" below. The generator writes no file at all
 * if it fails.
 */
import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import * as THREE from 'three';
import * as esbuild from 'esbuild';

const SAMPLES = 480;
/** Named because the placement code below has to know how wide the road it is
 *  placing beside actually is. It went into `road.halfWidth` as a literal, and
 *  a hay-bale line tapered to 4.9 m off the centreline of a road whose edge is
 *  at 7 — a number nothing in this file was in a position to notice. */
const HALF_WIDTH = 7;

// A flowing circuit: a long main straight, a fast sweeper, a tight hairpin
// complex and an off-camber run home.
const points = [
  [0, -250], [140, -250], [250, -205], [300, -110], [292, -10],
  [232, 62], [150, 84], [70, 110], [40, 190], [-40, 232],
  [-140, 226], [-208, 170], [-236, 80], [-250, -30], [-232, -132],
  [-160, -212], [-70, -248],
];

const curve = new THREE.CatmullRomCurve3(
  points.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal',
);
const pts = [];
for (let i = 0; i < SAMPLES; i++) pts.push(curve.getPoint(i / SAMPLES));

/** Position offset `lat` metres to the left of the racing line at lap fraction t. */
function beside(t, lat) {
  const i = Math.round(t * SAMPLES) % SAMPLES;
  const p = pts[i];
  const n = pts[(i + 1) % SAMPLES];
  const dx = n.x - p.x, dz = n.z - p.z;
  const len = Math.hypot(dx, dz) || 1;
  // left normal of the direction of travel
  return { x: p.x + (dz / len) * lat, z: p.z - (dx / len) * lat, heading: Math.atan2(dx, dz) };
}

const props = [];
/** One prop, beside the racing line, rounded exactly as it will be stored — so
 *  anything that measures it here measures the numbers that get written. */
const propBeside = (template, t, lat, opts = {}) => {
  const { x, z, heading } = beside(t, lat);
  return {
    template,
    x: Math.round(x * 10) / 10,
    z: Math.round(z * 10) / 10,
    rot: Math.round(((opts.rot ?? heading) + (opts.turn ?? 0)) * 1000) / 1000,
    scale: opts.scale ?? 1,
  };
};
const put = (template, t, lat, opts = {}) => { props.push(propBeside(template, t, lat, opts)); };
const putAt = (template, x, z, rot = 0, scale = 1) => props.push({ template, x, z, rot, scale });

// ---- THE GLOBAL CHECK: IS ANYTHING I AM PLACING STANDING IN THE ROAD? --------
//
// v1's `BUGS.md` #1 was 211 solid colliders inside the advertised lane across 29
// of 57 worlds. The count is not the useful part; the SHAPE of the mistake is,
// because it is why there were 211 and not one. Every object was pushed to a
// fixed lateral offset from ITS OWN centreline sample and never checked against
// the REST of the lap. On a bend the lap curls back under the offset, so the
// object lands in a different stretch of road, at the same height, in the racing
// line. Every one of those sites was correct by its own local reasoning, and the
// question that would have caught them cannot be asked locally at all:
//
//    GIVEN THE WHOLE LAP, is any solid thing this file places inside the width
//    the road advertises?
//
// The engine already asks it of SCATTER — `world/build.ts` rejects a site whose
// `terrain.distToRoad(x, z)` is under the layer's `minRoadDist`, off a
// road-distance field baked across the whole map. HAND PLACEMENT went through no
// such gate, here or in the engine, which is how this generator came to taper a
// hay-bale line 2.1 m inside its own carriageway and call it trackside.
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
  // ground it stands on.
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
 *  oriented rectangle it actually is, because a barn turned 45 degrees is not a
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
    const lat = Math.round((LANE + step * 0.1) * 10) / 10;
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

// ---- start / finish complex ----------------------------------------------
put('startGantry', 0.0, 0, { scale: 1 });
// pit building along the main straight, set back on the left
put('pitBuilding', 0.045, 26, { scale: 1 });
put('grandstand', 0.10, 28, { turn: Math.PI, scale: 1.1 });
put('grandstand', 0.135, 28, { turn: Math.PI, scale: 1.1 });
for (const t of [0.02, 0.06, 0.10, 0.14]) put('lightMast', t, -24, { scale: 1 });

// ---- guardrail down the outside of the fast sweeper ------------------------
// spacing derived from the component's own 6 m length so the run is continuous
for (let i = 0; i < 14; i++) {
  const t = 0.20 + i * 0.0092;
  put('guardrail', t, 12.5, { scale: 1 });
}

// ---- the hairpin complex: tyres on the outside, chevrons on approach -------
for (let i = 0; i < 9; i++) put('tyreStack', 0.335 + i * 0.004, 11, { scale: 1 });
put('chevronSign', 0.322, 13.5, { scale: 1.1 });
put('chevronSign', 0.330, 13.5, { scale: 1.1 });
put('marshalPost', 0.345, -12, {});
put('watchtower', 0.352, -17, {});

// ---- a hay-bale chicane on the back section --------------------------------
//
// TAPERED TO THE VERGE, NOT ACROSS IT. This was two rows of five stepping from
// 8.5 m to 4.9 m off the centreline, on a road whose edge is at 7 and whose
// promise runs to 7.95: ALL TEN stood inside the advertised lane, the innermost
// 3.7 m into it, and `verify-clearance` found every one. The taper is what makes
// a chicane read as a chicane, so it is kept — but it now runs OUTWARDS from the
// verge, and the verge is measured against the whole lap instead of assumed to
// be `lat` metres from the sample the offset came off.
//
// A chicane that genuinely narrows the carriageway is a legitimate thing to
// want, and this track — the one whose job is to exercise the library as
// content — is where you would want it. THE FORMAT CANNOT SAY IT TODAY: there is
// nowhere in a `PlacedProp` or in `road` to declare that a stretch is
// deliberately tighter than `halfWidth`, so a bale in the racing line is
// indistinguishable from the bug this was. Declaring it is a format change, not
// a generator change; see the note returned with this fix.
for (let i = 0; i < 5; i++) {
  const t = 0.44 + i * 0.0035;
  put('hayBale', t, verge('hayBale', t, +1) + (4 - i) * 0.9, { scale: 1 });
}
for (let i = 0; i < 5; i++) {
  const t = 0.47 + i * 0.0035;
  put('hayBale', t, -(verge('hayBale', t, -1) + (4 - i) * 0.9), { scale: 1 });
}

// ---- barriers and sandbags where the road runs close to the country --------
for (let i = 0; i < 6; i++) put('barrierBlock', 0.56 + i * 0.005, 10.5, { scale: 1 });
for (let i = 0; i < 4; i++) put('sandbagWall', 0.63 + i * 0.006, -10.5, { scale: 1 });

// ---- cones marking a narrowing on the run home -----------------------------
for (let i = 0; i < 12; i++) {
  put('cone', 0.72 + i * 0.0055, 7.6 - i * 0.12, {});
  put('cone', 0.72 + i * 0.0055, -7.6 + i * 0.12, {});
}

// ---- marshal posts all the way round ---------------------------------------
for (let i = 0; i < 10; i++) put('marshalPost', i / 10 + 0.03, -11, {});

// ---- the farm, off in the country ------------------------------------------
putAt('barn', -320, 300, 0.6, 1.1);
putAt('shed', -286, 322, 0.6, 1);
putAt('shed', -348, 268, -0.4, 0.9);
for (let i = 0; i < 7; i++) putAt('fenceRun', -300 + i * 8 * Math.cos(0.6), 250 + i * 8 * Math.sin(0.6), 0.6, 1);
putAt('waterTower', 330, 300, 0, 1);
putAt('watchtower', -360, -300, 0.9, 1);

// ---- yard clutter beside the pits -------------------------------------------
put('oilDrum', 0.03, 34, { scale: 1 });
put('oilDrum', 0.033, 36, { scale: 1 });
put('oilDrum', 0.036, 34.5, { scale: 1 });
put('crate', 0.04, 35, { scale: 1.1 });
put('crate', 0.043, 33, { scale: 0.9 });
put('pallet', 0.047, 35.5, { scale: 1 });
put('spareTyre', 0.05, 33.5, { scale: 1 });
put('spareTyre', 0.052, 34.5, { scale: 1 });

// ---- ROADS AND CROSSINGS ------------------------------------------------------
// The proving ground's job is to exercise the library as CONTENT, so the roads
// set is laid out beside the route the way it would be on a real stage rather
// than lined up in a field. Everything here is placed relative to the racing
// line, so it follows the road if the road moves.
//
// The bridges sit BESIDE the lap rather than carrying it. A component cannot
// know where the road is, so a bridge placed on the centreline would have to
// have its deck height match the road profile exactly at that point or a car
// would hit its parapet — and the deck is the only solid part it has. Beside
// the route they are scenery you drive past, which is honest.
put('stoneBridge', 0.115, 34, { turn: Math.PI / 2 });
put('timberBridge', 0.395, 36, { turn: Math.PI / 2 });
put('culvert', 0.47, 16, { turn: Math.PI });
put('tunnelMouth', 0.815, 40, { turn: Math.PI / 2, scale: 0.9 });
for (let i = 0; i < 7; i++) put('retainingWall', 0.235 + i * 0.0068, 15.5);
put('cattleGrid', 0.55, 0);
put('fordStones', 0.66, 22);
for (let i = 0; i < 10; i++) put('milestone', i / 10 + 0.005, -9.5, { turn: Math.PI / 2 });
put('signpost', 0.30, -12);
put('roadSign', 0.245, -12);
put('roadSign', 0.70, -12);
put('busShelter', 0.075, -13, { turn: Math.PI });
for (let i = 0; i < 24; i++) put('telegraphPole', i / 24 + 0.004, -16, { turn: 0 });

// ---- A HAMLET, so the settlement set is content and not a catalogue ---------
const HAMLET = ['cubeHouse', 'domedHouse', 'courtyardHouse', 'adobeHouse',
  'stiltHouse', 'signalHut', 'puebloRuin'];
HAMLET.forEach((id, i) => putAt(id, -350 + (i % 4) * 34, 130 + Math.floor(i / 4) * 38, 0.4 + i, 1));
putAt('campanile', -300, 96, 0, 1);
putAt('fountain', -316, 132, 0, 1);
putAt('archGateway', -352, 210, 0, 1);
for (let i = 0; i < 5; i++) putAt('vineRow', 300 + i * 2.9, 150, 0, 1);
putAt('trellisPost', 300, 143, 0, 1);
putAt('terraceWall', 296, 160, 0, 1);
putAt('winePress', 288, 146, 0.6, 1);
putAt('barrelStack', 286, 152, 0.2, 1);
putAt('oliveTree', 322, 158, 0, 1.1);
putAt('orchardTree', 316, 168, 0, 1);
putAt('hayRack', 276, 168, 0.8, 1);
putAt('waterTrough', 270, 160, 0.8, 1);
putAt('feedBin', 268, 172, 0.8, 1);
putAt('scarecrow', 306, 176, 0.4, 1);
putAt('quayWall', -390, -60, Math.PI / 2, 1);
putAt('quaySteps', -382, -70, 0, 1);
putAt('capstan', -384, -50, 0, 1);
putAt('dockLadder', -392, -44, 0, 1);
putAt('boatShed', -370, -84, 0.6, 1);
putAt('netLoft', -368, -30, 0.6, 1);
putAt('harbourCrane', -380, -14, 0, 1);
putAt('breakwater', -404, 20, Math.PI / 2, 1);
putAt('beacon', -404, 50, 0, 1);
putAt('slipway', -374, 70, 0, 1);
putAt('logPile', -330, -100, 0.5, 1);
putAt('silo', 342, 88, 0, 1);
putAt('kiosk', -140, 320, 0.9, 1);
putAt('towerhouse', -170, 316, 0.9, 1);
putAt('chalet', -206, 306, 0.9, 1);
putAt('halfTimbered', -240, 300, 0.9, 1);
putAt('stoneCottage', -272, 292, 0.9, 1);
putAt('cottageHipped', -300, 282, 0.9, 1);
putAt('cottageLong', -330, 272, 0.9, 1);
putAt('farmhouseL', -360, 258, 0.9, 1);

// ---- landmarks --------------------------------------------------------------
putAt('rockSpire', 250, -330, 0, 1.6);
putAt('rockSpire', 286, -300, 0, 1.1);
putAt('boulder', 210, -300, 0, 2.6);
putAt('fallenLog', -120, 300, 0.9, 1.3);
putAt('stump', -134, 292, 0, 1.2);

const track = {
  schema: 1,
  id: 'proving-ground',
  name: 'PROVING GROUND',
  author: 'dustline',
  notes: 'Generated by tools/make-proving-ground.mjs. Exercises every component '
    + 'category as content: trackside furniture placed relative to the racing line, '
    + 'structures where structures go, and scatter using the full flora set.',
  seed: 4711,

  world: { size: 900, meshRes: 224, sdfRes: 220 },
  road: { points, halfWidth: HALF_WIDTH, blend: 16, samples: SAMPLES },
  start: { padRadius: 48, padSurface: 'tarmac', tuningRings: false },

  terrain: {
    octaves: [
      { kind: 'product', amp: 5.5, freqX: 0.009, phaseX: 0.6, fnX: 'sin', freqZ: 0.008, phaseZ: 2.2, fnZ: 'cos' },
      { kind: 'product', amp: 2.4, freqX: 0.023, phaseX: 1.9, fnX: 'sin', freqZ: 0.026, phaseZ: 0.5, fnZ: 'sin' },
      { kind: 'wave', amp: 1.4, fx: 0.041, fz: 0.033, phase: 1.1 },
    ],
    ramps: [{ axis: 'x', beyond: 200, dir: 'gt', slope: 0.07, max: 16 }],
    road: {
      waves: [{ amp: 2.6, cycles: 3, phase: 1.4 }, { amp: 1.1, cycles: 7, phase: 0.3 }],
      crests: [
        { at: 0.255, height: 4.2, width: 0.00032 },
        { at: 0.685, height: 3.0, width: 0.00045 },
      ],
    },
  },

  surfaces: {
    road: 'tarmac',
    offroad: 'gravel',
    bands: [
      { from: 0.30, to: 0.52, surface: 'gravel' },
      { from: 0.60, to: 0.70, surface: 'mud' },
    ],
    zones: [
      {
        id: 'highground',
        surface: 'snow',
        onRoad: true,
        offRoad: true,
        any: [{ kind: 'aboveHeight', height: 14 }],
        stripe: { period: 0.05, duty: 0.009, surface: 'ice' },
      },
      {
        id: 'dustbowl',
        surface: 'sand',
        onRoad: false,
        offRoad: true,
        any: [{ kind: 'circle', x: 250, z: -300, radius: 150, offroadRadius: 170 }],
      },
    ],
  },

  scenery: [
    // GROUND COVER FIRST, and in the thousands. Everything else in the
    // library stands ON the ground; without this the ground itself is a
    // painted plane, and the eye has no scale between a rock and the horizon.
    { template: 'grassTuft', count: 4000, minRoadDist: 6, maxRoadDist: 60, minSpawnDist: 30, spread: 0.98 },
    { template: 'pine', count: 150, minRoadDist: 16, minSpawnDist: 70, spread: 0.93 },
    { template: 'birch', count: 120, minRoadDist: 15, minSpawnDist: 70, spread: 0.93 },
    { template: 'bush', count: 180, minRoadDist: 12, minSpawnDist: 60, spread: 0.95 },
    { template: 'reeds', count: 130, minRoadDist: 12, minSpawnDist: 60, spread: 0.95 },
    { template: 'rock', count: 120, minRoadDist: 13, minSpawnDist: 65, spread: 0.95 },
    { template: 'scree', count: 70, minRoadDist: 13, minSpawnDist: 65, spread: 0.95 },
    { template: 'stump', count: 45, minRoadDist: 14, minSpawnDist: 70, spread: 0.9 },
    { template: 'palm', count: 40, minRoadDist: 14, minSpawnDist: 70,
      avoidSurfaces: ['snow', 'ice', 'gravel', 'tarmac'], spread: 0.9 },
    { template: 'deadTree', count: 35, minRoadDist: 14, minSpawnDist: 70, spread: 0.92 },
  ],

  props,

  // Late afternoon rather than the full golden hour that harbour takes — the
  // reason is written down so it does not read as an inconsistency. This track
  // is the component library's proving ground: its whole job is that you can
  // SEE each of the 114 placed pieces and judge it. A 12-degree sun throws
  // shadows four times an object's height, which is what makes harbour read as
  // a place and would make this read as a thicket of stripes.
  //
  // So: the same warm sun and the same low fill, at 24 degrees instead of 12
  // ([-150, 67, 40]). Shadows still land beside their object rather than under
  // it, which is the cue that was missing at the old 51 degrees, without any
  // piece hiding in the shadow of the piece before it.
  sky: {
    stops: ['#2f6ab4', '#89a6cc', '#e8c79a', '#f6d5a8'],
    fogColor: '#eadcbe',
    fogNear: 260,
    fogFar: 1100,
    hemiSky: '#cfdcf2',
    hemiGround: '#7c6a4c',
    hemiIntensity: 0.85,
    sunColor: '#ffd6a4',
    sunIntensity: 2.7,
    sunDir: [-150, 67, 40],
    mountains: { count: 26, radius: 660, height: 105, snowline: -0.1 },
    clouds: 12,
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
    + `advertises (half-width ${HALF_WIDTH} + half a car ${CAR_HALF}) — proving-ground.json NOT written:`);
  for (const line of audit.inRoad) console.error(`  ${line}`);
  process.exit(1);
}

writeFileSync('src/data/tracks/proving-ground.json', `${JSON.stringify(track, null, 2)}\n`);
console.log(`wrote proving-ground.json — ${props.length} placed components, `
  + `${track.scenery.length} scatter layers, ${points.length} control points`);
console.log(`${audit.measured} solid components measured against all ${SAMPLES} centreline samples: `
  + `every one clear of ${LANE.toFixed(2)} m; ${audit.exempt.length} exempt on height`
  + `${audit.exempt.length ? ` — ${audit.exempt.join(', ')}` : ''}`);
