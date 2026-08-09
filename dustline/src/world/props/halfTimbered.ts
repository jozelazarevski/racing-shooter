// HALF-TIMBERED HOUSE — the upper floor jetties out over the lower.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.cottageF` in `src/world/catalog.js` at
// the repository root. That overhang is the silhouette the eye reads before it reads any timber.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'halfTimbered',
  name: 'Half-timbered house',
  template: 'cottageF',
  kit: 'alpine',
  description: 'Two-storey house with a jettied upper floor and timber framing, 6.8 m. Solid.',
  massKg: 105000,
  scale: [0.9, 1.15],
  minRoadDist: 11,
});
