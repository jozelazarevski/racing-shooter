// WHAT KIND OF WORLD IS THIS?
//
// "New" used to clone DUSTBOWL and give it a fresh loop and a fresh seed. Every
// new track was therefore a dustbowl: the same three octaves, the same snow
// line at 13 m, the same gravel, the same pines, the same sky. You could change
// all of it — that is what the panel is for — but you had to know which of
// forty numbers to change, and the starting point silently argued for one kind
// of world.
//
// TWO AXES, NOT A LIST OF THEMES. A land and a weather are independent: alpine
// in a snowfall and alpine at golden hour are the same terrain lit differently,
// and dunes under sea mist is a legitimate thing to want. Eight lands times
// seven weathers is fifty-six starting points out of fifteen entries, where a
// flat list of themes would be fifteen.
//
// THE NUMBERS ARE IGNITE RALLY'S. Sky stops, fog distances, sun colour and
// intensity, hemisphere fill and cloud counts all come from `THEMES` in
// `src/world/themes.js` at the repository root — thirty worlds' worth of
// lighting that has already been looked at on a screen. Where a dustline field
// has no v1 counterpart (the octaves, the scatter layers, the surface zones)
// the values are new, because v1 generates its terrain a different way.

import type { TrackDef, HeightOctave, Ramp, SurfaceZone, SceneryLayer, WaterDef, HorizonForm } from './trackDef';

/** What a land contributes: the shape of the ground and what grows on it. */
export interface LandPreset {
  id: string;
  name: string;
  blurb: string;
  octaves: HeightOctave[];
  ramps: Ramp[];
  road: TrackDef['terrain']['road'];
  surfaces: TrackDef['surfaces'];
  scenery: SceneryLayer[];
  water?: WaterDef;
  padSurface: TrackDef['start']['padSurface'];
  mountains: { count: number; radius: number; height: number; snowline: number; forms?: HorizonForm[] };
}

/** What a weather contributes: nothing but light and air. */
export interface WeatherPreset {
  id: string;
  name: string;
  blurb: string;
  stops: [string, string, string, string];
  fogColor: string;
  fogNear: number;
  fogFar: number;
  sunColor: string;
  sunIntensity: number;
  sunDir: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  clouds: number;
  /** weather can push the snowline up or down without touching the land */
  snowlineBias: number;
}

const wave = (amp: number, fx: number, fz: number, phase: number): HeightOctave =>
  ({ kind: 'wave', amp, fx, fz, phase });
const prod = (
  amp: number, freqX: number, phaseX: number, fnX: 'sin' | 'cos',
  freqZ: number, phaseZ: number, fnZ: 'sin' | 'cos',
): HeightOctave => ({ kind: 'product', amp, freqX, phaseX, fnX, freqZ, phaseZ, fnZ });

const ground = (template: string, count: number, minRoadDist: number, extra: Partial<SceneryLayer> = {}): SceneryLayer =>
  ({ template, count, minRoadDist, minSpawnDist: 60, spread: 0.95, ...extra });

/** Every land gets ground cover, banded to the road corridor — see the note on
 *  `maxRoadDist`. It is listed first everywhere so it draws before the things
 *  standing in it. */
const COVER: SceneryLayer =
  { template: 'grassTuft', count: 4000, minRoadDist: 6, maxRoadDist: 60, minSpawnDist: 30, spread: 0.98 };

