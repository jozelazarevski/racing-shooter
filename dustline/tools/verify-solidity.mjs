/* CAN YOU DRIVE THROUGH THE SCENERY?
 *
 * THE COMPLAINT THIS EXISTS FOR, IN THE OWNER'S OWN WORDS, THREE TIMES:
 *
 *     "I can still enter the mountains instead of hitting them"
 *     "Still can enter."          - with a photograph taken from INSIDE a hillside
 *     "Still see the shark mountains there"
 *
 * The word that matters is STILL. IGNITE RALLY release r148 fixed mountain
 * solidity. It fixed it for the massif cones. It did not fix the SKYLINE, and
 * nothing measured the difference, so the bug was reported as fixed, reported
 * again with a photograph, and finally traced in r153b: `_buildHorizon`'s rings
 * and `_buildMesaHorizon`'s mesas registered NO COLLIDERS AT ALL — 3,464 bare
 * instances across 51 of 60 worlds — while every check in the suite passed,
 * because every check in the suite was looking at the objects that HAD
 * colliders. A real fix, applied to one code path, with a second path left bare
 * and no test spanning both. COORDINATION.md records the whole episode.
 *
 * That is the defect this file is built against, and the shape of the defect
 * dictates the shape of the check. It is NOT "do mountains have colliders".
 * It is: EVERY PATH THAT PUTS GEOMETRY IN FRONT OF THE PLAYER IS ENUMERATED,
 * AND EACH ONE EITHER CARRIES A COLLIDER OR IS NAMED HERE WITH THE REASON IT
 * DOES NOT. A path nobody remembered is the bug; a census with no gaps is the
 * only thing that finds one. The same rule/exemption split as
 * `verify-architecture.mjs`, and for the same stated reason: so a new component
 * — or a new drawing path — cannot arrive with no standard applied to it.
 *
 * WHY A NAMED EXEMPTION LIST AND NOT THE COMPONENT'S OWN `solid` FLAG. Because
 * the flag is the thing that can be wrong. `verify-physics.mjs` measures every
 * SOLID component's collider against its geometry and never looks at a
 * non-solid one — so the way to make the entire physics suite go quiet about an
 * object is to declare it `solid: false`. The table below is a SECOND OPINION,
 * written down away from the component, and a component that changes its mind
 * about being solid fails here until somebody writes the reason down.
 *
 * WHAT IT MEASURES, NOT WHAT IT RESTATES. `components-smoke.mjs` learned this
 * the expensive way and says so in its own comments: its first version restated
 * the placement rule instead of reading the built world, and passed happily
 * with the builder deliberately broken to sink every boat. So this loads every
 * committed track in the REAL GAME, walks the REAL THREE.JS SCENE GRAPH and the
 * REAL RAPIER COLLIDERS out of the running engine, and counts.
 *
 * AND THEN IT DRIVES AT THE HILL. "Still can enter" is a statement about what
 * happens when you drive at a mountain, so check 9 does exactly that: the
 * player's own chassis body, launched at the car's own terminal speed, stepped
 * at the engine's own fixed timestep, and required to STOP. Two controls run
 * beside it — one through open air that must NOT stop, one into the ground that
 * MUST — because a probe that has never been seen to do both is not known to
 * measure anything. COORDINATION.md: "MEASURE FIXED-STEP OR MEASURE NOTHING";
 * every step here is `world.step()` at `world.timestep`, so SwiftShader's frame
 * rate cannot enter the arithmetic.
 *
 * AS SHIPPED THIS FILE IS RED, AND THAT IS THE POINT OF IT. dustline has the
 * same defect v1 had, in the same place: `render/horizon.ts` builds its
 * mountains with `buildMountains(scene, def)` — no `world`, no `RAPIER`, no
 * `createCollider` anywhere in the file — so all 343 horizon instances across
 * the three committed tracks are bare, and on every one of them some of that
 * skyline stands ON the drivable terrain rather than beyond it: 5 instances on
 * DUSTBOWL, 1 on HARBOUR POINT, 4 on PROVING GROUND. The nearest dome on
 * DUSTBOWL puts 42.8 m of its footprint inside the terrain collider, so a car
 * driven into the north-west corner is inside a hillside with no flight
 * involved. Checks 5, 6 and 9 stay red until `buildMountains` registers
 * colliders, in the same way `tests/test-field-stalls.mjs` stays red as the
 * definition of done. Checks 1-4, 7 and 8 are green and are the standing guard
 * over everything that is already right.
 *
 *   npx vite build          # the tool serves ../V2 itself
 *   node tools/verify-solidity.mjs
 *   node tools/verify-solidity.mjs --table   # the full census, per track
 *
 *   DIST=/some/other/build node tools/verify-solidity.mjs   # mutation testing
 */
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { ensureServer } from './serve.mjs';

const TABLE = process.argv.includes('--table');
const BASE = process.env.BASE || 'http://localhost:8911/';
const DIST = process.env.DIST || '../V2';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// ---------------------------------------------------------------------------
// THE EXEMPTIONS. Each one is a decision on the record, not a gap.
// ---------------------------------------------------------------------------

/* COMPONENTS THAT MAY PASS A CAR THROUGH THEM.
 *
 * Anything in `world/props/` that is NOT in this table must be solid at every
 * scale its authoring range allows. Anything that IS in it may be non-solid,
 * and the string is why — because "an unexplained exemption list is a way of
 * switching a check off" (`verify-architecture.mjs`).
 *
 * The reasons below are the component files' own, condensed. They are repeated
 * here rather than read from the file because the point of the table is to be a
 * SECOND place the decision is written: a component that quietly flips to
 * `solid: false` fails against this list, which is precisely the "fix that did
 * not hold" that r148 -> r153b was. */
