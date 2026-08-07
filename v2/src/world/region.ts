/* PHASE 4 — THE BIBLE.
 *
 * `RALLY_WORLD_BIBLE.md` is normative about appearance in the same way
 * `RALLY_RULES.md` is normative about physics: *"If the world does not match
 * this document, the world is wrong."* Until now v2's renderer did not match
 * it at all. It carried a hand-picked hex palette per legacy biome, six
 * colours each, chosen by eye — the file said so, in a comment admitting they
 * were placeholders.
 *
 * This module is the bridge. Everything a region looks like now comes from
 * `biomes.constants.ts`, and the three conversions that stand between a
 * specification and a renderer are done here, once, where they can be read:
 *
 *   colour temperature -> RGB      the sun is 5600 K, not "warm white"
 *   EV100 -> tone-mapping exposure the standard photographic relation
 *   lux -> renderer intensity      which, with the exposure above, is just lux
 *
 * The point of doing it this way rather than eyeballing a hex value is the
 * bible's own claim: two implementations built from that file should be
 * visually interchangeable. A number you converted is checkable. A number you
 * picked is not.
 */
import {
  LEGACY_BIOME_MAP,
  MATERIALS,
  REGIONS,
  REGION_LINT,
  type RegionDef,
} from '../../../spec/biomes.constants.ts';

/** The region a legacy biome key resolves to (§3.11). */
export function regionFor(biome: string): RegionDef {
  const key = LEGACY_BIOME_MAP[biome] ?? biome;
  const region = REGIONS[key];
  if (!region) {
    throw new Error(
      `no region for biome "${biome}" — §3.11 maps the legacy keys and the ` +
      'constants file is the authority. Add the mapping there, not a fallback here.',
    );
  }
  return region;
}

/**
 * Colour temperature to linear RGB, on the Planckian locus.
 *
 * A blackbody at 5600 K is a specific colour, and the specification gives one
 * per region — so it is computed rather than chosen. This is the standard
 * piecewise fit to the locus over 1000–40000 K, in sRGB primaries; the result
 * is normalised so the brightest channel is 1, because the brightness is
 * carried by `directionalLux` and must not be applied twice.
 */
export function kelvinToRgb(kelvin: number): [number, number, number] {
  const t = Math.max(1000, Math.min(40000, kelvin)) / 100;
  let r: number;
  let g: number;
  let b: number;

  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const clamp = (v: number) => Math.max(0, Math.min(255, v)) / 255;
  const out: [number, number, number] = [clamp(r), clamp(g), clamp(b)];
  const peak = Math.max(...out) || 1;
  return [out[0] / peak, out[1] / peak, out[2] / peak];
}

/* THE PHOTOMETRIC UNITS ARE USED AS RATIOS, AND THAT IS AN ADMISSION.
 *
 * The bible specifies light the way a photographer would: a sun in lux at a
 * colour temperature, an ambient fraction, a base EV100. Consuming those
 * absolutely needs a physically-based pipeline — MeshStandardMaterial, a sky
 * with a real luminance, tone mapping applied to every shader. This renderer
 * is MeshLambert and a raw ShaderMaterial sky dome, and it was tried:
 * a physical exposure of 4e-5 turned Safari into a correct desert sky over
 * black sand, and the sky dome, which bypasses tone mapping entirely, went
 * black on every stage.
 *
 * So the absolute values are normalised against a reference region. What
 * survives is every RATIO the bible cares about — a 118,000 lux oasis is
 * brighter than a 95,000 lux alpine pass by exactly the factor it says, an
 * ambient of 0.42 fills more than one of 0.35, and a region with a higher base
 * EV100 is exposed down relative to one with a lower one. What is lost is the
 * claim that a surface reads at a specific cd/m², which this renderer could
 * not honour anyway. Written down rather than quietly fudged; making it true
 * is a renderer change, not a constants change.
 */

/** Alpine Pass, the first region in the document, is the datum. */
const REFERENCE_LUX = 95_000;
const REFERENCE_AMBIENT = 0.35;
const REFERENCE_EV100 = 14.2;
/** What the renderer used before any of this, and still looks right. */
const REFERENCE_SUN_INTENSITY = 2.3;
const REFERENCE_HEMI_INTENSITY = 1.0;
const REFERENCE_EXPOSURE = 1.05;