export const LANDS: LandPreset[] = [
  {
    id: 'farmland',
    name: 'Rolling farmland',
    blurb: 'Gentle country, hedgerows and field walls. The forgiving one.',
    octaves: [prod(5.5, 0.009, 0.6, 'sin', 0.008, 2.2, 'cos'), prod(2.2, 0.024, 1.9, 'sin', 0.026, 0.5, 'sin'), wave(1.1, 0.041, 0.033, 1.1)],
    ramps: [],
    road: { waves: [{ amp: 2.4, cycles: 3, phase: 1.4 }, { amp: 1.0, cycles: 7, phase: 0.3 }], crests: [{ at: 0.5, height: 3.2, width: 0.0004 }] },
    surfaces: { road: 'tarmac', offroad: 'gravel', bands: [{ from: 0.3, to: 0.5, surface: 'gravel' }], zones: [] },
    scenery: [COVER, ground('oak', 90, 14), ground('birch', 80, 14), ground('bush', 160, 12), ground('stoneWall', 60, 14), ground('rock', 70, 13)],
    padSurface: 'tarmac',
    mountains: { count: 18, radius: 620, height: 70, snowline: -0.4 },
  },
  {
    id: 'alpine',
    name: 'Alpine pass',
    blurb: 'A ramped massif with a snow line and pines to the treeline.',
    octaves: [prod(9.5, 0.010, 1.7, 'sin', 0.009, 0.4, 'cos'), prod(3.6, 0.027, -0.8, 'sin', 0.031, 2.1, 'sin'), wave(1.4, 0.05, 0.05, 0)],
    ramps: [{ axis: 'z', beyond: -140, dir: 'lt', slope: 0.09, max: 18 }],
    road: { waves: [{ amp: 3.6, cycles: 2, phase: 0.7 }, { amp: 1.5, cycles: 5, phase: 2.2 }], crests: [{ at: 0.62, height: 5.5, width: 0.00028 }] },
    surfaces: {
      road: 'tarmac',
      offroad: 'gravel',
      bands: [{ from: 0.08, to: 0.52, surface: 'gravel' }],
      zones: [{
        id: 'snowline', surface: 'snow', onRoad: true, offRoad: true,
        any: [{ kind: 'aboveHeight', height: 14 }],
        stripe: { period: 0.07, duty: 0.012, surface: 'ice' },
      } as SurfaceZone],
    },
    scenery: [COVER, ground('pine', 220, 15), ground('birch', 90, 14), ground('rock', 130, 13), ground('scree', 80, 13), ground('bush', 120, 12)],
    padSurface: 'tarmac',
    mountains: { count: 26, radius: 660, height: 120, snowline: 0.3, forms: ['ridge', 'dome', 'spire'] },
  },
  {
    id: 'desert',
    name: 'Desert dunes',
    blurb: 'Long sand swells, saguaro and dead wood. Open and fast.',
    octaves: [prod(11, 0.007, 2.1, 'sin', 0.006, 1.2, 'cos'), prod(3.4, 0.019, 0.4, 'sin', 0.021, 2.6, 'sin'), wave(1.6, 0.033, 0.028, 2.4)],
    ramps: [],
    road: { waves: [{ amp: 3.0, cycles: 2, phase: 2.1 }, { amp: 1.2, cycles: 6, phase: 1.0 }], crests: [{ at: 0.34, height: 4.6, width: 0.00035 }] },
    surfaces: { road: 'gravel', offroad: 'sand', bands: [{ from: 0.4, to: 0.75, surface: 'sand' }], zones: [] },
    scenery: [COVER, ground('cactus', 70, 14, { avoidSurfaces: ['snow', 'ice'] }), ground('palm', 45, 14), ground('deadTree', 55, 14), ground('rock', 110, 13), ground('scree', 90, 13), ground('boulder', 18, 16)],
    padSurface: 'gravel',
    mountains: { count: 20, radius: 700, height: 85, snowline: -1, forms: ['mesa', 'dome', 'ridge'] },
  },
  {
    id: 'canyon',
    name: 'Canyon plateau',
    blurb: 'Flat-topped country broken by spires and scree.',
    octaves: [prod(7.0, 0.006, 0.2, 'cos', 0.007, 1.7, 'sin'), prod(4.2, 0.030, 2.4, 'sin', 0.028, 0.9, 'cos'), wave(2.0, 0.058, 0.049, 0.6)],
    ramps: [{ axis: 'x', beyond: 190, dir: 'gt', slope: 0.10, max: 24 }],
    road: { waves: [{ amp: 2.0, cycles: 4, phase: 0.9 }], crests: [{ at: 0.22, height: 5.0, width: 0.0003 }, { at: 0.71, height: 3.4, width: 0.00045 }] },
    surfaces: { road: 'gravel', offroad: 'sand', bands: [{ from: 0.15, to: 0.35, surface: 'mud' }], zones: [] },
    scenery: [COVER, ground('rockSpire', 40, 16), ground('boulder', 30, 15), ground('rock', 160, 12), ground('scree', 140, 12), ground('cactus', 40, 14), ground('deadTree', 30, 14)],
    padSurface: 'gravel',
    mountains: { count: 22, radius: 680, height: 95, snowline: -1, forms: ['mesa', 'horn', 'ridge'] },
  },
  {
    id: 'coast',
    name: 'Coast and harbour',
    blurb: 'The land falls into the sea on one side. Boats float, willows line the shore.',
    octaves: [prod(6.0, 0.0085, 2.4, 'sin', 0.0095, 0.9, 'cos'), prod(2.6, 0.021, 0.3, 'sin', 0.024, 1.6, 'sin'), wave(1.2, 0.038, 0.045, 2.0)],
    ramps: [
      { axis: 'x', beyond: -195, dir: 'lt', slope: -0.155, max: -42 },
      { axis: 'z', beyond: 250, dir: 'gt', slope: -0.13, max: -30 },
      { axis: 'x', beyond: 175, dir: 'gt', slope: 0.085, max: 22 },
    ],
    road: { waves: [{ amp: 2.2, cycles: 3, phase: 0.4 }, { amp: 0.9, cycles: 6, phase: 2.6 }], crests: [{ at: 0.42, height: 3.4, width: 0.00036 }] },
    surfaces: {
      road: 'tarmac',
      offroad: 'gravel',
      bands: [{ from: 0.34, to: 0.55, surface: 'gravel' }],
      zones: [{
        id: 'foreshore', surface: 'sand', onRoad: false, offRoad: true,
        any: [{ kind: 'halfPlane', axis: 'x', op: 'lt', value: -252 }, { kind: 'halfPlane', axis: 'z', op: 'gt', value: 268 }],
      } as SurfaceZone],
    },
    scenery: [COVER, ground('pine', 90, 15), ground('oak', 70, 15), ground('willow', 40, 12), ground('reeds', 110, 12), ground('bush', 140, 12), ground('rock', 90, 13), ground('lobsterPots', 24, 8, { spread: 0.98 }), ground('buoy', 22, 6, { spread: 0.98 })],
    water: { level: -7, color: '#3f8aa4', deep: '#124a66', deepAt: 8, opacity: 0.8 },
    padSurface: 'tarmac',
    mountains: { count: 22, radius: 680, height: 95, snowline: 0.1 },
  },
  {
    id: 'deepwood',
    name: 'Deep forest',
    blurb: 'Low relief, close trees. The one where you cannot see the corner.',
    octaves: [prod(4.2, 0.012, 1.1, 'sin', 0.011, 2.8, 'cos'), prod(2.0, 0.032, 0.6, 'sin', 0.029, 1.4, 'sin'), wave(1.0, 0.06, 0.055, 1.8)],
    ramps: [],
    road: { waves: [{ amp: 2.8, cycles: 4, phase: 0.2 }, { amp: 1.1, cycles: 9, phase: 1.7 }], crests: [{ at: 0.55, height: 3.8, width: 0.00032 }] },
    surfaces: { road: 'gravel', offroad: 'mud', bands: [{ from: 0.2, to: 0.45, surface: 'mud' }], zones: [] },
    scenery: [COVER, ground('pine', 320, 13), ground('birch', 180, 13), ground('oak', 90, 14), ground('stump', 70, 12), ground('fallenLog', 45, 13), ground('bush', 220, 10), ground('rock', 80, 12)],
    padSurface: 'gravel',
    mountains: { count: 16, radius: 640, height: 70, snowline: -0.6, forms: ['dome', 'ridge', 'dome'] },
  },
  {
    id: 'vineyard',
    name: 'Vineyard terraces',
    blurb: 'A worked slope: terrace walls, olives and orchards.',
    octaves: [prod(6.5, 0.0095, 1.4, 'sin', 0.0088, 0.2, 'cos'), prod(2.4, 0.026, 2.0, 'sin', 0.023, 1.1, 'sin'), wave(1.0, 0.044, 0.036, 0.8)],
    ramps: [{ axis: 'x', beyond: 120, dir: 'gt', slope: 0.075, max: 20 }],
    road: { waves: [{ amp: 2.6, cycles: 3, phase: 1.0 }, { amp: 1.0, cycles: 6, phase: 2.0 }], crests: [{ at: 0.48, height: 3.0, width: 0.0004 }] },
    surfaces: { road: 'tarmac', offroad: 'gravel', bands: [{ from: 0.25, to: 0.45, surface: 'gravel' }], zones: [] },
    scenery: [COVER, ground('oliveTree', 80, 14), ground('orchardTree', 70, 13), ground('oak', 45, 15), ground('terraceWall', 55, 14), ground('stoneWall', 45, 14), ground('bush', 120, 12), ground('rock', 60, 13)],
    padSurface: 'tarmac',
    mountains: { count: 20, radius: 660, height: 80, snowline: -0.3 },
  },
  {
    id: 'glacial',
    name: 'Snowfield',
    blurb: 'Everything above the line is white, and some of it is ice.',
    octaves: [prod(8.0, 0.010, 0.9, 'sin', 0.0105, 1.9, 'cos'), prod(3.0, 0.028, 1.5, 'sin', 0.026, 0.2, 'sin'), wave(1.3, 0.047, 0.041, 2.7)],
    ramps: [{ axis: 'z', beyond: 40, dir: 'gt', slope: 0.06, max: 16 }],
    road: { waves: [{ amp: 3.0, cycles: 2, phase: 1.9 }, { amp: 1.2, cycles: 5, phase: 0.6 }], crests: [{ at: 0.4, height: 4.0, width: 0.00033 }] },
    surfaces: {
      road: 'snow',
      offroad: 'snow',
      bands: [{ from: 0.5, to: 0.7, surface: 'ice' }],
      zones: [{
        id: 'icefield', surface: 'ice', onRoad: false, offRoad: true,
        any: [{ kind: 'aboveHeight', height: 10 }],
      } as SurfaceZone],
    },
    scenery: [COVER, ground('pine', 130, 15, { avoidSurfaces: ['ice'] }), ground('deadTree', 50, 14), ground('rock', 110, 13), ground('scree', 70, 13), ground('boulder', 20, 16)],
    padSurface: 'snow',
    mountains: { count: 26, radius: 660, height: 130, snowline: 1, forms: ['ridge', 'dome', 'spire'] },
  },
];

