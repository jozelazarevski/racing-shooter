// COTTAGE — the scattered dwelling.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.cottageA` in `src/world/catalog.js` at
// the repository root. The archetype the v1 game puts more of in front of a player
// than any other building, and the one the keeper's house at its lighthouse is.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'cottage',
  name: 'Cottage',
  template: 'cottageA',
  kit: 'dalmatia',
  description: 'Rendered cottage on a stone footing, 7 m. Eaves, porch door, ridge chimney. Solid.',
  massKg: 40000,
  scale: [0.85, 1.2],
  minRoadDist: 12,
});
