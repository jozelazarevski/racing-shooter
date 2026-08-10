// SKYLINE FORMS — the six silhouettes a horizon is built from.
//
// Split out of `render/horizon.ts` so the SHAPES live with the other templates
// and only the PLACEMENT — how massifs clump, which ring is which — stays in
// the renderer. They are the same functions; nothing about them is specific to
// how the horizon happens to arrange them, and anything in the app that wants a
// mountain-shaped thing can have one.
//
// PORTED FROM IGNITE RALLY: `_horizonForms` and `_horizonGrad` in
// `src/world/sky.js` at the repository root. dustline's horizon was a ring of
// five-sided cones, and v1's own comment is the diagnosis:
//
//   "Every world's horizon was two rings of CONES - forty at seven sides,
//    thirty at five - so every world on the roster, from the Alps to a Croatian
//    bay, was ringed by the same pyramids. Scale jitter does not fix that: a
//    scaled pyramid is a pyramid."
//
// Six silhouettes instead, each authored as a unit form — height 1, centred on
// the origin — so any seat-and-scale placement can use them unchanged: a sharp
// pyramid, a thin spire, a rounded whaleback dome, a flat-topped mesa, an
// asymmetric horn (steep face one side, long shoulder the other) and a proper
// saw-tooth RIDGE, which is the one that stops a skyline reading as a picket
// fence of separate hills.

import * as THREE from 'three';
import type { HorizonForm } from '../tracks/trackDef';

export const HORIZON_FORMS: HorizonForm[] = ['pyramid', 'spire', 'dome', 'mesa', 'horn', 'ridge'];

/** `textures.horizonTexture` — a vertical strip, pale at the top and fading
 *  into the fog at the base.
 *
 *  THIS IS WHAT MAKES A DISTANT MOUNTAIN LOOK DISTANT, and it is the piece the
 *  first cut of this port left out: a peak painted one flat colour is a
 *  cardboard cut-out standing on the ground, where a real one dissolves into
 *  haze from the bottom up. It is also what lets two rings STACK — hills, haze,
 *  peaks, sky — instead of reading as one band of triangles. */
export function horizonTexture(topHex: string, baseHex: string): THREE.Texture {
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
export function horizonGrad(hex: number, fogHex: string, baseMix: number, topMix: number, desat = 0) {
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
export function form(name: HorizonForm): THREE.BufferGeometry {
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
