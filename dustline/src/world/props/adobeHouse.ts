// ADOBE HOUSE — flat-roofed mud brick with protruding roof beams.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.adobe` in `src/world/catalog.js` at
// the repository root, already ported into `houseTemplates.ts`. A single
// low block, a parapet standing proud of the roof line, and three VIGAS —
// the ceiling beams left sticking out through the front wall. Those three
// stubs are the whole archetype: without them it is a beige box, and with
// them it is the only building in the set that could be in a desert.
//
// KIT: farm. Its `wall` is the sand tone the adobe wants and its `trim` is a
// dark brown, which is what the vigas need — the two Mediterranean kits paint
// trim green for shutters, and green beam ends look like a mistake.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'adobeHouse',
  name: 'Adobe house',
  template: 'adobe',
  kit: 'farm',
  description: 'Flat-roofed adobe block with a parapet and protruding vigas, 9.1 x 8.1 m, 4.9 m tall. Solid.',
  massKg: 85000,
  scale: [0.85, 1.2],
  minRoadDist: 12,
});
