// FARMHOUSE — the rural house, with a wing and a porch.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.house` in `src/world/catalog.js` at
// the repository root. A FARMHOUSE, NOT A BOX WITH A LID: a stone footing so it sits IN the ground,
// a steep roof whose eaves oversail the walls, and a lower wing so the outline
// is not a rectangle. Its table comment is worth reading.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'farmhouse',
  name: 'Farmhouse',
  template: 'house',
  kit: 'farm',
  description: 'Farmhouse with a side wing, posted porch and ridge chimney, 7.8 m. Solid.',
  massKg: 90000,
  scale: [0.9, 1.15],
  minRoadDist: 14,
});
