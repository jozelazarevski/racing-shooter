// THE SKYLINE FORM LIBRARY — PORTED FROM IGNITE RALLY.
//
// `_horizonForms` and the range placement of `_buildHorizon` from
// `src/world/sky.js` at the repository root. dustline's horizon was a ring of
// five-sided cones — thirty of them, evenly spaced, scale-jittered — and v1's
// own comment is the exact diagnosis:
//
//   "Every world's horizon was two rings of CONES - forty at seven sides,
//    thirty at five - so every world on the roster, from the Alps to a Croatian
//    bay, was ringed by the same pyramids. Scale jitter does not fix that: a
//    scaled pyramid is a pyramid."
//
// Six silhouettes instead, each authored as a unit form (height 1, centred on
// the origin, so the existing seat-and-scale placement is unchanged): a sharp
// pyramid, a thin spire, a rounded whaleback dome, a flat-topped mesa, an
// asymmetric horn — steep face one side, long shoulder the other — and a
// proper saw-tooth RIDGE, which is the one that stops a skyline reading as a
// picket fence of separate hills.
//
// AND THE PLACEMENT IS THE OTHER HALF OF IT. Evenly spaced peaks give the same
// regular saw-tooth whatever shape they are, so massifs clump into a few
// groups with open sky between them, and a group keeps ONE form and one height
// band so it reads as a single range seen from far away.
//
// WHAT CHANGED IN THE PORT: `Math.random()` becomes a seeded stream, because a
// dustline world must rebuild identically; and the near/far rings take their
// radius and height from the track's own `sky.mountains` instead of v1's
// per-theme constants.
//
// THE SHAPES THEMSELVES ARE IN `templates/horizon.ts`. What is left here is the
// PLACEMENT, which is the half of the problem that is about this world rather
// than about mountains.
//
// AND THE MOUNTAINS ARE SOLID. That is the other thing this file does now, and
// the reason is v1's r153b, reported by the owner three times in the same
// words: "I can still enter the mountains instead of hitting them", then
// "Still can enter." with a photograph taken FROM INSIDE A HILLSIDE, then
// "Still see the shark mountains there". v1's r148 had made the drivable
// massif solid and measured 18 runs at its peaks; the SKYLINE was a second
// drawing path nobody had put on any list, and it registered no collider at
// all — 3,464 bare instances across 51 of 60 worlds. dustline shipped with
// exactly the same hole: `buildMountains` returned InstancedMeshes and nothing
// else, so all 343 horizon instances on the roster were bare and a probe
// driven into the dustbowl massif at 54 m/s came out the far side still doing
// 50 m/s.
//
// THE PLACEMENT AND THE SOLID NOW COME OFF ONE FUNCTION. `horizonPeaks()` is
// the single source of truth for where the skyline stands; `buildMountains()`
// draws from it and `horizonSolids()` makes it solid. A mountain cannot be
// drawn in one place and collided in another, and a form cannot be added to
// the library without a solid, because `SOLID_FAMILY` below is exhaustive over
// `HorizonForm` and the build fails without an entry. The r148 -> r153b
// disease was two code paths and one fix; this is one path.

import * as THREE from 'three';
import type { TrackDef, HorizonForm } from '../tracks/trackDef';
import { Rng } from '../core/rng';
import { form, horizonGrad, HORIZON_FORMS } from '../templates/horizon';

export { HORIZON_FORMS };

/** Where the base of every skyline form sits, in world metres.
 *
 *  v1 seats its horizon on its own highland surface; dustline's terrain stops
 *  at the world's edge and the skyline stands beyond it, so the whole ring is
 *  seated on one plane 8 m below zero — deep enough that a peak reads as
 *  standing IN the ground rather than on a pedestal. Named because the solids
 *  have to agree with the drawing about it. */
export const HORIZON_SEAT = -8;

/** EVERY SET CARRIES A DOME AND A RIDGE. A mix of horn and spire is still
 *  three cones in a trenchcoat — the complaint was that every skyline is
 *  pyramids, and a set with no rounded and no linear form does not answer it.
 *  At most one cone-family shape per world. */