const MAY_PASS_THROUGH = {
  // --- ground cover you drive over -----------------------------------------
  grassTuft: 'a 0.7 m tuft of grass. It also hides the seam where the road ribbon tucks into the terrain, so it is authored right up to the verge — solid, it would line the road',
  bush: 'scrub. A car goes through a bush and comes out with leaves on it',
  reeds: 'reeds standing in the shallows',
  scree: 'loose stone lying on a slope, not a boulder standing on one',
  cropRow: 'standing wheat. "a metre of crop that stops a rally car is the single most immersion-breaking thing a field could contain" — cropRow.ts',
  vineRow: 'wire and leaf, not masonry. At pace you plough a gap through the row',
  fordStones: 'stepping stones set flush in a river bed — the ford is a place you drive through',

  // --- light trackside furniture that gives way ----------------------------
  cone: 'the lightest marker there is. "a traffic cone that stops a car is not a traffic cone" — cone.ts',
  fenceRun: 'post-and-rail stock fence: 8 m of light timber a rally car takes with it',
  trellisPost: 'a 0.2 m timber stake. Making the END of a vine row the one hard thing in the vineyard would be the worst of both worlds',
  hayRack: 'an open rail frame two people carry. v1 registers it as a BREAKABLE prop',
  scarecrow: 'a coat on two sticks',
  stoneWall: 'DELIBERATE AND ARGUABLE, and the component says so: "an 0.9 m wall you cannot cross turns every field into a pen, and a rally car clipping one should lose time, not stop dead". First candidate for destructible scenery in M4',

  // --- loose objects on the ground -----------------------------------------
  pallet: 'a 0.14 m pallet lying flat',
  spareTyre: 'a loose tyre on the deck is something you drive over',
  lobsterPots: 'a stack of creels left on the hard',

  // --- things whose collider would be worse than no collider ---------------
  // These are the interesting ones: a single convex box would either seal an
  // opening the road runs through or stand where the opening is.
  startGantry: 'an arch OVER the start line. "an arch you can hit is an arch you WILL hit" — a convex hull across the grid would end the race at the lights',
  archGateway: 'a town gate you drive THROUGH. One convex box seals the opening; the file records the two-box compound it should become when per-instance compound colliders exist',
  tunnelMouth: 'a 33 m wall with a 27 m hole in it. Same reason as the gantry and stronger — the hole is the road',
  slipway: 'a ramp. It has no height, only a gradient; the terrain under it is the surface',
  dockLadder: 'rungs on the face of a quay, below the deck a car can reach',
  buoy: 'floating. Nothing in this game is a boat',

  // --- scale predicates: solid above a size, drive-over below --------------
  // Not a blanket exemption. These carry a floor, and the floor is checked.
  rock: { below: 1.1, why: 'a stone you drive over. Above scale 1.1 it is a boulder and IS solid — rock.ts has carried that predicate since the scatter loop had it as a bare `if (s > 1.1)`' },
  crate: { below: 0.7, why: 'a small crate is a box of fruit. Above 0.7 it is freight and IS solid' },
};

/* DRAWING PATHS THAT ARE NOT COMPONENTS, and what each one is.
 *
 * `world/build.ts` is the one path with a solidity CONTRACT. Everything else
 * that puts a mesh in the scene does it by hand, in its own file, with no
 * declaration anywhere — which is exactly the situation v1 was in when the
 * horizon turned out to be bare. So every such path is identified below by a
 * structural signature and given a verdict.
 *
 * `solid: true` means the check goes and finds the collider. A string means the
 * path is exempt and the string is the reason. AN UNRECOGNISED DRAWABLE IS A
 * FAILURE, not a skip: if one of these signatures stops matching, or a new
 * path appears, check 8 goes red rather than quietly passing. That is the whole
 * mechanism by which "the path nobody remembered" gets found. */
const BACKDROP = {
  terrainSurface: { solid: true, note: 'the ground. Trimesh from the same vertex buffer — terrain.ts:399' },
  horizon: { solid: true, note: 'THE MOUNTAINS. v1 r153b. A mountain must be solid' },

  skyDome: 'the sky: a BackSide sphere at r = max(1100, world.size * 1.25) with fog off, drawn behind everything. A collider on it would be a lid over the map',
  cloudPuff: 'cloud, 120-180 m up and 250-650 m out. Nothing in this game leaves the ground for more than a jump',
  hazeRing: 'atmosphere, not terrain: v1\'s two open-ended BackSide cylinders standing off past the horizon massifs (templates/horizon.ts:331), depthWrite off, fog off, drawn to make a distant peak fade into air from its base up. They sit OUTSIDE the mountains they haze, so a collider here would be a fence around the world at a radius no car reaches — and worse, a solid one would be invisible, which is the exact failure mode this file exists to catch pointed the wrong way round',
  roadRibbon: 'the road SURFACE is drawn here and driven on the terrain trimesh underneath it — terrain.ts:506 says so in its own comment. Solid by proxy, and check 7 is what proves the proxy covers it',
  waterSurface: 'water is not a floor. The lake BED is terrain and carries the trimesh; the surface is a translucent sheet with depthWrite off',
  tuningRing: 'paint on the tarmac: a flat RingGeometry 4 cm above the start apron',
  roadPost: 'A DECISION MADE HERE BECAUSE terrain.ts:575 MAKES NONE. A 0.22 m square, 1 m painted verge post, planted every ten samples at halfWidth + 1.2 — 0.3 m outside the clearance the road promises. Solid, it would be 96 hard 0.22 m obstacles a lap on both verges, which is BUGS.md #1 rebuilt on purpose; frangible delineator posts are what the real ones are, and the library takes the same line on `cone`. THE RIGHT LONG-TERM FIX is for this to become a component with its own declaration instead of a hand-rolled InstancedMesh in the terrain builder',
  wheelFX: 'dust, mud and tyre smoke: 700 camera-facing quads with no life beyond a second',
  car: 'the cars are dynamic bodies and carry their own cuboid collider — vehicleController.ts:80. They are not scenery',
};

// ---------------------------------------------------------------------------
// THE NUMBERS, AND WHERE EACH ONE COMES FROM.
// ---------------------------------------------------------------------------

const car = JSON.parse(readFileSync('src/data/car.json', 'utf8'));

/** The car's terminal speed on the flat, from the car's own numbers: drive
 *  force balanced by drag, `sqrt(engine.force / engine.dragCoeff)`. 53.6 m/s,
 *  193 km/h. Used for the probe's launch speed and for the ballistic reach in
 *  check 6, so retuning the engine retunes both instead of leaving a stale
 *  constant in a tool. */
const V_TERM = Math.sqrt(car.engine.force / car.engine.dragCoeff);

/** Half the chassis width — the probe is a car, so the margins are a car's. */
const CAR_HALF = car.chassis.halfExtents[0];

/** How far a collider may sit from the instance it belongs to before the two
 *  are not the same object — ON TOP OF that component's own declared offset.
 *  `PhysicsShape.centerX/centerZ` deliberately move a collider inside the
 *  component's frame (a jetty's collider sits 13 m along its deck at full
 *  scale, a grandstand's 3.8 m back), and each component is allowed exactly
 *  its own, read from the library rather than guessed. Everything else must be
 *  on its instance's origin, so 1 cm is float noise and nothing more. */
const MATCH_EPS = 0.01;

/** How far the probe may sink past a surface it lands on before "it stopped"
 *  stops being true. At the engine's 1/120 s step the probe covers 0.45 m per
 *  step, and Rapier resolves a 1.2 t impact over a handful of them: 4 m is nine
 *  steps of contact resolution. Used for the GROUND control, where the impact is
 *  square-on and the distance means what it looks like. */
const PENETRATION_MAX = 4;

/** WHAT "STOPPED" MEANS AT THE MOUNTAIN, and why it is a speed and not a
 *  distance. Against a hillside the probe hits an oblique face and slides along
 *  it, so how far it travelled depends on the shape of the face and not on
 *  whether anything was there. What it has left in it does not: the measurement
 *  is bimodal and the two modes are nowhere near each other.
 *
 *    nothing there   — 49-50 m/s of 53.6 survives (92%); only the chassis'
 *                      0.02 linear damping takes anything at all
 *    something there — 2-10 m/s survives (3-18%)
 *
 *  Half is the middle of a gap with no measurements in it. Any threshold
 *  between 0.2 and 0.9 returns the same verdict on every track, which is what
 *  makes it a safe number rather than a tuned one. The probe must ALSO not come
 *  out the far side, so a body that ricochets fast and sideways cannot pass. */
