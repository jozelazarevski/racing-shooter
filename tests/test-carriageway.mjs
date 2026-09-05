/* NOTHING PARKS ON THE RACING LINE.
 *
 * test-obstacles.mjs asserts this for `track.obstacles` and passes 32/32 — and
 * the player still photographed rocks and log rounds on the road. The fix had
 * been verified on one list while four other systems put things in the same
 * place. A census across 21 worlds found:
 *
 *   - `_buildRoadCabins`: FOUR OF FIVE cabins on FURKA RIDGE intruded, the
 *     worst at lateral 0.25 with a 5 u SOLID radius — a house on the
 *     centreline, with push-out. `_buildableSpot` tests terrain flatness and
 *     spacing and never asks how far the road is.
 *   - tire stacks: 38 of 763 inside the drivable width, worst lateral 4.01.
 *     Same cause — `pointAt(i, fixedOffset)` measures along ONE sample's
 *     normal, and on a hairpin the road's other leg swings underneath it.
 *   - `_buildProps`: 674 of 1050 inside the drivable width, 326 inside the
 *     obstacle corridor, worst inner edge 1.78 u. Not blockers, but on the
 *     timber worlds they are `hay` recoloured as cut-log rounds, so the line
 *     was strewn with log-shaped objects regardless of where the boulders went.
 *
 * So this test does not take a list's name on trust. It walks every world
 * placement that produces something the car can hit or see on the road, and
 * measures the same quantity for all of them: `|lateral| - radius`, the closest
 * the thing comes to the centreline. Negative means it straddles.
 *
 * Deliberately NOT covered, because they are hazards that are supposed to be in
 * your way and are telegraphed: rockfall/burning-tree fallers, crossroad
 * traffic, sand geysers, puddles (drag only, no push-out).
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// FURKA RIDGE is the only world with roadCabins and is where the worst
// intrusion was measured. LOG FLUME FURY and ROCKFALL RAVINE had the densest
// prop clutter. COL DE TURINI had the worst tire stack. PINE VALLEY has no
// obstacles at all, so anything found there came from another system entirely.
// OLIVE COAST is the only world that puts anything ON the tarmac on purpose
// (the corner-exit gravel), so it is swept here as well.
// LANTERN QUARTER is the densest placement on the roster by a wide margin —
// a CONTINUOUS building frontage down both kerbs, ~430 solid masonry blocks
// against a typical world's 14 huts — so it is the world where a placement
// rule that only nearly works shows up.
const WORLDS = [[21, 'FURKA RIDGE'], [13, 'LOG FLUME FURY'], [10, 'ROCKFALL RAVINE'],
                [22, 'COL DE TURINI'], [1, 'PINE VALLEY'], [29, 'OLIVE COAST'],
                [30, 'LANTERN QUARTER']];

for (const [id, name] of WORLDS) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center,
    undefined, { timeout: 240000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  const r = await p.evaluate(() => {
    const t = window.__game.track;
    // Exact distance to the centreline polyline, not `lateralOffset` at one
    // sample: on a curve the nearest sample's normal is not the shortest path,
    // and that error is the same size as the thing being measured.
    const inner = (x, z, rad) => {
      let best = Infinity;
      for (let i = 0; i < t.center.length; i++) {
        const c = t.center[i];
        const d = Math.hypot(x - c.x, z - c.z);
        if (d < best) best = d;
      }
      return best - rad;
    };
    const survey = (list, rOf) => {
      const out = [];
      for (const o of (list ?? [])) {
        const rad = rOf(o);
        out.push({ inner: +inner(o.x, o.z, rad).toFixed(2), r: +rad.toFixed(2) });
      }
      out.sort((a, b) => a.inner - b.inner);
      return { n: out.length, worst: out.length ? out[0].inner : null, sample: out.slice(0, 3) };
    };
    return {
      obstacles: survey(t.obstacles, (o) => o.r),
      // Cabins/huts land in `solids` with a material tag; `hut` is the cabin.
      huts: survey((t.solids ?? []).filter((s) => s.mat === 'hut' && (s.y ?? 0) > -1000), (o) => o.r ?? 2),
      tires: survey(t.tireStacks, (o) => o.r ?? 1.1),
      props: survey(t.props, (o) => o.r ?? 1.2),
    };
  });

  // SOLIDS — these push the car. Nothing solid may come within the corridor.
  for (const [key, label] of [['obstacles', 'rocks and logs'], ['huts', 'cabins'], ['tires', 'tire stacks']]) {
    const s = r[key];
    if (!s.n) { console.log(`NOTE  ${name}: no ${label}`); continue; }
    check(`${name}: ${label} clear the racing line`, s.worst >= 4.0,
      `closest ${s.worst} u from the centreline (${s.n} of them)`);
    check(`${name}: no ${label} straddle the centreline`, s.worst > 0,
      s.worst > 0 ? 'none' : JSON.stringify(s.sample));
  }

  // PROPS — smashable, not blockers, so they may sit nearer than a solid. They
  // still may not sit ON the line: that is the reported complaint.
  if (r.props.n) {
    check(`${name}: smashable props are off the racing line`, r.props.worst >= 3.5,
      `closest ${r.props.worst} u from the centreline (${r.props.n} props)`);
  }

  await p.close();
}

// ---- THE TWO BUILDERS THAT WERE PLACING WITHOUT ASKING ---------------------
// A roster-wide census (tests/tool-road-census.mjs) found 159 solids reaching
// inside the drivable width across 43 of 60 worlds. Two builders accounted for
// more than half of them, and both were placing by an offset that is only true
// at one sample:
//
//   FORD DEPTH MARKERS offset by the RIVER's half-width along the RIVER's
//   bearing, so where a ford crosses at a slant the marker lands on the
//   carriageway. 67 of the 159, worst 0.23 u from the centreline on PIKES PEAK.
//
//   NARROW-SECTION POSTS offset by `widthAt(j)` at the sample they flag — and
//   a narrow section is by definition somewhere the road is doing something,
//   so the centreline swings back under them. Worst 1 u out on RED CENTRE RUN.
//
// The stone teeth beside those posts already carried `_clearsRoad`, with a
// comment saying exactly why. These two now do too. Pinned on the worlds the
// census measured them worst on.
const PLACED = [[25, 'PIKES PEAK'], [32, 'RED CENTRE RUN'], [1, 'PINE VALLEY'],
  [13, 'LOG FLUME FURY']];
for (const [id, name] of PLACED) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const built = await p.waitForFunction(() => window.__game?.track?.center,
    undefined, { timeout: 240000 }).then(() => 1).catch(() => 0);
  if (!built) { console.log(`SKIP  ${name}`); await p.close(); continue; }
  const r = await p.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    const nearest = (x, z) => {
      let best = Infinity, at = 0;
      for (let i = 0; i < N; i++) {
        const c = t.center[i];
        const d = (x - c.x) * (x - c.x) + (z - c.z) * (z - c.z);
        if (d < best) { best = d; at = i; }
      }
      return { d: Math.sqrt(best), i: at };
    };
    // the two signatures: ford marker is wood r 0.35, narrow post is metal 0.45
    const want = (s) => (s.mat === 'wood' && Math.abs(s.r - 0.35) < 0.01)
      || (s.mat === 'metal' && Math.abs(s.r - 0.45) < 0.01);
    let worst = Infinity, n = 0;
    for (const s of (t.solids ?? [])) {
      if (!want(s)) continue;
      n++;
      const { d, i } = nearest(s.x, s.z);
      worst = Math.min(worst, d - s.r - t.widthAt(i));
    }
    return { n, worst: Number.isFinite(worst) ? +worst.toFixed(2) : null };
  });
  check(`${name}: ford markers and narrow-section posts clear the carriageway`,
    r.worst === null || r.worst >= 0,
    r.n ? `${r.n} of them, closest ${r.worst} u outside the drivable edge` : 'none on this world');
  await p.close();
}

// ---- AN OFFSET IS NOT A DISTANCE: THE r199/r200 CLASS ----------------------
// The scene-graph census (tool-road-census's BODIES section) found four more
// builders doing exactly what the two above were doing — placing at
// `pointAt(i, someOffset)` and never asking how far the NEAREST leg is. Where a
// lap comes back on itself, an offset that is right beside its own carriageway
// lands in another one. Measured before the fixes:
//
//   SPONSOR BOARDS  `_buildBanners` had no road check of any kind. 68 of 419
//                   boards inside a drivable width across 15 of 61 worlds;
//                   worst BRIDGE RUN 8.58 u into a 9 u half-width — 0.42 u off
//                   the centreline. On cliff-walled worlds it was systematic,
//                   not incidental: WALL_OFF + 0.75 leaves EVERY board 6.65 u
//                   from the road against a 9 u half-width.
//   TREE TRUNKS     three builders — the forest corridors (whose own comment
//                   promised the trunks were pushed clear), the cacti, and the
//                   flora mix, which measured the distance but spent it on
//                   capping tree SIZE and never asked whether the trunk FITS.
//                   482 of 44544 trunks inside their clearance on 8 worlds, 25
//                   of them ON the drivable surface. SUZUKA is a
//                   figure-of-eight, so its crossover legs run close: 14 SOLID
//                   boles on the road, worst 4.44 u inside a 9 u half-width.
//   MARKER POSTS    the reflector markers pick CORNERS on purpose, which is
//                   exactly where the lap is likeliest to have another leg past
//                   the apex. CLIFF KNOT, whose lap ties around itself, stood
//                   23 posts and bands in a carriageway, worst 7.91 u.
//
// Pinned on the worlds each was measured worst on.
const OFFSETS = [[55, 'BRIDGE RUN'], [34, 'PRINCIPALITY STREETS'], [57, 'MOUNTAIN TO SEA'],
  [4, 'CANYON RUN'], [37, 'CROSSOVER RING'], [47, 'DEEPWOOD TRAIL'], [59, 'CLIFF KNOT']];
const seen = { boards: 0, trunks: 0, posts: 0 };
for (const [id, name] of OFFSETS) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const built = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 240000 }).then(() => 1).catch(() => 0);
  if (!built) { console.log(`SKIP  ${name}`); await p.close(); continue; }
  const r = await p.evaluate(() => {
    const t = window.__game.track;
    const V = new (t.center[0].constructor)();
    const halfAt = (x, z) => { V.set(x, 0, z); return t.widthAt(t.nearestIndex(V)); };

    // ---- sponsor boards: measure the whole 9 u SPAN ------------------------
    // A board pivoted across the road has its midpoint on the verge and its
    // ends over both lanes, so the centre alone reads as clear. `banners` also
    // holds `_buildGuardFence`'s bays (kind 'fence'), and a guard rail BELONGS
    // at the road edge — counting those buries the boards under them.
    let boards = 0, boardWorst = -Infinity;
    for (const bn of (t.banners ?? [])) {
      if (bn.kind === 'fence') continue;
      boards++;
      const h = bn.heading ?? 0;
      for (const off of [-4.5, -2.25, 0, 2.25, 4.5]) {
        const x = bn.x + Math.cos(h) * off, z = bn.z - Math.sin(h) * off;
        boardWorst = Math.max(boardWorst, halfAt(x, z) - t._distToTrack(x, z));
      }
    }

    // ---- tree trunks: RULES.md's `widthAt + r + car radius` (1.7 for a tree)
    // Only the TRUNK is solid — "collision r tracks the TRUNK, not the canopy"
    // — so a crown leaning over the road is the design working, not a defect.
    // And HEIGHT comes first: `_buildCacti` silhouettes saguaros on the canyon
    // RIM twenty units up, and judging those on XZ distance alone would fail
    // this test for the skyline doing its job.
    let trunks = 0, trunkWorst = -Infinity;
    for (const tr of (t.trees ?? [])) {
      V.set(tr.x, 0, tr.z);
      const i = t.nearestIndex(V);
      const dy = (tr.y ?? 0) - t.center[i].y;
      if (dy > 3 || dy < -4) continue;
      trunks++;
      trunkWorst = Math.max(trunkWorst,
        (t.widthAt(i) + (tr.r ?? 0.75) + 1.7) - t._distToTrack(tr.x, tr.z));
    }

    // ---- reflector marker posts -------------------------------------------
    // These carry no collider and no registry, so they are found by geometry.
    // A signature filter MUST check the values exist before comparing them, or
    // every geometry lacking those parameters passes on a NaN comparison —
    // which is how `fence.mjs` invented phantom posts for a whole session.
    let posts = 0, postWorst = -Infinity;
    const M = new (t.group.matrixWorld.constructor)();
    t.group.traverse((o) => {
      if (!o.isInstancedMesh) return;
      const g = o.geometry, q = g?.parameters;
      if (g?.type !== 'BoxGeometry' || !q) return;
      if (!Number.isFinite(q.width) || !Number.isFinite(q.height)) return;
      if (Math.abs(q.width - 0.15) > 0.005 || Math.abs(q.height - 0.85) > 0.005) return;
      o.updateWorldMatrix(true, false);
      for (let k = 0; k < o.count; k++) {
        o.getMatrixAt(k, M); M.premultiply(o.matrixWorld);
        const x = M.elements[12], z = M.elements[14];
        posts++;
        postWorst = Math.max(postWorst, halfAt(x, z) - (t._distToTrack(x, z) - 0.075));
      }
    });

    const fin = (v) => (Number.isFinite(v) ? +v.toFixed(2) : null);
    return { boards, boardWorst: fin(boardWorst), trunks, trunkWorst: fin(trunkWorst),
      posts, postWorst: fin(postWorst) };
  });
  seen.boards += r.boards; seen.trunks += r.trunks; seen.posts += r.posts;

  if (r.boards) {
    check(`${name}: no sponsor board stands in a carriageway`, r.boardWorst <= 0,
      `${r.boards} boards, deepest span reach ${r.boardWorst} u past the drivable edge`);
  } else console.log(`NOTE  ${name}: no sponsor boards`);

  if (r.trunks) {
    check(`${name}: every tree trunk clears widthAt + r + 1.7`, r.trunkWorst <= 0,
      `${r.trunks} trunks at road level, worst ${r.trunkWorst} u inside the clearance`);
  } else console.log(`NOTE  ${name}: no trees at road level`);

  if (r.posts) {
    check(`${name}: no reflector marker post stands in a carriageway`, r.postWorst <= 0,
      `${r.posts} posts, worst ${r.postWorst} u inside the drivable edge`);
  } else console.log(`NOTE  ${name}: no reflector marker posts`);

  await p.close();
}

// A CLEARANCE TEST THAT MATCHES NOTHING PASSES FOREVER. Every check above is
// conditional on having found something to measure, so rename a field or
// change a geometry and the whole section goes quiet and green. This is the
// guard on the guards.
check('the r199/r200 filters still match real geometry',
  seen.boards > 0 && seen.trunks > 0 && seen.posts > 0,
  `boards ${seen.boards}, trunks ${seen.trunks}, marker posts ${seen.posts} measured across the pinned worlds`);

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe line is clear of everything');
process.exit(fail ? 1 : 0);
