// FARMHOUSE, L-PLAN — a main range with a return wing and a dormer.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.cottageD` in `src/world/catalog.js` at
// the repository root. One of the five added when three silhouettes turned out to make every
// village read as the same house stamped down the road.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'farmhouseL',
  name: 'Farmhouse, L-plan',
  template: 'cottageD',
  kit: 'farm',
  description: 'L-plan farmhouse, posted porch, dormer breaking the eaves, 8.4 m. Solid.',
  massKg: 95000,
  scale: [0.9, 1.15],
  minRoadDist: 14,
});
