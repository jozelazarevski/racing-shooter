// WATCHTOWER — a marshal's tower with a railed platform. Human-scale vertical
// furniture: it tells you a corner is manned.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.watchtower`.

import { dwelling } from '../../templates/buildings';

export default dwelling({
  id: 'watchtower',
  name: 'Watchtower',
  template: 'watchtower',
  kit: 'alpine',
  category: 'structure',
  description: 'Tower with a railed platform under a conical roof, 14 m. Solid.',
  massKg: 5000,
  scale: [0.85, 1.3],
  minRoadDist: 11,
  previewDist: 34,
});
