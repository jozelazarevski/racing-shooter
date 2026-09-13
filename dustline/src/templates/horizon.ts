// SKYLINE FORMS AND THE SKY BEHIND THEM — the six silhouettes a horizon is
// built from, the gradient dome they stand against, and the haze band that
// stacks the two.
//
// Split out of `render/horizon.ts` so the SHAPES live with the other templates
// and only the PLACEMENT — how massifs clump, which ring is which — stays in
// the renderer. They are the same functions; nothing about them is specific to
// how the horizon happens to arrange them, and anything in the app that wants a
// mountain-shaped thing can have one. `render/sky.ts` arrived later and takes
// the same split: the dome and the haze ring are shapes and are here, where the
// cloud field and the ring radii are this world's arrangement and are there.
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

// ---------------------------------------------------------------------------
// THE SKY DOME AND THE HAZE BAND — PORTED FROM IGNITE RALLY (`_buildSky` in
// `src/world/sky.js` at the repository root).
//
// v1 does not paint its sky onto a texture. The dome is a BackSide sphere with
// a ShaderMaterial on it, and the reason is the second term in that shader: a
// FORWARD-SCATTER LOBE around the sun's bearing, which is a per-direction dot
// product and cannot be baked into a vertical strip. That lobe is the only sun
// v1 draws, and its comment says why:
//
//   "the sunGlow knob was authored in ~30 palettes and read by NOTHING since
//    the sun sprite was banned. This is not that sprite: it is a forward-scatter
//    lobe painted ON the BackSide dome at r=3000, behind all geometry and
//    correctly occluded - it cannot smear over the road from the top-down
//    camera the way the billboard did."
//
// WHAT CAME ACROSS VERBATIM: the glow term
// `col += glow * pow(max(dot(vDir, sunDir), 0.0), 24.0) * (1.0 - t) * 0.55`,
// its exponent, its 0.55 scale and the `smoothstep(0.0, 0.5, ...)` horizon
// curve that shapes the `t` it fades against; the BackSide / depthWrite off /
// fog off material; the sphere's 24 x 12 segments; and the haze cylinder — 48
// radial segments, open-ended, BackSide, unfogged, one translucent tinted strip.
//
// TWO DELIBERATE CHANGES:
//
//   1. THE GRADIENT IS FOUR STOPS, NOT TWO. v1 mixes `skyHorizon` into `skyTop`
//      and that is the whole ramp. dustline's track format already carries four
//      (`TrackDef.sky.stops`), every shipped track has them authored, and its
//      old canvas dome laid them at 0 / 0.55 / 0.8 / 1 down the sphere's v. So
//      the shader keeps v1's structure and evaluates FOUR stops at exactly
//      those positions — see `SKY_STOP_AT`. Rewriting three tracks' skies to
//      two colours would have been a re-authoring wearing the word "port".
//   2. THE HORIZON CURVE IS NOT THE STOP RAMP. In v1 the same `t` does both
//      jobs: it mixes the two colours and it fades the glow. Here the ramp is
//      the four stops and `t` survives only as the glow's falloff, so the lobe
//      still dies out by 30 degrees of elevation the way v1's does. v1's
//      `skyCurve` knob — "< 1 lets the horizon glow reach higher" — is the
//      `curve` argument below, defaulting to v1's own 1.0 because the track
//      format has no field for it.
//
// AND ONE ADDITION THAT IS NOT A LOOK CHANGE: the two output chunks at the end
// of the fragment shader. A `ShaderMaterial` gets none of the automatic tone
// mapping or colour-space conversion a built-in material does — an author who
// wants them writes the includes — so v1's dome writes LINEAR values straight
// out. Under a composer that is exactly right, because the render target is
// linear and every other material is writing linear into it too — three sets
// `colorSpace` to linear and `toneMapping` to none for any material drawn into
// a target (`WebGLRenderer.js:1746` and `:1754` in three 0.160), so nothing is
// converting there and the dome is in step with the frame. It is wrong the
// moment the composer is off, which dustline supports on purpose:
// `?nopost`, and `postWanted` in `render/post.ts` switching itself off under a
// software rasteriser — the path every headless tool here runs on, including
// the one that renders the committed documentation screenshots. MEASURED in a
// headless frame on `dustbowl`, drawing straight to the canvas with tone
// mapping off: the horizon should be #79b0e4, which is what `skyColorAt` below
// answers, and the dome painted it #306ec6 — that colour's own linear values
// read as if they were sRGB. With the includes it paints #78afe4, one step out
// of 255. Three applies whatever the current target needs, so the composed path
// is unchanged — both chunks are no-ops against a linear target, where every
// other material is writing linear too — and the un-composed path stops being
// the odd one out.
// ---------------------------------------------------------------------------

/** The four stops of a dome gradient, zenith first: `TrackDef.sky.stops`. */
export type SkyStops = readonly [string, string, string, string];

/** WHERE THE FOUR STOPS SIT, as a fraction of the arc from zenith to nadir.
 *
 *  These are the positions dustline's canvas dome used, and they are kept so
 *  the shipped tracks' skies do not change colour under the port. A sphere's
 *  uv.y runs 1 at the top pole to 0 at the bottom, and a CanvasTexture is drawn
 *  with row 0 at uv.y = 1, so canvas fraction f sat at uv.y = 1 - f, i.e. at
 *  polar angle f * PI from straight up. The old stop positions 0 / 0.55 / 0.8
 *  / 1 therefore mean: zenith, 9 degrees BELOW the horizon, 54 degrees below,
 *  nadir. Only the ramp between the first two is sky; the rest paints the band
 *  seen past the edge of the terrain, which is why every shipped track sets its
 *  third stop to its own fog colour. */
