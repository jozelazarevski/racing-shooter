// GRASS TUFT — the thing that was missing between everything else.
//
// The library had 108 components and a world still read as objects standing on
// a painted plane, because the PLANE was empty: outside the road corridor there
// was nothing smaller than a bush anywhere, so the eye had no scale reference
// between a 0.6 m rock and 900 m of vertex-coloured ground.
//
// SHAPE FROM IGNITE RALLY: the grass-tuft block of `_buildGroundCover(m4)` in
// `src/world/flora.js` at the repository root — "two crossed alpha-cut planes,
// dense right beside the road". v1's construction, verbatim: a plane per axis,
// the two of them at 90 degrees, `alphaTest: 0.45`, `side: DoubleSide`,
// `roughness: 1`, and `grassTexture()` for the map.
//
// THE FIRST CUT OF THIS FILE BUILT SIX SOLID TRIANGLES INSTEAD, on the grounds
// that a tuft placed in the thousands has to be cheap. It is cheap and it is
// also wrong: six flat opaque wedges is a paper flower, and the thing that
// makes grass read as grass — a lot of thin curved blades of slightly
// different greens with daylight between them — cannot be built out of solid
// triangles at any price. It can be PAINTED, which is what v1 does: fifteen
// quadratic-curve blades on a 128 px canvas, each interpolated between two
// palette colours. That texture was already ported, sitting in
// `templates/surfaces.ts` with no consumer.
//
// AND IT IS CHEAPER. Two crossed planes is FOUR triangles against six, so the
// port removes a third of the geometry from the most-instanced component in
// the game and gets v1's blades for the price of one shared 128 px texture.
//
// THREE PALETTES, PICKED BY GROUND. v1 carries a `grass` override on every
// theme — dry gold in the desert, a frosted blue-green in the snow — and the
// numbers below are v1's own, lifted from `src/world/themes.js`: the `desert`
// theme's pair at line 77 and the `snow` theme's at line 117, with v1's
// painter defaults (`#2f7a22` / `#63c243`) everywhere else. dustline has no
// theme on a component, so the surface chooses, exactly as it does for the
// pine's snow cap. Only one part is ever eligible per instance.
//
// ONE DELIBERATE ADDITION: a per-instance brightness jitter. v1 does not tint
// its tufts at all — every tuft in a v1 world is the same tile — and it gets
// away with it because it plants 1,100 of them at once. dustline scatters
// fewer and further apart, where a field of identical sprites is visible as a
// repeat, so each instance multiplies the map by 0.88-1.10.
//
// HEIGHT IS NOT v1'S. v1's plane is 1.6 x 1.3 m; this is 1.0 x 0.85, because
// the tracks in `src/data/tracks/` carry scale layers tuned to the 0.45-0.66 m
// tuft this used to be, and v1's would have doubled every one of them. The
// painted blades occupy the upper 35-90% of the canvas, so the visible grass
// stands 0.30-0.77 m at scale 1 — within a centimetre or two of what was here.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeomsUV } from './types';
import { grassTexture, type GrassPalette } from '../../templates/surfaces';

/** v1's tuft: one plane per axis, crossed. */
function crossedPlanes(w: number, h: number): THREE.BufferGeometry {
  const a = new THREE.PlaneGeometry(w, h);
  a.translate(0, h / 2, 0);
  const b = new THREE.PlaneGeometry(w, h);
  b.translate(0, h / 2, 0);
  b.rotateY(Math.PI / 2);
  // mergeGeomsUV, not mergeGeoms: this is the one flora component with a map
  // on it, and the plain merge drops the UV channel, which samples texel (0,0)
  // across the whole quad — a solid green rectangle where the blades should be.
  return mergeGeomsUV([a, b]);
}

/** v1's material for the tuft, at v1's numbers. */
const bladeMat = (palette: GrassPalette) => standard(0xffffff, {
  map: grassTexture(palette),
  alphaTest: 0.45,
  side: THREE.DoubleSide,
  flatShading: false,
});

const W = 1.0;
const H = 0.85;

const grassTuft: PropTemplate = {
  id: 'grassTuft',
  name: 'Grass tuft',
  category: 'flora',
  description: 'v1\'s crossed alpha-cut blades, 0.85 m. Ground cover — scatter it in the thousands. Never solid.',

  build: () => [
    {
      key: 'blades',
      geometry: crossedPlanes(W, H),
      material: bladeMat({}),
      when: (c) => c.surface !== 'sand' && c.surface !== 'snow' && c.surface !== 'ice',
      tint: (c) => new THREE.Color().setScalar(0.88 + c.rng.float() * 0.22),
    },
    {
      key: 'bladesDry',
      geometry: crossedPlanes(W, H),
      // v1 `themes.js:77`, the desert theme's grass override.
      material: bladeMat({ bladeA: '#8a7a30', bladeB: '#c8b45e' }),
      when: (c) => c.surface === 'sand',
      tint: (c) => new THREE.Color().setScalar(0.88 + c.rng.float() * 0.22),
    },
    {
      key: 'bladesFrost',
      geometry: crossedPlanes(W, H),
      // v1 `themes.js:117`, the snow theme's grass override.
      material: bladeMat({ bladeA: '#5a7a58', bladeB: '#b8d0c0' }),
      when: (c) => c.surface === 'snow' || c.surface === 'ice',
      tint: (c) => new THREE.Color().setScalar(0.88 + c.rng.float() * 0.22),
    },
  ],

  // Never. A tuft of grass with a collider would be 1,200 colliders per world
  // for something a car drives through without noticing.
  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 1 },

  authoring: {
    scale: [0.7, 2.2], defaultScale: 1.2,
    avoidSurfaces: ['tarmac'],
    // Right up to the verge: this is the component that hides the seam where
    // the road ribbon's skirt tucks into the terrain.
    minRoadDist: 6,
    randomYaw: true,
    previewDist: 2.2,
  },
};

export default grassTuft;
