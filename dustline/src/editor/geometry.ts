// Everything the editor measures about a shape, and nothing it draws.
//
// The rule this file exists to enforce: the editor must sample the loop the way
// the ENGINE samples it. Not similarly — identically. `Terrain` builds its
// centreline with `new THREE.CatmullRomCurve3(pts, true, 'centripetal')` and
// walks it at `def.road.samples`; so does this. If the editor used a uniform
// parameterisation, or its own sample count, then the corner radius it warned
// about and the corner the car actually drove would be different corners, and
// every number the editor showed would be a lie told confidently.

import * as THREE from 'three';
import type { TrackDef, SurfaceId } from '../tracks/trackDef';
import { hillsAt, roadHeightAt } from '../tracks/trackDef';

export interface Sample {
  x: number; z: number;
  /** unit tangent */
  tx: number; tz: number;
  /** signed curvature, 1/m — positive is one way round, negative the other */
  k: number;
  /** lap fraction */
  t: number;
  /** road-surface height at this point */
  y: number;
}

export function buildCurve(points: [number, number][]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal',
  );
}

/** Walk the loop exactly as Terrain does. `stride` thins the result for drawing
 *  without changing WHERE the samples are — the editor draws every 4th sample
 *  but measures on all of them. */
export function sampleLoop(def: TrackDef, stride = 1): Sample[] {
  const pts = def.road.points;
  if (pts.length < 4) return [];
  const curve = buildCurve(pts);
  const n = def.road.samples;
  const raw: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) raw.push(curve.getPoint(i / n));

  const out: Sample[] = [];
  for (let i = 0; i < n; i += stride) {
    const p = raw[i];
    const nx = raw[(i + 1) % n];
    const dx = nx.x - p.x, dz = nx.z - p.z;
    const len = Math.hypot(dx, dz) || 1;

    // Menger curvature over a window. The window matters: adjacent samples are
    // ~1 m apart on a 1.2 km lap, so the angle between them is mostly sampling
    // noise and the "curvature" from three consecutive points is unreadable.
    const W = Math.max(2, Math.round(n / 120));
    const a = raw[(i - W + n) % n], b = p, c = raw[(i + W) % n];
    const ab = Math.hypot(b.x - a.x, b.z - a.z);
    const bc = Math.hypot(c.x - b.x, c.z - b.z);
    const ca = Math.hypot(a.x - c.x, a.z - c.z);
    const cross = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
    const k = ab * bc * ca > 1e-6 ? (2 * cross) / (ab * bc * ca) : 0;

    out.push({ x: p.x, z: p.z, tx: dx / len, tz: dz / len, k, t: i / n, y: roadHeightAt(def, i / n) });
  }
  return out;
}

/** Lap length, in metres, measured on the full sample set. */
export function lapLength(def: TrackDef): number {
  const s = sampleLoop(def, 1);
  let d = 0;
  for (let i = 0; i < s.length; i++) {
    const a = s[i], b = s[(i + 1) % s.length];
    d += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return d;
}

/** The theoretical cornering speed at a sample, which is what makes a corner
 *  radius meaningful to a driver rather than to a geometer.
 *
 *  Same formula the AI's racing-line bake uses: v = sqrt(mu * g * R). Shown in
 *  km/h because that is the number on the HUD. */
export function cornerSpeedKmh(k: number, muLat: number): number {
  const r = Math.abs(k) > 1e-6 ? 1 / Math.abs(k) : 1e6;
  return Math.sqrt(muLat * 9.81 * r) * 3.6;
}

export interface HitResult { kind: 'point' | 'segment' | 'none'; index: number; t?: number; }

/** What is under the cursor: a control point (preferred), else the segment of
 *  the control polygon it is nearest to, else nothing. Points win over segments
 *  because dragging a point is the common action and clicking one should never
 *  insert a new one on top of it. */
export function hitTest(
  points: [number, number][], x: number, z: number, pointTol: number, segTol: number,
): HitResult {
  for (let i = points.length - 1; i >= 0; i--) {
    if (Math.hypot(points[i][0] - x, points[i][1] - z) <= pointTol) return { kind: 'point', index: i };
  }
  let best = -1, bestD = Infinity, bestT = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[(i + 1) % n];
    const dx = bx - ax, dz = bz - az;
    const len2 = dx * dx + dz * dz;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2)) : 0;
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    if (d < bestD) { bestD = d; best = i; bestT = t; }
  }
  if (best >= 0 && bestD <= segTol) return { kind: 'segment', index: best, t: bestT };
  return { kind: 'none', index: -1 };
}

/** A plain circle, for new tracks. Deliberately dull: a starter track should be
 *  obviously unfinished, so the first thing you do is drag it into a shape. */
export function starterLoop(radius = 180, n = 12): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.round(Math.sin(a) * radius), Math.round(-Math.cos(a) * radius)] as [number, number];
  });
}

/** Height of the OPEN COUNTRY at a point — what the land would be with no road
 *  cut into it. The editor draws this as a shaded relief so you can see the
 *  hills you are routing through before you build anything. */
export function landHeight(def: TrackDef, x: number, z: number): number {
  return hillsAt(def, x, z);
}

/** Cheap surface classification for the 2D map, WITHOUT the road-distance
 *  field. The real `surfaceIdAt` needs the baked SDF, which costs 32 ms; the
 *  map only needs the off-road zones, which are pure functions of position and
 *  land height, so it can paint them at interactive rates. Road-corridor
 *  surfaces are drawn separately, from the sampled loop. */
export function offroadSurfaceAt(def: TrackDef, x: number, z: number, height: number): SurfaceId {
  for (const zone of def.surfaces.zones) {
    if (!zone.offRoad) continue;
    for (const p of zone.any) {
      const hit = p.kind === 'circle'
        ? Math.hypot(x - p.x, z - p.z) < (p.offroadRadius ?? p.radius)
        : p.kind === 'halfPlane'
          ? (p.op === 'lt' ? (p.axis === 'x' ? x : z) < p.value : (p.axis === 'x' ? x : z) > p.value)
          : height > p.height;
      if (hit) return zone.surface;
    }
  }
  return def.surfaces.offroad;
}

/** Surface on the road corridor at lap fraction t, ignoring zones that depend
 *  on height (which the map paints from the land field instead). */
export function roadSurfaceAt(def: TrackDef, t: number, x: number, z: number, height: number): SurfaceId {
  for (const zone of def.surfaces.zones) {
    if (!zone.onRoad) continue;
    for (const p of zone.any) {
      const hit = p.kind === 'circle'
        ? Math.hypot(x - p.x, z - p.z) < p.radius
        : p.kind === 'halfPlane'
          ? (p.op === 'lt' ? (p.axis === 'x' ? x : z) < p.value : (p.axis === 'x' ? x : z) > p.value)
          : height > p.height;
      if (hit) {
        if (zone.stripe && t % zone.stripe.period < zone.stripe.duty) return zone.stripe.surface;
        return zone.surface;
      }
    }
  }
  for (const b of def.surfaces.bands) if (t > b.from && t < b.to) return b.surface;
  return def.surfaces.road;
}
