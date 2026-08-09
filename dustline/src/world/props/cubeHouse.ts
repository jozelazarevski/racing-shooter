// CUBE HOUSE — the Aegean whitewashed cube.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.cube` in `src/world/catalog.js` at
// the repository root, already ported into `houseTemplates.ts`. A parapet
// instead of eaves, an outside stair climbing the flank, a roof room set back
// on the terrace, and one painted door. It is the FLAT TOP that does the work:
// every other dwelling in the set ends in a pitch, so a village of these reads
// as a different coast from a hundred metres out without a single new shape.
//
// KIT: dalmatia, the limewash kit — its `wallBase` is white so the wall colour
// survives the texture multiply. The four kits carried over do not include an
// Aegean blue, so the door and shutter come out dalmatia's green rather than
// the blue the table's comment names. That is a missing kit, not a wrong
// template, and adding one belongs in `houseTemplates.ts`, not here.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'cubeHouse',
  name: 'Cube house',
  template: 'cube',
  kit: 'dalmatia',
  description: 'Flat-roofed limewashed cube with a parapet, outside stair and roof room, 8 x 7.2 m, 9.2 m tall. Solid.',
  massKg: 90000,
  scale: [0.85, 1.2],
  minRoadDist: 12,
});