const SETS: HorizonForm[][] = [
  ['dome', 'ridge', 'horn'],          // sierra
  ['ridge', 'dome', 'spire'],         // alpine
  ['mesa', 'dome', 'ridge'],          // tableland
  ['dome', 'ridge', 'mesa'],          // downs
  ['ridge', 'dome', 'pyramid'],       // classic range
  ['dome', 'ridge', 'dome'],          // rolling highland
];

/** ONE PEAK, PLACED — everything the drawing and the collider both need.
 *
 *  `w` and `d` are the x and z scales applied to the unit form, `h` its height;
 *  the base of the form lands on `HORIZON_SEAT` whatever `h` is. */
export interface HorizonPeak {
  form: HorizonForm;
  /** 0 near ring, 1 far ring — which InstancedMesh it belongs to */
  ring: 0 | 1;
  x: number;
  z: number;
  h: number;
  w: number;
  d: number;
  yaw: number;
  /** the instance's colour scalar, drawn here so one function owns the stream */
  shade: number;
}

/** WHERE THE SKYLINE STANDS. Seeded, pure, and the only place that decides.
 *
 *  RANGES, NOT A PICKET FENCE. Peaks spaced evenly round the compass give the
 *  same regular saw-tooth whatever shape they are, so a range is a CLUMP of
 *  three to six sharing one form and one height band, with open sky between it
 *  and the next.
 *
 *  Width is derived from each peak's own height rather than given as an
 *  absolute range: a track that asks for 95 m mountains and one that asks for
 *  200 m should get the same PROPORTIONS, and the first cut, which took v1's
 *  metre constants directly, produced 300 m-wide hills on a world whose peaks
 *  are 95 m tall. */
export function horizonPeaks(def: TrackDef): HorizonPeak[] {
  const rng = Rng.fork(def.seed, 'mountains');
  const M = def.sky.mountains;
  if (M.count <= 0) return [];
  // A track may name its own skyline; otherwise it gets one from its seed, so
  // two worlds are not ringed by the same mountains.
  const set = M.forms?.length ? M.forms : SETS[Math.abs(def.seed) % SETS.length];
  // Instances are shared between the two rings per form; `count` is the
  // track's total budget, split near/far the way v1 splits its two rings.
  const cap = Math.max(16, M.count * 6);

  // `count` NOW MEANS MASSIFS, NOT PEAKS. It used to be the number of cones in
  // one evenly spaced ring, and 22 of those around a full circle leaves about
  // five in any one view — which as clumped ranges is three lonely triangles
  // and a lot of empty sky. A massif is three to six peaks, so the same number
  // in a track file now buys roughly the density v1 has. Split near/far.
  const groupsNear = Math.max(2, Math.round(M.count * 0.45));
  const groupsFar = Math.max(2, M.count - groupsNear);

  const out: HorizonPeak[] = [];
  const place = (
    ring: 0 | 1, groups: number,
    r0: number, rSpan: number, h0: number, hSpan: number, wFac: number, snowy: boolean,
  ) => {
    // one budget per form per ring, exactly as the per-form InstancedMesh's
    // own `count` used to be
    const used = new Map<HorizonForm, number>();
    for (let gi = 0; gi < groups; gi++) {
      const aC = (gi / groups) * Math.PI * 2 + rng.centered(0.35);
      const f = set[(gi + ((rng.float() * 1.4) | 0)) % set.length];
      const band = 0.7 + rng.float() * 0.55;          // this range's height
      const n = 3 + ((rng.float() * 4) | 0);
      for (let k = 0; k < n && (used.get(f) ?? 0) < cap; k++) {
        const a = aC + (k - n / 2) * (0.1 + rng.float() * 0.07);
        const r = r0 + rng.float() * rSpan;
        const h = (h0 + rng.float() * hSpan) * band;
        const w = h * wFac * (0.85 + rng.float() * 0.5);
        const px = Math.cos(a) * r, pz = Math.sin(a) * r;
        // a ridge lies ALONG the range, so it is turned to face the middle
        const yaw = f === 'ridge'
          ? a + Math.PI / 2 + rng.centered(0.3)
          : rng.float() * Math.PI;
        const d = w * (0.5 + rng.float() * 0.7);
        // THE COLOUR IS IN THE MAP; the instance carries only a shade, which is
        // v1's scheme and the reason one material serves a whole ring. The
        // track's snowline still does its job through it: a peak past the line
        // is lightened toward the map's pale top, and — unlike the first cut —
        // it must also be TALL enough, because a 40 m hill with a snowcap on it
        // is the giveaway that the snow is a bearing test and not an altitude.
        const white = snowy && Math.sin(a) < M.snowline && h > M.height * 1.15;
        const shade = (white ? 1.0 : 0.78) + rng.float() * 0.18;
        out.push({ form: f, ring, x: px, z: pz, h, w, d, yaw, shade });
        used.set(f, (used.get(f) ?? 0) + 1);
      }
    }
  };

  // Near ring: lower hills standing in front, no snow. Far ring: the range
  // itself, half again as far out and twice as tall, catching snow past the
  // snowline. The track's own radius and height set the near ring; the far one
  // is derived, so one pair of numbers still describes a whole skyline.
  place(0, groupsNear, M.radius, M.radius * 0.10,
    M.height * 0.55, M.height * 0.45, 1.45, false);
  place(1, groupsFar, M.radius * 1.34, M.radius * 0.16,
    M.height * 1.15, M.height * 0.9, 1.2, true);
  return out;
}

