// STONE COTTAGE — outside stair to the upper door, lean-to woodstore.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.cottageG` in `src/world/catalog.js` at
// the repository root. The plan you get on any hillside.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'stoneCottage',
  name: 'Stone cottage',
  template: 'cottageG',
  kit: 'alpine',
  description: 'Stone cottage with an outside stair and a woodstore, 7.2 m. Solid.',
  massKg: 70000,
  scale: [0.9, 1.2],
  minRoadDist: 12,
});
