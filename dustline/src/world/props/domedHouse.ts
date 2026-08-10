// DOMED HOUSE — the Aegean cube's neighbour, with a drum and a cap.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.domed` in `src/world/catalog.js` at
// the repository root, already ported into `houseTemplates.ts`. Same
// parapeted cube as `cubeHouse`, plus a low drum carrying a conical cap — the
// chapel-ish silhouette that sits among the flat roofs of an island village
// and stops the terrace reading as one repeated block.
//
// Scale range is deliberately narrower than the cottage's. This is the shape
// the eye picks out of a row, and a row containing the same dome at 0.85 and
// at 1.2 reads as one building drawn twice at two distances.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'domedHouse',
  name: 'Domed house',
  template: 'domed',
  kit: 'dalmatia',
  description: 'Limewashed cube under a drum and conical cap, 8.1 x 7.5 m, 9 m tall. Solid.',
  massKg: 85000,
  scale: [0.9, 1.12],
  minRoadDist: 12,
});
