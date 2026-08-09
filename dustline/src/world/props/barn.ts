// BARN — the rally-stage building. Every real stage runs past one, and it is
// the cheapest way to make open country read as farmed rather than empty.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.barn`. The hand-rolled 9 x 6 m box
// that stood here first was the odd one out once the dwellings came across —
// a farmyard with a v1 farmhouse and a dustline barn in it looks like two
// different games sharing a field, which it was.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'barn',
  name: 'Barn',
  template: 'barn',
  kit: 'farm',
  category: 'structure',
  description: 'Gabled barn, 12 x 8.4 m, with a hay-loft hatch. Solid.',
  massKg: 60000,
  scale: [0.8, 1.3],
  minRoadDist: 15,
  previewDist: 32,
});
