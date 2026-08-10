// COURTYARD HOUSE — the Andalusian house behind its walled patio.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.courtyard` in `src/world/catalog.js`
// at the repository root, already ported into `houseTemplates.ts`. Its table
// comment states the point: THE HOUSE IS HALF THE OBJECT — the other half is
// the coped patio wall beside it, which is what makes a line of these read as
// a STREET rather than as detached buildings standing in a field.
//
// That wall is also why this one needs room. The template spans about 13 m in
// x against the cottage's 7, all of it on one side of the origin, so a
// `minRoadDist` sized for a cottage puts the patio coping in the carriageway.
// 16 m clears the wall at the top of the scale range with margin.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'courtyardHouse',
  name: 'Courtyard house',
  template: 'courtyard',
  kit: 'liguria',
  description: 'Rendered house with a walled patio alongside, 13 m across, 8.3 m tall. Solid.',
  massKg: 120000,
  scale: [0.85, 1.15],
  minRoadDist: 16,
});
