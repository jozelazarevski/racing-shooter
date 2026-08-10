// MARSHAL POST — a striped pole with a flag panel. Reads at speed, which is
// the entire job of trackside furniture: it tells you where the corner goes
// before you can see the corner.

import { PropTemplate, boxAt, cylinderAt, standard } from './types';

const marshalPost: PropTemplate = {
  id: 'marshalPost',
  name: 'Marshal post',
  category: 'trackside',
  description: 'Striped pole and board. Visible at speed; solid but frangible-light.',

  build: () => [
    { key: 'pole', geometry: cylinderAt(0.07, 0.09, 2.6, 8, 0), material: standard(0xe8e2d4, { flatShading: false }), castShadow: true },
    { key: 'band', geometry: cylinderAt(0.075, 0.075, 0.5, 8, 1.1), material: standard(0xd83a2a, { flatShading: false }) },
    { key: 'board', geometry: boxAt(0.9, 0.62, 0.06, 2.0), material: standard(0xf4b21a), castShadow: true },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.3 * s, radius: 0.12 * s, centerY: 1.3 * s }),
    solid: true,
    massKg: 25,
  },

  authoring: { scale: [0.9, 1.15], defaultScale: 1, minRoadDist: 7 },
};

export default marshalPost;
