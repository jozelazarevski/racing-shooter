// BOULDER — the big one. Always solid, heavy enough to be a hazard rather
// than an obstacle you nudge aside.

import * as THREE from 'three';
import { PropTemplate, standard, craggy } from './types';

const geo = () => {
  // Two subdivisions, because a boulder is the one stone a player drives right
  // up to and there are only ever a handful in a world.
  const g = craggy(new THREE.DodecahedronGeometry(1, 2), 0.14);
  g.scale(1.15, 0.85, 1);
  g.translate(0, 0.6, 0);
  return g;
};

const boulder: PropTemplate = {
  id: 'boulder',
  name: 'Boulder',
  category: 'terrain',
  description: 'Large stone. Always solid — a course-defining obstacle.',

  build: () => [{
    key: 'body',
    geometry: geo(),
    material: standard(0x8d8a82, { roughness: 0.98 }),
    castShadow: true,
    tint: (c) => new THREE.Color()
      .setHex(c.surface === 'snow' ? 0xc2ccd6 : c.surface === 'sand' ? 0xbfa079 : 0x807d75)
      .offsetHSL(0, 0, c.rng.centered(0.05)),
  }],

  physics: {
    shape: (s) => ({ kind: 'ball', radius: s * 1.05, centerY: s * 0.6 }),
    solid: true,
    massKg: 12000,
  },

  authoring: {
    scale: [1.4, 3.2], defaultScale: 2, minRoadDist: 12, randomYaw: true,
  },
};

export default boulder;