const STOP_FRACTION = 0.5;

/** How far the ground control drops the probe. 60 m is longer than any terrain
 *  feature on the roster is tall (the relief is 36 m on DUSTBOWL), so the probe
 *  is always released in clear air above the pad. */
const DROP = 60;

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

console.log(`car: terminal speed ${V_TERM.toFixed(1)} m/s, half-width ${CAR_HALF} m `
  + '— both from src/data/car.json\n');

const stopServer = await ensureServer(BASE, DIST);
const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 900, height: 600 } });

// ---- the library and the roster, from the editor ----------------------------
const edPage = await ctx.newPage();
const edErrors = [];
edPage.on('pageerror', (e) => edErrors.push(e.message.split('\n')[0]));
await edPage.goto(`${BASE}editor.html`, { waitUntil: 'load' });
await edPage.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 90000 });

const library = await edPage.evaluate(() => {
  const e = window.__editor;
  const out = {};
  for (const id of e.templateIds()) {
    const t = e.getTemplate(id);
    const [lo, hi] = t.authoring.scale;
    const solidAt = (s) => (typeof t.physics.solid === 'function' ? t.physics.solid(s) : t.physics.solid);
    // `solid: (s) => s > 1.1` on a [0.5, 1.7] range is neither always nor never,
    // and the threshold has to come back EXACT rather than sampled: a rock at
    // 1.12 is solid in the game, and a tool that thought the floor was 1.13
    // would call its collider an orphan. So the range is sampled to find out
    // whether the predicate turns over at all, and then BISECTED to find where.
    const N = 41;
    let nSolid = 0, firstSolid = null, lastNonSolid = null, holes = false;
    for (let i = 0; i < N; i++) {
      const s = lo + ((hi - lo) * i) / (N - 1);
      if (solidAt(s)) {
        nSolid++;
        if (firstSolid === null) firstSolid = s;
      } else {
        lastNonSolid = s;
        if (firstSolid !== null) holes = true;   // solid, then not: not monotone
      }
    }
    let floor = null;
    if (nSolid && nSolid < N && !holes) {
      // monotone in scale: bisect between the last non-solid sample and the
      // first solid one until the two are a micron apart
      let a = lastNonSolid, b = firstSolid;
      for (let i = 0; i < 60 && b - a > 1e-9; i++) {
        const m = (a + b) / 2;
        if (solidAt(m)) b = m; else a = m;
      }
      floor = b;
    } else if (nSolid === N) floor = lo;
    const sh = t.physics.shape(hi);
    out[id] = {
      scale: [lo, hi],
      always: nSolid === N,
      never: nSolid === 0,
      solidFrom: floor,
      notMonotone: holes,
      // an offset collider is not a missing one — see MATCH_EPS
      offset: sh.kind === 'none' ? 0 : Math.hypot(sh.centerX ?? 0, sh.centerZ ?? 0) * hi,
      // a template that says `solid: true` and then hands back `kind: 'none'`
      // gets no collider at all: addCollider returns early. build.ts:153.
      shapeless: sh.kind === 'none',
      category: t.category,
    };
  }
  return out;
});
const trackIds = await edPage.evaluate(() => window.__editor.builtInTracks().map((t) => t.id));
await edPage.close();

check(edErrors.length === 0, 'no page errors reading the component library', edErrors.slice(0, 3).join(' | '));
check(trackIds.length > 0 && Object.keys(library).length > 0,
  'the roster and the library were read',
  `${trackIds.length} built-in tracks, ${Object.keys(library).length} components`);

/** The widest a collider is allowed to sit from its own instance, anywhere in
 *  the library — reported, not used as a blanket tolerance: check 3 gives each
 *  component its own declared offset and nothing more. */
const WIDEST_OFFSET = Math.max(...Object.values(library).map((v) => v.offset));

// ---- 2. every component is covered by the rule or by a named exemption ------
//
// THE GAP THIS CLOSES is a component arriving non-solid with nothing anywhere
// saying that was meant, and every existing check staying silent because every
// existing check only looks at solid things.
{
  const bad = [];
  for (const [id, v] of Object.entries(library)) {
    const ex = MAY_PASS_THROUGH[id];
    // Solidity that switches on, off and on again across the authored scale
    // range cannot be stated as a floor and cannot be reasoned about at all.
    if (v.notMonotone) { bad.push(`${id}: solidity is not monotone in scale — no floor can be stated`); continue; }
    if (!ex) {
      if (v.never) bad.push(`${id}: non-solid at every scale and not on the exemption list`);
      else if (!v.always) bad.push(`${id}: solid only from scale ${v.solidFrom?.toFixed(2)} and no exemption states the floor`);
      else if (v.shapeless) bad.push(`${id}: declares solid but hands back kind 'none' — build.ts skips it, so it has no collider`);
      continue;
    }
    if (typeof ex === 'object') {
      // A scale predicate: the exemption states the floor, and the floor is
      // checked EXACTLY. The threshold is bisected out of the component's own
      // predicate, so "below 1.1" here and `s > 1.1` there agree to a micron or
      // one of them has been edited without the other.
      if (v.always) bad.push(`${id}: exempted below scale ${ex.below} but it is solid at every scale — stale exemption`);
      else if (v.never) bad.push(`${id}: exempted below scale ${ex.below} but it is never solid`);
      else if (Math.abs(v.solidFrom - ex.below) > 1e-6) {
        bad.push(`${id}: exemption says below ${ex.below}, the component turns solid at ${v.solidFrom.toFixed(6)}`);
      }
      continue;
    }
    // a blanket exemption on something that is in fact solid is not harmless:
    // it means the reason written here is no longer the reason in the file
    if (!v.never) bad.push(`${id}: listed as pass-through but it IS solid — remove the exemption or the collider`);
  }
  const unknown = Object.keys(MAY_PASS_THROUGH).filter((id) => !library[id]);
  for (const id of unknown) bad.push(`${id}: exempted here and no such component exists`);
  const nEx = Object.keys(MAY_PASS_THROUGH).length;
  check(bad.length === 0,
    `every component is solid or is named here as pass-through with a reason `
    + `(${Object.keys(library).length - nEx} solid, ${nEx} exempt)`,
    bad.join(' | '));
}