export const WEATHERS: WeatherPreset[] = [
  {
    id: 'noon', name: 'Clear noon', blurb: 'High sun, long views, hard shadows.',
    stops: ['#2f6fbe', '#79a8d8', '#cfdfe8', '#e6dcc4'],
    fogColor: '#cfdfe8', fogNear: 280, fogFar: 1050,
    sunColor: '#fff4dc', sunIntensity: 2.35, sunDir: [-70, 95, 45],
    hemiSky: '#cfe6ff', hemiGround: '#6a7a52', hemiIntensity: 0.95, clouds: 12, snowlineBias: 0,
  },
  {
    id: 'overcast', name: 'Overcast', blurb: 'Flat grey light and a close horizon. v1’s farmland.',
    stops: ['#6f8ca8', '#9aabbd', '#c3cbd2', '#d4d8d6'],
    fogColor: '#c3cbd2', fogNear: 170, fogFar: 950,
    sunColor: '#ffe4ce', sunIntensity: 1.35, sunDir: [-40, 70, -60],
    hemiSky: '#9fb2c6', hemiGround: '#6a6350', hemiIntensity: 1.15, clouds: 22, snowlineBias: -0.1,
  },
  {
    id: 'golden', name: 'Golden hour', blurb: 'Low warm sun raking across the land.',
    stops: ['#2b5f9e', '#8fa8c8', '#f0c98e', '#ffd9a0'],
    fogColor: '#f2ddb6', fogNear: 240, fogFar: 1200,
    sunColor: '#ffc98a', sunIntensity: 2.9, sunDir: [-160, 34, 20],
    hemiSky: '#cfd8f0', hemiGround: '#8a6a44', hemiIntensity: 0.8, clouds: 9, snowlineBias: 0,
  },
  {
    id: 'storm', name: 'Storm light', blurb: 'Dark sky, tight fog, one cold sun.',
    stops: ['#26313d', '#41505f', '#6b7885', '#8a9098'],
    fogColor: '#6f7a85', fogNear: 110, fogFar: 620,
    sunColor: '#cfd8e2', sunIntensity: 1.05, sunDir: [60, 60, -80],
    hemiSky: '#7d8b99', hemiGround: '#40453f', hemiIntensity: 1.0, clouds: 26, snowlineBias: -0.25,
  },
  {
    id: 'snowfall', name: 'Snowfall', blurb: 'Pale and quiet, with the snow line pushed down.',
    stops: ['#639fd8', '#a7c6e0', '#e2edf6', '#eaf3fa'],
    fogColor: '#e2edf6', fogNear: 200, fogFar: 900,
    sunColor: '#fff2dc', sunIntensity: 1.9, sunDir: [50, 80, 40],
    hemiSky: '#9ec4f2', hemiGround: '#8fa0c8', hemiIntensity: 0.9, clouds: 20, snowlineBias: 0.35,
  },
  {
    id: 'dust', name: 'Dust haze', blurb: 'Hot, hazy and orange. Nothing far away is sharp.',
    stops: ['#3a86c9', '#8fb4d2', '#e8c79a', '#f0d6ac'],
    fogColor: '#e8c79a', fogNear: 200, fogFar: 1000,
    sunColor: '#ffedcc', sunIntensity: 3.05, sunDir: [-30, 110, 30],
    hemiSky: '#a8cdea', hemiGround: '#b85a38', hemiIntensity: 0.75, clouds: 5, snowlineBias: -0.4,
  },
  {
    id: 'seaMist', name: 'Sea mist', blurb: 'Soft, damp and bright. Built for the coast.',
    stops: ['#3f84c4', '#8db6d6', '#dde6e8', '#e8ece9'],
    fogColor: '#dde6e8', fogNear: 220, fogFar: 1150,
    sunColor: '#ffeed0', sunIntensity: 2.3, sunDir: [-95, 88, -35],
    hemiSky: '#b8d4ec', hemiGround: '#9a9484', hemiIntensity: 0.9, clouds: 16, snowlineBias: 0,
  },
];