export function buildMountains(scene: THREE.Scene, def: TrackDef): THREE.Object3D[] {
  const M = def.sky.mountains;
  const peaks = horizonPeaks(def);
  if (!peaks.length) return [];
  const set = M.forms?.length ? M.forms : SETS[Math.abs(def.seed) % SETS.length];
  const cap = Math.max(16, M.count * 6);

  const out: THREE.Object3D[] = [];
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();

  const layer = (mat: THREE.Material) => {
    const per = new Map<HorizonForm, THREE.InstancedMesh>();
    for (const f of set) {
      if (per.has(f)) continue;
      const mesh = new THREE.InstancedMesh(form(f), mat, cap);
      mesh.count = 0;
      // NAMED SO TOOLS CAN FIND THEM. `tools/verify-solidity.mjs` classifies
      // every drawable in the built scene by this prefix and requires each
      // instance to carry a collider.
      mesh.name = `horizon-${f}`;
      per.set(f, mesh);
      out.push(mesh);
    }
    return per;
  };

  const fog = def.sky.fogColor;
  const rings = [
    layer(new THREE.MeshStandardMaterial({
      map: horizonGrad(0x8195a8, fog, 0.52, 0.10), roughness: 1, flatShading: true,
    })),
    layer(new THREE.MeshStandardMaterial({
      // far ring: paler base and a slight desaturation, so distance reads
      map: horizonGrad(0xdde8f0, fog, 0.68, 0.26, 0.3), roughness: 1, flatShading: true,
    })),
  ];

  for (const p of peaks) {
    const mesh = rings[p.ring].get(p.form)!;
    m4.makeRotationY(p.yaw);
    m4.scale(new THREE.Vector3(p.w, p.h, p.d));
    m4.setPosition(p.x, p.h / 2 + HORIZON_SEAT, p.z);
    const i = mesh.count;
    mesh.setMatrixAt(i, m4);
    col.setScalar(p.shade);
    mesh.setColorAt(i, col);
    mesh.count = i + 1;
  }

  for (const mesh of out as THREE.InstancedMesh[]) {
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (mesh.count) scene.add(mesh);
  }
  return out.filter((m) => (m as THREE.InstancedMesh).count > 0);
}

