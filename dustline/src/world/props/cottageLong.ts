// COTTAGE, LONG — low, with a lean-to on the end.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.cottageC` in `src/world/catalog.js` at
// the repository root. The long low member of the original three.

import { dwelling } from '../../templates/buildings';

export default dwelling({
  id: 'cottageLong',
  name: 'Cottage, long',
  template: 'cottageC',
  kit: 'dalmatia',
  description: 'Long low cottage with an end lean-to, 8 m. Solid.',
  massKg: 38000,
  scale: [0.85, 1.2],
  minRoadDist: 12,
});
