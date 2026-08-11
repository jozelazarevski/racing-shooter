/* IS THE WORLD BUILT TO REAL DIMENSIONS?
 *
 * A world reads as real when the things in it are the size they are in life,
 * and the eye is unforgiving about exactly the objects it has stood next to: a
 * door, a step, a handrail, a lamp post. Get a mountain wrong by 30% and nobody
 * can tell. Get a street lamp wrong by 30% and the whole street looks like a
 * model railway, without anyone being able to say why.
 *
 * So the standards are written down and CHECKED, rather than each component
 * being whatever looked right on the day it was authored. The ranges below are
 * the real ones — highway and building practice, mostly UK/EU, which is the
 * idiom these worlds are drawn in — and every one carries the reason it is what
 * it is, because a bare number invites somebody to nudge it.
 *
 * WHAT IS DELIBERATELY NOT HERE: nature. A boulder, a scree slope, a pine and a
 * rock spire have no standard to violate, and inventing "correct" heights for
 * them would be enforcing my taste while pretending it was engineering. They
 * are listed as exempt by name, so the exemption is a decision on the record
 * rather than a gap in the table.
 *
 *   npx vite build
 *   node tools/verify-architecture.mjs
 *   node tools/verify-architecture.mjs --table   # every component and its rule
 */
import { chromium } from 'playwright-core';
import { ensureServer } from './serve.mjs';

const TABLE = process.argv.includes('--table');

/* [min, max] overall height in metres, and why.
 *
 * Measured against the component at scale 1, which is what the palette drops
 * and what every authored track uses unless it says otherwise. */
