// WELL — stone ring, two posts, a little roof.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.well` in `src/world/catalog.js` at
// the repository root. Village-square furniture at a scale nothing else in the set covers.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'wellHouse',
  name: 'Well',
  template: 'well',
  kit: 'farm',
  description: 'Stone well with a winch and a pitched roof, 3.2 m across. Solid.',
  massKg: 3000,
  scale: [0.9, 1.2],
  minRoadDist: 8,
});