// ---------------------------------------------------------------------------
// THE SOLID SKYLINE
//
// WHAT A HORIZON COLLIDER HAS TO BE, and why none of the easy answers is it:
//
//   A TRIMESH PER PEAK is the exact answer and is not affordable. There are 343
//   instances on the three committed tracks and this game is going on a phone;
//   a trimesh carries its whole vertex buffer per instance and is the most
//   expensive narrow phase Rapier has.
//   A CONVEX HULL PER PEAK is cheaper and still wrong here for a second reason:
//   `verify-solidity.mjs` reads the built world's colliders and treats any
//   shape with a `vertices` array as the terrain trimesh — Rapier's
//   `ConvexPolyhedron` has one — so 343 hulls would also blind the check that
//   the ground collider is the ground you can see.
//   A BOX PER PEAK is what you reach for and it is the one thing a mountain is
//   not. Measured on the roster with a vertical probe over each footprint, a
//   box round a pyramid averages 98.8 m of invisible rock standing in clear
//   sky where the cone below averages 18.1 m; round a spire, 92.8 m against
//   19.6 m; round a dome, 67.5 m against the sphere's 45.6 m.
//
// So: ONE RAPIER PRIMITIVE PER INSTANCE, chosen per form to follow that form's
// own profile, and sized by MEASURING the geometry rather than by copying
// numbers out of `templates/horizon.ts` — where the shapes live, and where they
// can be edited by somebody who never opens this file. The measurement is the
// point: a hand-copied 0.5 is exactly the kind of number that goes stale
// silently, and a stale number here means a collider inside its own mountain.
//
// ONE COLLIDER PER INSTANCE, AND THE FINER FIT WAS TRIED AND MEASURED. A ridge
// is a saw-tooth wall and one box around it fills in the notches, so it was
// built the other way too: cut at the form's own six drawn stations, a box per
// tooth, its own height and its own depth. Probed over every instance in the
// three committed worlds — a vertical ray on a 24 x 24 grid across each
// footprint, Rapier's own colliders against the drawn triangles — six boxes
// took the MEAN invisible height on a ridge from 69.8 m to 52.7 m on DUSTBOWL
// (52.6 -> 39.7 on HARBOUR POINT, 77.2 -> 58.3 on PROVING GROUND) and moved
// neither worst case at all: 192.5 m -> 192.3 m of invisible height above
// visible rock, and 296.2 m -> 296.2 m on the sideways probe. A quarter of the
// mean for six times the colliders, because what dominates is not the notches
// but the foot of the wall, where any box stands full height over rock that
// has tapered to nothing — and a box is the only primitive a wall has.
//
// So one box, and the census stays honest: 343 colliders for 343 instances
// means `verify-solidity.mjs` counting colliders against instances is EXACT —
// a form that lost its solid cannot hide behind another form's extras. If a
// track ever puts a ridge where a car can reach it, the per-tooth version is
// the first thing to bring back; the numbers above are what it is worth.
//
// THE SHAPES CONTAIN THE ROCK, THEY DO NOT APPROXIMATE IT. Every fit below is
// the smallest member of its family that contains every sampled point of the
// drawn form, so the error has ONE SIGN: a collider may stand proud of the
// mountain, never inside it. That is the direction that fails safe — "I can
// still enter the mountains" is the bug on record, three times, and stopping
// short of a peak the road never goes near is not.
//
// AND WHAT IT LEAVES, measured rather than hoped: 98,784 rays fired at the 343
// instances on the three committed tracks, Rapier's own colliders against the
// drawn triangles, found NO drawn rock outside its own collider — the bug is
// gone in the direction it was reported. What is left is margin, and the
// margin is the price of a surface of revolution on a footprint that is an
// ellipse: a form is scaled `w` across and `d` deep, `d` runs as narrow as half
// of `w`, and one radius has to hold both. So the radius is the LONG axis —
// v1's own cone rule from r148, "the long axis of the drawn footprint... the
// cone rule's trade of a little invisible margin on the short one" — and on
// the narrow flank the collider stands up to (w - d) / 2 proud. On the peaks
// that actually stand on drivable ground that is 33.6 m (DUSTBOWL), 39.5 m
// (HARBOUR POINT) and 55.3 m (PROVING GROUND) within 10 m of the base; out on
// the far ring, where nothing can reach, it runs to 250-296 m on the widest
// ridges. Rapier has no elliptic cone; the fix that would remove this is a
// convex hull per peak, which is barred above for two reasons.
// ---------------------------------------------------------------------------

