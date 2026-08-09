// GEOMETRY HELPERS, PORTED FROM IGNITE RALLY.
//
// These are not new. Every function here is lifted from `src/track.js` and
// `src/world/catalog.js` in the v1 game, which has spent a long time getting
// hulls, sails and roofs to read correctly at speed, and each one carries the
// comment that explains WHY it is shaped the way it is. Rewriting them from
// scratch for dustline would have thrown that away and re-earned the same bugs
// — which is exactly what the first cut of the boats and houses did.
//
// Where the original is a method on `Track`, it is a plain function here. The
// bodies are otherwise unchanged.

import * as THREE from 'three';

/** `Track._tri` — one triangle, pushed into a flat vertex array. */
export function tri(arr: number[], a: number[], b: number[], c: number[]) {
  arr.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
}

/** `Track._quad` — a quad as two triangles, wound a->b->c->d. */
export function quad(arr: number[], a: number[], b: number[], c: number[], d: number[]) {
  tri(arr, a, b, c); tri(arr, a, c, d);
}

/** `Track._geo` — a flat-shaded BufferGeometry from a raw triangle soup. */
export function soup(arr: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  g.computeVertexNormals();
  return g;
}

/** `Track._bundle` — MANY SMALL FIXED PARTS, ONE DRAW CALL. Detail is spokes,
 *  rings, glazing bars and stanchions — dozens of little meshes, each of which
 *  would otherwise be its own draw. Anything rigidly fixed relative to its
 *  parent welds into one buffer here. */
export function bundle(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const parts = geos.map((gm) => (gm.index ? gm.toNonIndexed() : gm));
  let n = 0;
  for (const gm of parts) n += (gm.attributes.position.array as ArrayLike<number>).length;
  const pos = new Float32Array(n);
  let o = 0;
  for (const gm of parts) {
    pos.set(gm.attributes.position.array as ArrayLike<number>, o);
    o += (gm.attributes.position.array as ArrayLike<number>).length;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.computeVertexNormals();
  return out;
}

/** `Track._strut` — A STRUT BETWEEN TWO POINTS, a cylinder posed from its real
 *  endpoints. Standing rigging, railings and gantry legs all run somewhere
 *  specific, so they are built from where they start and stop rather than posed
 *  by hand with an Euler, which is the trap that has cost the original file
 *  three separate bugs. */
export function strut(a: number[], b: number[], r: number, seg?: number): THREE.BufferGeometry {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz);
  const geo = new THREE.CylinderGeometry(r, r, len, seg ?? 5);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len)));
  geo.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return geo;
}

/** `Track._sailGeo` — A SAIL IS NOT FLAT. Lofted from the luff toward the clew
 *  with a belly that dies at head, tack and clew — a handful of triangles, and
 *  it stops the canvas reading as a paper cut-out. */