/**
 * Exposure, and why `baseEV100` is NOT consumed.
 *
 * The obvious move is a relative exposure — one stop of EV100 per halving, as
 * on a camera. It was tried and it is wrong here, because it double-counts.
 * In a physical pipeline a brighter region means both more light AND less
 * exposure, and the two cancel; the EV100 is the whole scene's brightness,
 * including how bright its ground is, not just its sun. This renderer only
 * scales the sun, so applying the EV100 as well took Deep Desert — 2 stops
 * above the reference — down to a third of the brightness it should have, and
 * a desert at noon came out as dusk.
 *
 * So the region's relative brightness is carried by lux and ambient alone, and
 * `baseEV100` has no consumer. That is a gap, and it is the honest place to
 * leave it: the field is read, printed by the lint, and unused, rather than
 * applied somewhere it makes the picture worse.
 */
export function ev100ToExposure(_ev100: number): number {
  return REFERENCE_EXPOSURE;
}

/*
 * The intensities are BOUNDED, and that is the third thing this file has had to
 * admit to.
 *
 * Scaling the sun linearly by lux looks right until a region's ground base is
 * nearly white. Nordic Winter pairs a high sun with snow, which is correct
 * photographically and, in a renderer with no absolute exposure to expose it
 * against, clips: Ouninpohja came out as a white screen with a red car on it.
 *
 * So the ratio is applied over a narrow band around the reference — enough
 * that a desert reads brighter than an alpine pass, not enough that any region
 * can blow out. The alternative was to keep every region identically lit,
 * which loses the only part of the photometry this renderer can express.
 */
const INTENSITY_SPREAD = 0.35;

function ratioAround(value: number, reference: number, base: number): number {
  const r = value / reference;
  const bounded = 1 + (r - 1) * INTENSITY_SPREAD;
  return base * Math.max(0.75, Math.min(1.3, bounded));
}

export function luxToIntensity(lux: number): number {
  return ratioAround(lux, REFERENCE_LUX, REFERENCE_SUN_INTENSITY);
}

export function ambientToIntensity(ambient: number): number {
  return ratioAround(ambient, REFERENCE_AMBIENT, REFERENCE_HEMI_INTENSITY);
}

/** #rrggbb to a 0xrrggbb number, because three.js wants the latter and the
 *  bible is written in the former. */