export const SKY_STOP_AT = [0, 0.55, 0.8, 1] as const;

export interface SkyDomeSpec {
  stops: SkyStops;
  /** Direction TOWARDS the sun. Length is ignored — `TrackDef.sky.sunDir` is
   *  documented as a bearing, and `render/scene.ts` treats it as one. */
  sunDir: THREE.Vector3 | readonly [number, number, number];
  /** Colour of the forward-scatter lobe: v1's `sunGlow`. */
  glow: string | number;
  /** v1's `skyCurve`. Below 1 lets the horizon glow reach higher. */
  curve?: number;
}

/** The colour the dome shader paints at elevation `y`, in TypeScript.
 *
 *  A mirror of the fragment shader's ramp, for the callers that need to know
 *  what colour the sky IS somewhere — `render/sky.ts` tints the far haze ring
 *  toward the sky at the horizon, which is v1's `skyHorizon`, and dustline has
 *  no such field because its stops describe the ramp instead of its ends.
 *  `y` is the vertical component of a unit direction: 1 zenith, 0 horizon. */
export function skyColorAt(stops: SkyStops, y: number): THREE.Color {
  const q = Math.acos(Math.max(-1, Math.min(1, y))) / Math.PI;
  let i = 0;
  while (i < 2 && q > SKY_STOP_AT[i + 1]) i++;
  const a = SKY_STOP_AT[i], b = SKY_STOP_AT[i + 1];
  return new THREE.Color(stops[i]).lerp(new THREE.Color(stops[i + 1]), (q - a) / (b - a));
}

/** v1's dome shader, with the four-stop ramp described above. */
export function skyDomeMaterial(spec: SkyDomeSpec): THREE.ShaderMaterial {
  const d = Array.isArray(spec.sunDir)
    ? new THREE.Vector3(spec.sunDir[0], spec.sunDir[1], spec.sunDir[2])
    : (spec.sunDir as THREE.Vector3).clone();
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      c0: { value: new THREE.Color(spec.stops[0]) },
      c1: { value: new THREE.Color(spec.stops[1]) },
      c2: { value: new THREE.Color(spec.stops[2]) },
      c3: { value: new THREE.Color(spec.stops[3]) },
      stopAt: { value: new THREE.Vector2(SKY_STOP_AT[1], SKY_STOP_AT[2]) },
      sunDir: { value: d.normalize() },
      glow: { value: new THREE.Color(spec.glow) },
      curve: { value: spec.curve ?? 1.0 },
    },
    vertexShader: `varying vec3 vDir;
      void main(){
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    // v1 normalises in the vertex shader and reads the interpolated vector
    // straight. It is normalised here in the fragment shader instead: the dome
    // is 24 x 12 segments, so a polar face spans 15 degrees and an interpolated
    // unit vector is 0.86 per cent short at the middle of one — which the acos
    // below reads as an elevation up to half a degree out, and the sun lobe's
    // 24th power reads as a lopsided lobe. Both are cheap to not have.
    fragmentShader: `uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3;
      uniform vec2 stopAt; uniform vec3 sunDir; uniform vec3 glow; uniform float curve;
      varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float q = acos(clamp(d.y, -1.0, 1.0)) / 3.141592653589793;
        vec3 col = mix(c0, c1, clamp(q / stopAt.x, 0.0, 1.0));
        col = mix(col, c2, clamp((q - stopAt.x) / (stopAt.y - stopAt.x), 0.0, 1.0));
        col = mix(col, c3, clamp((q - stopAt.y) / (1.0 - stopAt.y), 0.0, 1.0));
        float t = pow(smoothstep(0.0, 0.5, max(d.y, 0.0)), curve);
        col += glow * pow(max(dot(d, sunDir), 0.0), 24.0) * (1.0 - t) * 0.55;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** The dome: v1's `SphereGeometry(r, 24, 12)` seen from the inside. */
export function skyDome(radius: number, spec: SkyDomeSpec): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 12), skyDomeMaterial(spec));
  m.name = 'sky-dome';
  return m;
}

export interface HazeRingSpec {
  /** `hazeTexture()` from `./textures`, or a clone of it. The strip is white;
   *  the ring's own colour is what tints it. */
  map: THREE.Texture;
  color: THREE.Color | string | number;
  opacity: number;
  /** Band height as a fraction of the radius. v1's near ring is 300 over 940. */
  heightFrac?: number;
  /** Centre height as a fraction of the radius. v1's near ring is 95 over 940,
   *  which is what makes the dense end of the strip hug the horizon line. */
  liftFrac?: number;
}

/** ONE RING OF HORIZON HAZE.
 *
 *  v1 stands two of these around the world, and its comment is the reason the
 *  skyline in that game has depth where a single gradient does not:
 *
 *    "a second, farther, fainter ring OUTSIDE the far peak ring: the skyline
 *     now stacks hills -> haze -> peaks -> haze -> sky, which is the banded
 *     aerial perspective the reference has."
 *
 *  Heights and lifts are fractions of the radius rather than v1's metres, so
 *  one ring keeps its proportions at whatever radius a track's skyline wants.
 *  Both of v1's rings work out at very nearly the same pair — 0.319 / 0.101 for
 *  the near one, 0.331 / 0.103 for the far — and the defaults here are the near
 *  ring's. */
export function hazeRing(radius: number, spec: HazeRingSpec): THREE.Mesh {
  const h = radius * (spec.heightFrac ?? 0.319);
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, h, 48, 1, true),
    new THREE.MeshBasicMaterial({
      map: spec.map,
      color: new THREE.Color(spec.color as THREE.ColorRepresentation),
      transparent: true,
      opacity: spec.opacity,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
  );
  m.position.y = radius * (spec.liftFrac ?? 0.101);
  return m;
}