const HEIGHT = {
  // ---- the road, and what stands beside it -------------------------------
  guardrail:   [0.60, 0.95, 'W-beam safety barrier: top of rail 0.70–0.75 m so it catches a wheel arch rather than launching a car'],
  barrierBlock:[0.70, 1.10, 'concrete step barrier (F-shape) is 0.81 m; the taller 1.07 m single-slope is the motorway variant'],
  chevronSign: [1.20, 2.60, 'a chevron board sits low and square-on — its top is below a driver\'s sightline to the corner'],
  roadSign:    [2.00, 3.50, 'lower edge of a rural sign 1.5 m, board about a metre deep'],
  signpost:    [1.80, 3.00, 'fingerpost fingers at eye height so they can be read from a stopped car'],
  milestone:   [0.60, 1.20, 'a milestone is knee-to-waist — it is read from beside it, not from the road'],
  // THIS RULE WAS WRONG BEFORE THE COMPONENT WAS. It first said 5–10 m, off
  // modern highway lighting columns, and flagged a 4.14 m lamp as too short.
  // The lamp is a cast-iron village post, and heritage columns really are
  // 3.5–5 m — the 8–10 m figure is a steel column on a main road, a different
  // object. Correcting the standard rather than the world.
  // 3.5 IS THE REAL FLOOR, NOT A NUMBER CHOSEN TO FIT. It was 3.30 first, which
  // is what happens when you set a bound by backing off from the component you
  // have: a mutation test dropped this lamp to 3.33 m — visibly a toy — and it
  // passed with 3 cm to spare. The low end of the real range is 3.5 m, so that
  // is the bound, and the 4.14 m lamp sits comfortably inside it.
  streetLamp:  [3.50, 10.0, 'cast-iron village lamp post 3.5–5 m; a modern steel highway column is 8–10 m'],
  telegraphPole:[7.50, 11.0, 'distribution pole 9–11 m above ground, with 1.5–2 m more of it buried'],
  lightMast:   [8.00, 20.0, 'floodlight mast for a yard or a paddock'],
  busShelter:  [2.20, 2.80, 'a shelter has to clear a standing passenger with a hat on: 2.3–2.5 m'],
  cattleGrid:  [0.00, 3.00, 'the grid itself is flush with the road; the height is the marker posts either side'],
  marshalPost: [2.00, 3.20, 'a post and a board, read from a moving car'],
  fenceRun:    [0.90, 1.50, 'post-and-rail stock fence 1.1–1.3 m — high enough to turn a cow, low enough to see over'],
  stoneWall:   [0.60, 1.60, 'a drystone field wall is chest height, about 1.2 m; taller than that and it is a boundary wall, not a field one'],
  terraceWall: [0.80, 2.50, 'a retaining terrace wall holds one lift of ground'],
  retainingWall:[1.50, 6.00, 'highway retaining wall'],
  sandbagWall: [0.60, 1.60, 'stacked to chest height — above that it needs a batter and stops being a wall of bags'],
  waterTrough: [0.50, 1.40, 'a cattle trough is drinking height for stock'],

  // ---- things you drive through, over or under ----------------------------
  // These are the ones with a hard legal floor rather than a convention.
  tunnelMouth: [5.00, 20.0, 'a road tunnel must give at least 5.03 m (16\'6") of clear headroom in the UK; the portal is taller than the bore'],
  archGateway: [5.00, 25.0, 'a gateway a car passes under needs the same headroom as a tunnel'],
  startGantry: [5.00, 12.0, 'a sign gantry clears 5.1 m minimum so a high-sided vehicle passes under it'],
  stoneBridge: [3.00, 12.0, 'a masonry arch: the height here is the parapet, not the clearance under it'],
  timberBridge:[2.00, 8.00, 'trestle deck with rope rails'],
  culvert:     [1.00, 6.00, 'headwall on a bank, a drain rather than a passage'],

  // ---- the harbour ---------------------------------------------------------
  quayWall:    [0.20, 1.20, 'what stands above the quay is the coping course; the face is below the deck'],
  // MEASURED TOP TO BOTTOM, not above ground: this ladder is authored against
  // the quay deck and runs down past the waterline, so its height above the
  // origin is 1.07 m and its actual length is 3.7 m. Checking the wrong one
  // called a correct ladder too short.
  dockLadder:  [1.80, 6.00, 'a quay ladder has to reach the water at low tide — a 2 m tidal range is unremarkable', 'span'],
  mooringPost: [0.50, 1.50, 'a bollard is knee-to-thigh so a line can be dropped over it'],
  capstan:     [0.60, 1.60, 'worked standing up, waist height'],
  beacon:      [3.00, 12.0, 'a channel marker has to be seen over a swell'],
  lighthouse:  [10.0, 60.0, 'a minor harbour light, not an offshore tower'],
  slipway:     [0.00, 1.50, 'a slipway is a ramp — it has no height, only a gradient'],
  breakwater:  [0.80, 4.00, 'the crown stands above the highest water it is built for'],

  // ---- buildings -----------------------------------------------------------
  // A storey is 2.7–3.0 m floor to floor, so these ranges are storey counts
  // plus a roof, which is what stops a "cottage" coming out three storeys tall.
  shed:        [2.00, 4.50, 'single storey, lean-to roof'],
  kiosk:       [2.50, 5.00, 'single storey with a serving canopy'],
  wellHouse:   [2.50, 6.00, 'a wellhead cover, one storey with a roof'],
  signalHut:   [3.00, 11.0, 'a raised cabin needs to see over what it signals'],
  boatShed:    [3.00, 7.00, 'one tall storey — a boat goes in it'],
  cottage:     [4.50, 8.50, 'one and a half storeys under a pitched roof'],
  cottageHipped:[4.50, 9.50, 'as the cottage, hipped'],
  cottageLong: [4.00, 8.00, 'a long low single storey'],
  stoneCottage:[4.50, 9.50, 'two storeys of masonry'],
  farmhouse:   [6.00, 11.0, 'two storeys and a steep roof'],
  farmhouseL:  [5.50, 10.0, 'two storeys, L-plan'],
  chalet:      [5.00, 10.0, 'two storeys under a deep-eaved alpine roof'],
  halfTimbered:[6.00, 11.0, 'two storeys with a jettied upper floor'],
  townhouse:   [6.50, 13.0, 'three storeys on a street frontage'],
  towerhouse:  [9.00, 18.0, 'four narrow storeys — the Ligurian terrace'],
  adobeHouse:  [3.00, 7.00, 'single storey, flat roofed'],
  cubeHouse:   [5.00, 11.0, 'two storeys and a roof room'],
  domedHouse:  [5.00, 11.0, 'two storeys under a drum and cap'],
  courtyardHouse:[5.00, 11.0, 'two storeys around a patio'],
  stiltHouse:  [5.00, 11.0, 'a storey lifted clear of the water on piles'],
  puebloRuin:  [3.00, 12.0, 'stacked masonry, broken'],
  barn:        [6.00, 13.0, 'a barn is tall because a loaded cart went into it'],
  church:      [8.00, 25.0, 'nave and a tower'],
  campanile:   [20.0, 60.0, 'a bell tower is meant to be seen from the next village'],
  watchtower:  [8.00, 20.0, 'it has to see over the trees'],
  windmill:    [8.00, 20.0, 'the sails must clear the ground with room to spare'],
  silo:        [6.00, 20.0, 'a farm silo'],
  waterTower:  [6.00, 20.0, 'head of water sets the height'],
  grandstand:  [3.00, 10.0, 'a small stand: tiers plus a roof'],
  pitBuilding: [4.00, 10.0, 'single tall storey with a canopy over the lane'],
  netLoft:     [5.00, 10.0, 'store below, loft above'],
  fountain:    [1.00, 5.00, 'a village fountain is drawn from standing'],
  marketStall: [2.20, 3.40, 'a stall canopy clears a standing customer'],
  trellisPost: [1.60, 3.00, 'vine trellis is worked by hand from the ground'],
  hayRack:     [1.20, 3.00, 'a feed rack is loaded by hand off a cart'],
  scarecrow:   [1.40, 2.60, 'a person, roughly'],
  winePress:   [1.20, 3.50, 'a basket press is loaded and screwed down by hand from the ground'],

  // ---- loose objects a person handles --------------------------------------
  crate:       [0.40, 1.60, 'a crate is lifted by two people'],
  pallet:      [0.10, 0.30, 'a standard pallet is 144 mm'],
  oilDrum:     [0.70, 1.10, 'a 205 litre drum is 0.88 m tall'],
  barrelStack: [0.80, 2.20, 'barriques on their sides, two courses'],
  hayBale:     [1.10, 1.90, 'a round bale is 1.2–1.5 m across'],
  tyreStack:   [0.60, 2.00, 'stacked car tyres'],
  cone:        [0.45, 1.00, 'a motorway cone is 0.75 m; a 0.5 m cone is the small one'],
  spareTyre:   [0.15, 0.45, 'a tyre lying flat'],
  lobsterPots: [0.60, 2.00, 'stacked creels'],
  logPile:     [1.00, 4.00, 'cordwood stacked against a wall'],
  feedBin:     [1.50, 3.50, 'filled from a cart, drawn from below'],
};

