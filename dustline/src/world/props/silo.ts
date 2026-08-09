// SILO — banded cylinder under a conical cap.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.silo` in `src/world/catalog.js` at
// the repository root. The farm's vertical: a farmstead of nothing but low buildings has no
// silhouette at all from the road.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'silo',
  name: 'Silo',
  template: 'silo',
  kit: 'farm',
  description: 'Banded grain silo under a conical cap, 4.4 m across, 11 m tall. Solid.',
  massKg: 200000,
  scale: [0.85, 1.15],
  minRoadDist: 14,
});