/** WHAT EACH SILHOUETTE IS MADE OF. Exhaustive over `HorizonForm` on purpose:
 *  a seventh form cannot be added to the library without somebody deciding what
 *  shape it is, because this record will not compile without an entry. That is
 *  the same "no path arrives with no standard applied to it" rule
 *  `verify-solidity.mjs` enforces from outside, made structural from inside. */
const SOLID_FAMILY: Record<HorizonForm, 'cone' | 'ball' | 'cylinder' | 'box'> = {
  // The cone family: these three ARE cones — `ConeGeometry(0.5, 1, 6)`,
  // `ConeGeometry(0.40, 1, 5)` and a sheared cone — so a cone fits them with
  // nothing left over but the sliver between a circle and the polygon
  // inscribed in it.
  pyramid: 'cone',
  spire: 'cone',
  horn: 'cone',
  // A WHALEBACK IS NOT A CONE. The dome's profile bulges: at half height it is
  // 0.336 of the unit width where a cone from the same base is 0.25, so a cone
  // would leave a seventh of its own width of climbable rock hollow up the
  // flank. A sphere through the base rim and the summit contains it, hugs it
  // where the ground is (0.2 m out at a twentieth of the height on a 150 m
  // dome) and only bulges high up where nothing can reach.
  dome: 'ball',
  // FLAT-TOPPED. `CylinderGeometry(0.30, 0.52, 1, 6)` still has 58 % of its
  // width at the summit; a cone would come to a point 0.30 of a width inside
  // the drawn table.
  mesa: 'cylinder',
  // A WALL, NOT A PEAK. The ridge is a saw-tooth run of slabs, and the one
  // primitive that contains a wall is a box turned to lie along it.
  ridge: 'box',
};

/** The measured profile of one unit form: how far the drawn surface reaches
 *  from the instance's own vertical axis, in bands of height. */
interface Silhouette {
  base: number;
  top: number;
  /** half extents about the origin — the box family's own dimensions */
  hx: number;
  hz: number;
  /** per band: the farthest any drawn point in it is from the Y axis */
  bands: { r: number; yLo: number; yHi: number }[];
  /** the widest the form gets anywhere */
  rMax: number;
}

/** HOW FINE THE MEASUREMENT IS. 64 bands over a form's own height, so a band
 *  is 1.6 % of it. Bands are the unit of CONSERVATISM, not of accuracy: a
 *  band's widest point is required to fit at the band's own top edge, where a
 *  cone or a cylinder is at its narrowest, so the discretisation can only ever
 *  make a collider bigger than the rock — never smaller. */
const BANDS = 64;

/** How many points each triangle of a form contributes: a barycentric grid at
 *  1/6, so 28 points per triangle including all three corners and the edges.
 *  The corners alone would not do — the widest part of a cone's base is the
 *  ring of vertices, but the widest part of a LATHE is between them. */
const TRI_STEPS = 6;

const silhouettes = new Map<HorizonForm, Silhouette>();

/** Measure a unit form from its own geometry. Memoised: the answer depends only
 *  on the form, and building it costs a few thousand point transforms. */
