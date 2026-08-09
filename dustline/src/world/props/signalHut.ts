// SIGNAL HUT — a small gabled hut with an antenna mast.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.signalhut` in `src/world/catalog.js`
// at the repository root, already ported into `houseTemplates.ts`. A 4.6 m
// hut, a pitched roof and a 6.4 m mast with a crossbar off one corner —
// nearly ten metres of total height on a footprint smaller than the shed's.
//
// It is the only settlement component that reads as INFRASTRUCTURE rather than
// as somewhere anybody lives: a railway box, a border post, a relay station.
// One of these at the end of a valley says the road goes somewhere, which is a
// thing no number of cottages can say.
//
// The mast is inside the template's own collider radius of 3.2 m and the
// collider runs the full 9.8 m to the mast tip, so the hut stops a car at its
// walls rather than at the mast — right, because the mast is a thin pole and
// the walls are what you actually hit.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'signalHut',
  name: 'Signal hut',
  template: 'signalhut',
  kit: 'farm',
  description: 'Gabled hut with a 6.4 m antenna mast, 5.4 x 4.8 m, 9.8 m to the tip. Solid.',
  massKg: 15000,
  scale: [0.9, 1.15],
  minRoadDist: 10,
});
