// CHALET — long and low under a very deep eave.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.cottageH` in `src/world/catalog.js` at
// the repository root. Full-width balcony, woodpile stacked under it.

import { dwelling } from '../../templates/buildings';

export default dwelling({
  id: 'chalet',
  name: 'Chalet',
  template: 'cottageH',
  kit: 'alpine',
  description: 'Long chalet under a deep eave, full-width balcony, 9 m. Solid.',
  massKg: 80000,
  scale: [0.9, 1.15],
  minRoadDist: 13,
});
