// BUSH — soft dressing, and the understorey layer of every world.
// No collider at any size: the original gave bushes none, and a bush that
// stops a rally car is a worse lie than one you drive through.
//
// SHAPE FROM IGNITE RALLY: the understorey block of `_buildGroundCover(m4)` in
// `src/world/flora.js` at the repository root. Its comment is the whole reason
// this file changed, and it is worth quoting because the complaint is exactly
// dustline's:
//
//   "One squashed blob stood in for every biome's ground layer — the same
//    shape under redwoods, in the Amazon, on an ice sheet and in a wadi. It is
//    the layer you see most of at eye height, so it is the layer that most
//    gives away that the worlds are the same world repainted."
//
// v1 answers that with FOUR silhouettes chosen by what actually grows there,
// and three of them are here:
//
//   blob    broadleaf scrub      — a squashed lump. Everywhere else, and what
//                                  this component already was.
//   spike   saltbush / creosote  — an octahedron scaled (0.8, 1.35, 0.8):
//                                  "sparse, angular, twice as tall as it is
//                                  wide". Deserts.
//   spray   tussock / bunchgrass — an OPEN cone, drawn DoubleSide. Snow and
//                                  alpine pasture.
//
// v1's fourth, `frond` (a flat rosette for rainforest floor), is not here
// because dustline has no surface to key it on: the surface set is tarmac /
// gravel / mud / snow / ice / sand, and nothing in it says jungle.
//
// HOW THE SILHOUETTE IS CHOSEN is the one deliberate change. v1 picks per
// WORLD, from `T.understorey` or a theme lookup. dustline has no theme on a
// component, so the pick is per instance from the ground it is standing on —
// the same mechanism the pine's snow cap and the birch's bare winter branches
// use. Only one part is ever eligible for a given instance, so a bush still
// costs one instanced mesh and one silhouette's worth of triangles: 80 on
// gravel and mud, 8 on sand, 12 on snow.
//
// AND `snow` LEAVES `avoidSurfaces`. It was there because a green lump on a
// snowfield is wrong, which was true of the only shape this had. A bleached
// tussock is not wrong, it is what a snowfield edge actually looks like, and
// scatter refusing to place any understorey at all on snow is why the white
// worlds read as empty. Ice stays refused — nothing grows on ice.
//
// WHAT DID NOT COME ACROSS: v1's blob is `IcosahedronGeometry(1, 0)`, a 20-tri
// lump. The detail-1 craggy sphere here is a better bush and it stays.

import * as THREE from 'three';
import { PropTemplate, standard, craggy } from './types';

/** v1's `blob`: broadleaf scrub, and the default. */
const blobGeo = () => {
  const g = craggy(new THREE.IcosahedronGeometry(1, 1), 0.18);
  g.scale(1, 0.6, 1);
  g.translate(0, 0.2, 0);
  return g;
};

/** v1's `spike`: "desert scrub: sparse, angular, twice as tall as it is wide".
 *  v1's octahedron and v1's (0.8, 1.35, 0.8), at 0.65 of v1's radius so it
 *  sits in dustline's bush envelope rather than v1's much larger one. */
const spikeGeo = () => {
  const g = new THREE.OctahedronGeometry(0.55, 0);
  g.scale(0.8, 1.35, 0.8);
  g.translate(0, 0.52, 0);
  return g;
};

/** v1's `spray`: an open cone, drawn double-sided. v1's own note calls it
 *  "narrow at the base, splaying up and out", which is not what a cone does —
 *  the geometry is apex-up and it is ported as written, because what it
 *  actually gives is a faceted tussock and that is the read the snow edge
 *  wanted. Same 0.65 factor as the spike. */
const sprayGeo = () => {
  const g = new THREE.ConeGeometry(0.62, 1.0, 6, 1, true);
  g.translate(0, 0.5, 0);
  return g;
};

const bush: PropTemplate = {
  id: 'bush',
  name: 'Bush',
  category: 'flora',
  description: 'Understorey: scrub on dirt, spiked saltbush on sand, tussock on snow. Never solid.',

  build: () => [
    {
      key: 'body',
      geometry: blobGeo(),
      material: standard(0xffffff),
      when: (c) => c.surface !== 'sand' && c.surface !== 'snow',
      tint: (c) => new THREE.Color().setHSL(0.3, 0.35, 0.24)
        .offsetHSL(0, 0, c.rng.centered(0.03)),
    },
    {
      key: 'spike',
      geometry: spikeGeo(),
      material: standard(0xffffff),
      when: (c) => c.surface === 'sand',
      // grey-green and dry: creosote and saltbush are the only living things
      // out there and neither of them is the green of a hedge.
      tint: (c) => new THREE.Color().setHSL(0.16, 0.2, 0.3)
        .offsetHSL(0, 0, c.rng.centered(0.04)),
    },
    {
      key: 'spray',
      geometry: sprayGeo(),
      // DoubleSide, which is v1's rule for this silhouette and not optional:
      // an open cone seen from inside is a hole otherwise.
      material: standard(0xffffff, { side: THREE.DoubleSide }),
      when: (c) => c.surface === 'snow',
      // bleached straw. The tussock has to read against white, so it is
      // darker and duller than the snow rather than another shade of it.
      tint: (c) => new THREE.Color().setHSL(0.12, 0.16, 0.44)
        .offsetHSL(0, 0, c.rng.centered(0.05)),
    },
  ],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 30 },

  authoring: {
    scale: [0.5, 1.4],
    defaultScale: 0.9,
    avoidSurfaces: ['ice'],
    minRoadDist: 9,
    randomYaw: true,

  },
};

export default bush;