if (TABLE) {
  console.log('\ncomponent'.padEnd(18) + 'solid'.padEnd(20) + 'why not, if not');
  console.log('-'.repeat(112));
  for (const id of Object.keys(library).sort()) {
    const v = library[id];
    const ex = MAY_PASS_THROUGH[id];
    const state = v.always ? 'always' : v.never ? 'never' : `>= ${v.solidFrom.toFixed(2)}`;
    const why = !ex ? '' : typeof ex === 'object' ? ex.why : ex;
    console.log(id.padEnd(18) + state.padEnd(20) + why.slice(0, 74));
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// EVERY TRACK, IN THE REAL GAME.
// ---------------------------------------------------------------------------
const perTrack = [];
for (const id of trackIds) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));
  await page.goto(`${BASE}index.html?track=${encodeURIComponent(id)}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__dust?.track, null, { timeout: 180000 });

  const r = await page.evaluate((args) => {
    const { library, MATCH_EPS, V_TERM, PENETRATION_MAX, STOP_FRACTION, DROP } = args;
    const d = window.__dust;
    const def = d.track;
    const terrain = d.terrain;

    // ---- reach the scene graph the way the other browser tools do ----------
    let root = d.fx?.mesh;
    while (root && root.parent) root = root.parent;
    if (!root || !root.isScene) return { fatal: 'could not reach the scene graph from __dust' };
    const carRoots = new Set((d.racers ?? []).map((x) => x.visual?.root).filter(Boolean));
    const isCar = (o) => { for (let p = o; p; p = p.parent) if (carRoots.has(p)) return true; return false; };

    /* THE CLASSIFIER. Every drawable in the scene is assigned to exactly one
     * path. Components and the horizon name themselves — `world/build.ts` and
     * `render/horizon.ts` set `mesh.name` precisely so tools can find them.
     * Everything else is hand-built by some other file and is identified by a
     * structural signature; a signature that stops matching returns
     * `unclassified`, which FAILS check 8 rather than skipping the object. */
    const RES = def.world.meshRes;
    const nRoadPosts = Math.ceil(terrain.roadPts.length / 10) * 2;
    const classify = (o) => {
      const n = String(o.name || '');
      if (n.includes(':')) return { path: 'component', key: n.slice(0, n.indexOf(':')) };
      if (n.startsWith('horizon-')) return { path: 'horizon', key: 'horizon' };
      if (o === d.fx?.mesh) return { path: 'backdrop', key: 'wheelFX' };
      if (isCar(o)) return { path: 'backdrop', key: 'car' };
      const g = o.geometry, m = o.material;
      const bb = g.boundingBox;
      const dx = bb ? bb.max.x - bb.min.x : 0, dy = bb ? bb.max.y - bb.min.y : 0, dz = bb ? bb.max.z - bb.min.z : 0;
      if (g.type === 'SphereGeometry' && m.side === 1 && m.fog === false) return { path: 'backdrop', key: 'skyDome' };
      if (g.type === 'RingGeometry') return { path: 'backdrop', key: 'tuningRing' };
      // the haze rings: an open-ended BackSide cylinder with fog and depth
      // write both off. All four facts are required, so a closed cylinder, or
      // one that writes depth, does NOT inherit this exemption — which is what
      // stops a real cylindrical solid (a silo, a tank) hiding behind it.
      if (g.type === 'CylinderGeometry' && g.parameters?.openEnded === true
        && m.side === 1 && m.fog === false && m.depthWrite === false) {
        return { path: 'backdrop', key: 'hazeRing' };
      }
      if (g.type === 'IcosahedronGeometry' && !o.isInstancedMesh
        && m.emissive && m.emissive.getHex() !== 0) return { path: 'backdrop', key: 'cloudPuff' };
      // the verge posts: an unnamed instanced box, one per side every ten road
      // samples, 0.22 x 1.0 x 0.22 — terrain.ts:575. All four facts are
      // required, so a different unnamed instanced box does NOT inherit the
      // verge post's exemption.
      if (o.isInstancedMesh && g.type === 'BoxGeometry' && o.count === nRoadPosts
        && Math.abs(dx - 0.22) < 0.02 && Math.abs(dy - 1.0) < 0.05 && Math.abs(dz - 0.22) < 0.02) {
        return { path: 'backdrop', key: 'roadPost' };
      }
      if (!o.isInstancedMesh && g.attributes.color && !m.map
        && g.attributes.position.count === (RES + 1) * (RES + 1)) return { path: 'ground', key: 'terrainSurface' };
      if (!o.isInstancedMesh && m.map && !m.transparent) return { path: 'backdrop', key: 'roadRibbon' };
      if (!o.isInstancedMesh && m.transparent && m.depthWrite === false
        && m.vertexColors) return { path: 'backdrop', key: 'waterSurface' };
      return { path: 'unclassified', key: `${g.type}/${m.type}${o.isInstancedMesh ? '/instanced' : ''}` };
    };

    /* An instance's world footprint: the geometry's own bounding box, carried
     * through the instance matrix. Taken as the axis-aligned hull of the eight
     * transformed corners, which over-approximates a rotated box — deliberately,
     * because this is used to ask "could a car be here", and an answer that is
     * too big fails safe. */
    const footprint = (bb, m, b) => {
      let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
      for (const cx of [bb.min.x, bb.max.x]) {
        for (const cy of [bb.min.y, bb.max.y]) {
          for (const cz of [bb.min.z, bb.max.z]) {
            const wx = m[b] * cx + m[b + 4] * cy + m[b + 8] * cz + m[b + 12];
            const wy = m[b + 1] * cx + m[b + 5] * cy + m[b + 9] * cz + m[b + 13];
            const wz = m[b + 2] * cx + m[b + 6] * cy + m[b + 10] * cz + m[b + 14];
            x0 = Math.min(x0, wx); x1 = Math.max(x1, wx);
            y0 = Math.min(y0, wy); y1 = Math.max(y1, wy);
            z0 = Math.min(z0, wz); z1 = Math.max(z1, wz);
          }
        }
      }
      return { x0, y0, z0, x1, y1, z1 };
    };

    // ---- the census --------------------------------------------------------
    const census = {};            // key -> { path, meshes, instances }
    const compInst = [];          // one entry per solid component instance
    const compAll = {};           // template -> instance count
    const horizon = [];           // one entry per horizon instance
    const unclassified = {};
    let drawables = 0;
    root.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh && !o.isPoints && !o.isLine) return;
      drawables++;
      o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      const c = classify(o);
      const row = census[c.key] ?? (census[c.key] = { path: c.path, meshes: 0, instances: 0 });
      row.meshes++;
      row.instances += o.isInstancedMesh ? o.count : 1;
      if (c.path === 'unclassified') {
        unclassified[c.key] = (unclassified[c.key] ?? 0) + (o.isInstancedMesh ? o.count : 1);
        return;
      }
      if (!o.isInstancedMesh || !bb) return;
      const a = o.instanceMatrix.array;
      if (c.path === 'component') {
        const lib = library[c.key];
        compAll[c.key] = (compAll[c.key] ?? 0) + o.count;
        if (!lib) return;
        for (let i = 0; i < o.count; i++) {
          const b = i * 16;
          const s = Math.hypot(a[b], a[b + 1], a[b + 2]);
          // one component draws several parts; count each instance once, on the
          // first part that carries it
          compInst.push({ tpl: c.key, s, x: a[b + 12], z: a[b + 14], part: o.name });
        }
      } else if (c.path === 'horizon') {
        for (let i = 0; i < o.count; i++) {
          const b = i * 16;
          horizon.push({ form: o.name, ...footprint(bb, a, b) });
        }
      }
    });

    // a component with several parts appears once per part; keep the first part
    // of each template as the canonical instance list
    const firstPart = {};
    for (const it of compInst) if (!(it.tpl in firstPart)) firstPart[it.tpl] = it.part;
    const instances = compInst.filter((it) => it.part === firstPart[it.tpl]);
    const solidInst = instances.filter((it) => {
      const lib = library[it.tpl];
      if (!lib || lib.shapeless) return false;
      if (lib.always) return true;
      if (lib.never) return false;
      return lib.solidFrom !== null && it.s >= lib.solidFrom - 1e-6;
    });

    // ---- the real colliders ------------------------------------------------
    const cols = [];
    let trimesh = null, nTrimesh = 0;
    d.world.forEachCollider((c) => {
      const body = c.parent();
      if (!body || !body.isFixed()) return;              // the cars are dynamic
      const sh = c.shape;
      if (sh.vertices) {
        nTrimesh++;
        const v = sh.vertices;
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
        for (let i = 0; i < v.length; i += 3) {
          x0 = Math.min(x0, v[i]); x1 = Math.max(x1, v[i]);
          y0 = Math.min(y0, v[i + 1]); y1 = Math.max(y1, v[i + 1]);
          z0 = Math.min(z0, v[i + 2]); z1 = Math.max(z1, v[i + 2]);
        }
        const t = c.translation();
        trimesh = { x0: x0 + t.x, x1: x1 + t.x, y0: y0 + t.y, y1: y1 + t.y, z0: z0 + t.z, z1: z1 + t.z, tris: v.length / 3 };
        return;
      }
      const t = c.translation();
      const hy = sh.halfExtents ? sh.halfExtents.y : (sh.halfHeight !== undefined ? sh.halfHeight : sh.radius);
      const rad = sh.halfExtents ? Math.hypot(sh.halfExtents.x, sh.halfExtents.z) : sh.radius;
      cols.push({ x: t.x, y: t.y, z: t.z, rad, top: t.y + hy, bot: t.y - hy, used: false });
    });

    // ---- 3. every solid instance found its collider ------------------------
    //
    // MATCHED WITH EACH COMPONENT'S OWN TOLERANCE, NOT A GLOBAL ONE. Nearly
    // every collider in the library sits on its instance's origin, so it must be
    // found within a centimetre; the handful that are deliberately offset — a
    // jetty's deck runs 9 m out from its origin, a grandstand's 3.8 m back — are
    // allowed exactly their own declared offset and no more. Tight components
    // are matched first so a loose one cannot walk off with a neighbour's
    // collider and leave a false orphan behind.
    const orphanInst = [];
    const ordered = solidInst.slice().sort((a, b) => (library[a.tpl].offset) - (library[b.tpl].offset));
    for (const it of ordered) {
      const tol = library[it.tpl].offset + MATCH_EPS;
      let best = null, bd = Infinity;
      for (const c of cols) {
        if (c.used) continue;
        const dd = Math.hypot(c.x - it.x, c.z - it.z);
        if (dd < bd) { bd = dd; best = c; }
      }
      if (best && bd <= tol) { best.used = true; best.tpl = it.tpl; }
      else {
        const near = bd === Infinity ? 'none' : `${bd.toFixed(2)} m away`;
        orphanInst.push(`${it.tpl} scale ${it.s.toFixed(2)} at ${it.x.toFixed(1)},${it.z.toFixed(1)} — nearest free collider ${near}, tolerance ${tol.toFixed(2)} m`);
      }
    }

    // ---- 4. and every collider belongs to something you can see ------------
    const orphanCols = [];
    for (const c of cols) {
      if (c.used) continue;
      // it may belong to a horizon instance — that is the fix, not a fault
      const inHz = horizon.some((h) => c.x >= h.x0 - c.rad && c.x <= h.x1 + c.rad
        && c.z >= h.z0 - c.rad && c.z <= h.z1 + c.rad);
      if (inHz) { c.used = true; c.tpl = 'horizon'; continue; }
      orphanCols.push(`${c.rad.toFixed(1)} m collider at ${c.x.toFixed(1)},${c.z.toFixed(1)} with nothing drawn there`);
    }
    const hzCols = cols.filter((c) => c.tpl === 'horizon').length;

    // ---- 5/6. the horizon --------------------------------------------------
    //
    // REACH. A car cannot drive past the trimesh, but it can LEAVE it: the
    // ballistic envelope is terminal speed for as long as it takes to fall from
    // the highest point on the collider's own rim to the base of the thing being
    // tested. Both ends measured from the built world, and deliberately
    // generous — over-estimating reach fails safe.
    let rimTop = -Infinity;
    if (trimesh) {
      // the rim is the boundary of the collider's footprint; sample the mesh's
      // own vertices rather than assuming a square
      d.world.forEachCollider((c) => {
        const sh = c.shape;
        if (!sh.vertices) return;
        const v = sh.vertices;
        for (let i = 0; i < v.length; i += 3) {
          const onRim = Math.abs(Math.abs(v[i]) - Math.max(Math.abs(trimesh.x0), trimesh.x1)) < 1e-3
            || Math.abs(Math.abs(v[i + 2]) - Math.max(Math.abs(trimesh.z0), trimesh.z1)) < 1e-3;
          if (onRim) rimTop = Math.max(rimTop, v[i + 1]);
        }
      });
    }
    const reachOf = (baseY) => {
      const drop = Math.max(0, rimTop - baseY);
      return V_TERM * Math.sqrt((2 * drop) / 9.81);
    };
    const hzReach = [];
    // With no terrain collider there is no drivable ground to measure against.
    // Check 7 is what says so; this one steps aside rather than throwing, so a
    // missing floor produces one clear failure instead of a stack trace.
    for (const h of trimesh ? horizon : []) {
      const reach = reachOf(h.y0);
      // gap 0 means the footprint OVERLAPS the drivable ground: there is
      // terrain under part of that mountain and no flight is needed at all.
      // That is the photograph taken from inside a hillside.
      const gap = Math.max(
        Math.max(trimesh.x0 - h.x1, h.x0 - trimesh.x1, 0),
        Math.max(trimesh.z0 - h.z1, h.z0 - trimesh.z1, 0),
      );
      const overlap = Math.min(
        Math.min(h.x1, trimesh.x1) - Math.max(h.x0, trimesh.x0),
        Math.min(h.z1, trimesh.z1) - Math.max(h.z0, trimesh.z0),
      );
      hzReach.push({ ...h, reach, gap, overlap, onGround: gap === 0, slack: gap - reach });
    }
    // worst first: the ones standing on drivable ground, biggest overlap first
    hzReach.sort((a, b) => (b.overlap - a.overlap) || (a.slack - b.slack));

    // ---- 7. the floor covers the ground you can see ------------------------
    let surface = null;
    root.traverse((o) => {
      if (surface || !o.isMesh) return;
      if (classify(o).key === 'terrainSurface') {
        o.geometry.computeBoundingBox();
        const bb = o.geometry.boundingBox;
        surface = { x0: bb.min.x, x1: bb.max.x, y0: bb.min.y, y1: bb.max.y, z0: bb.min.z, z1: bb.max.z };
      }
    });

    // ---- 9. THE DRIVEN PROBE ----------------------------------------------
    //
    // The player's own chassis body, at the car's own terminal speed, stepped at
    // the engine's own fixed timestep. Gravity is switched off for the flight so
    // the probe asks one question and one only: is there anything there.
    const body = d.car.body;
    const dt = d.world.timestep;
    const fly = (from, dir, metres) => {
      const L = Math.hypot(dir.x, dir.y, dir.z) || 1;
      const u = { x: dir.x / L, y: dir.y / L, z: dir.z / L };
      // CCD ON, AND THIS IS NOT A DETAIL. Without it the instrument lies: the
      // chassis is 0.68 m thick and covers 0.45 m per step at terminal speed,
      // and measured on DUSTBOWL it goes STRAIGHT THROUGH the terrain trimesh
      // — dropped 60 m onto the start pad it ended 30 m under the world still
      // doing 51.8 m/s. Falling at gravity's own pace (19.8 m/s at impact) the
      // same body lands correctly on the pad, and in the game the car rides on
      // raycast suspension rather than on chassis contact, so this is the
      // PROBE's problem and not the car's. A probe that can tunnel would report
      // "nothing there" for a mountain that was solid, which is the one answer
      // this file must never give by accident.
      body.enableCcd(true);
      body.setGravityScale(0, true);
      body.setTranslation({ x: from.x, y: from.y, z: from.z }, true);
      body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      body.setLinvel({ x: u.x * V_TERM, y: u.y * V_TERM, z: u.z * V_TERM }, true);
      // one extra step of budget so a probe that is NOT stopped provably
      // overshoots rather than merely running out of steps
      const steps = Math.ceil(metres / (V_TERM * dt)) + 2;
      for (let i = 0; i < steps; i++) d.world.step();
      const t = body.translation();
      const v = body.linvel();
      return {
        travelled: (t.x - from.x) * u.x + (t.y - from.y) * u.y + (t.z - from.z) * u.z,
        speed: Math.hypot(v.x, v.y, v.z),
        budget: steps * V_TERM * dt,
        steps, dt,
      };
    };

    // CONTROL 1 — open air. High above the world, aimed along +X at nothing.
    // Must cover the whole budget: a probe that stops here is jammed, and every
    // "it stopped" below would be meaningless.
    const ceiling = (trimesh ? trimesh.y1 : 0) + 400;
    const air = fly({ x: 0, y: ceiling, z: 0 }, { x: 1, y: 0, z: 0 }, 200);

    // CONTROL 2 — the ground. Dropped onto the start pad from DROP metres. Must
    // stop: this is the same probe, the same stepping, against a collider that
    // is known to be there, and it is the only thing standing behind the word
    // "stopped" in the horizon probe.
    //
    // THE FLIGHT IS LONGER THAN THE DROP, and the reason is a bug this control
    // had until it was mutation-tested. It was flown exactly DROP metres, which
    // is also its own failure threshold plus a bit — so with the terrain
    // collider deliberately DELETED from the physics world the probe fell the
    // whole way and the control still passed, because it ran out of steps
    // before it ran out of allowance. A control that cannot fail is not a
    // control. The budget is now DROP + 20 m, so an unstopped probe provably
    // overshoots.
    const sp = terrain.spawn;
    const padY = terrain.heightAt(sp.x, sp.z);
    const ground = fly({ x: sp.x, y: padY + DROP, z: sp.z }, { x: 0, y: -1, z: 0 }, DROP + 20);

    // THE MEASUREMENT — driven at the mountain. The target is the horizon
    // instance a car can most easily get to: the one whose footprint overlaps
    // the drivable ground most deeply, or failing that the one nearest it. The
    // probe starts 30 m outside its near face on the line from the world
    // origin — the side a car is on — and is given enough budget to cross the
    // whole footprint and come out the far side.
    //
    // THE FLIGHT IS ABOVE EVERY TERRAIN VERTEX IN THE WORLD, deliberately: run
    // at car height it could be stopped by a rise in the ground and report a
    // solid mountain that is not there. Up here nothing but the target can stop
    // it, so "it stopped" means one thing only.
    let mountain = null;
    const flightY = (trimesh ? trimesh.y1 : 0) + 3;
    const target = trimesh ? (hzReach.find((h) => h.y1 > flightY + 10) ?? null) : null;
    if (target) {
      const h = target;
      const cx = (h.x0 + h.x1) / 2, cz = (h.z0 + h.z1) / 2;
      let ax = cx, az = cz;
      const aL = Math.hypot(ax, az) || 1; ax /= aL; az /= aL;
      const half = Math.max(h.x1 - h.x0, h.z1 - h.z0) / 2;
      const standoff = 30;
      const from = { x: cx - ax * (half + standoff), y: flightY, z: cz - az * (half + standoff) };
      // WHERE THE MOUNTAIN ACTUALLY STARTS along the probe's own line — the
      // slab intersection of the ray with the footprint, not `half`. Approached
      // on a diagonal the near face can be tens of metres nearer the centre than
      // the widest half-extent, and measuring penetration from `half` would
      // charge the probe for open air it crossed before touching anything.
      const slab = (p, d, lo, hi) => (Math.abs(d) < 1e-9
        ? (p >= lo && p <= hi ? [-Infinity, Infinity] : [Infinity, -Infinity])
        : [(lo - p) / d, (hi - p) / d].sort((m, n) => m - n));
      const [tx0, tx1] = slab(from.x, ax, h.x0, h.x1);
      const [tz0, tz1] = slab(from.z, az, h.z0, h.z1);
      const face = Math.max(0, Math.max(tx0, tz0));      // distance to the near face
      const exit = Math.min(tx1, tz1);
      const res = fly(from, { x: ax, y: 0, z: az }, exit + 40);
      mountain = {
        ...res, standoff, half, face: +face.toFixed(1), depth: +(exit - face).toFixed(1),
        flightY: +flightY.toFixed(1),
        form: h.form, cx: +cx.toFixed(1), cz: +cz.toFixed(1),
        top: +h.y1.toFixed(1), base: +h.y0.toFixed(1),
        onGround: h.onGround, overlap: +h.overlap.toFixed(1),
        // "entered" is the owner's word. Two ways to have entered, and either
        // is enough: the probe still has most of its speed (nothing touched
        // it), or it came out the far side of the footprint.
        inside: +(res.travelled - face).toFixed(1),
        kept: +(res.speed / V_TERM).toFixed(2),
        outFarSide: res.travelled >= exit,
        entered: res.speed > V_TERM * STOP_FRACTION || res.travelled >= exit,
      };
    }

    return {
      id: def.id, name: def.name, errors: [],
      drawables, census, unclassified,
      counts: {
        components: instances.length, solid: solidInst.length,
        colliders: cols.length, trimesh: nTrimesh, horizonCols: hzCols,
      },
      orphanInst, orphanCols,
      horizon: {
        n: horizon.length,
        tallest: horizon.length ? +Math.max(...horizon.map((h) => h.y1)).toFixed(1) : 0,
        withCollider: hzCols,
        worst: hzReach.slice(0, 3).map((h) => ({
          form: h.form, x: +((h.x0 + h.x1) / 2).toFixed(0), z: +((h.z0 + h.z1) / 2).toFixed(0),
          top: +h.y1.toFixed(1), gap: +h.gap.toFixed(1), reach: +h.reach.toFixed(1),
          slack: +h.slack.toFixed(1), overlap: +h.overlap.toFixed(1), onGround: h.onGround,
        })),
        inReach: hzReach.filter((h) => h.slack < 0).length,
        onGround: hzReach.filter((h) => h.onGround).length,
      },
      floor: { trimesh, surface, rimTop },
      probe: { air, ground, mountain },
      compAll,
    };
  }, { library, MATCH_EPS, V_TERM, PENETRATION_MAX, STOP_FRACTION, DROP });

  r.errors = errors;
  perTrack.push(r);
  await page.close();
}

const fatal = perTrack.filter((t) => t.fatal);
check(fatal.length === 0, 'every track was read out of the running game',
  fatal.map((t) => t.fatal).join(' | '));
if (fatal.length) { await browser.close(); await stopServer?.(); process.exit(1); }

check(perTrack.every((t) => t.errors.length === 0), 'no page errors building the worlds',
  perTrack.flatMap((t) => t.errors).slice(0, 3).join(' | '));

// ---- 3. every solid instance has its collider -------------------------------
{
  const bad = perTrack.filter((t) => t.orphanInst.length);
  const total = perTrack.reduce((n, t) => n + t.counts.solid, 0);
  check(bad.length === 0,
    `every solid component instance carries a collider in the built world `
    + `(${total} across ${perTrack.length} tracks, matched to ${MATCH_EPS} m + each component's own `
    + `declared offset, widest ${WIDEST_OFFSET.toFixed(1)} m)`,
    bad.map((t) => `${t.id}: ${t.orphanInst.length} bare — ${t.orphanInst.slice(0, 3).join('; ')}`).join(' | '));
}

