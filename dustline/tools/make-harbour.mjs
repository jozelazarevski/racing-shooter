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
 */
import { writeFileSync } from 'node:fs';
import * as THREE from 'three';

const SAMPLES = 480;
const WATER = -7;

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
const put = (template, t, lat, opts = {}) => {
  const { x, z, heading } = beside(t, lat);
  props.push({ template, x: r1(x), z: r1(z), rot: r3((opts.rot ?? heading) + (opts.turn ?? 0)), scale: opts.scale ?? 1 });
};
const putAt = (template, x, z, rot = 0, scale = 1) =>
  props.push({ template, x: r1(x), z: r1(z), rot: r3(rot), scale });

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
for (let i = 0; i < 5; i++) put('hayBale', 0.46 + i * 0.0035, 8.5 - i * 0.9);
for (let i = 0; i < 6; i++) put('barrierBlock', 0.60 + i * 0.005, 10.5);
for (let i = 0; i < 10; i++) put('cone', 0.75 + i * 0.0055, 7.4 - i * 0.14);
put('watchtower', 0.33, -17);

// ---- THE HARBOUR ------------------------------------------------------------
// Quay furniture follows the shoreline, so it stays on the shore if the land
// or the water level is edited afterwards.
const moorings = [];
for (let z = -70; z <= 90; z += 10) {
  const s = shoreX(z);
  putAt('mooringPost', s + 1.5, z, 0, 1);
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
for (const z of [-60, -44, 14, 52, 70]) putAt('lobsterPots', shoreX(z) + 3.5, z, z * 0.03, 1);
for (const z of [-36, 24]) putAt('crate', shoreX(z) + 5, z, 0.4, 1);
putAt('oilDrum', shoreX(-30) + 6, -30, 0, 1);

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
putAt('church', shoreX(24) + 52, 24, Math.PI / 2, 1.05);
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

// ---- the farm, inland east --------------------------------------------------
putAt('windmill', 330, -60, 0.4, 1);
putAt('farmhouse', 300, 40, 0.9, 1);
putAt('barn', 336, 66, 0.9, 1.05);
putAt('shed', 312, 88, 0.9, 0.95);
for (let i = 0; i < 8; i++) putAt('fenceRun', 268 + i * 8 * Math.cos(0.9), 20 + i * 8 * Math.sin(0.9), 0.9, 1);
putAt('waterTower', 372, 128, 0, 1);
putAt('silo', 356, 42, 0, 1);
putAt('farmhouseL', 268, -108, 2.2, 1);
putAt('logPile', 292, 74, 0.9, 1.1);
for (let i = 0; i < 6; i++) putAt('stoneWall', 250 + i * 8 * Math.cos(2.1), -150 + i * 8 * Math.sin(2.1), 2.1, 1);

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
  road: { points, halfWidth: 7, blend: 17, samples: SAMPLES },
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
          { kind: 'halfPlane', axis: 'x', op: 'lt', value: -215 },
          { kind: 'halfPlane', axis: 'z', op: 'gt', value: 268 },
        ],
      },
      {
        id: 'highground',
        surface: 'snow',
        onRoad: true,
        offRoad: true,
        any: [{ kind: 'aboveHeight', height: 19 }],
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

writeFileSync('src/data/tracks/harbour.json', `${JSON.stringify(track, null, 2)}\n`);

const FLOATS = ['rowboat', 'fishingBoat', 'sailboat', 'launch'];
const afloat = props.filter((p) => FLOATS.includes(p.template));
const shallow = afloat.filter((p) => depth(p.x, p.z) < 0.4);
console.log(`wrote harbour.json — ${props.length} placed components, `
  + `${track.scenery.length} scatter layers, ${afloat.length} boats`);
console.log(`shoreline at z=0 is x=${shoreX(0)}; deepest water ${Math.max(
  ...[-400, -350, -300].map((x) => depth(x, 0))).toFixed(1)} m`);
if (shallow.length) {
  console.error(`${shallow.length} boat(s) are aground: `
    + shallow.map((p) => `${p.template}@(${p.x},${p.z})`).join(' '));
  process.exit(1);
}