export function hexToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/** HSL saturation of a hex colour, 0..1 — the quantity R02 constrains. */
export function saturationOf(hex: string): number {
  const n = hexToInt(hex);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const l = (max + min) / 2;
  return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

/** Hue in degrees, 0..360. R01 measures asset colours against the palette with
 *  a 12-degree tolerance. */
export function hueOf(hex: string): number {
  const n = hexToInt(hex);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/** Shortest angular distance between two hues, degrees. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * The sun's world direction.
 *
 * The bible gives azimuth "relative to stage forward", which is the detail
 * that makes a region's light belong to the stage rather than to the compass:
 * two stages in the same region, laid out in different directions, are lit the
 * same way relative to the road. So the stage's opening heading is the datum.
 *
 * Returns a unit vector pointing FROM the sun toward the scene, ready to place
 * a directional light by negating it.
 */
export function sunDirection(
  region: RegionDef,
  stageHeadingRad: number,
): { x: number; y: number; z: number } {
  const el = (region.lighting.sunElevationDeg * Math.PI) / 180;
  const az = stageHeadingRad + (region.lighting.sunAzimuthDeg * Math.PI) / 180;
  // Heading convention: a yaw of `a` points along (sin a, cos a) in xz.
  return { x: -Math.sin(az) * Math.cos(el), y: -Math.sin(el), z: -Math.cos(az) * Math.cos(el) };
}

/**
 * §16's surface id to §1's material.
 *
 * The road's colour is specified — it is just specified in the material
 * library rather than in the region palette, because a gravel road is the same
 * gravel in Kenya and in Finland and it is the LIGHT that differs. Deriving it
 * from the region's ground base instead, which is what the first cut did, put
 * an orange road on orange sand and broke G1: "the roadbed is always the
 * highest-contrast element in frame."
 */
const SURFACE_MATERIAL: Record<string, string> = {
  tarmac_dry: 'tarmac_worn',
  tarmac_wet: 'cobble_wet',
  tarmac_patched: 'tarmac_worn',
  gravel_hardpack: 'gravel_road',
  gravel_loose: 'gravel_road',
  gravel_deep: 'gravel_road',
  dirt_dry: 'dirt_packed',
  dirt_wet: 'mud_wet',
  mud: 'mud_wet',
  sand: 'sand_fine',
  snow_packed: 'snow_packed_mat',
  snow_deep: 'snow_fresh',
  ice: 'ice_black',
  cobble: 'cobble_wet',
  bridge_plank: 'timber_weathered',
  grass_dry: 'gravel_road',
  grass_wet: 'mud_wet',
  water_shallow: 'mud_wet',
  cattle_grid: 'steel_guardrail',
};

export function roadMaterialFor(surfaceId: string): number {
  const key = SURFACE_MATERIAL[surfaceId] ?? 'gravel_road';
  return hexToInt(MATERIALS[key]!.albedo);
}

/** Relative luminance, 0..1, for the G1/R12 contrast check. */
export function luminanceOf(hex: number): number {
  const r = ((hex >> 16) & 255) / 255;
  const g = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Everything the renderer needs, converted once. */
export interface RegionRender {
  region: RegionDef;
  skyZenith: number;
  skyHorizon: number;
  ground: number;
  foliage: number;
  structure: number;
  accent: number;
  fogColour: number;
  /** §0 FogExp2 density, to the five decimals R05 asks for. */
  fogDensity: number;
  sunColour: [number, number, number];
  /** The specification's own figure, kept for the lint. */
  sunLux: number;
  /** What the renderer is given — see the note on ratios above. */
  sunIntensity: number;
  ambientIntensity: number;
  exposure: number;
  sightLineMetres: number;
}

export function renderSettings(biome: string, override?: string): RegionRender {
  const region = override ? regionFor(override) : regionFor(biome);
  const p = region.palette;
  const l = region.lighting;
  return {
    region,
    skyZenith: hexToInt(p.skyZenith),
    skyHorizon: hexToInt(p.skyHorizon),
    ground: hexToInt(p.groundBase),
    foliage: hexToInt(p.foliageMid),
    structure: hexToInt(p.structurePrimary),
    accent: hexToInt(p.accent),
    fogColour: hexToInt(l.fogColour),
    fogDensity: l.fogDensity,
    sunColour: kelvinToRgb(l.colourTemperatureK),
    sunLux: l.directionalLux,
    sunIntensity: luxToIntensity(l.directionalLux),
    ambientIntensity: ambientToIntensity(l.ambientIntensity),
    exposure: ev100ToExposure(l.baseEV100),
    sightLineMetres: region.sightLineMetres,
  };
}

export { REGION_LINT, REGIONS, type RegionDef };

// ---------------------------------------------------------------------------
// §5 AUTHORING CHECKLIST — the checks that are answerable from data
// ---------------------------------------------------------------------------
//
// Twelve are specified. Four can be answered by reading the region definition
// and the material library; the rest are claims about rendered frames (R06
// silhouette readability, R11 grade under three variants, R12 contrast at the
// sight line) or about content that does not exist yet (R07 settlements, R08
// fords, R09 fauna). Those are reported as SKIPPED with the reason, the same
// rule §15's lint follows: a check that returns green without running is worse
// than no check.

export interface RegionLintResult {
  id: string;
  status: 'pass' | 'fail' | 'skip';
  detail: string;
}

export function lintRegion(regionKey: string): RegionLintResult[] {
  const r = REGIONS[regionKey];
  if (!r) return [{ id: 'R00', status: 'fail', detail: `no region "${regionKey}"` }];
  const out: RegionLintResult[] = [];
  const pass = (id: string, detail: string) => out.push({ id, status: 'pass', detail });
  const fail = (id: string, detail: string) => out.push({ id, status: 'fail', detail });
  const skip = (id: string, detail: string) => out.push({ id, status: 'skip', detail });

  // R01 — every asset albedo falls within the region palette or greyscale,
  // tolerance 12 degrees of hue. The assets this build draws are the road
  // material and the palette itself, so that is what is measured.
  {
    const hues = Object.values(r.palette).map(hueOf);
    const road = roadMaterialFor(Object.keys(r.surfaceMix)[0] ?? 'gravel_loose');
    const roadSat = saturationOf(`#${road.toString(16).padStart(6, '0')}`);
    const roadHue = hueOf(`#${road.toString(16).padStart(6, '0')}`);
    const nearest = Math.min(...hues.map((h) => hueDistance(h, roadHue)));
    // Greyscale is explicitly allowed, and a road material at 12% saturation
    // is greyscale by any reasonable reading of G2.
    roadSat < 0.18 || nearest <= REGION_LINT.paletteHueToleranceDeg
      ? pass('R01', `road material ${roadSat < 0.18 ? 'is greyscale' : `within ${nearest.toFixed(0)}° of the palette`}`)
      : fail('R01', `road material ${nearest.toFixed(0)}° from the nearest palette hue and ${(roadSat * 100).toFixed(0)}% saturated`);
  }

  // R02 — foliage saturation <= 55%, structure <= 45% except the accent.
  {
    const foliage = saturationOf(r.palette.foliageMid);
    const structure = saturationOf(r.palette.structurePrimary);
    const bad: string[] = [];
    if (foliage > REGION_LINT.maxFoliageSaturation) bad.push(`foliage ${(foliage * 100).toFixed(0)}%`);
    if (structure > REGION_LINT.maxStructureSaturation) bad.push(`structure ${(structure * 100).toFixed(0)}%`);
    bad.length
      ? fail('R02', `${bad.join(', ')} over the §G3 limit`)
      : pass('R02', `foliage ${(foliage * 100).toFixed(0)}%, structure ${(structure * 100).toFixed(0)}%`);
  }

  skip('R03', 'archetypes are listed but no structures are built yet');

  // R04 — scatter weights sum to 1.0.
  {
    const sum = r.flora.reduce((a, f) => a + f.weight, 0);
    Math.abs(sum - 1) > REGION_LINT.scatterWeightSumTolerance
      ? fail('R04', `flora weights sum to ${sum.toFixed(4)}, not 1.0`)
      : pass('R04', `${r.flora.length} species, weights sum to ${sum.toFixed(3)}`);
  }

  // R05 — lighting values match the document. Trivially true for anything read
  // straight out of it, so what is checked is the part that can drift: that
  // every field the renderer consumes is present and finite, and that the fog
  // density survives to the five decimals the document writes it with.
  {
    const l = r.lighting;
    const finite = [l.sunElevationDeg, l.sunAzimuthDeg, l.colourTemperatureK,
      l.directionalLux, l.ambientIntensity, l.fogDensity].every(Number.isFinite);
    const decimals = l.fogDensity.toFixed(5);
    finite && Number(decimals) === l.fogDensity
      ? pass('R05', `${l.colourTemperatureK} K, ${l.directionalLux} lux at ${l.sunElevationDeg}°, fog ${decimals}`)
      : fail('R05', `lighting incomplete or fog density loses precision at 5 dp (${l.fogDensity})`);
  }

  skip('R06', 'silhouette readability is a claim about rendered frames');
  skip('R07', 'no settlements are built yet');
  skip('R08', 'no fords are built yet');
  skip('R09', 'no fauna are built yet');

  // R10 — the negative list. Every region has one and it is prose, so what can
  // be checked is that it exists and that nothing on it is silently ignored.
  r.neverList.length
    ? pass('R10', `${r.neverList.length} prohibitions, none automatable yet`)
    : fail('R10', 'no negative list');

  skip('R11', 'needs the low-sun and adverse variants, which are §G8 and not built');

  // R12/G1 — the road must out-contrast the terrain. Measured in luminance
  // against the region's ground base, which is the comparison the renderer
  // actually makes; the "at the sight line through fog" part of the check
  // needs a frame and is not claimed.
  {
    const road = roadMaterialFor(Object.keys(r.surfaceMix)[0] ?? 'gravel_loose');
    const delta = Math.abs(luminanceOf(road) - luminanceOf(hexToInt(r.palette.groundBase)));
    delta < 0.10
      ? fail('R12', `road and ground differ by ${(delta * 100).toFixed(1)}% luminance — G1 needs the road to read`)
      : pass('R12', `road/ground luminance gap ${(delta * 100).toFixed(1)}%`);
  }

  return out;
}
