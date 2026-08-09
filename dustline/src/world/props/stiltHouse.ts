// STILT HOUSE — a timber cabin standing on six posts.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.stilt` in `src/world/catalog.js` at
// the repository root, already ported into `houseTemplates.ts`. Six 3 m posts,
// a gabled cabin on top and a deck out one side. The archetype of a dwelling
// on a flood plain, a lake edge or a slope too steep to level.
//
// KIT: farm, and the timber half of that kit is the point — `farm` has
// `planks: true`, so the walls get v1's boarding rather than the limewash the
// Mediterranean kits use. A planked stilt house is a hut; a limewashed one is
// a villa on legs.
//
// LIGHT FOR ITS SIZE. It is 8.6 m tall and looks like a building, but there is
// nothing in it except a boarded box on posts, so it weighs a fifteenth of the
// masonry cottage it stands next to. Inventing that number later per-object is
// exactly how a hay bale ends up heavier than a boulder.
//
// It is NOT a floating or shore component: `dwelling()` builds land placement,
// and the posts are anchored to the ground the base sits on. Put one at a
// waterline by hand if you want it in the shallows.

import { dwelling } from './houseTemplates';

export default dwelling({
  id: 'stiltHouse',
  name: 'Stilt house',
  template: 'stilt',
  kit: 'farm',
  description: 'Boarded cabin on six 3 m posts with a side deck, 7.2 x 7.7 m overall, 8.6 m tall. Solid.',
  massKg: 22000,
  scale: [0.85, 1.15],
  minRoadDist: 12,
});
