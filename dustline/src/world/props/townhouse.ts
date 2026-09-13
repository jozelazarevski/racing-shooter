// TOWNHOUSE — two full storeys, string course, balcony.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.cottageE` in `src/world/catalog.js` at
// the repository root. Roof end-on to the street, which is what makes a row of them a terrace.

import { dwelling } from '../../templates/buildings';

export default dwelling({
  id: 'townhouse',
  name: 'Townhouse',
  template: 'cottageE',
  kit: 'liguria',
  description: 'Two-storey townhouse with a string course and an upper balcony, 6.2 m. Solid.',
  massKg: 120000,
  scale: [0.9, 1.15],
  minRoadDist: 11,
});
