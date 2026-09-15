// PUEBLO RUIN — the broken fortress on the mesa rim.
//
// SHAPE FROM IGNITE RALLY: `HOUSE_TEMPLATES.puebloRuin` in `src/world/catalog.js`
// at the repository root, already ported into `houseTemplates.ts`. A roofless
// main block, a stepped lower block, a breached curtain wall whose gap is the
// gate, a collapsed round tower under a ragged cap, protruding vigas and
// tumbled rubble. The only component in the library that is a RUIN, which is
// why it is worth its 10.5 x 8.5 m footprint: it reads as history in a set
// where everything else was finished last week.
//
// DO NOT "FIX" THE TEMPLATE'S PART KINDS. Every piece of its masonry is kind
// 'box' or 'cyl' and none is kind 'wall', including the parts written into the
// `wall` and `wall2` COLOUR slots. Kind 'wall' is the bucket that carries the
// emissive window map — it is the inhabited mass — so a ruin built out of it
// would have lit windows behind its collapsed roof, which is a haunted house.
// The slots name colours; the kinds name materials. They are allowed to
// disagree and here they must.
//
// KIT: farm — sand walls, grey stone rubble, brown vigas. The Mediterranean
// kits would paint the beam ends green.
//
// The collider is the template's own `r` of 8.5, and that is generous against
// the masonry: the ruin's parts do not fill their footprint and there are gaps
// you could believe are drivable. They are not, and a collider that let a car
// halfway into a stone wall before stopping it is worse than one that stops it
// a metre early.

import { dwelling } from '../../templates/buildings';

export default dwelling({
  id: 'puebloRuin',
  name: 'Pueblo ruin',
  template: 'puebloRuin',
  kit: 'farm',
  description: 'Roofless stone ruin with a breached curtain wall and a collapsed tower, 11.8 x 9 m, 7.5 m tall. Solid.',
  massKg: 220000,
  scale: [0.8, 1.25],
  minRoadDist: 16,
  previewDist: 34,
});