export function sailGeo(A: number[], B: number[], C: number[], belly: number): THREE.BufferGeometry {
  const mix = (p: number[], q: number[], t: number) => [
    p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  const v: number[] = [];
  const ROWS = 4;
  for (let r = 0; r < ROWS; r++) {
    const t0 = r / ROWS, t1 = (r + 1) / ROWS;
    const l0 = mix(A, B, t0), l1 = mix(A, B, t1);
    const f = (t: number) => Math.sin(Math.PI * t) * belly;
    const o0 = mix(l0, C, 0.5), o1 = mix(l1, C, 0.5);
    o0[0] += f(t0); o1[0] += f(t1);
    tri(v, l0, l1, o1); tri(v, l0, o1, o0);
    tri(v, o0, o1, C);
  }
  return soup(v);
}

/** `catalog.gablePrismGeo` — the pitched-roof prism, a unit box footprint with
 *  a ridge at y = 1. Base-anchored, like every other element geometry: the
 *  house templates give a height, never a translate. */
export function gablePrismGeo(): THREE.BufferGeometry {
  const A = [-0.5, 0, -0.5], Bv = [0.5, 0, -0.5], C = [0.5, 0, 0.5], D = [-0.5, 0, 0.5];
  const E = [-0.5, 1, 0], F = [0.5, 1, 0];
  const tris = [
    [A, Bv, C], [A, C, D],            // floor
    [A, F, Bv], [A, E, F],            // back pitch
    [D, C, F], [D, F, E],             // front pitch
    [A, D, E], [Bv, F, C],            // gable ends
  ];
  const v: number[] = [];
  for (const t of tris) for (const p of t) v.push(p[0], p[1], p[2]);
  return soup(v);
}

/** THE BOAT HULL, lofted through nine stations with a hard chine.
 *
 *  `Track._boatHull`, verbatim. ONE hull for the whole game. There used to be
 *  two kinds of boat in a harbour: the marina's, and a flotilla of BOX HULLS
 *  WITH A CONE ON TOP moored in the same water — those cones are the toy boats
 *  dotted across every harbour screenshot. A hull is not a box, so it is built
 *  once, here, and everything that floats uses it.
 *
 *  Five stations and a plain V gave a boat-shaped wedge; the reference is a
 *  proper hull, so the loft runs nine stations and carries a CHINE — the crease
 *  between topside and bottom that catches the light down the whole length, and
 *  is most of what tells the eye this is a hull rather than a shape.
 *  ~70 triangles, instanced across every boat in the world.
 *
 *  Per station: z aft->forward, deck half-beam, chine half-beam, chine height,
 *  keel depth, sheer height. Deck datum is y = 1.0.
 */
export function boatHull(): { hull: THREE.BufferGeometry; deck: THREE.BufferGeometry; band: THREE.BufferGeometry } {
  const STA = [
    [-4.30, 1.28, 1.18, -0.30, -1.00, 1.00],   // transom
    [-3.40, 1.42, 1.30, -0.36, -1.14, 0.97],
    [-2.00, 1.53, 1.40, -0.42, -1.26, 0.95],
    [-0.60, 1.55, 1.42, -0.44, -1.28, 0.97],
    [0.80, 1.50, 1.35, -0.42, -1.24, 1.01],
    [2.00, 1.32, 1.15, -0.36, -1.10, 1.10],
    [3.10, 1.02, 0.85, -0.28, -0.86, 1.24],
    [4.00, 0.62, 0.48, -0.18, -0.52, 1.42],
    [4.70, 0.10, 0.08, -0.05, -0.12, 1.62],    // stem, sheer up to the bow
  ];
  const hv: number[] = [], dv: number[] = [], bv: number[] = [];
  for (let i = 0; i < STA.length - 1; i++) {
    const S = STA[i], T = STA[i + 1];
    for (const sg of [1, -1]) {
      const D0 = [sg * S[1], S[5], S[0]], D1 = [sg * T[1], T[5], T[0]];
      const C0 = [sg * S[2], S[3], S[0]], C1 = [sg * T[2], T[3], T[0]];
      const K0 = [0, S[4], S[0]], K1 = [0, T[4], T[0]];
      quad(hv, D0, D1, C1, C0);            // topside
      quad(hv, C0, C1, K1, K0);            // bottom
      // the rubbing band: a dark strake right on the sheer line
      const b0 = [sg * (S[1] + 0.04), S[5] - 0.16, S[0]];
      const b1 = [sg * (T[1] + 0.04), T[5] - 0.16, T[0]];
      quad(bv, D0, D1, b1, b0);
    }
    const e0 = S[1] * 0.90, e1 = T[1] * 0.90, h0 = S[5] + 0.02, h1 = T[5] + 0.02;
    quad(dv, [-e0, h0, S[0]], [e0, h0, S[0]], [e1, h1, T[0]], [-e1, h1, T[0]]);
  }
  const S = STA[0];
  quad(hv, [-S[1], S[5], S[0]], [S[1], S[5], S[0]], [S[2], S[3], S[0]], [-S[2], S[3], S[0]]);
  tri(hv, [-S[2], S[3], S[0]], [S[2], S[3], S[0]], [0, S[4], S[0]]);
  return { hull: soup(hv), deck: soup(dv), band: soup(bv) };
}

/** WHERE THE WATERLINE IS ON THAT HULL.
 *
 *  v1 floats a boat by placing its origin at `seaLevel + 0.38 * scale`, so in
 *  the hull's own frame the water surface is at y = -0.38. A dustline floating
 *  component's origin must BE the waterline, so every boat part is lifted by
 *  this before it is scaled down to its own size. Same number, stated once. */
export const BOAT_WATERLINE = 0.38;

/** A boat's geometry at its own length, sitting on y = 0 as the waterline.
 *  `scale` is v1's per-boat scalar: 0.42 is its rowing boat, ~0.66 its rigged
 *  day boat, 1.0 the full 9 m hull. */
export function afloat(geo: THREE.BufferGeometry, scale: number): THREE.BufferGeometry {
  return geo.scale(scale, scale, scale).translate(0, BOAT_WATERLINE * scale, 0);
}
