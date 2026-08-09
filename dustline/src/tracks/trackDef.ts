// WHAT A TRACK IS.
//
// Before this file, a track was a literal in the Terrain constructor and its
// character lived in three hand-written functions: `hills()` decided the
// landscape, `roadHeight()` decided the crests, `surfaceIdAt()` decided where
// the snow, mud, sand and gravel were — with the snow line at `z < -150`, the
// mud at `(-210, 160) r 80`, and the sand at `x > 190`, all typed in.
//
// That is fine for one track and impossible for twenty-five. Worse, it means
// changing a world is a code change: to move a snow line you edit a comparison
// operator inside a function that also feeds the physics collider.
//
// So: everything that made THAT track that track is now data, and the terrain
// generator is a pure function of this shape. Nothing here imports three.js,
// Rapier, or anything else — a TrackDef is a value you can serialise, diff,
// hash, post in a bug report, or hand to an editor.
//
// DESIGN RULE: this format must be able to express the original track EXACTLY.
// Not approximately — exactly, to the last coefficient. `dustbowl.json` is that
// proof: it is the old hardcoded world written out in this format, and the
// terrain it generates is identical to what the constructor used to produce.
// A format that cannot round-trip the content you already have is a format that
// silently throws some of it away.

export type SurfaceId = 'tarmac' | 'gravel' | 'mud' | 'snow' | 'ice' | 'sand';

export const SURFACE_IDS: SurfaceId[] = ['tarmac', 'gravel', 'mud', 'snow', 'ice', 'sand'];

// ---------------------------------------------------------------------------
// terrain height
// ---------------------------------------------------------------------------

/** `amp * sin(x*fx + z*fz + phase)` — a plane wave at any orientation.
 *  Covers ridges running diagonally, which a separable product cannot. */
export interface WaveOctave {
  kind: 'wave';
  amp: number;
  fx: number;
  fz: number;
  phase: number;
}

/** `amp * fx(x*freqX + phaseX) * fz(z*freqZ + phaseZ)` — separable, and what
 *  gives rolling country its two-directional lumpiness. */
export interface ProductOctave {
  kind: 'product';
  amp: number;
  freqX: number; phaseX: number; fnX: 'sin' | 'cos';
  freqZ: number; phaseZ: number; fnZ: 'sin' | 'cos';
}

export type HeightOctave = WaveOctave | ProductOctave;

/** A one-sided ramp: ground climbs (or falls) beyond a line on one axis and
 *  then stops. The original's "north rises to the snow line" is exactly this. */
export interface Ramp {
  axis: 'x' | 'z';
  /** ramp applies where the axis value is beyond this, in direction `dir` */
  beyond: number;
  dir: 'lt' | 'gt';
  /** metres of rise per world unit past `beyond` */
  slope: number;
  /** rise is clamped here */
  max: number;
}

/** Road-surface elevation along the lap, as a function of t in [0,1). */
export interface RoadProfile {
  /** `amp * sin(t*2PI*cycles + phase)` */
  waves: { amp: number; cycles: number; phase: number }[];
  /** gaussian bumps: `height * exp(-(t-at)^2 / width)`. This is how a jump is
   *  authored — a narrow width is a kicker, a wide one is a hill. */
  crests: { at: number; height: number; width: number }[];
}

// ---------------------------------------------------------------------------
// surface zones
// ---------------------------------------------------------------------------

export interface CirclePredicate {
  kind: 'circle';
  x: number; z: number;
  radius: number;
  /** off-road radius, if the zone should bleed wider outside the road than on
   *  it (the original mud does: 80 on the road, 90 off it) */
  offroadRadius?: number;
}

export interface HalfPlanePredicate {
  kind: 'halfPlane';
  axis: 'x' | 'z';
  op: 'lt' | 'gt';
  value: number;
}

export interface AboveHeightPredicate {
  kind: 'aboveHeight';
  height: number;
}

export type ZonePredicate = CirclePredicate | HalfPlanePredicate | AboveHeightPredicate;

/** A named region of the map that overrides the surface. Predicates are OR'd:
 *  the original snow zone is "north of z=-150 OR higher than 13 m", which is
 *  one zone with two predicates, not two zones. */
export interface SurfaceZone {
  id: string;
  surface: SurfaceId;
  any: ZonePredicate[];
  /** applies to the road corridor itself */
  onRoad: boolean;
  /** applies to the open country */
  offRoad: boolean;
  /** optional banding WITHIN this zone, along t — the original's ice patches
   *  on the snow leg: every 0.07 of a lap, the first 0.012 is ice. */
  stripe?: { period: number; duty: number; surface: SurfaceId };
}

