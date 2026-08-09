// SHED — the lean-to outbuilding. The small thing that makes a barn look like
// a farm rather than a barn in a field.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.shed`.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'shed',
  name: 'Shed',
  template: 'shed',
  kit: 'farm',
  category: 'structure',
  description: 'Lean-to outbuilding, 5.2 x 4.2 m. Solid.',
  massKg: 9000,
  scale: [0.8, 1.3],
  minRoadDist: 10,
});
