// The buildable-world catalog: destructible prop specs, house and
// cottage templates, per-region element kits, flora mixes, sponsor
// boards and the shared prop geometry/material cache. Data plus the
// merged-geometry builders that turn it into instanced assets.
import * as THREE from 'three';
import { coneTexture, crateTexture } from '../textures.js';


// ---- width-variation ----
// Per-theme narrow-section tuning: {count, min} — `min` is the pinch floor as
// a fraction of ROAD_HALF. Themes may also declare `narrows` directly on their
// THEMES entry (it wins). Cliff-walled corridors (canyon/glacial/ravine/
// sheetice/undercity) are auto-off — those roads are already the constraint.
// Everything else defaults to { count: 3, min: 0.6 }.
export const NARROW_TUNE = {
  avalanche: { count: 4, min: 0.55 },  // the pass squeezes hardest
  alpine: { count: 2, min: 0.62 },     // switchback stack is left alone
  dunes: { count: 2, min: 0.65 },      // fast flow world — gentler pinches
  neon: { count: 2, min: 0.65 },       // expressway keeps its speed
};
// ---- river-fords ----
// Worlds with shallow watercourses crossing the road (visible stream + splash
// + wet-tire traction loss; consumed by the vehicle code via track.fords).
// Themes may declare `fords: {count}` on their THEMES entry (it wins).
export const FORD_TUNE = {
  forest: { count: 2 }, alpine: { count: 2 }, jungle: { count: 3 },
  oasis: { count: 2 }, flume: { count: 2 }, redwood: { count: 2 },
};
// ---- viz-zones ----
// Sectional visibility hazards, per theme: [kind, count] pairs.
//   'forest'  — thick tree corridor pressed against both road edges + gloom
//   'fogbank' — localized dense fog (pure zone data; runtime pulls fog in)
//   'squall'  — rain burst + fog pull on wet worlds
// Exposed as track.vizZones [{i0, i1, len, mid, half, kind, strength}];
// the game lead lerps scene fog from it, rivals slow inside.
export const VIZ_TUNE = {
  forest: [['forest', 2], ['squall', 1]],
  alpine: [['forest', 2], ['fogbank', 1]],
  redwood: [['forest', 2]],
  flume: [['forest', 2]],
  wildfire: [['forest', 1]],
  jungle: [['forest', 2], ['squall', 1]],
  avalanche: [['forest', 1], ['fogbank', 2]],
  snow: [['fogbank', 2]],
  glacial: [['fogbank', 1]],
  sheetice: [['fogbank', 1]],
};

export const SPONSORS = [
  ['AETHER', '#14243a', '#7fd4ff'],
  ['HYPER-FLUX', '#2a1436', '#ff7fd4'],
  ['CLAW TIRES', '#1c1812', '#e8b83a'],
  ['VOLT FUEL', '#26300f', '#d4ff5e'],
  ['RALLY CO.', '#3a1414', '#ffd4c2'],
];
// NEO-KYOTO holo sponsors: near-black panels, searing neon lettering
export const NEON_SPONSORS = [
  ['KIRIN CYBER', '#050510', '#2af6ff'],
  ['LOTUS-9', '#0a0514', '#ff3af0'],
  ['HYPER-FLUX', '#02101a', '#7fd4ff'],
  ['ONI RAMEN', '#140505', '#ffd23a'],
  ['VOLT', '#0a1405', '#d4ff5e'],
];

// ---------- destructible prop catalog ----------
// Per-theme mix of smashable roadside props ([type, count]); every level totals
// well under 60 individual meshes. Geometry (and theme-independent materials)
// are shared module-wide — each prop is still its own cheap Mesh/Group so the
// game code can knock it flying individually.
export const PROP_SPECS = {
  forest: [['hay', 22], ['crate', 16], ['cone', 14]],
  desert: [['crate', 16], ['cone', 14], ['barrel', 18]],
  snow: [['snowman', 16], ['crate', 16], ['cone', 14]],
  canyon: [['crate', 16], ['barrel', 13], ['cone', 13], ['rock', 8]],
  volcano: [['barrel', 18], ['crate', 16], ['cone', 14]],
  alpine: [['hay', 20], ['crate', 16], ['cone', 14]],
  glacial: [['penguin', 10], ['snowman', 10], ['crate', 14], ['barrel', 10]],
  jungle: [['crate', 14], ['barrel', 12], ['cone', 12], ['hay', 14]],
  dunes: [['barrel', 16], ['crate', 16], ['cone', 14]],
  ravine: [['crate', 14], ['barrel', 14], ['cone', 12], ['rock', 8]],
  oasis: [['crate', 16], ['barrel', 12], ['hay', 14], ['cone', 10]],
  redwood: [['hay', 18], ['crate', 16], ['cone', 12]],
  flume: [['hay', 26], ['crate', 16], ['barrel', 12]],   // hay = cut-log rounds here
  wildfire: [['barrel', 18], ['crate', 14], ['cone', 12]],
  sheetice: [['penguin', 10], ['snowman', 10], ['crate', 14], ['barrel', 10]],
  avalanche: [['snowman', 14], ['crate', 16], ['cone', 12], ['hay', 10]],
  neon: [['barrel', 18], ['crate', 16], ['cone', 14]],
  undercity: [['crate', 18], ['barrel', 18], ['cone', 12]],
  pass: [['hay', 20], ['crate', 16], ['cone', 14], ['rock', 8]],
  tremola: [['hay', 16], ['crate', 16], ['cone', 14], ['rock', 10]],
  furka: [['snowman', 10], ['crate', 16], ['cone', 14], ['rock', 12]],
  // OLIVE COAST: the Bible's roadside kit is blue plastic harvest crates,
  // rolled olive nets (the hay rolls) and stones off the terrace walls
  medterrace: [['crate', 20], ['hay', 14], ['cone', 12], ['rock', 8]],
  // OLD TOWN: market stall crates packed away at the kerb, street-works cones
  // and steel drums. No rocks and no hay — the region's negative list rules
  // out gravel, dirt and anything that is not architectural.
  oldtown: [['crate', 20], ['cone', 18], ['barrel', 14]],
  // farm dressing only — 'hay' is a wrapped silage bale here and 'barrel' a
  // slurry drum. No 'rock': the region's negative list forbids exposed rock.
  farmland: [['hay', 24], ['crate', 14], ['barrel', 10], ['cone', 10]],
  // OUTBACK: 44-gallon drums at the siding, station fodder, freight crates.
  // No 'rock' — a gibber plain has no boulders worth stacking beside a road.
  outback: [['barrel', 20], ['hay', 14], ['crate', 14], ['cone', 10]],
};
export const PROP_SCORE = { cone: 25, crate: 50, hay: 40, barrel: 60, snowman: 75, rock: 20, penguin: 40 };
export const PROP_PICKUPS = ['health', 'missile', 'nitro', 'mine'];
// theme tints for the barrel drum texture
export const BARREL_PALETTES = {
  desert: { base: '#c29a5c', hoop: '#4a3620' },
  canyon: { base: '#9a6440', hoop: '#33291e' },
  volcano: { base: '#37322e', hoop: '#191512', stripe: '#e8381e' },
  glacial: { base: '#7aa8c4', hoop: '#2c4456', stripe: '#e8f2f8' },
  jungle: { base: '#5a7a34', hoop: '#2c3a1a', stripe: '#c8b45e' },
  dunes: { base: '#c9a05e', hoop: '#4a3620' },
  ravine: { base: '#8f5434', hoop: '#2e2016' },
  wildfire: { base: '#2e2a26', hoop: '#141210', stripe: '#e8481e' },
  sheetice: { base: '#8ab4d0', hoop: '#2c4456', stripe: '#eef6fc' },
  avalanche: { base: '#7aa8c4', hoop: '#2c4456', stripe: '#e8f2f8' },
  neon: { base: '#22262e', hoop: '#101318', stripe: '#26f6ff' },
  undercity: { base: '#3a4034', hoop: '#181c14', stripe: '#8a9a3c' },
  oldtown: { base: '#3a4048', hoop: '#1a1e24', stripe: '#f2a93b' },  // works drum
  farmland: { base: '#5a6450', hoop: '#2c3226' },      // green slurry drum
  outback: { base: '#9a5a38', hoop: '#3e2a1c', stripe: '#c9b9a2' },  // rusted 44-gallon drum
};

