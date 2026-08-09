// KIOSK — a serving hatch under an awning.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.kiosk` in `src/world/catalog.js` at
// the repository root. What puts people in a place without modelling any.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'kiosk',
  name: 'Kiosk',
  template: 'kiosk',
  kit: 'dalmatia',
  description: 'Roadside kiosk with an awning and a sign board, 4.4 m. Solid.',
  massKg: 4000,
  scale: [0.9, 1.15],
  minRoadDist: 8,
});