function silhouette(f: HorizonForm): Silhouette {
  const cached = silhouettes.get(f);
  if (cached) return cached;

  const g = form(f);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const idx = g.getIndex();
  const n = idx ? idx.count : pos.count;
  const vx = (i: number) => (idx ? idx.getX(i) : i);

  let base = Infinity, top = -Infinity, hx = 0, hz = 0, rMax = 0;
  for (let i = 0; i < pos.count; i++) {
    base = Math.min(base, pos.getY(i));
    top = Math.max(top, pos.getY(i));
  }
  const span = top - base || 1;
  const r = new Array<number>(BANDS).fill(0);
  const put = (x: number, y: number, z: number) => {
    hx = Math.max(hx, Math.abs(x));
    hz = Math.max(hz, Math.abs(z));
    const rr = Math.hypot(x, z);
    rMax = Math.max(rMax, rr);
    const b = Math.min(BANDS - 1, Math.max(0, Math.floor(((y - base) / span) * BANDS)));
    r[b] = Math.max(r[b], rr);
  };
  for (let t = 0; t + 2 < n; t += 3) {
    const a = vx(t), b = vx(t + 1), c = vx(t + 2);
    const ax = pos.getX(a), ay = pos.getY(a), az = pos.getZ(a);
    const bx = pos.getX(b), by = pos.getY(b), bz = pos.getZ(b);
    const cx = pos.getX(c), cy = pos.getY(c), cz = pos.getZ(c);
    for (let i = 0; i <= TRI_STEPS; i++) {
      for (let j = 0; i + j <= TRI_STEPS; j++) {
        const u = i / TRI_STEPS, v = j / TRI_STEPS, w = 1 - u - v;
        put(ax * u + bx * v + cx * w, ay * u + by * v + cy * w, az * u + bz * v + cz * w);
      }
    }
  }
  g.dispose();

  const bands: Silhouette['bands'] = [];
  for (let i = 0; i < BANDS; i++) {
    if (r[i] <= 0) continue;
    bands.push({ r: r[i], yLo: base + (i / BANDS) * span, yHi: base + ((i + 1) / BANDS) * span });
  }
  const s: Silhouette = { base, top, hx, hz, bands, rMax };
  silhouettes.set(f, s);
  return s;
}

/** The upright cone that contains a form, in unit space: the apex height and
 *  the base radius that hold every band, chosen to leave the least room.
 *
 *  A TRUE CONE FITS EXACTLY and the search finds that; the apex only rises for
 *  a form that still has width at the top. The HORN is the one that needs it —
 *  it is a cone sheared 0.44 sideways, so its summit leans a quarter of a width
 *  off the axis and no cone with its apex on the axis at the drawn height could
 *  hold it. Rather than special-case the horn with a tilted collider, the
 *  search buys the containment with a taller, thinner cone and reports what
 *  that costs in `margin`. */
function fitCone(s: Silhouette) {
  const span = s.top - s.base;
  let best = { r: Infinity, apex: s.top, margin: Infinity };
  // the apex may stand anywhere from the drawn summit to one height above it;
  // beyond that a cone is a cylinder with extra steps
  const TRIES = 128;
  for (let i = 1; i <= TRIES; i++) {
    const apex = s.top + (i / TRIES) * span;
    const H = apex - s.base;
    let r = 0;
    // contained at the top edge of every band, where the cone is narrowest
    for (const b of s.bands) r = Math.max(r, (b.r * H) / (apex - b.yHi));
    // ...and how far it then stands proud at the bottom edge, where it is widest
    let margin = 0;
    for (const b of s.bands) margin = Math.max(margin, (r * (apex - b.yLo)) / H - b.r);
    if (margin < best.margin) best = { r, apex, margin };
  }
  return best;
}

const coneFits = new Map<HorizonForm, ReturnType<typeof fitCone>>();
function coneFit(f: HorizonForm) {
  const cached = coneFits.get(f);
  if (cached) return cached;
  const fit = fitCone(silhouette(f));
  coneFits.set(f, fit);
  return fit;
}

/** One horizon collider, in world metres. Plain data: `world/build.ts` is where
 *  every collider in this game is created, and the renderer does not import
 *  Rapier to make an exception of the skyline. */
export type HorizonSolid = { form: HorizonForm; x: number; y: number; z: number; margin: number }
  & ({ kind: 'cone' | 'cylinder'; radius: number; halfHeight: number }
    | { kind: 'ball'; radius: number }
    | { kind: 'box'; yaw: number; half: [number, number, number] });

/** THE SKYLINE, AS SOLIDS. One per instance, in the same order.
 *
 *  A form is scaled anisotropically — `w` across and `d` deep, and `d` runs as
 *  narrow as half of `w` — while every shape here is a surface of revolution.
 *  So the radius is taken from the LONG axis, which is v1's own cone rule from
 *  r148 ("the long axis of the drawn footprint... the cone rule's trade of a
 *  little invisible margin on the short one"). The trade is the same one the
 *  whole file makes: the collider is never inside the rock you can see, and it
 *  can stand up to `(w - d) / 2` proud on the narrow flank of something that is
 *  at minimum 640 m from the middle of the world. */