// ---------- world elements: farms, chapels, outposts, field walls ----------
// Every world gets lived-in structures out in the country: places to go and
// smash. A "kit" is one theme family's palette + which archetypes it builds.
// Buildings are SOLID ('hut' → they crash big); field walls are SOLID stone;
// rail fences, troughs, feed bins and hay racks are BREAKABLE props (they go
// through this.props, so cars AND weapons destroy them).
/* ---------------------------------------------------------------------------
 * HOUSE TEMPLATES — every structure in the game, as data.
 *
 * THE COMPLAINT: "Design houses templates and make sure they are referenced
 * across all tracks instead of designing one by one."
 *
 * It was the right diagnosis. Five builders each rolled their own dwelling
 * geometry — `_buildHuts` (the scattered cottages), `_element` (the farmstead
 * kit), the spur farmstead's barn, the OLD TOWN frontage, and the igloos — and
 * the cost of that was not abstraction for its own sake. THE SAME BUG SHIPPED
 * TWICE, INDEPENDENTLY: `_buildHuts` and the barn builder both composed a
 * centred ConeGeometry roof at the wall top without translating it to its own
 * base, so half of every roof was inside the house it sat on. Two builders,
 * one mistake, found weeks apart. A third would have made it three.
 *
 * So a template is a PART LIST, not a function. Every entry is
 *
 *     [kind, dx, dy, dz, sx, sy, sz, colourKey, roll?]
 *
 * in the structure's own local frame, with y measured from the ground and
 * every shared geometry base-anchored ONCE in `_realizeElements`. There is
 * nowhere left for an author to forget a translate, because no author writes a
 * translate: they write a height. `colourKey` names a slot in the theme's
 * ELEMENT_KIT (wall / wall2 / roof / trim / stone) so one template reads as
 * limewash-and-pantile in the Mediterranean and weatherboard-and-tin in the
 * outback without a second copy of the shape.
 *
 * `r` is the collider radius the car pushes off, and `mat` its solidity class.
 */