// ---- 4. and nothing invisible stops the car ---------------------------------
{
  const bad = perTrack.filter((t) => t.orphanCols.length);
  check(bad.length === 0,
    'no collider stands where nothing is drawn',
    bad.map((t) => `${t.id}: ${t.orphanCols.slice(0, 3).join('; ')}`).join(' | '));
}

// ---- 5. THE HORIZON IS SOLID ------------------------------------------------
//
// v1 r153b, verbatim: the skyline registered no colliders at all while the
// massifs r148 had fixed did. This is that check, in dustline.
{
  const bad = perTrack.filter((t) => t.horizon.n > 0 && t.horizon.withCollider < t.horizon.n);
  const n = perTrack.reduce((s, t) => s + t.horizon.n, 0);
  const solid = perTrack.reduce((s, t) => s + t.horizon.withCollider, 0);
  check(bad.length === 0,
    `every horizon instance carries a collider (${solid} of ${n} across ${perTrack.length} tracks)`,
    bad.map((t) => `${t.id}: ${t.horizon.n - t.horizon.withCollider} of ${t.horizon.n} bare, tallest ${t.horizon.tallest} m`).join(' | '));
}

// ---- 6. ...and in particular the ones a car can get to ----------------------
{
  const bad = perTrack.filter((t) => t.horizon.inReach > 0 && t.horizon.withCollider < t.horizon.n);
  check(bad.length === 0,
    'no bare horizon mountain stands inside the ballistic reach of the drivable ground',
    bad.map((t) => {
      const w = t.horizon.worst[0];
      const worst = w.onGround
        ? `${w.form} at ${w.x},${w.z} (top ${w.top} m) has ${w.overlap} m of its footprint STANDING ON the drivable ground — no flight needed`
        : `nearest ${w.form} at ${w.x},${w.z} is ${w.gap} m past the ground against ${w.reach} m of reach`;
      return `${t.id}: ${t.horizon.inReach} of ${t.horizon.n} within reach, ${t.horizon.onGround} of them on the ground itself — ${worst}`;
    }).join(' | '));
}

