// COTTAGE, HIPPED — tall and narrow under a pyramid roof.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.cottageB` in `src/world/catalog.js` at
// the repository root. One of the three original scattered dwellings: the massing differs from
// cottageA, not the tint, which is the whole reason there is more than one.

import { dwelling } from '../../templates/buildings';

export default dwelling({
  id: 'cottageHipped',
  name: 'Cottage, hipped',
  template: 'cottageB',
  kit: 'dalmatia',
  description: 'Tall narrow cottage under a hipped pyramid roof, 5.6 m. Solid.',
  massKg: 34000,
  scale: [0.85, 1.2],
  minRoadDist: 11,
});