/** Build a whole track from a land, a weather and a loop.
 *
 *  Everything a preset does is DATA the panel can then edit — there is no
 *  hidden state and nothing here the editor cannot express. Choosing a preset
 *  is choosing a starting point, not a mode. */
export function composeTrack(
  land: LandPreset, weather: WeatherPreset, points: [number, number][], seed: number,
): TrackDef {
  const id = `track-${Date.now().toString(36)}`;
  return {
    schema: 1,
    id,
    name: `${land.name.toUpperCase()}`,
    author: 'editor',
    notes: `New track: ${land.name} in ${weather.name.toLowerCase()}.`,
    seed,
    world: { size: 900, meshRes: 224, sdfRes: 220 },
    road: { points, halfWidth: 7, blend: 16, samples: 480 },
    start: { padRadius: 48, padSurface: land.padSurface, tuningRings: false },
    terrain: {
      octaves: structuredClone(land.octaves),
      ramps: structuredClone(land.ramps),
      road: structuredClone(land.road),
    },
    ...(land.water ? { water: structuredClone(land.water) } : {}),
    surfaces: structuredClone(land.surfaces),
    scenery: structuredClone(land.scenery),
    props: [],
    sky: {
      stops: [...weather.stops],
      fogColor: weather.fogColor,
      fogNear: weather.fogNear,
      fogFar: weather.fogFar,
      hemiSky: weather.hemiSky,
      hemiGround: weather.hemiGround,
      hemiIntensity: weather.hemiIntensity,
      sunColor: weather.sunColor,
      sunIntensity: weather.sunIntensity,
      sunDir: [...weather.sunDir],
      mountains: {
        ...structuredClone(land.mountains),
        // the weather moves the snow line without redefining the range
        snowline: Math.max(-1, Math.min(1, land.mountains.snowline + weather.snowlineBias)),
      },
      clouds: weather.clouds,
    },
  } as TrackDef;
}