export function horizonSolids(def: TrackDef): HorizonSolid[] {
  const out: HorizonSolid[] = [];
  for (const p of horizonPeaks(def)) {
    const s = silhouette(p.form);
    // unit y -> world y, the same mapping the instance matrix makes
    const off = p.h / 2 + HORIZON_SEAT;
    const Y = (u: number) => u * p.h + off;
    // a unit circle of radius r becomes an ellipse (r*w, r*d); the circle that
    // holds it has the long semi-axis
    const rs = Math.max(p.w, p.d);
    const common = { form: p.form, x: p.x, z: p.z };

    switch (SOLID_FAMILY[p.form]) {
      case 'cone': {
        const fit = coneFit(p.form);
        out.push({
          ...common, kind: 'cone',
          y: Y((s.base + fit.apex) / 2),
          radius: fit.r * rs,
          halfHeight: ((fit.apex - s.base) * p.h) / 2,
          margin: fit.margin * rs,
        });
        break;
      }
      case 'cylinder': {
        let margin = 0;
        for (const b of s.bands) margin = Math.max(margin, (s.rMax - b.r) * rs);
        out.push({
          ...common, kind: 'cylinder',
          y: Y((s.base + s.top) / 2),
          radius: s.rMax * rs,
          halfHeight: ((s.top - s.base) * p.h) / 2,
          margin,
        });
        break;
      }
      case 'ball': {
        // THE ONE FIT THAT CANNOT BE DONE IN UNIT SPACE. A sphere does not
        // scale anisotropically, so where it sits depends on how tall this
        // particular peak is against how wide it is. Cheap anyway: a ternary
        // search over the centre height, which is convex in it because the
        // radius it needs is the largest of a set of distances.
        const need = (yc: number) => {
          let r2 = 0;
          for (const b of s.bands) {
            const rr = b.r * rs;
            // the band edge FARTHER from the centre — a sphere's radius is not
            // monotone in height, so both edges have to be held
            const dy = Math.max(Math.abs(b.yLo * p.h - yc), Math.abs(b.yHi * p.h - yc));
            r2 = Math.max(r2, rr * rr + dy * dy);
          }
          return Math.sqrt(r2);
        };
        // A squat dome wants its centre well below its own base — the sphere
        // through a wide base rim and a low summit is a shallow cap. Three
        // heights of room below, which is past anything the placement can ask
        // for; landing on the end of the range would still CONTAIN, only with
        // more margin than necessary.
        let lo = (s.base - 3 * (s.top - s.base)) * p.h, hi = s.top * p.h;
        for (let i = 0; i < 60; i++) {
          const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3;
          if (need(a) < need(b)) hi = b; else lo = a;
        }
        const yc = (lo + hi) / 2;
        const radius = need(yc);
        let margin = 0;
        for (const b of s.bands) {
          const dy = Math.min(Math.abs(b.yLo * p.h - yc), Math.abs(b.yHi * p.h - yc));
          margin = Math.max(margin, Math.sqrt(Math.max(0, radius * radius - dy * dy)) - b.r * rs);
        }
        out.push({ ...common, kind: 'ball', y: off + yc, radius, margin });
        break;
      }
      case 'box': {
        // THE BOX IS THE FORM'S OWN EXTENT, turned with it — a wall's collider
        // has to carry its yaw or it would stand across the ridge instead of
        // along it, which is the same mistake `world/build.ts` fixed for a
        // 12 m barn at 45 degrees.
        const half: [number, number, number] = [
          s.hx * p.w, ((s.top - s.base) * p.h) / 2, s.hz * p.d,
        ];
        // an upper bound on how far it can stand proud: its own corner against
        // the widest the rock ever gets
        let margin = 0;
        for (const b of s.bands) margin = Math.max(margin, Math.hypot(half[0], half[2]) - b.r * rs);
        out.push({
          ...common, kind: 'box', yaw: p.yaw, y: Y((s.base + s.top) / 2), half, margin,
        });
        break;
      }
    }
  }
  return out;
}