/** A stretch of the road corridor, by lap fraction, with its own surface. */
export interface RoadBand {
  from: number;
  to: number;
  surface: SurfaceId;
}

// ---------------------------------------------------------------------------
// scenery
// ---------------------------------------------------------------------------

/** A scatter layer names a COMPONENT by id (see world/props/) rather than
 *  choosing from a closed list of hardcoded kinds. Adding a plantable thing to
 *  the game is adding a file, not editing an enum and three switch statements. */
export interface SceneryLayer {
  template: string;
  count: number;
  /** rejected if closer than this to the road centreline */
  minRoadDist: number;
  /** rejected if closer than this to the start pad */
  minSpawnDist: number;
  /** rejected on these surfaces; omitted means "use the component's own rule" */
  avoidSurfaces?: SurfaceId[];
  /** uniform scale range; omitted means "use the component's own range" */
  scale?: [number, number];
  /** scale bonus on these surfaces (the original grows bigger rocks on sand) */
  scaleBonusOn?: { surfaces: SurfaceId[]; extra: number };
  /** area sampled, as a fraction of world size */
  spread: number;
}

/** The six skyline silhouettes. See `render/horizon.ts` for what each one is
 *  and why a horizon of nothing but cones was the problem. */
export type HorizonForm = 'pyramid' | 'spire' | 'dome' | 'mesa' | 'horn' | 'ridge';

/** STANDING WATER.
 *
 *  A single level, not a set of lakes: the terrain is a heightfield, so
 *  "everything below this line is wet" describes a sea, a flooded valley and a
 *  lake in a hollow all at once, and costs one number instead of a shape
 *  system. Where the water goes is decided by the LAND — carve a bay with an
 *  octave or a ramp and the water fills it.
 *
 *  Optional. A track without it has no water at all, which is why every track
 *  written before this one still builds byte-identically. */
export interface WaterDef {
  /** world height of the surface; terrain below this is submerged */
  level: number;
  /** surface colour in shallow water */
  color: string;
  /** surface colour over deep water — the gradient is what makes a shore read */
  deep: string;
  /** how far below the surface counts as "deep" */
  deepAt: number;
  opacity: number;
}

/** ONE COMPONENT, PUT SOMEWHERE ON PURPOSE.
 *
 *  The counterpart to a scatter layer: scatter fills a landscape, placement
 *  puts a tyre stack on the outside of turn four. Position is stored in world
 *  units; the ground height is NOT stored, because it is derived at build time
 *  — so a prop stays on the ground when the terrain under it is edited, which
 *  is the behaviour you want every single time. */
export interface PlacedProp {
  /** component id, e.g. "tyreStack" */
  template: string;
  x: number;
  z: number;
  /** yaw in radians */
  rot: number;
  scale: number;
  /** lift off the ground, for the rare deliberate float */
  yOffset?: number;
}

// ---------------------------------------------------------------------------
// the track
// ---------------------------------------------------------------------------

export interface TrackDef {
  schema: 1;
  id: string;
  name: string;
  author?: string;
  notes?: string;

  /** Every random choice made while building this track derives from here, so
   *  the same track builds the same world on every machine and every load.
   *  Change it to reshuffle the scatter without touching anything else. */
  seed: number;

  world: {
    /** world square, metres, centred on the origin */
    size: number;
    /** terrain grid resolution — shared by the render mesh and the collider */
    meshRes: number;
    /** resolution of the baked road-distance field */
    sdfRes: number;
  };

  road: {
    /** control points of a CLOSED centripetal Catmull-Rom curve */
    points: [number, number][];
    /** drivable half-width */
    halfWidth: number;
    /** terrain flattens toward the road within this distance beyond the edge */
    blend: number;
    /** how many samples the loop is baked to */
    samples: number;
  };

  start: {
    /** flat apron radius at the start line */
    padRadius: number;
    padSurface: SurfaceId;
    /** draw the two painted rings of the M1 tuning circuit on the apron */
    tuningRings: boolean;
  };

  terrain: {
    octaves: HeightOctave[];
    ramps: Ramp[];
    road: RoadProfile;
  };

  surfaces: {
    road: SurfaceId;
    offroad: SurfaceId;
    bands: RoadBand[];
    zones: SurfaceZone[];
  };

