// LOG PILE — six stacked trunks.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.logpile` in `src/world/catalog.js` at
// the repository root. Yard dressing, and the fallback shape the v1 element builder uses when it is
// handed a name it does not know.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'logPile',
  name: 'Log pile',
  template: 'logpile',
  kit: 'alpine',
  description: 'Stack of six trunks, 4.6 m long. Solid.',
  category: 'debris',
  massKg: 6000,
  scale: [0.8, 1.3],
  minRoadDist: 8,
});
