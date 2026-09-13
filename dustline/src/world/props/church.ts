// CHURCH — nave, bell tower, cross.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.chapel` in `src/world/catalog.js` at
// the repository root. The landmark of a settlement: tall enough to see from the far side of the
// map, which makes it what tells you where the village is while you are still
// driving towards it.

import { dwelling } from '../../templates/buildings';

export default dwelling({
  id: 'church',
  name: 'Church',
  template: 'chapel',
  kit: 'dalmatia',
  description: 'Stone chapel with a bell tower and cross, 15 m to the tip. Solid.',
  massKg: 400000,
  scale: [0.9, 1.2],
  minRoadDist: 18,
  previewDist: 40,
});
