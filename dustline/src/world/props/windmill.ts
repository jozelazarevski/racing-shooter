// WINDMILL — tapered tower, cap and four sails.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.windmill` in `src/world/catalog.js` at
// the repository root. The other long-range landmark, and the one that suits open farmland where a
// church tower would not.

import { dwelling } from '../../templates/buildings';

export default dwelling({
  id: 'windmill',
  name: 'Windmill',
  template: 'windmill',
  kit: 'farm',
  description: 'Tapered mill tower with four sails, 10 m to the cap. Solid.',
  massKg: 150000,
  // COVERAGE — the tower. The sails sweep a 13 m circle and are not solid.
  coverage: 'trunk',
  scale: [0.85, 1.15],
  minRoadDist: 16,
  previewDist: 34,
});