// ---- 7. the floor covers the ground you can see -----------------------------
//
// The other way to fall through the world: not a missing prop collider but a
// collider smaller than the terrain it is meant to be. BUGS.md #7 — "a hole in
// the road", the car 7.43 u below the world, and the owner's "if I fall off a
// cliff... it's doing nothing".
{
  const bad = [];
  for (const t of perTrack) {
    const { trimesh: c, surface: s } = t.floor;
    if (!c || !s) { bad.push(`${t.id}: no terrain ${c ? 'mesh' : 'collider'} found`); continue; }
    const slack = Math.max(s.x0 - c.x0, c.x1 - s.x1, s.z0 - c.z0, c.z1 - s.z1);
    const short = Math.max(c.x0 - s.x0, s.x1 - c.x1, c.z0 - s.z0, s.z1 - c.z1);
    // Exact, not tolerant: terrain.ts builds both from ONE vertex buffer, so
    // any difference at all means they stopped being the same buffer.
    if (short > 1e-3) bad.push(`${t.id}: collider is ${short.toFixed(1)} m short of the drawn ground`);
    if (slack > 1e-3) bad.push(`${t.id}: collider overhangs the drawn ground by ${slack.toFixed(1)} m`);
  }
  const t0 = perTrack[0]?.floor?.trimesh;
  check(bad.length === 0,
    `the ground collider is the ground you can see, to the millimetre`
    + (t0 ? ` (${t0.tris.toLocaleString()} vertices, ${(t0.x1 - t0.x0).toFixed(0)} m square)` : ''),
    bad.join(' | '));
}

