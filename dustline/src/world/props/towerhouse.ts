// TOWER HOUSE — four storeys on a small footprint.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.towerhouse` in `src/world/catalog.js` at
// the repository root. The Ligurian terrace house: painted render, shallow pantile roof, a shutter
// band per floor. The silhouette is what tells you which coast you are on.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'towerhouse',
  name: 'Tower house',
  template: 'towerhouse',
  kit: 'liguria',
  description: 'Four-storey painted terrace house, 5.8 m footprint, 13 m tall. Solid.',
  massKg: 160000,
  scale: [0.9, 1.1],
  minRoadDist: 11,
});
