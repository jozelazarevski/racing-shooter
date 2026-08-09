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

import * as THREE from 'three';
import type { TrackDef, HorizonForm } from '../tracks/trackDef';
import { Rng } from '../core/rng';

export const HORIZON_FORMS: HorizonForm[] = ['pyramid', 'spire', 'dome', 'mesa', 'horn', 'ridge'];

/** `textures.horizonTexture` — a vertical strip, pale at the top and fading
 *  into the fog at the base.
 *
 *  THIS IS WHAT MAKES A DISTANT MOUNTAIN LOOK DISTANT, and it is the piece the
 *  first cut of this port left out: a peak painted one flat colour is a
 *  cardboard cut-out standing on the ground, where a real one dissolves into
 *  haze from the bottom up. It is also what lets two rings STACK — hills, haze,
 *  peaks, sky — instead of reading as one band of triangles. */
function horizonTexture(topHex: string, baseHex: string): THREE.Texture {
  const cv = document.createElement('canvas');
  cv.width = 16; cv.height = 128;
  const g = cv.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, topHex);
  grd.addColorStop(0.55, topHex);
  grd.addColorStop(1, baseHex);
  g.fillStyle = grd;
  g.fillRect(0, 0, 16, 128);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  // The canvas runs top-to-bottom and a form's v runs base-to-summit, so the
  // strip is flipped rather than the gradient being written upside down.
  t.flipY = false;
  return t;
}

/** `Track._horizonGrad` — one ring's strip, mixed toward the world's own fog so
 *  the skyline belongs to the weather it is standing in. */
function horizonGrad(hex: number, fogHex: string, baseMix: number, topMix: number, desat = 0) {
  const fogC = new THREE.Color(fogHex);
  const c = new THREE.Color(hex);
  if (desat) {
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    c.setHSL(hsl.h, hsl.s * (1 - desat), hsl.l);
  }
  const top = c.clone().lerp(fogC, topMix);
  const base = c.clone().lerp(fogC, baseMix);
  return horizonTexture(`#${top.getHexString()}`, `#${base.getHexString()}`);
}