  scenery: SceneryLayer[];

  /** Hand-placed components. Optional so tracks written before placement
   *  existed still load. */
  props?: PlacedProp[];

  /** Standing water. Optional — omit it and the track has none. */
  water?: WaterDef;

  sky: {
    /** four stops of the dome gradient, top to horizon */
    stops: [string, string, string, string];
    fogColor: string;
    fogNear: number;
    fogFar: number;
    hemiSky: string;
    hemiGround: string;
    hemiIntensity: number;
    sunColor: string;
    sunIntensity: number;
    /** sun direction; length is irrelevant, only the bearing matters */
    sunDir: [number, number, number];
    mountains: {
      count: number;
      radius: number;
      height: number;
      snowline: number;
      /** Which silhouettes this world's skyline is built from. Optional — a
       *  track that does not say picks a set from its own seed, so two worlds
       *  are not ringed by the same mountains. See `render/horizon.ts`. */
      forms?: HorizonForm[];
    };
    clouds: number;
  };
}

// ---------------------------------------------------------------------------
// evaluation — pure, and shared by the game and the editor
// ---------------------------------------------------------------------------

const TAU = Math.PI * 2;

export function octaveAt(o: HeightOctave, x: number, z: number): number {
  if (o.kind === 'wave') return Math.sin(x * o.fx + z * o.fz + o.phase) * o.amp;
  const fx = o.fnX === 'sin' ? Math.sin : Math.cos;
  const fz = o.fnZ === 'sin' ? Math.sin : Math.cos;
  // Trig terms first, amplitude last, matching the order the hardcoded terrain
  // multiplied in. Measured, this particular reordering makes no difference at
  // all (delta exactly 0 at the worst sample in the world) — it is kept because
  // matching the original where matching is free costs nothing, and because the
  // next coefficient someone changes might not be so forgiving.
  return fx(x * o.freqX + o.phaseX) * fz(z * o.freqZ + o.phaseZ) * o.amp;
}

export function rampAt(r: Ramp, x: number, z: number): number {
  const v = r.axis === 'x' ? x : z;
  const past = r.dir === 'lt' ? r.beyond - v : v - r.beyond;
  if (past <= 0) return 0;
  const rise = past * r.slope;
  // Clamp TOWARDS ZERO, not with a bare `Math.min`. A ramp with a negative
  // slope descends — which is how a coastline is made, since the water level is
  // one number and the only way to get a sea is to take the land below it — and
  // `Math.min(-34, -0.6)` returns the floor at the very first metre, dropping
  // the whole map off a cliff at the ramp's edge instead of sloping it. For the
  // ascending ramps every existing track uses, this is `Math.min` exactly.
  return r.slope < 0 ? Math.max(r.max, rise) : Math.min(r.max, rise);
}

/** Open-country height before the road is carved into it. */
export function hillsAt(def: TrackDef, x: number, z: number): number {
  let h = 0;
  for (const o of def.terrain.octaves) h += octaveAt(o, x, z);
  for (const r of def.terrain.ramps) h += rampAt(r, x, z);
  return h;
}

/** Road-surface height at lap fraction t. */
export function roadHeightAt(def: TrackDef, t: number): number {
  let h = 0;
  for (const w of def.terrain.road.waves) h += w.amp * Math.sin(t * TAU * w.cycles + w.phase);
  for (const c of def.terrain.road.crests) {
    const d = t - c.at;
    h += c.height * Math.exp(-(d * d) / c.width);
  }
  return h;
}

function predicateHolds(
  p: ZonePredicate, x: number, z: number, height: number, onRoad: boolean,
): boolean {
  switch (p.kind) {
    case 'circle': {
      const r = !onRoad && p.offroadRadius !== undefined ? p.offroadRadius : p.radius;
      return Math.hypot(x - p.x, z - p.z) < r;
    }
    case 'halfPlane': {
      const v = p.axis === 'x' ? x : z;
      return p.op === 'lt' ? v < p.value : v > p.value;
    }
    case 'aboveHeight':
      return height > p.height;
  }
}

/** The surface at a point. `onRoad` and `t` come from the road-distance field,
 *  `height` from the height field — the caller has both already, and passing
 *  them in keeps this function free of any dependency on how they are found. */