export const HOUSE_TEMPLATES = {
  // ---- THE MEDITERRANEAN COASTS ----
  // Four archetypes that are genuinely different SHAPES, not the farmhouse
  // retinted: a tall narrow Ligurian terrace house, a flat-roofed Aegean cube,
  // its domed neighbour, and an Andalusian house around a walled patio. The
  // silhouette is what tells you which coast you are on from the driving seat.

  // LIGURIA: four storeys on a small footprint, painted render, shallow
  // pantile roof, a shutter band per floor.
  towerhouse: { r: 4.4, parts: [
    ['box', 0, 0, 0, 5.8, 0.5, 5.4, 'stone'],                // footing
    ['wall', 0, 0.5, 0, 5.4, 11.2, 5.0, 'wall'],             // the tall block
    ['box', 0, 11.7, 0, 6.1, 0.26, 5.7, 'trim'],             // eaves
    ['prism', 0, 11.95, 0, 6.3, 1.5, 5.9, 'roof'],           // shallow pantile
    ['box', 0, 3.0, 2.6, 3.9, 0.5, 0.22, 'trim'],            // shutter bands
    ['box', 0, 5.9, 2.6, 3.9, 0.5, 0.22, 'trim'],
    ['box', 0, 8.8, 2.6, 3.9, 0.5, 0.22, 'trim'],
    ['box', 0, 0.5, 2.6, 1.5, 2.4, 0.2, 'trim'],             // street door
  ] },
  // AEGEAN: a whitewashed cube with a parapet instead of eaves, an outside
  // stair, and one painted door.
  cube: { r: 4.6, parts: [
    ['wall', 0, 0, 0, 8.0, 5.4, 7.2, 'wall'],
    ['box', 0, 5.4, 0, 8.5, 0.55, 7.7, 'wall2'],             // parapet
    ['wall', 2.2, 5.95, 0.8, 3.6, 2.8, 3.4, 'wall'],         // roof room
    ['box', 2.2, 8.75, 0.8, 3.9, 0.45, 3.7, 'wall2'],
    ['box', -2.6, 0, 3.7, 2.6, 2.6, 0.55, 'trim'],           // outside stair
    ['box', 0.9, 0, 3.7, 1.5, 2.5, 0.22, 'trim'],            // blue door
    ['box', -2.8, 3.2, 3.7, 1.2, 1.1, 0.2, 'trim'],          // shutter
  ] },
  // AEGEAN, the one with the dome: same cube, a drum and a blue cap.
  domed: { r: 4.8, parts: [
    ['wall', 0, 0, 0, 7.6, 4.8, 7.0, 'wall'],
    ['box', 0, 4.8, 0, 8.1, 0.5, 7.5, 'wall2'],
    ['cyl', 0, 5.3, 0, 3.4, 1.5, 3.4, 'wall'],               // drum
    ['cone', 0, 6.8, 0, 3.8, 2.2, 3.8, 'roof'],              // the blue cap
    ['box', 0, 0, 3.6, 1.5, 2.5, 0.22, 'trim'],
    ['box', -2.4, 2.6, 3.6, 1.1, 1.0, 0.2, 'trim'],
  ] },
  // ANDALUSIA: the house is half the object - the other half is the walled
  // patio it sits behind, which is what makes the street read as a street.
  courtyard: { r: 6.4, parts: [
    ['box', -1.6, 0, 0, 8.4, 0.6, 7.4, 'stone'],
    ['wall', -1.6, 0.6, 0, 7.8, 5.0, 6.8, 'wall'],
    ['box', -1.6, 5.6, 0, 8.6, 0.3, 7.6, 'trim'],
    ['prism', -1.6, 5.9, 0, 9.0, 2.4, 8.0, 'roof'],
    ['wall', 4.6, 0, 2.9, 4.2, 2.6, 0.7, 'wall2'],           // patio walls
    ['wall', 6.4, 0, 0, 0.7, 2.6, 6.5, 'wall2'],
    ['box', 4.6, 2.6, 2.9, 4.5, 0.35, 1.0, 'roof'],          // coping tiles
    ['box', 6.4, 2.6, 0, 1.0, 0.35, 6.8, 'roof'],
    ['box', -1.6, 0.6, 3.5, 1.6, 2.6, 0.22, 'trim'],
  ] },

  // ---- FARMSTEAD AND VILLAGE ----
  barn: { r: 7.4, parts: [
    ['wall', 0, 0, 0, 12, 6.0, 8.4, 'wall2'],
    ['prism', 0, 6.0, 0, 12.8, 3.4, 9.1, 'roof'],
    ['box', 0, 0.1, 4.3, 3.4, 4.6, 0.35, 'trim'],            // big door
    ['box', 0, 4.9, 4.35, 1.6, 1.4, 0.3, 'trim'],            // hay loft hatch
    ['box', -6.05, 0, 0, 0.4, 6.0, 8.4, 'trim'],
    ['box', 6.05, 0, 0, 0.4, 6.0, 8.4, 'trim'],
  ] },
  // A FARMHOUSE, NOT A BOX WITH A LID. What makes a small rural house read at
  // a glance is not detail, it is MASSING: a stone footing so it sits IN the
  // ground rather than on it, a steep roof whose eaves oversail the walls, and
  // a lower wing so the outline is not a rectangle.
  house: { r: 6.0, parts: [
    ['box', 0, 0, 0, 7.8, 0.75, 6.8, 'stone'],               // stone footing
    ['wall', 0, 0.75, 0, 7.2, 4.8, 6.2, 'wall'],             // main block
    ['box', 0, 5.35, 0, 8.1, 0.28, 7.1, 'trim'],             // eaves fascia
    ['prism', 0, 5.55, 0, 8.6, 3.7, 7.6, 'roof'],            // steeper, oversailing
    ['box', 4.7, 0, 0.6, 3.8, 0.6, 4.9, 'stone'],            // lower side wing
    ['wall', 4.7, 0.6, 0.6, 3.4, 2.9, 4.4, 'wall2'],
    ['prism', 4.7, 3.5, 0.6, 3.9, 1.6, 5.0, 'roof'],
    ['box', -0.6, 3.15, 3.55, 3.4, 0.22, 1.9, 'roof'],       // porch canopy
    ['cyl', -1.9, 0.75, 4.0, 0.24, 2.4, 0.24, 'trim'],
    ['cyl', 0.7, 0.75, 4.0, 0.24, 2.4, 0.24, 'trim'],
    ['box', -0.6, 0.8, 3.05, 1.4, 2.6, 0.28, 'trim'],        // door
    ['cyl', -2.6, 5.4, 0, 0.95, 3.4, 0.95, 'stone'],         // chimney on the ridge
  ] },
  chapel: { r: 4.8, parts: [
    ['wall', 0, 0, 0, 5.6, 5.4, 8.0, 'wall'],
    ['prism', 0, 5.4, 0, 6.2, 3.0, 8.6, 'roof'],
    ['wall', 0, 0, -4.6, 3.6, 9.6, 3.6, 'wall'],             // bell tower
    ['cone', 0, 9.6, -4.6, 4.6, 3.8, 4.6, 'roof'],
    ['box', 0, 13.4, -4.6, 0.22, 1.6, 0.22, 0xf0e6c8],       // cross
    ['box', 0, 14.2, -4.6, 1.0, 0.22, 0.22, 0xf0e6c8],
    ['box', 0, 0.1, 4.1, 1.4, 3.0, 0.3, 'trim'],
  ] },
  shed: { r: 3.4, parts: [
    ['wall', 0, 0, 0, 5.2, 3.2, 4.2, 'wall2'],
    ['box', 0, 3.2, 0.35, 5.8, 0.35, 4.9, 'roof'],           // lean-to roof
    ['box', 0, 0.1, 2.2, 1.3, 2.4, 0.28, 'trim'],
  ] },
  // PUEBLO RUIN: the broken fortress silhouette from the player's canyon
  // reference, standing on the mesa rim. All masonry is kind 'box'/'cyl' -
  // NEVER kind 'wall', whose bucket carries the emissive window map, and a
  // ruin with lit windows is a haunted house. Roofless main block, stepped
  // lower block, breached curtain wall with a doorway gap, a collapsed round
  // tower under a ragged cap, protruding viga beams (the adobe motif), and
  // tumbled rubble. _element's per-placement stretch/mirror/shade means the
  // same ruin never reads twice.
  puebloRuin: { r: 8.5, mat: 'stone', parts: [
    ['box', 0, 0, 0, 10.5, 0.6, 8.5, 'stone'],               // rubble plinth
    ['box', -1.4, 0.6, -0.6, 6.0, 4.6, 6.4, 'wall'],         // roofless main block
    ['box', -2.6, 5.2, -2.2, 3.4, 0.7, 0.9, 'wall2'],        // broken parapet
    ['box', 2.9, 0.6, 1.2, 4.6, 2.9, 5.2, 'wall2'],          // stepped lower block
    ['box', -0.2, 0.6, 3.6, 4.2, 3.2, 0.7, 'wall'],          // curtain wall A
    ['box', 4.5, 0.6, 3.4, 2.6, 2.2, 0.7, 'wall'],           // curtain wall B (gap = gate)
    ['cyl', -4.2, 0.6, 2.4, 3.4, 6.4, 3.4, 'stone'],         // collapsed tower stump
    ['cyl', -4.2, 6.9, 2.4, 3.7, 0.6, 3.7, 'trim'],          // ragged cap ring
    ['cyl', -3.2, 4.4, 2.6, 0.3, 1.3, 0.3, 'trim', Math.PI / 2],   // vigas
    ['cyl', 0.4, 4.0, 2.6, 0.3, 1.3, 0.3, 'trim', Math.PI / 2],
    ['cyl', 2.2, 2.8, 3.9, 0.3, 1.3, 0.3, 'trim', Math.PI / 2],
    ['box', 3.6, 0.6, -2.6, 1.7, 1.1, 1.4, 'stone'],         // tumbled blocks
    ['box', -4.6, 0.6, -1.8, 1.3, 0.9, 1.1, 'stone'],
    ['cone', 1.2, 0.6, -3.4, 2.6, 1.7, 2.6, 'stone'],        // scree heap
  ] },

  adobe: { r: 5.7, parts: [
    ['wall', 0, 0, 0, 8.6, 4.2, 7.2, 'wall'],
    ['box', 0, 4.2, 0, 9.1, 0.7, 7.7, 'wall'],               // parapet
    ['box', 0, 0.1, 3.7, 1.5, 2.9, 0.3, 'trim'],
    ['cyl', -2.2, 3.6, 4.1, 0.35, 1.4, 0.35, 'trim', Math.PI / 2],
    ['cyl', 0, 3.6, 4.1, 0.35, 1.4, 0.35, 'trim', Math.PI / 2],
    ['cyl', 2.2, 3.6, 4.1, 0.35, 1.4, 0.35, 'trim', Math.PI / 2],
  ] },

  // ---- COTTAGES ----
  //
  // Three of them, because the scattered dwellings are the buildings a player
  // sees most and they were ONE shape at a random size: a box with a pyramid,
  // repeated ten times a world. Same kit slots, same base anchoring, different
  // massing — a long low one, a tall narrow one, and a squat gabled one.
  cottageA: { r: 4.6, parts: [
    ['box', 0, 0, 0, 7.0, 0.5, 5.4, 'stone'],
    ['wall', 0, 0.5, 0, 6.5, 3.6, 5.0, 'wall'],
    ['box', 0, 4.0, 0, 7.3, 0.24, 5.8, 'trim'],              // eaves
    ['prism', 0, 4.2, 0, 7.7, 2.6, 6.1, 'roof'],
    ['box', 0, 0.6, 2.6, 1.2, 2.2, 0.26, 'trim'],            // door
    ['cyl', 2.2, 4.1, 0, 0.8, 2.6, 0.8, 'stone'],            // chimney
  ] },
  cottageB: { r: 4.2, parts: [
    ['box', 0, 0, 0, 5.6, 0.6, 5.6, 'stone'],
    ['wall', 0, 0.6, 0, 5.1, 5.2, 5.1, 'wall2'],             // taller, narrower
    ['box', 0, 5.6, 0, 5.9, 0.26, 5.9, 'trim'],
    ['cone', 0, 5.8, 0, 6.4, 3.0, 6.4, 'roof'],              // hipped pyramid roof
    ['box', 0, 0.7, 2.7, 1.1, 2.2, 0.26, 'trim'],
    ['cyl', -1.7, 5.7, 1.2, 0.7, 2.4, 0.7, 'stone'],
  ] },
  cottageC: { r: 5.0, parts: [
    ['box', 0, 0, 0, 8.0, 0.45, 5.0, 'stone'],
    ['wall', 0, 0.45, 0, 7.4, 3.0, 4.5, 'wall'],             // long and low
    ['box', 0, 3.35, 0, 8.3, 0.22, 5.4, 'trim'],
    ['prism', 0, 3.5, 0, 8.7, 2.2, 5.7, 'roof'],
    ['wall', -4.4, 0.45, 0.4, 2.6, 2.2, 3.4, 'wall2'],       // lean-to at the end
    ['box', -4.4, 2.65, 0.4, 3.0, 0.26, 3.8, 'roof'],
    ['box', 1.0, 0.55, 2.4, 1.2, 2.1, 0.26, 'trim'],
    ['cyl', 3.0, 3.4, 0, 0.75, 2.2, 0.75, 'stone'],
  ] },

  // A VILLAGE OF THREE HOUSES IS A VILLAGE OF ONE HOUSE.
  //
  // Every settlement in the game - every hut scatter on every world - drew from
  // COTTAGES, and COTTAGES held exactly three entries. Three silhouettes, hue-
  // jittered, is what makes a street read as the same building stamped down the
  // road, which is the complaint. Five more, and they differ in PLAN and
  // ROOFLINE rather than in tint: an L-plan farmhouse with a porch and a
  // dormer, a two-storey townhouse with a balcony, a half-timbered cottage
  // with its upper floor jettied out over the street, a stone cottage with an
  // outside stair and a woodstore, and a long chalet under a deep eave.
  //
  // They also carry two to three times the parts of the old three - porch
  // posts, sills, braces, balcony rails, ridge chimneys - because at the
  // distance a village is seen it is the number of EDGES catching the light
  // that separates a house from a box, not the smoothness of any one of them.

  // L-PLAN FARMHOUSE: a main range with a return wing, a posted porch and a
  // dormer breaking the eaves.
  cottageD: { r: 5.4, parts: [
    ['box', 0, 0, 0, 8.4, 0.5, 5.6, 'stone'],
    ['wall', 0, 0.5, 0, 7.8, 3.8, 5.0, 'wall'],
    ['box', 0, 4.3, 0, 8.6, 0.26, 5.6, 'trim'],
    ['prism', 0, 4.5, 0, 9.0, 2.8, 5.9, 'roof'],
    ['wall', -3.0, 0.5, -3.6, 4.2, 3.2, 4.2, 'wall'],
    ['box', -3.0, 3.7, -3.6, 4.5, 0.24, 4.5, 'trim'],
    ['prism', -3.0, 3.9, -3.6, 4.8, 2.2, 4.8, 'roof'],
    ['box', 1.6, 0.5, 2.9, 2.8, 0.22, 1.7, 'stone'],
    ['cyl', 0.5, 0.7, 3.3, 0.26, 2.5, 0.26, 'trim'],
    ['cyl', 2.7, 0.7, 3.3, 0.26, 2.5, 0.26, 'trim'],
    ['box', 1.6, 3.2, 3.1, 3.2, 0.22, 1.9, 'roof'],
    ['box', 1.6, 0.6, 2.5, 1.2, 2.2, 0.26, 'trim'],
    ['box', -1.8, 1.9, 2.6, 1.3, 1.1, 0.2, 'trim'],
    ['prism', -1.4, 5.2, 1.6, 1.9, 1.3, 1.8, 'roof'],
    ['cyl', 3.4, 4.4, -1.2, 0.72, 2.8, 0.72, 'stone'],
  ] },

  // TOWNHOUSE: two full storeys, a string course between them, a shallow
  // balcony on the upper floor and a pitched roof end-on to the street.
  cottageE: { r: 4.4, parts: [
    ['box', 0, 0, 0, 6.2, 0.45, 6.6, 'stone'],
    ['wall', 0, 0.45, 0, 5.6, 6.6, 6.0, 'wall'],
    ['box', 0, 3.6, 0, 5.9, 0.26, 6.3, 'trim'],
    ['box', 0, 7.05, 0, 6.4, 0.28, 6.8, 'trim'],
    ['prism', 0, 7.3, 0, 6.7, 2.4, 7.1, 'roof'],
    ['box', 0, 4.3, 3.1, 3.4, 0.2, 1.1, 'trim'],
    ['box', 0, 5.2, 3.5, 3.4, 0.9, 0.16, 'trim'],
    ['box', -1.5, 4.5, 3.5, 0.16, 0.9, 0.16, 'trim'],
    ['box', 1.5, 4.5, 3.5, 0.16, 0.9, 0.16, 'trim'],
    ['box', 0, 0.55, 3.05, 1.2, 2.3, 0.24, 'trim'],
    ['box', -1.7, 1.5, 3.05, 1.0, 1.2, 0.18, 'trim'],
    ['box', 1.7, 1.5, 3.05, 1.0, 1.2, 0.18, 'trim'],
    ['cyl', 2.0, 7.2, -1.6, 0.62, 2.4, 0.62, 'stone'],
    ['cyl', -2.0, 7.2, 1.6, 0.62, 2.0, 0.62, 'stone'],
  ] },

  // HALF-TIMBERED: the upper floor JETTIES out over the lower one, which is
  // the silhouette the eye reads before it reads any timber.
  cottageF: { r: 4.8, parts: [
    ['box', 0, 0, 0, 6.4, 0.4, 5.4, 'stone'],
    ['wall', 0, 0.4, 0, 5.8, 3.0, 4.8, 'stone'],
    ['wall', 0, 3.4, 0, 6.8, 3.0, 5.8, 'wall'],
    ['box', 0, 3.3, 0, 7.1, 0.24, 6.1, 'trim'],
    ['box', 0, 6.4, 0, 7.2, 0.26, 6.2, 'trim'],
    ['prism', 0, 6.6, 0, 7.6, 3.0, 6.5, 'roof'],
    ['box', -2.9, 3.4, 0, 0.24, 3.0, 5.6, 'trim'],
    ['box', 2.9, 3.4, 0, 0.24, 3.0, 5.6, 'trim'],
    ['box', 0, 4.8, 2.9, 6.4, 0.22, 0.2, 'trim'],
    ['box', -1.7, 3.6, 2.9, 0.22, 2.7, 0.2, 'trim'],
    ['box', 1.7, 3.6, 2.9, 0.22, 2.7, 0.2, 'trim'],
    ['box', 0, 0.5, 2.5, 1.2, 2.2, 0.24, 'trim'],
    ['box', -1.9, 1.5, 2.5, 1.1, 1.1, 0.18, 'trim'],
    ['cyl', 2.4, 6.5, -1.0, 0.7, 2.6, 0.7, 'stone'],
  ] },

  // STONE COTTAGE with an outside stair to the upper door and a lean-to
  // woodstore - the plan you get on any hillside.
  cottageG: { r: 5.0, parts: [
    ['box', 0, 0, 0, 7.2, 0.5, 5.2, 'stone'],
    ['wall', 0, 0.5, 0, 6.6, 4.6, 4.6, 'stone'],
    ['box', 0, 5.1, 0, 6.9, 0.26, 5.0, 'trim'],
    ['prism', 0, 5.3, 0, 7.3, 2.6, 5.3, 'roof'],
    ['box', 3.6, 0.5, 1.2, 1.8, 2.6, 0.5, 'stone'],
    ['box', 3.6, 0.5, 0.2, 1.8, 1.7, 0.5, 'stone'],
    ['box', 3.6, 0.5, -0.8, 1.8, 0.9, 0.5, 'stone'],
    ['box', 2.9, 3.1, 1.6, 1.0, 2.0, 0.22, 'trim'],
    ['wall', -4.2, 0.5, 0.6, 2.4, 2.2, 3.2, 'wall2'],
    ['box', -4.2, 2.7, 0.6, 2.8, 0.22, 3.6, 'roof'],
    ['cyl', -4.2, 0.7, 2.0, 0.36, 1.6, 0.36, 'trim'],
    ['cyl', -4.2, 0.7, -0.6, 0.36, 1.6, 0.36, 'trim'],
    ['box', 0, 0.6, 2.4, 1.1, 2.1, 0.24, 'trim'],
    ['cyl', -1.6, 5.2, 0, 0.7, 2.8, 0.7, 'stone'],
  ] },

  // CHALET: long and low under a very deep eave, with a full-width balcony
  // and a woodpile stacked under it.
  cottageH: { r: 5.6, parts: [
    ['box', 0, 0, 0, 9.0, 0.5, 5.4, 'stone'],
    ['wall', 0, 0.5, 0, 8.4, 2.6, 4.8, 'stone'],
    ['wall', 0, 3.1, 0, 8.2, 2.4, 4.6, 'wall2'],
    ['box', 0, 5.5, 0, 10.4, 0.3, 7.0, 'trim'],
    ['prism', 0, 5.8, 0, 10.8, 2.2, 7.3, 'roof'],
    ['box', 0, 3.0, 2.7, 8.8, 0.22, 1.3, 'trim'],
    ['box', 0, 3.9, 3.2, 8.8, 0.9, 0.16, 'trim'],
    ['box', -4.2, 3.2, 3.2, 0.18, 0.9, 0.16, 'trim'],
    ['box', 0, 3.2, 3.2, 0.18, 0.9, 0.16, 'trim'],
    ['box', 4.2, 3.2, 3.2, 0.18, 0.9, 0.16, 'trim'],
    ['box', -2.6, 0.55, 2.5, 1.2, 2.2, 0.24, 'trim'],
    ['box', 1.4, 1.5, 2.5, 1.4, 1.2, 0.18, 'trim'],
    ['cyl', -3.0, 0.6, 1.9, 0.34, 1.4, 0.34, 'trim'],
    ['cyl', 3.2, 5.6, -1.4, 0.68, 2.4, 0.68, 'stone'],
  ] },

  // ---- LANDMARKS AND DRESSING ----
  watchtower: { r: 2.7, parts: [
    ['wall', 0, 0, 0, 3.6, 9.5, 3.6, 'wall2'],
    ['box', 0, 9.5, 0, 5.4, 0.5, 5.4, 'trim'],               // platform
    ['box', -2.4, 10.0, -2.4, 0.28, 1.7, 0.28, 'trim'],
    ['box', 2.4, 10.0, -2.4, 0.28, 1.7, 0.28, 'trim'],
    ['box', -2.4, 10.0, 2.4, 0.28, 1.7, 0.28, 'trim'],
    ['box', 2.4, 10.0, 2.4, 0.28, 1.7, 0.28, 'trim'],
    ['cone', 0, 11.7, 0, 6.0, 2.2, 6.0, 'roof'],
  ] },
  stilt: { r: 3.8, parts: [
    ['cyl', -2.4, 0, -1.9, 0.5, 3.0, 0.5, 'trim'],
    ['cyl', 2.4, 0, -1.9, 0.5, 3.0, 0.5, 'trim'],
    ['cyl', -2.4, 0, 1.9, 0.5, 3.0, 0.5, 'trim'],
    ['cyl', 2.4, 0, 1.9, 0.5, 3.0, 0.5, 'trim'],
    ['cyl', 0, 0, -1.9, 0.5, 3.0, 0.5, 'trim'],
    ['cyl', 0, 0, 1.9, 0.5, 3.0, 0.5, 'trim'],
    ['wall', 0, 3.0, 0, 6.2, 3.0, 5.2, 'wall'],
    ['prism', 0, 6.0, 0, 7.2, 2.6, 6.2, 'roof'],
    ['box', 1.2, 0, 3.4, 3.0, 0.25, 2.4, 'trim'],            // ramp/deck
  ] },
  kiosk: { r: 3.0, parts: [
    ['wall', 0, 0, 0, 4.4, 3.2, 3.4, 'wall'],
    ['box', 0, 3.2, 0, 4.8, 0.4, 3.8, 'roof'],
    ['box', 0, 2.0, 2.1, 4.8, 0.2, 1.6, 'trim'],             // awning
    ['box', 0, 3.7, 0, 3.2, 1.1, 0.24, 'trim'],              // sign board
    ['box', -1.7, 1.9, 1.75, 0.2, 0.2, 1.5, 'trim'],
  ] },
  signalhut: { r: 3.2, parts: [
    ['wall', 0, 0, 0, 4.6, 3.4, 4.2, 'wall'],
    ['prism', 0, 3.4, 0, 5.2, 1.8, 4.8, 'roof'],
    ['cyl', 1.9, 3.4, -1.7, 0.24, 6.4, 0.24, 'trim'],        // antenna mast
    ['box', 1.9, 9.4, -1.7, 1.8, 0.16, 0.16, 'trim'],
    ['box', 0, 0.1, 2.2, 1.2, 2.4, 0.28, 'trim'],
  ] },
  silo: { r: 2.4, mat: 'stone', parts: [
    ['cyl', 0, 0, 0, 4.4, 9.0, 4.4, 'wall'],
    ['cone', 0, 9.0, 0, 4.9, 2.4, 4.9, 'roof'],
    ['cyl', 0, 2.2, 0, 4.6, 0.3, 4.6, 'trim'],
    ['cyl', 0, 4.4, 0, 4.6, 0.3, 4.6, 'trim'],
    ['cyl', 0, 6.6, 0, 4.6, 0.3, 4.6, 'trim'],
  ] },
  windmill: { r: 2.0, mat: 'stone', parts: [
    ['cyl', 0, 0, 0, 3.0, 8.4, 2.4, 'wall'],
    ['cone', 0, 8.4, 0, 3.6, 1.8, 3.0, 'roof'],
    ['cyl', 0, 7.6, 1.6, 0.7, 0.9, 0.7, 'trim', Math.PI / 2],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', 0.4],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', Math.PI / 4 + 0.4],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', Math.PI / 2 + 0.4],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', 3 * Math.PI / 4 + 0.4],
  ] },
  well: { r: 1.8, mat: 'stone', parts: [
    ['cyl', 0, 0, 0, 3.2, 1.3, 3.2, 'stone'],
    ['box', -1.3, 1.3, 0, 0.3, 2.4, 0.3, 'trim'],
    ['box', 1.3, 1.3, 0, 0.3, 2.4, 0.3, 'trim'],
    ['prism', 0, 3.7, 0, 3.4, 0.9, 2.8, 'roof'],
    ['cyl', 0, 3.5, 0, 0.28, 2.6, 0.28, 'trim', Math.PI / 2],
  ] },
  logpile: { r: 2.4, mat: 'stone', parts: [
    ['cyl', 0, 0.55, -1.1, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
    ['cyl', 0, 0.55, 0, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
    ['cyl', 0, 0.55, 1.1, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
    ['cyl', 0, 1.50, -0.55, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
    ['cyl', 0, 1.50, 0.55, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
    ['cyl', 0, 2.45, 0, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
  ] },
};
// The cottage variants, for the builders that scatter dwellings at random.
export const COTTAGES = ['cottageA', 'cottageB', 'cottageC',
  'cottageD', 'cottageE', 'cottageF', 'cottageG', 'cottageH'];

export const ELEMENT_KITS = {
  alpine: {
    wall: 0xe2d6bc, wall2: 0x9c6c40, roof: 0x7a4630, trim: 0x5d4426, stone: 0x9a978e,
    builds: ['barn', 'house', 'house', 'shed'], landmarks: ['chapel', 'silo'],
    dress: ['logpile', 'well'], fenceColor: 0xc4a87c, stoneWalls: 5,
  },
  farm: {
    wall: 0xdac9a4, wall2: 0xa8442e, roof: 0x8a3a2a, trim: 0x5d4426, stone: 0x8d8578,
    builds: ['barn', 'house', 'shed', 'house'], landmarks: ['silo', 'windmill'],
    dress: ['logpile', 'well'], fenceColor: 0xc8b48a, stoneWalls: 3,
  },
  desert: {
    wall: 0xdcbd90, wall2: 0xc09a68, roof: 0xa8794a, trim: 0x6a4a2c, stone: 0xb08a5c,
    builds: ['adobe', 'adobe', 'shed'], landmarks: ['watchtower', 'well'],
    dress: ['well', 'logpile'], fenceColor: 0xc9a06a, stoneWalls: 4,
    ruin: 'puebloRuin',
  },
  jungle: {
    wall: 0xac9660, wall2: 0x8a7a44, roof: 0x6f8a38, trim: 0x5a4a28, stone: 0x6a7a5a,
    builds: ['stilt', 'stilt', 'shed'], landmarks: ['watchtower'],
    dress: ['logpile'], fenceColor: 0x9a8a54, stoneWalls: 1,
  },
  ice: {
    wall: 0xd2dae2, wall2: 0x8a9aa8, roof: 0x56646f, trim: 0x3a4650, stone: 0x9ab0c0,
    builds: ['signalhut', 'shed', 'shed'], landmarks: ['watchtower'],
    dress: ['logpile'], fenceColor: 0xb8c4cc, stoneWalls: 2,
  },
  city: {
    wall: 0x3c424a, wall2: 0x2a3038, roof: 0x22262c, trim: 0x6a7280, stone: 0x4a4e54,
    builds: ['kiosk', 'shed', 'kiosk'], landmarks: ['watchtower'],
    dress: ['logpile'], fenceColor: 0x5a6068, stoneWalls: 2,
    // no cattle under the expressway: the livestock dressing (water trough,
    // feed bin, hay rack) is dropped and the budget goes into more grey
    // barrier runs, which read as crowd/works hoarding in a city
    field: [], fenceRuns: 5,
  },
  burnt: {
    wall: 0x4c4038, wall2: 0x3a3028, roof: 0x2e2620, trim: 0x241d18, stone: 0x4a4238,
    builds: ['shed', 'house', 'barn'], landmarks: ['watchtower'],
    dress: ['logpile'], fenceColor: 0x4a3c30, stoneWalls: 3,
  },
  // OLIVE COAST. A new kit rather than a retint of 'alpine', because the
  // Bible's archetype list for this region is exactly H_MED_CORTIJO +
  // S_UNI_CHAPEL and nothing else (checklist R03) — 'alpine' also builds a
  // silo and 'farm' a windmill, neither of which belongs on a terrace hillside.
  // Limewash walls (#E0D6C0, the Bible's structure primary), terracotta
  // pantiles, and the chapel with its bell gable as the one landmark
  // silhouette. `stoneWalls: 8` is the highest on the roster: dry stone
  // boundaries running across the terraces are half the region's identity.
  // (the desert worlds' shared ruin flag lives on the kit, see placement)
  medhill: {
    // WALLS THAT ARE NOT THE GROUND. wall 0xe0d6c0 against fog 0xd8d0b8 and
    // dirt 0xc4b088 meant the walls of every hillside house dissolved into
    // the haze and its orange roof floated alone in mid-air - reported twice,
    // with photographs, as "floating buildings". Bright limewash and dusty
    // ochre now, over a plinth dark enough to seat the house on the ground.
    wall: 0xf6efe0, wall2: 0xcf9257, roof: 0xb4552e, trim: 0xc0532e, stone: 0x9d9178,
    builds: ['house', 'house', 'barn', 'shed'], landmarks: ['chapel'],
    dress: ['well'], fenceColor: 0x8f8264, stoneWalls: 8,
  },
  // OLD TOWN NIGHT: what the world is dressed with BEYOND the street frontage
  // — the outer quarters, seen across the rooftops. Muted ochre render under
  // slate, and a chapel with a bell gable as the second landmark silhouette
  // after the campanile. No livestock and no paddocks in a town, so `field`
  // is emptied (the same trick the city kit uses) and the budget goes into
  // town-wall runs instead.
  oldtown: {
    wall: 0xb0a189, wall2: 0x8e8478, roof: 0x3f444a, trim: 0x5c5148, stone: 0x7a746a,
    builds: ['house', 'house', 'shed'], landmarks: ['chapel'],
    dress: ['well'], fenceColor: 0x5a5f66, stoneWalls: 6,
    field: [], fenceRuns: 4,
  },
  // ---------------------------------------------------------------------
  // THE MEDITERRANEAN KITS. Five coasts, five building cultures - not one
  // kit retinted five times, which is the trap the back half of the roster
  // already fell into. Each carries its own PALETTE, so a quay is a row of
  // differently painted houses the way the reference art is, and its own
  // build list, so the silhouettes differ too.
  //
  // LIGURIA (Italy) - Cinque Terre: tall narrow houses painted in saturated
  // coral, ochre, rose and mustard, green shutters, pantile roofs.
  liguria: {
    wall: 0xe8a15c, wall2: 0xd4884a, roof: 0xb4552e, trim: 0x3f6b46, stone: 0xc9b998,
    palette: [0xe98d5a, 0xe8b45c, 0xd9686a, 0xe4c37a, 0xc9705a, 0xefd9a6, 0xd98f4e],
    roofs: [0xb4552e, 0xa74a2c, 0xc06238],
    builds: ['towerhouse', 'towerhouse', 'house', 'shed'], landmarks: ['chapel'],
    dress: ['well'], fenceColor: 0xc8bb96, stoneWalls: 6,
  },
  // AEGEAN (Greece) - whitewashed cubes, flat roofs, one blue dome, and blue
  // joinery. The palette is deliberately nearly monochrome WHITE, because
  // that is the region's identity; the colour lives in the roofs and doors.
  aegean: {
    wall: 0xf4f1ea, wall2: 0xe6e2d8, roof: 0x2f6fae, trim: 0x2f6fae, stone: 0xd8d2c4,
    palette: [0xf6f4ee, 0xefece2, 0xf8f6f2, 0xe9e6dc],
    roofs: [0x2f6fae, 0x3f86c6, 0xf2efe6],
    builds: ['cube', 'cube', 'domed', 'shed'], landmarks: ['chapel'],
    dress: ['well'], fenceColor: 0xe4e0d4, stoneWalls: 7,
  },
  // ANDALUSIA (Spain) - limewash white and ochre under terracotta, deep-set
  // openings, courtyard walls.
  andalusia: {
    wall: 0xf0e6d2, wall2: 0xe0c893, roof: 0xb85c33, trim: 0x8a5a2c, stone: 0xd6c7a4,
    palette: [0xf4ecdc, 0xeed8a8, 0xe8c88c, 0xf6f0e4, 0xdcb87a],
    roofs: [0xb85c33, 0xa9522f, 0xc46a3a],
    builds: ['courtyard', 'house', 'courtyard', 'shed'], landmarks: ['chapel'],
    dress: ['well'], fenceColor: 0xdccfae, stoneWalls: 8,
  },
  // DALMATIA (Croatia) - pale limestone, almost no paint, orange-red tile,
  // green shutters. The stone IS the colour, so the palette is narrow and
  // the variation goes into the roofs.
  dalmatia: {
    wall: 0xe6dfcd, wall2: 0xd2c9b2, roof: 0xc0603a, trim: 0x4a6b4a, stone: 0xcfc6ae,
    palette: [0xe9e2d0, 0xdfd6c2, 0xf0ebdc, 0xd8cfba],
    roofs: [0xc0603a, 0xb35634, 0xcc6c42, 0xa94f30],
    builds: ['house', 'towerhouse', 'house', 'shed'], landmarks: ['chapel'],
    dress: ['well'], fenceColor: 0xd6cdb6, stoneWalls: 9,
  },
  // COTE D'AZUR (France) - Provencal pastels: rose, apricot, lavender-grey
  // and cream render under faded pantile, pale blue shutters.
  azur: {
    wall: 0xf2ddc8, wall2: 0xe2c6ae, roof: 0xc07a52, trim: 0x8fb4cc, stone: 0xdccdb8,
    palette: [0xf3d9c4, 0xefc9b0, 0xe8c8cf, 0xdcd2e2, 0xf6ead6, 0xe9d3a8],
    roofs: [0xc07a52, 0xb8724c, 0xcb8a5e],
    builds: ['house', 'house', 'towerhouse', 'shed'], landmarks: ['chapel'],
    dress: ['well'], fenceColor: 0xdfd3bc, stoneWalls: 5,
  },

  // FARMLAND HEDGEROW: rubble stone with lime pointing, slate roofs, dark
  // green painted doors, and a muted-grey steel portal barn behind the house.
  // The Bible allows this region exactly two archetypes — the farm longhouse
  // and the universal chapel — so `builds` is house/barn only and there is one
  // landmark, never a silo or a windmill (checklist R03).
  hedgerow: {
    wall: 0x8f8778, wall2: 0x8a8f8c, roof: 0x4a5058, trim: 0x2f4a3c, stone: 0x7e7468,
    builds: ['house', 'barn', 'house', 'barn'], landmarks: ['chapel'],
    dress: ['well'], fenceColor: 0xa8a08c, stoneWalls: 6, fenceRuns: 4,
  },
  // OUTBACK STATION (Bible 3.10 architecture): weatherboard bleached to grey
  // under a corrugated-iron roof, machinery sheds, and a windmill over the
  // stock tank as the landmark you steer by. `stoneWalls: 0` is deliberate —
  // the region's negative list forbids rock walls, and a station is fenced
  // with WIRE, so the whole masonry budget goes into long fence runs instead.
  outback: {
    wall: 0xb8ae9e, wall2: 0x8e8478, roof: 0x9aa0a2, trim: 0x6a6055, stone: 0x9c6a4e,
    builds: ['house', 'shed', 'barn', 'shed'], landmarks: ['windmill', 'silo'],
    dress: ['well', 'logpile'], fenceColor: 0xa89c88,
    stoneWalls: 0, fenceRuns: 7,
  },
};
// Species mix for the default (conifer-family) forest builder, per theme:
// [[species, weight]...]. Species live in _buildForest. Themes not listed
// fall back to the classic two-pine stand; a theme can override the whole
// mix via T.floraMix.
export const FLORA_MIX = {
  forest: [['pineA', 0.34], ['pineB', 0.22], ['birch', 0.24], ['oak', 0.20]],
  // Amazon: emergents over a closed mid-storey over tree ferns. Weighted so the
  // emergents are the minority they are in life — they read because they tower,
  // not because there are many of them.
  jungle: [['cecropia', 0.44], ['treeFern', 0.32], ['kapok', 0.24]],
  flume: [['pineA', 0.38], ['pineB', 0.20], ['birch', 0.20], ['oak', 0.22]],
  snow: [['pineA', 0.42], ['pineB', 0.23], ['birchBare', 0.35]],
  glacial: [['pineA', 0.45], ['pineB', 0.25], ['birchBare', 0.30]],
  sheetice: [['pineA', 0.5], ['birchBare', 0.5]],
  avalanche: [['pineA', 0.35], ['pineB', 0.20], ['larch', 0.25], ['birchBare', 0.20]],
  alpine: [['pineA', 0.40], ['pineB', 0.25], ['larch', 0.35]],
  pass: [['pineA', 0.34], ['pineB', 0.22], ['larch', 0.28], ['birch', 0.16]],
  tremola: [['pineA', 0.36], ['pineB', 0.22], ['larch', 0.42]],
  furka: [['pineA', 0.40], ['pineB', 0.22], ['larch', 0.38]],
  // OLIVE COAST. Species live in _buildOliveGrove, not the conifer builder.
  // Weights are the Bible's tree tiers (0.22/0.18/0.10/0.08/0.06) renormalised
  // over the 0.64 they sum to — the remaining 0.36 is the maquis and the dry
  // grass, which this world scatters as bushes and tufts, so the full region
  // scatter still sums to 1.0 (checklist R04).
  medterrace: [['oliveOld', 0.344], ['oliveRow', 0.281], ['corkOak', 0.156],
    ['umbrellaPine', 0.125], ['cypress', 0.094]],
  // THE MEDITERRANEAN FIVE inherit the harbour's machinery but must not
  // inherit a northern forest with it: olive, cypress and umbrella pine, with
  // the cypress weighted up because it is the species that says "this coast"
  // in one silhouette - it lines the roads in the reference art.
  liguria: [['oliveOld', 0.30], ['oliveRow', 0.22], ['umbrellaPine', 0.22], ['cypress', 0.26]],
  aegean: [['oliveOld', 0.38], ['oliveRow', 0.26], ['cypress', 0.22], ['umbrellaPine', 0.14]],
  brava: [['oliveOld', 0.32], ['oliveRow', 0.24], ['corkOak', 0.20], ['cypress', 0.24]],
  dalmatia: [['oliveOld', 0.26], ['oliveRow', 0.20], ['umbrellaPine', 0.22], ['cypress', 0.32]],
  azur: [['oliveOld', 0.28], ['oliveRow', 0.22], ['umbrellaPine', 0.24], ['cypress', 0.26]],
  // OLD TOWN: pollarded planes and limes only — the two broadleaf species in
  // the kit. A conifer anywhere near a European old town would be wrong.
  oldtown: [['oak', 0.62], ['birch', 0.38]],
  // hedgerow standards and nothing else — no conifer has any business here.
  // `birch` is the stand-in for ash: pale bark, open airy crown.
  farmland: [['oak', 0.54], ['birch', 0.46]],
};

// How many decorative side-road junctions each RURAL world gets (city, ice
// and cliff-walled worlds get none). A theme can override via T.crossroads.
export const THEME_CROSSROADS = {
  forest: 3, desert: 2, snow: 2, alpine: 3, oasis: 2, redwood: 2, flume: 2,
  wildfire: 2, pass: 3, tremola: 2, furka: 2, medterrace: 2, outback: 3,
  // the field entrances the tractors drag the mud out of — the maximum, since
  // they are the region's stated hazard and every one of them opens the hedge
  farmland: 4,
};
export const ELEMENT_KIT_BY_THEME = {
  forest: 'farm', desert: 'desert', snow: 'alpine', canyon: 'desert', volcano: 'burnt',
  alpine: 'alpine', glacial: 'ice', jungle: 'jungle', dunes: 'desert', ravine: 'desert',
  oasis: 'desert', redwood: 'farm', flume: 'farm', wildfire: 'burnt', sheetice: 'ice',
  avalanche: 'alpine', neon: 'city', undercity: 'city',
  pass: 'alpine', tremola: 'alpine', furka: 'alpine', oldtown: 'oldtown',
  medterrace: 'medhill', farmland: 'hedgerow', outback: 'outback',
};

/** Unit gable-roof prism: 1×1×1, base at y=0, ridge running along local X at
 *  (y=1, z=0). Eight triangles, shared by every pitched roof in the game. */
let PRISM_GEO = null;
export function gablePrismGeo() {
  if (PRISM_GEO) return PRISM_GEO;
  const A = [-0.5, 0, -0.5], Bv = [0.5, 0, -0.5], C = [0.5, 0, 0.5], D = [-0.5, 0, 0.5];
  const E = [-0.5, 1, 0], F = [0.5, 1, 0];
  const tris = [
    [A, Bv, C], [A, C, D],            // floor
    [A, F, Bv], [A, E, F],            // back pitch
    [D, C, F], [D, F, E],             // front pitch
    [A, D, E], [Bv, F, C],            // gable ends
  ];
  const pos = new Float32Array(tris.length * 9);
  const uv = new Float32Array(tris.length * 6);
  let o = 0, u = 0;
  for (const t of tris) {
    for (const v of t) {
      pos[o++] = v[0]; pos[o++] = v[1]; pos[o++] = v[2];
      uv[u++] = v[0] + 0.5; uv[u++] = v[1];
    }
  }
  PRISM_GEO = new THREE.BufferGeometry();
  PRISM_GEO.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  PRISM_GEO.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  PRISM_GEO.computeVertexNormals();
  return PRISM_GEO;
}

/** Merge a list of box specs {w,h,d,x,y,z,ry?} into ONE BufferGeometry so a
 *  multi-part smashable (a fence bay, a trough, a hay rack) costs a single
 *  mesh. Build-time only. */
export function mergeBoxes(specs) {
  const geos = specs.map((s) => {
    const g = new THREE.BoxGeometry(s.w, s.h, s.d).toNonIndexed();
    const m = new THREE.Matrix4().makeRotationY(s.ry || 0);
    m.setPosition(s.x, s.y, s.z);
    g.applyMatrix4(m);
    return g;
  });
  let total = 0;
  for (const g of geos) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), nrm = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of geos) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    nrm.set(g.attributes.normal.array, o * 3);
    uv.set(g.attributes.uv.array, o * 2);
    o += n;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}

let PROP_ASSETS = null;
export function propAssets() {
  if (PROP_ASSETS) return PROP_ASSETS;
  const hay = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 10);
  hay.rotateZ(Math.PI / 2);
  hay.translate(0, 0.8, 0);
  const crate = new THREE.BoxGeometry(1.55, 1.55, 1.55);
  crate.translate(0, 0.78, 0);
  const cone = new THREE.ConeGeometry(0.55, 1.35, 10);
  cone.translate(0, 0.74, 0);
  const coneBase = new THREE.BoxGeometry(1.05, 0.14, 1.05);
  coneBase.translate(0, 0.07, 0);
  const barrel = new THREE.CylinderGeometry(0.62, 0.66, 1.5, 12);
  barrel.translate(0, 0.75, 0);
  const rock = new THREE.DodecahedronGeometry(0.7, 0);
  rock.translate(0, 0.32, 0);
  PROP_ASSETS = {
    geo: {
      hay, crate, cone, coneBase, barrel, rock,
      ballBody: new THREE.SphereGeometry(0.8, 12, 9),
      ballHead: new THREE.SphereGeometry(0.52, 12, 9),
      eye: new THREE.SphereGeometry(0.07, 6, 5),
      carrot: new THREE.ConeGeometry(0.1, 0.5, 6),
      // voxel penguin parts (glacial): boxes only, r ≈ 0.6
      pengBody: new THREE.BoxGeometry(0.62, 0.9, 0.54),
      pengBelly: new THREE.BoxGeometry(0.44, 0.66, 0.1),
      pengHead: new THREE.BoxGeometry(0.46, 0.36, 0.42),
      pengWing: new THREE.BoxGeometry(0.1, 0.5, 0.3),
      pengBeak: new THREE.BoxGeometry(0.14, 0.1, 0.22),
      pengFoot: new THREE.BoxGeometry(0.2, 0.08, 0.3),
    },
    mat: {
      crate: new THREE.MeshStandardMaterial({ map: crateTexture(), roughness: 0.9 }),
      cone: new THREE.MeshStandardMaterial({ map: coneTexture(), roughness: 0.75 }),
      coneBase: new THREE.MeshStandardMaterial({ color: 0xd85f10, roughness: 0.9 }),
      barrelCap: new THREE.MeshStandardMaterial({ color: 0x3a2c1a, roughness: 0.95 }),
      snow: new THREE.MeshStandardMaterial({ color: 0xf4f8fc, roughness: 0.85 }),
      coal: new THREE.MeshStandardMaterial({ color: 0x201c18, roughness: 0.8 }),
      carrot: new THREE.MeshStandardMaterial({ color: 0xe8641e, roughness: 0.8 }),
      rock: new THREE.MeshStandardMaterial({ color: 0xb5744a, flatShading: true, roughness: 1 }),
      pengBlack: new THREE.MeshStandardMaterial({ color: 0x1c2026, roughness: 0.8 }),
      pengWhite: new THREE.MeshStandardMaterial({ color: 0xf4f8fc, roughness: 0.75 }),
      pengOrange: new THREE.MeshStandardMaterial({ color: 0xe8862e, roughness: 0.8 }),
    },
  };
  return PROP_ASSETS;
}
