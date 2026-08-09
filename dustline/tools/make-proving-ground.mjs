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
 */
import { writeFileSync } from 'node:fs';
import * as THREE from 'three';

const SAMPLES = 480;

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
const put = (template, t, lat, opts = {}) => {
  const { x, z, heading } = beside(t, lat);
  props.push({
    template,
    x: Math.round(x * 10) / 10,
    z: Math.round(z * 10) / 10,
    rot: Math.round(((opts.rot ?? heading) + (opts.turn ?? 0)) * 1000) / 1000,
    scale: opts.scale ?? 1,
  });
};
const putAt = (template, x, z, rot = 0, scale = 1) => props.push({ template, x, z, rot, scale });

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
for (let i = 0; i < 5; i++) put('hayBale', 0.44 + i * 0.0035, 8.5 - i * 0.9, { scale: 1 });
for (let i = 0; i < 5; i++) put('hayBale', 0.47 + i * 0.0035, -8.5 + i * 0.9, { scale: 1 });

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
  road: { points, halfWidth: 7, blend: 16, samples: SAMPLES },
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

  sky: {
    stops: ['#2f6fbe', '#79a8d8', '#cfdfe8', '#e6dcc4'],
    fogColor: '#cfdfe8',
    fogNear: 260,
    fogFar: 1020,
    hemiSky: '#cfe6ff',
    hemiGround: '#6a7a52',
    hemiIntensity: 0.95,
    sunColor: '#fff4dc',
    sunIntensity: 2.35,
    sunDir: [-70, 95, 45],
    mountains: { count: 26, radius: 660, height: 105, snowline: -0.1 },
    clouds: 16,
  },
};

writeFileSync('src/data/tracks/proving-ground.json', `${JSON.stringify(track, null, 2)}\n`);
console.log(`wrote proving-ground.json — ${props.length} placed components, `
  + `${track.scenery.length} scatter layers, ${points.length} control points`);