// ---- 8. no drawing path is unaccounted for ----------------------------------
//
// THE CHECK THE V1 BUG NEEDED. It is not enough to audit the objects you know
// about: r153b's 3,464 bare instances were drawn by a function nobody had put
// on any list. So every drawable in the scene must land in a path that has a
// verdict, and an unrecognised one is a failure rather than a skip.
{
  const bad = [];
  const seen = new Set();
  for (const t of perTrack) {
    for (const [key, cnt] of Object.entries(t.unclassified)) {
      bad.push(`${t.id}: ${cnt} x ${key} — no rule and no exemption`);
    }
    for (const [key, row] of Object.entries(t.census)) {
      if (row.path === 'unclassified' || row.path === 'component') continue;
      seen.add(key);
      if (!BACKDROP[key]) bad.push(`${t.id}: drawing path "${key}" is not in the BACKDROP table`);
    }
  }
  const stale = Object.keys(BACKDROP).filter((k) => !seen.has(k));
  const total = perTrack.reduce((n, t) => n + t.drawables, 0);
  check(bad.length === 0,
    `every drawable in every built world belongs to a path with a verdict `
    + `(${total} objects, ${seen.size} non-component paths${stale.length ? `, ${stale.length} not seen on this roster: ${stale.join('/')}` : ''})`,
    bad.slice(0, 6).join(' | '));
}