/* No standard exists, and pretending one does would be taste dressed as
 * engineering. Named individually so the exemption is a decision, not a gap. */
const NATURE = new Set([
  'pine', 'oak', 'birch', 'willow', 'palm', 'cactus', 'oliveTree', 'orchardTree',
  'deadTree', 'bush', 'reeds', 'grassTuft', 'stump', 'fallenLog', 'cropRow',
  'vineRow', 'rock', 'boulder', 'rockSpire', 'scree', 'fordStones',
]);
/* Vehicles and vessels: sized by naval architecture, checked in `boats.ts`
 * against v1's hull tables rather than by a height range. */
const VESSELS = new Set(['rowboat', 'sailboat', 'fishingBoat', 'launch', 'buoy', 'jetty', 'harbourCrane', 'quaySteps']);

const BASE = process.env.BASE || 'http://localhost:8907/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const stopServer = await ensureServer(BASE, '../play-dustline');

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
await page.goto(`${BASE}editor.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 90000 });

const rows = await page.evaluate(() => {
  const e = window.__editor;
  return e.templateIds().map((id) => {
    const t = e.getTemplate(id);
    let top = -Infinity, bot = Infinity;
    for (const part of t.build()) {
      part.geometry.computeBoundingBox();
      const bb = part.geometry.boundingBox;
      if (bb) { top = Math.max(top, bb.max.y); bot = Math.min(bot, bb.min.y); }
      part.geometry.dispose();
    }
    return { id, top: +top.toFixed(2), bot: +bot.toFixed(2), category: t.category };
  });
});

await browser.close();
await stopServer?.();

if (TABLE) {
  console.log('\nid'.padEnd(18) + 'height'.padEnd(9) + 'rule'.padEnd(14) + 'why');
  console.log('-'.repeat(100));
  for (const r of rows.sort((a, b) => a.id.localeCompare(b.id))) {
    const rule = HEIGHT[r.id];
    const band = rule ? `${rule[0]}–${rule[1]}` : NATURE.has(r.id) ? 'nature' : VESSELS.has(r.id) ? 'vessel' : '—';
    console.log(r.id.padEnd(18) + `${r.top}`.padEnd(9) + band.padEnd(14) + (rule ? rule[2].slice(0, 60) : ''));
  }
  console.log('');
}

// ---- 1. every object is the size its real counterpart is --------------------
const wrong = [];
for (const r of rows) {
  const rule = HEIGHT[r.id];
  if (!rule) continue;
  const [lo, hi] = rule;
  // most objects are measured from the ground up, which is what you see; a few
  // are authored against a waterline or a deck and their real dimension is the
  // whole thing, top to bottom
  const v = rule[3] === 'span' ? +(r.top - r.bot).toFixed(2) : r.top;
  if (v < lo) wrong.push(`${r.id} ${v}m < ${lo}m (${rule[2].split(':')[0]})`);
  if (v > hi) wrong.push(`${r.id} ${v}m > ${hi}m (${rule[2].split(':')[0]})`);
}
check(wrong.length === 0,
  `every object with a real-world standard is built to it (${Object.keys(HEIGHT).length - 1} rules)`,
  wrong.join(' | '));

// ---- 2. and every object is covered by a rule or an exemption ---------------
// The gap this closes is a new component quietly arriving with no standard
// applied to it — which is how the table stops being true.
const unruled = rows.filter((r) => !HEIGHT[r.id] && !NATURE.has(r.id) && !VESSELS.has(r.id))
  .map((r) => `${r.id} (${r.top}m, ${r.category})`);
check(unruled.length === 0,
  'every component has a dimensional rule or a stated exemption',
  unruled.join(', '));

// ---- 3. nothing is buried in its own base -----------------------------------
//
// A component's origin sits on the ground, so geometry a long way below y = 0
// is usually a prop sunk into the terrain. Usually — several are authored that
// way on purpose, and each is named here with the reason, because an unexplained
// exemption list is just a way of switching a check off.
const BELOW = {
  quayWall:    'the face descends the full height of the quay; only the coping is above deck',
  breakwater:  'the armour slopes away under water on both flanks',
  slipway:     'a slipway runs down into the water — that is what it is for',
  dockLadder:  'driven below the waterline so it is still a ladder at low tide',
  beacon:      'its pile goes down to the bed',
  cattleGrid:  'a cattle grid has a pit under it, or stock walks across',
  timberBridge:'trestle footings, dug in',
  rock:        'bedded into the ground rather than resting on it',
};
const sunk = rows.filter((r) => r.bot < -0.6 && !VESSELS.has(r.id) && !BELOW[r.id])
  .map((r) => `${r.id} ${r.bot}m`);
check(sunk.length === 0,
  `nothing sits more than 0.6 m below its own origin without saying why (${Object.keys(BELOW).length} do)`,
  sunk.join(', '));

console.log(fails ? `\n${fails} FAILED` : '\nthe world is built to real dimensions');
process.exit(fails ? 1 : 0);