/** One unit form: height 1, centred on the origin. */
function form(name: HorizonForm): THREE.BufferGeometry {
  switch (name) {
    case 'pyramid':
      return new THREE.ConeGeometry(0.5, 1, 6);
    case 'spire':
      return new THREE.ConeGeometry(0.40, 1, 5);
    case 'dome': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        pts.push(new THREE.Vector2(
          Math.max(0.001, 0.5 * Math.cos((t * Math.PI) / 2) * (1 - 0.10 * t)), -0.5 + t));
      }
      return new THREE.LatheGeometry(pts, 9);
    }
    case 'mesa':
      return new THREE.CylinderGeometry(0.30, 0.52, 1, 6);
    case 'horn': {
      const g = new THREE.ConeGeometry(0.5, 1, 6);
      // shear the apex sideways so one face is a cliff and the other a shoulder
      g.applyMatrix4(new THREE.Matrix4().set(
        1, 0.44, 0, 0,
        0, 1, 0, 0,
        0, 0.14, 1, 0,
        0, 0, 0, 1));
      return g;
    }
    case 'ridge': {
      // a wall with named peaks along it, tapering to nothing at both ends
      const H = [0.03, 0.62, 0.30, 0.92, 0.44, 0.70, 0.05];
      const n = H.length - 1;
      const v: number[] = [];
      const push = (a: number[], b: number[], c: number[]) =>
        v.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      for (let k = 0; k < n; k++) {
        const x0 = -0.5 + k / n, x1 = -0.5 + (k + 1) / n;
        const y0 = -0.5 + H[k], y1 = -0.5 + H[k + 1];
        const d0 = 0.44 * Math.sin(Math.PI * (k / n)) + 0.06;
        const d1 = 0.44 * Math.sin(Math.PI * ((k + 1) / n)) + 0.06;
        // WIND EACH FLANK OUTWARD. Emitting both sides in the same vertex order
        // leaves one of them back-facing, and a front-side material culls it —
        // which is why half of every ridge vanished and the skyline grew thin
        // dark slivers where the interior showed through.
        for (const sg of [1, -1]) {
          const A = [x0, y0, 0], B = [x1, y1, 0];
          const C = [x1, -0.5, sg * d1], D = [x0, -0.5, sg * d0];
          if (sg > 0) { push(A, B, C); push(A, C, D); }
          else { push(B, A, C); push(C, A, D); }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      // UVs the other forms get for free from three's primitives, and the
      // vertical gradient below needs: v runs 0 at the base to 1 at the ridge.
      const uv = new Float32Array((v.length / 3) * 2);
      for (let i = 0; i < v.length / 3; i++) {
        uv[i * 2] = v[i * 3] + 0.5;
        uv[i * 2 + 1] = v[i * 3 + 1] + 0.5;
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.computeVertexNormals();
      return g;
    }
  }
}

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

export function buildMountains(scene: THREE.Scene, def: TrackDef): THREE.Object3D[] {
  const rng = Rng.fork(def.seed, 'mountains');
  const M = def.sky.mountains;
  if (M.count <= 0) return [];
  // A track may name its own skyline; otherwise it gets one from its seed, so
  // two worlds are not ringed by the same mountains.
  const set = M.forms?.length ? M.forms : SETS[Math.abs(def.seed) % SETS.length];

  const out: THREE.Object3D[] = [];
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  // Instances are shared between the two rings per form; `count` is the
  // track's total budget, split near/far the way v1 splits its two rings.
  const cap = Math.max(16, M.count * 6);

  const layer = (mat: THREE.Material) => {
    const per = new Map<HorizonForm, THREE.InstancedMesh>();
    for (const f of set) {
      if (per.has(f)) continue;
      const mesh = new THREE.InstancedMesh(form(f), mat, cap);
      mesh.count = 0;
      mesh.name = `horizon-${f}`;
      per.set(f, mesh);
      out.push(mesh);
    }
    return per;
  };

  const fog = def.sky.fogColor;
  const near = layer(new THREE.MeshStandardMaterial({
    map: horizonGrad(0x8195a8, fog, 0.52, 0.10), roughness: 1, flatShading: true,
  }));
  const far = layer(new THREE.MeshStandardMaterial({
    // far ring: paler base and a slight desaturation, so distance reads
    map: horizonGrad(0xdde8f0, fog, 0.68, 0.26, 0.3), roughness: 1, flatShading: true,
  }));

  /** RANGES, NOT A PICKET FENCE. Peaks spaced evenly round the compass give the
   *  same regular saw-tooth whatever shape they are, so a range is a CLUMP of
   *  three to six sharing one form and one height band, with open sky between
   *  it and the next.
   *
   *  Width is derived from each peak's own height rather than given as an
   *  absolute range: a track that asks for 95 m mountains and one that asks for
   *  200 m should get the same PROPORTIONS, and the first cut, which took v1's
   *  metre constants directly, produced 300 m-wide hills on a world whose
   *  peaks are 95 m tall. */
  // `count` NOW MEANS MASSIFS, NOT PEAKS. It used to be the number of cones in
  // one evenly spaced ring, and 22 of those around a full circle leaves about
  // five in any one view — which as clumped ranges is three lonely triangles
  // and a lot of empty sky. A massif is three to six peaks, so the same number
  // in a track file now buys roughly the density v1 has. Split near/far.
  const groupsNear = Math.max(2, Math.round(M.count * 0.45));
  const groupsFar = Math.max(2, M.count - groupsNear);

  const place = (
    per: Map<HorizonForm, THREE.InstancedMesh>, groups: number,
    r0: number, rSpan: number, h0: number, hSpan: number, wFac: number, snowy: boolean,
  ) => {
    for (let gi = 0; gi < groups; gi++) {
      const aC = (gi / groups) * Math.PI * 2 + rng.centered(0.35);
      const f = set[(gi + ((rng.float() * 1.4) | 0)) % set.length];
      const mesh = per.get(f)!;
      const band = 0.7 + rng.float() * 0.55;          // this range's height
      const n = 3 + ((rng.float() * 4) | 0);
      for (let k = 0; k < n && mesh.count < cap; k++) {
        const a = aC + (k - n / 2) * (0.1 + rng.float() * 0.07);
        const r = r0 + rng.float() * rSpan;
        const h = (h0 + rng.float() * hSpan) * band;
        const w = h * wFac * (0.85 + rng.float() * 0.5);
        const px = Math.cos(a) * r, pz = Math.sin(a) * r;
        // a ridge lies ALONG the range, so it is turned to face the middle
        const yaw = f === 'ridge'
          ? a + Math.PI / 2 + rng.centered(0.3)
          : rng.float() * Math.PI;
        m4.makeRotationY(yaw);
        m4.scale(new THREE.Vector3(w, h, w * (0.5 + rng.float() * 0.7)));
        m4.setPosition(px, h / 2 - 8, pz);
        const i = mesh.count;
        mesh.setMatrixAt(i, m4);
        // THE COLOUR IS IN THE MAP; the instance carries only a shade, which is
        // v1's scheme and the reason one material serves a whole ring. The
        // track's snowline still does its job through it: a peak past the line
        // is lightened toward the map's pale top, and — unlike the first cut —
        // it must also be TALL enough, because a 40 m hill with a snowcap on it
        // is the giveaway that the snow is a bearing test and not an altitude.
        const white = snowy && Math.sin(a) < M.snowline && h > M.height * 1.15;
        col.setScalar((white ? 1.0 : 0.78) + rng.float() * 0.18);
        mesh.setColorAt(i, col);
        mesh.count = i + 1;
      }
    }
  };

  // Near ring: lower hills standing in front, no snow. Far ring: the range
  // itself, half again as far out and twice as tall, catching snow past the
  // snowline. The track's own radius and height set the near ring; the far one
  // is derived, so one pair of numbers still describes a whole skyline.
  place(near, groupsNear, M.radius, M.radius * 0.10,
    M.height * 0.55, M.height * 0.45, 1.45, false);
  place(far, groupsFar, M.radius * 1.34, M.radius * 0.16,
    M.height * 1.15, M.height * 0.9, 1.2, true);

  for (const mesh of out as THREE.InstancedMesh[]) {
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (mesh.count) scene.add(mesh);
  }
  return out.filter((m) => (m as THREE.InstancedMesh).count > 0);
}