// ---- 9. DRIVEN, FIXED-STEP: THE PROBE AT THE HILL ---------------------------
{
  // control A — the instrument is not jammed
  const jammed = perTrack.filter((t) => t.probe.air.travelled < t.probe.air.budget * 0.95);
  check(jammed.length === 0,
    'control: the probe crosses 200 m of open air without stopping',
    jammed.map((t) => `${t.id}: travelled ${t.probe.air.travelled.toFixed(1)} of ${t.probe.air.budget.toFixed(1)} m`).join(' | '));

  // control B — the instrument can be stopped
  const fell = perTrack.filter((t) => t.probe.ground.travelled > DROP + PENETRATION_MAX);
  check(fell.length === 0,
    `control: the same probe dropped ${DROP} m onto the start pad STOPS `
    + `(within ${PENETRATION_MAX} m, flown ${DROP + 20} m so it can overshoot)`,
    fell.map((t) => `${t.id}: fell ${t.probe.ground.travelled.toFixed(1)} m — through the floor`).join(' | '));

  // the measurement
  const entered = perTrack.filter((t) => t.probe.mountain?.entered);
  const noTarget = perTrack.filter((t) => t.horizon.n > 0 && !t.probe.mountain);
  check(entered.length === 0 && noTarget.length === 0,
    `driven at ${V_TERM.toFixed(0)} m/s, fixed-step (${(perTrack[0]?.probe.air.dt ?? 0).toFixed(5)} s), `
    + `the probe STOPS at the mountain — it must shed at least `
    + `${((1 - STOP_FRACTION) * 100).toFixed(0)}% of its speed and must not come out the far side`,
    [
      ...entered.map((t) => {
        const m = t.probe.mountain;
        return `${t.id}: drove ${m.travelled.toFixed(0)} m at a face ${m.face} m away and ended up `
          + `${m.inside} m inside a ${m.top} m ${m.form} at ${m.cx},${m.cz} (${m.depth} m of mountain on that line)`
          + `${m.onGround ? `, ${m.overlap} m of its footprint standing on drivable ground` : ''}, `
          + `still doing ${m.speed.toFixed(0)} m/s — ${(m.kept * 100).toFixed(0)}% of launch speed`
          + `${m.outFarSide ? ', and out the far side' : ''} — "Still can enter."`;
      }),
      ...noTarget.map((t) => `${t.id}: has ${t.horizon.n} horizon instances and no probe ran`),
    ].join(' | '));
}

// ---- the census, per track --------------------------------------------------
if (TABLE) {
  for (const t of perTrack) {
    console.log(`\n${t.name} (${t.id}) — ${t.drawables} drawables, ${t.counts.colliders} colliders + ${t.counts.trimesh} trimesh`);
    console.log('  path'.padEnd(16) + 'key'.padEnd(18) + 'meshes'.padEnd(9) + 'instances');
    for (const [key, row] of Object.entries(t.census).sort((a, b) => b[1].instances - a[1].instances)) {
      console.log('  ' + row.path.padEnd(14) + key.padEnd(18) + String(row.meshes).padEnd(9) + row.instances);
    }
    const p = t.probe;
    console.log(`  probe: air ${p.air.travelled.toFixed(1)}/${p.air.budget.toFixed(0)} m, `
      + `ground ${p.ground.travelled.toFixed(1)} m (${DROP} m drop), `
      + (p.mountain
        ? `mountain ${p.mountain.travelled.toFixed(1)} m against a face at ${p.mountain.face} m (${p.mountain.inside} m inside, ${p.mountain.speed.toFixed(1)} m/s left)`
        : 'no mountain')
      + ` @ dt ${p.air.dt.toFixed(5)} s`);
  }
  console.log('');
}

console.log('\nsummary');
for (const t of perTrack) {
  console.log(`  ${t.id.padEnd(16)} ${String(t.counts.components).padStart(5)} component instances `
    + `(${t.counts.solid} solid, ${t.counts.colliders} colliders) · `
    + `${String(t.horizon.n).padStart(3)} horizon instances, ${t.horizon.withCollider} solid, `
    + `${t.horizon.inReach} within reach (${t.horizon.onGround} on drivable ground)`);
}

/* WHAT THIS DOES NOT COVER, stated plainly, because a check that overstates its
 * reach is worse than no check.
 *
 *  - ONLY BUILT-IN TRACKS. A track in localStorage or in a `?t=` share link is
 *    never loaded here. `src/data/tracks/*.json` is the whole roster it sees.
 *  - ONE SEED PER TRACK. Scatter and the horizon are seeded, so this is the
 *    world as committed. A reseed moves every instance; the RULES are checked
 *    (checks 2 and 6 are seed-independent) but the census is one draw.
 *  - THE PROBE IS ONE LINE THROUGH ONE MOUNTAIN — the nearest one, on the
 *    bearing from the world origin. It does not sweep the skyline, and a
 *    mountain that is solid on one flank and hollow on the other would pass.
 *  - IT ASKS WHETHER A COLLIDER IS THERE, NOT WHETHER IT IS THE RIGHT SHAPE.
 *    `verify-physics.mjs` is what measures a collider against its geometry, and
 *    it only looks at components — a horizon collider's fit is measured by
 *    nobody.
 *  - THE BALLISTIC REACH IN CHECK 6 IS A MODEL, not a measurement: terminal
 *    speed horizontally off the highest point of the collider's rim, falling
 *    freely. It ignores drag and it ignores whether any road actually leads
 *    that way, and it is generous on purpose.
 *  - DYNAMIC BODIES ARE OUT OF SCOPE. Only fixed colliders are counted, because
 *    only fixed ones are scenery.
 *  - THE PROBE FLIES WITH CCD AND NO GRAVITY, so it is not the car. That is
 *    deliberate — see `fly()` — and it means check 9 answers "is a collider
 *    there", not "does a car handle the impact well". Whether a car that lands
 *    at 50 m/s vertical tunnels through the floor is a real question and this
 *    file does not ask it: measured on DUSTBOWL, without CCD it does.
 *  - THE ROAD-EDGE POSTS ARE EXEMPTED ON THIS FILE'S AUTHORITY. terrain.ts
 *    states no intent for them either way, and somebody had to. If the intent
 *    is that they should stop a car, this is where to change it — and
 *    `verify-clearance.mjs` should be re-run afterwards, because at
 *    halfWidth + 1.2 they sit 0.3 m outside the corridor the road promises.
 *  - IT SAYS NOTHING ABOUT WHERE THINGS STAND. A solid object in the middle of
 *    the road passes every check here; `verify-clearance.mjs` is that one. */

await browser.close();
await stopServer?.();
console.log(fails ? `\n${fails} FAILED` : '\nnothing in the world is drive-through without a stated reason');
process.exit(fails ? 1 : 0);