export function surfaceAt(
  def: TrackDef, x: number, z: number,
  opts: { onRoad: boolean; t: number; height: number; onPad: boolean },
): SurfaceId {
  if (opts.onPad) return def.start.padSurface;
  for (const zone of def.surfaces.zones) {
    if (opts.onRoad ? !zone.onRoad : !zone.offRoad) continue;
    let hit = false;
    for (const p of zone.any) {
      if (predicateHolds(p, x, z, opts.height, opts.onRoad)) { hit = true; break; }
    }
    if (!hit) continue;
    if (zone.stripe && opts.onRoad) {
      const phase = opts.t % zone.stripe.period;
      if (phase < zone.stripe.duty) return zone.stripe.surface;
    }
    return zone.surface;
  }
  if (opts.onRoad) {
    for (const b of def.surfaces.bands) {
      if (opts.t > b.from && opts.t < b.to) return b.surface;
    }
    return def.surfaces.road;
  }
  return def.surfaces.offroad;
}

// ---------------------------------------------------------------------------
// validation
// ---------------------------------------------------------------------------

export interface TrackIssue {
  level: 'error' | 'warning';
  message: string;
  /** control-point index this concerns, when it concerns one */
  at?: number;
}

/** Everything that can be judged from the definition alone, without building
 *  the world. The editor shows these live; the loader refuses `error`s.
 *
 *  Deliberately NOT a style guide — a track may be ugly. These are the things
 *  that make a track unbuildable or undrivable. */
export function validateTrack(def: TrackDef): TrackIssue[] {
  const out: TrackIssue[] = [];
  const pts = def.road?.points ?? [];

  if (def.schema !== 1) out.push({ level: 'error', message: `unknown schema ${def.schema}` });
  if (pts.length < 4) {
    out.push({ level: 'error', message: `a closed loop needs at least 4 control points, got ${pts.length}` });
    return out;
  }

  const half = def.world.size / 2;
  const margin = def.road.halfWidth + def.road.blend + 10;
  pts.forEach(([x, z], i) => {
    if (!Number.isFinite(x) || !Number.isFinite(z)) {
      out.push({ level: 'error', message: `control point ${i} is not a finite coordinate`, at: i });
    } else if (Math.abs(x) > half - margin || Math.abs(z) > half - margin) {
      out.push({
        level: 'error',
        at: i,
        message: `control point ${i} at (${x.toFixed(0)}, ${z.toFixed(0)}) is outside the buildable area `
          + `(±${(half - margin).toFixed(0)}) — the terrain mesh does not reach it`,
      });
    }
  });

  // Two runs of road closer than a road-width apart merge into one wide, wrong
  // surface, and the AI's nearest-node search jumps between them. The engine
  // has no overpass concept, so this is an error rather than a note.
  const clear = def.road.halfWidth * 2 + 4;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 2; j < pts.length; j++) {
      if (i === 0 && j === pts.length - 1) continue;      // adjacent round the loop
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d < clear) {
        out.push({
          level: 'warning',
          at: j,
          message: `control points ${i} and ${j} are ${d.toFixed(1)} m apart — closer than a road width `
            + `(${clear.toFixed(0)} m); the two runs will merge`,
        });
      }
    }
  }

  if (def.water) {
    // The road is carved to its own profile and is NOT pushed above water, so a
    // level above the road's lowest point floods the circuit. That is a
    // warning rather than an error because a deliberately flooded ford is a
    // real thing to want; drowning the whole lap is not.
    const floor = def.terrain.road.waves.reduce((a, w) => a - Math.abs(w.amp), 0);
    if (def.water.level > floor + 0.5) {
      out.push({
        level: 'warning',
        message: `water level ${def.water.level} is above the road's lowest point (${floor.toFixed(1)}) `
          + '— part of the lap will be underwater',
      });
    }
  }

  if (def.road.samples < 64) out.push({ level: 'error', message: 'road.samples below 64 cannot resolve corners' });
  if (def.world.meshRes < 32) out.push({ level: 'error', message: 'world.meshRes below 32 is not a surface' });
  for (const b of def.surfaces.bands) {
    if (b.from >= b.to) out.push({ level: 'warning', message: `road band ${b.surface} has from >= to and will never apply` });
  }
  for (const l of def.scenery) {
    if (l.count > 4000) out.push({ level: 'warning', message: `${l.template} count ${l.count} is very high and will cost frame rate` });
  }
  return out;
}

export function trackErrors(def: TrackDef): TrackIssue[] {
  return validateTrack(def).filter((i) => i.level === 'error');
}
