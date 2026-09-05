/* NOTHING STANDS ON NOTHING — every world, every scattered thing.
 *
 * Reported from a phone screenshot: "levitating grass and stone", with the car
 * stopped on a dark steep hillside under a TOO STEEP warning and grass tufts
 * and white boulders hanging clear of the ground behind it. A second, clearer
 * shot showed the same thing on the pale flanks either side of a tunnel
 * portal: trees and rocks stuck to a near-vertical face, plainly detached.
 *
 * WHY NO EXISTING CHECK COULD SEE IT ------------------------------------------
 * `tests/tool-float-census.mjs` measures a part's base against
 * `terrainHeight(x, z)` — and every scatter builder in the game seats its
 * items on exactly that function. The answer it computes is therefore 0 by
 * construction wherever the placement is honest, and it was honest. The
 * defect lives in the gap between the game's TWO grounds:
 *
 *   terrainHeight()     analytic, continuous. What the car stands on.
 *   the terrain MESH    `_buildTerrain`: a 10 u lattice of _terrainMeshHeight
 *                       samples, drawn 0.12 u low, with FLAT TRIANGLES between
 *                       them. What the player looks at.
 *
 * Between two lattice points the drawn surface is the CHORD. Where the field
 * bends faster than a 10 u cell can follow, the chord runs far below the
 * curve, and anything seated on the curve is left in mid-air. Measured on
 * SUMMIT CLIMB before the fix: a boulder with an analytic seating error of
 * 0.00 u and 27.02 u of visible air under it, over one 10 u cell that spanned
 * 56 u of terrain.
 *
 * So this gate measures against the ground that is DRAWN, read out of the live
 * scene's own vertex buffer. That is the surface the report was about.
 *
 * THE COLUMN RULE, from tool-float-census: per-part height is meaningless — a
 * roof legitimately sits 9 u up because its walls reach the ground. Bucket
 * every drawn part's footprint into a 2 u grid, keep the LOWEST piece over
 * each cell, and only judge a part that IS the lowest thing in its own column.
 *
 * THINGS THAT ARE MEANT TO BE IN THE AIR are exempted BY NAME or BY MEMBERSHIP
 * OF THE GAME'S OWN LISTS — never by shape, never by a threshold that happens
 * to swallow them — and every class is COUNTED and printed, because a silent
 * filter reads as "nothing there" (which is how bridge piers survived two
 * censuses, r199).
 *
 * FOUR LAWS:
 *   1. THE INSTRUMENT WORKS. The near terrain patch is found and complete
 *      (40401 vertices), and the exemption classes matched real geometry. A
 *      clearance check that matches nothing passes forever.
 *   2. A DELIBERATELY UNSEATED OBJECT IS CAUGHT. The POSITIVE CONTROL: one
 *      instance on the control world is lifted 6 u and the count must rise.
 *      Without this the gate could be green because it measures nothing.
 *   3. NOTHING FLOATS, ROSTER-WIDE. Per-world counts against measured caps.
 *   4. AND NOTHING FLOATS FAR. The worst single gap on any world, against a
 *      measured ceiling — a hundred 1.2 u grazes are a threshold, one 27 u
 *      boulder is the photograph.
 *
 *   node tests/test-nothing-floats.mjs
 *   node tests/test-nothing-floats.mjs 6 62      # only these worlds
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const only = process.argv.slice(2).map(Number).filter(Boolean);

// THE GAP THAT COUNTS AS FLOATING. 1.0 u is the car's wheel radius' worth of
// daylight — under that, a rock reads as sitting in a dip. The r210 defect ran
// to 27 u, so nothing about this number is close to the thing it catches.
const MIN = 1.0;

// LAW 3/4 budgets. MEASURED after the fix, roster-wide, then rounded UP a
// little so a re-seed does not fail the suite — never rounded up to cover a
// world that is actually broken. Before the fix the same sweep read 139 / 27.0
// on SUMMIT CLIMB, 149 / 18.1 on CAPE OLIVETO and 141 / 134.4 on GLACIER COL.
const MAX_FLOATERS = 8;      // measured: 46 of 67 worlds score 0, the rest 1-8
const MAX_GAP = 8.0;         // measured deepest on any UNPINNED world: 6.9 (SUZUKA foot-bridge
                             // beam). It was 137.81 on CANYON RUN before the fix.

// Worlds that carry a KNOWN, MEASURED exception. Empty is the goal; an entry
// needs a name, a number and a reason, and raising MAX_* instead would hide
// the next one on every world at once.
const KNOWN = {
  // ---- CLASSES THIS SESSION DID NOT CLEAR ---------------------------------
  // Each entry is a MEASURED number from the sweep, with the class named. They
  // are all pre-existing and none of them is the reported defect: they are
  // things seated on a DATUM (a road height, a terrace step, a bracket) rather
  // than on the ground, which is a different bug from "the drawn ground is not
  // where the placer thought it was". Shrinking this list is the next job.
  //
  // THE CANYON RIM. `_buildCacti` places its rim saguaros at `p.y + spot.dy`
  // — the ROAD's elevation plus a lift — on purpose, because on a cliff-walled
  // world there is no terrain up there at all: the wall is drawn as a vertical
  // ribbon with no horizontal top. tool-tree-clearance already carries a
  // height gate for exactly these ("the saguaros silhouetted on the canyon rim
  // are not read as intrusions").
  'CANYON RUN': { max: 95, gap: 41, why: 'canyon-rim saguaros on the road datum, worst 40.15 u' },
  'CORNICHE': { max: 110, gap: 42, why: 'the same rim saguaros, worst 40.47 u' },
  'DRY LAGOON': { max: 100, gap: 39, why: 'the same rim saguaros, worst 37.66 u' },
  'ROCKFALL RAVINE': { max: 65, gap: 35, why: 'the same rim saguaros, worst 33.18 u' },
  // STREET LANTERN GLOBES on brackets — a bulb hangs off an arm by design, and
  // the arm is a separate mesh in a different 2 u column.
  'LANTERN QUARTER': { max: 140, gap: 9.5, why: 'lantern globes on wall brackets, worst 8.64 u' },
  // 240 -> 248 for the building dressing (r218), and the DEPTH is what says
  // this is not a regression: LAW 4 still measures 8.69 u here, the same
  // lantern globes, unchanged to the centimetre. LAW 3 counts parts clearing
  // 1 u, and a gutter at 4 u or a shutter at 1.6 u is ON A WALL — the dressing
  // adds ~21 such parts per dwelling and this world's kit builds `house`
  // twice. Measured 241; rounded a little, as this file's own note requires,
  // and NOT raised to cover anything that is actually in the air.
  'HARBOR QUAY': { max: 248, gap: 9.5, why: 'the same quayside lantern globes, worst 8.69 u' },
  'CINQUE TERRE': { max: 200, gap: 9.5, why: 'the same lantern globes, worst 8.52 u' },
  'AEGEAN BLUE': { max: 160, gap: 9.5, why: 'the same lantern globes, worst 8.69 u' },
  'COSTA BRAVA': { max: 100, gap: 9.5, why: 'the same lantern globes, worst 8.38 u' },
  'DALMATIA DRIVE': { max: 220, gap: 9.5, why: 'the same lantern globes, worst 8.43 u' },
  'CITADEL BAY': { max: 155, gap: 8, why: 'citadel frontage detail, worst 6.94 u' },
  // TERRACE / PARAPET BLOCKS, 0.5 x 1.1 x ~5 u, seated on the road datum where
  // the shelf falls away beneath them — the coast and knot worlds.
  'COTE D AZUR': { max: 190, gap: 12, why: 'parapet blocks on the road datum, worst 11.23 u' },
  'CLIFF KNOT': { max: 310, gap: 12, why: 'the same parapet blocks, worst 11.28 u' },
  'SEA CLIFF RUN': { max: 275, gap: 12.5, why: 'the same parapet blocks, worst 11.84 u' },
  'BRIDGE RUN': { max: 50, gap: 14.5, why: 'the same parapet blocks, worst 13.52 u' },
  'OLIVE CROSSING': { max: 10, gap: 16, why: 'the same parapet blocks, worst 15.25 u — the roster maximum' },
  // r354 (#65): the two arch gateways' voussoir rings joined the census on
  // the 2x pinches (18 blocks over 1 u). The rings were the world's real
  // defect — a semicircle rising 13 u, crown 20.7 u over the ground — and
  // are SEGMENTAL now (rise capped at the pre-2x 4.6 u, worst 10.08 u,
  // inside the gap below); the budget admits the counted masonry.
  'MOUNTAIN TO SEA': { max: 34, gap: 11.5, why: 'roadWidth blocks + 2 segmental arch rings, worst 10.86 u' },
  'PRINCIPALITY STREETS': { max: 50, gap: 12.5, why: 'oldtown frontage on a stepped hillside datum, worst 11.84 u' },
  'RED CENTRE RUN': { max: 20, gap: 12.5, why: 'pylon crossarms and rail blocks, worst 11.92 u' },
  // MEDITERRANEAN TERRACE COPING, a 3.4 x 0.05 x 0.32 u strip on the wall it
  // caps — the wall is one long Buffer mesh the column grid cannot stamp.
  'OLIVE COAST': { max: 22, gap: 6, why: 'terrace-wall coping strips, worst 5.03 u' },
  'AUTODROMO VELOCE': { max: 38, gap: 6, why: 'the same coping strips, worst 5.03 u' },
  'TOUR DES CAPS': { max: 40, gap: 6, why: 'the same coping strips, worst 5.03 u' },
  'SALINE SPRINT': { max: 30, gap: 5.5, why: 'the same coping strips, worst 4.39 u' },
  // VINE TRELLIS POSTS standing on the ploughed soil bank they are planted in
  // — the bank is one long Buffer mesh the 2 u column grid cannot stamp.
  'VINEYARD VELOCE': { max: 14, gap: 4, why: 'vine trellis posts on their own soil bank, worst 2.09 u' },
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 300 } });
page.setDefaultTimeout(900000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 });

// The measurement runs INSIDE the page, once per world, driven by swapLevel:
// 68 page reloads is forty minutes of build time and 68 swaps is under ten.
await page.evaluate(() => {
  window.__seatScan = async ({ MINGAP }) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    g.scene.updateMatrixWorld(true);

    // ---- the DRAWN ground, read out of the scene ---------------------------
    // Found by the near patch's own geometry parameters. The find is REPORTED,
    // not assumed: a probe that matched nothing would score every world as
    // perfectly seated and never say so.
    let gm = null;
    t.group.traverse((o) => {
      if (gm || !o.isMesh || !o.geometry?.parameters) return;
      const p = o.geometry.parameters;
      if (p.width === 2000 && p.height === 2000 && p.widthSegments === 200) gm = o;
    });
    if (!gm) return { patch: 0 };
    gm.updateWorldMatrix(true, false);
    const gp = gm.geometry.attributes.position;
    const STEP = 10, HALF = 1000, W = 201;
    const H = new Float32Array(W * W).fill(NaN);
    {
      const e = gm.matrixWorld.elements;
      for (let k = 0; k < gp.count; k++) {
        const lx = gp.getX(k), ly = gp.getY(k), lz = gp.getZ(k);
        const wx = e[0] * lx + e[4] * ly + e[8] * lz + e[12];
        const wy = e[1] * lx + e[5] * ly + e[9] * lz + e[13];
        const wz = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
        const i = Math.round((wx + HALF) / STEP), j = Math.round((wz + HALF) / STEP);
        if (i >= 0 && i < W && j >= 0 && j < W) H[j * W + i] = wy;
      }
    }
    let patch = 0;
    for (let k = 0; k < H.length; k++) if (Number.isFinite(H[k])) patch++;

    const meshY = (x, z) => {
      const gx = (x + HALF) / STEP, gz = (z + HALF) / STEP;
      const i0 = Math.floor(gx), j0 = Math.floor(gz);
      if (i0 < 0 || j0 < 0 || i0 + 1 >= W || j0 + 1 >= W) return null;
      const fx = gx - i0, fz = gz - j0;
      const h00 = H[j0 * W + i0], h10 = H[j0 * W + i0 + 1];
      const h01 = H[(j0 + 1) * W + i0], h11 = H[(j0 + 1) * W + i0 + 1];
      if (!Number.isFinite(h00 + h10 + h01 + h11)) return null;
      // the flat triangles the GPU actually rasterises (PlaneGeometry splits a
      // cell a-b-d / b-c-d, i.e. across the fx + fz = 1 diagonal). Bilinear
      // here would average away the very error being measured.
      return (fx + fz <= 1)
        ? h00 + (h10 - h00) * fx + (h01 - h00) * fz
        : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
    };

    // ---- legitimately airborne, BY NAME ------------------------------------
    // Each of these is a thing whose whole job is to be off the ground: the
    // sky and weather, water surfaces, the world skirt, baked shadow decals,
    // and every structure that SPANS something — a bridge deck, an overpass,
    // a tunnel crown, a gantry, a lamp arm, a cable. Named, so the exemption
    // is auditable rather than an accident of some size threshold.
    const AIRBORNE = /^(sky|horizon|cloud|bird|sea|water|river|lake|rain|snow|dust|spark|smoke|fog|particle|chopper|heli|banner|gantry|start-lights|world-skirt|contact-shadows|.*-lightpool|.*shadow|edit-|preview|hud|arrow|marker|.*-veil|bridge|deck|overpass|tunnel|gallery|rail|parapet|lamp|wire|cable|pylon|whale|pontoon|buoy|arch|crane|cablecar|ropeway|zip|net|flag|bunting|edge-rail|guard-fence|foot-bridge|hollow-arch|stone-bridge|tyre-stack|retaining-wall|oldtown-strings|hedge-bank|hedge-top|frontage-balconies|vine-soil|.*-strings|.*-balconies|heroBridge|hero-bridge)/i;

    // ---- held up by something the 2 u column grid cannot see, BY MEMBERSHIP -
    //   foliage  parts[1..] of a `track.trees` entry. A TREE'S COLLIDER IS ITS
    //            TRUNK; an olive crown translated 1.35 u off its own stem lands
    //            in a different 2 u cell from the trunk holding it up, and the
    //            column rule then reports a perfectly seated tree as 13.58 u of
    //            air. parts[0] — the trunk — is measured like anything else.
    //   prop     `track.props`: `_buildProps` stands crates, cones and barrels
    //            ON the drivable surface on purpose ("NOT blockers — a car
    //            drives straight through one and accelerates").
    //   banner   `track.banners`: a sponsor board is a hoarding on posts, and
    //            `_buildGuardFence` shares the array with rail bays. Both
    //            belong in the air by construction.
    //   tyres    `track.tireStacks`: a stack is tyres on top of tyres.
    const exempt = new Map();
    const tag = (o, k) => { if (o) exempt.set(o, k); };
    for (const tr of (t.trees ?? [])) {
      if (!Array.isArray(tr.parts)) continue;
      for (let i = 1; i < tr.parts.length; i++) tag(tr.parts[i], 'foliage');
    }
    for (const pr of (t.props ?? [])) tag(pr.mesh, 'prop');
    for (const bn of (t.banners ?? [])) { tag(bn.group, 'banner'); tag(bn.board, 'banner'); }
    for (const st of (t.tireStacks ?? [])) tag(st.mesh, 'tyres');
    const exemptOf = (o) => { for (let p = o; p; p = p.parent) { const k = exempt.get(p); if (k) return k; } return null; };
    const supp = { foliage: 0, prop: 0, banner: 0, tyres: 0, named: 0 };

    const CELL = 2;
    const col = new Map(), parts = [];
    const MM = new (t.group.matrixWorld.constructor)();
    const bbc = new Map();

    const consider = (m, bb, name) => {
      const e = m.elements;
      let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let c = 0; c < 8; c++) {
        const lx = (c & 1) ? bb.max.x : bb.min.x, ly = (c & 2) ? bb.max.y : bb.min.y, lz = (c & 4) ? bb.max.z : bb.min.z;
        const wx = e[0] * lx + e[4] * ly + e[8] * lz + e[12];
        const wy = e[1] * lx + e[5] * ly + e[9] * lz + e[13];
        const wz = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
        if (wy < y0) y0 = wy; if (wy > y1) y1 = wy;
        if (wx < x0) x0 = wx; if (wx > x1) x1 = wx;
        if (wz < z0) z0 = wz; if (wz > z1) z1 = wz;
      }
      if (!Number.isFinite(y0)) return;
      // A PARKED POOL SLOT IS NOT A FLOATING OBJECT: an unused instance is
      // scaled to zero, which collapses its box to a point (see
      // tests/test-floating.mjs, which owns that defect).
      if (y1 - y0 < 1e-4 && x1 - x0 < 1e-4 && z1 - z0 < 1e-4) return;
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      // THE FAR SKYLINE SITS ON ITS OWN HIGHLAND, BY DESIGN — the same 420 u
    // horizon rule `tool-float-census` uses. The horizon rings, mesas and
    // distant blocks past that radius are drawn against fog to give the world
    // an edge; they are not scenery anybody drives past, and measuring them
    // against the near terrain patch reports 82 u of air under a mountain
    // that is supposed to be on the skyline.
    if (Math.hypot(cx, cz) > 420) return;
    if (Math.abs(cx) > 940 || Math.abs(cz) > 940) return;   // outside the near patch
      parts.push({ name, y0, cx, cz, h: y1 - y0 });
      const i0 = Math.floor(x0 / CELL), i1 = Math.floor(x1 / CELL);
      const j0 = Math.floor(z0 / CELL), j1 = Math.floor(z1 / CELL);
      if ((i1 - i0 + 1) * (j1 - j0 + 1) > 4000) return;       // landscape footprint
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const k = i * 100000 + j;
        const cur = col.get(k);
        if (cur === undefined || y0 < cur) col.set(k, y0);
      }
    };

    t.group.traverse((o) => {
      if (!o.visible) return;
      const geo = o.geometry; if (!geo || (!o.isMesh && !o.isInstancedMesh)) return;
      if (o === gm) return;
      let name = o.name;
      if (!name) { const ch = []; for (let p = o.parent; p && ch.length < 3; p = p.parent) if (p.name) ch.push(p.name);
        name = (ch[0] ? ch[0] + '/' : '') + geo.type.replace('Geometry', ''); }
      const n = o.isInstancedMesh ? o.count : 1;
      if (AIRBORNE.test(name)) { supp.named += n; return; }
      const ex = exemptOf(o);
      if (ex) { supp[ex] += n; return; }
      for (let p = o; p; p = p.parent) if (!p.visible) return;
      let bb = bbc.get(geo.uuid);
      if (!bb) { geo.computeBoundingBox(); bb = geo.boundingBox; bbc.set(geo.uuid, bb); }
      if (!bb) return;
      // the ancestor chain and geometry, so a finding names a BUILDER instead
      // of starting another hunt
      const ch = [];
      for (let p = o; p && p !== t.group && ch.length < 4; p = p.parent) if (p.name) ch.push(p.name);
      const q = geo.parameters ?? {};
      const sig = (ch.length ? ch.join('<') + ' ' : '') + geo.type.replace('Geometry', '')
        + '(' + Object.entries(q).filter(([k, v]) => typeof v === 'number' && !/segment/i.test(k))
          .map(([, v]) => +v.toFixed(2)).join(',') + ')';
      o.updateWorldMatrix(true, false);
      if (o.isInstancedMesh) {
        for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, MM); MM.premultiply(o.matrixWorld); consider(MM, bb, sig); }
      } else { MM.copy(o.matrixWorld); consider(MM, bb, sig); }
    });

    // ---- THE ARBITER: is anything DRAWN under it? --------------------------
    // The 2 u column grid cannot answer that for geometry with a huge
    // footprint — a canyon cliff ribbon, a mesa flank, a quay wall are all
    // skipped by the 4000-cell cap — so a ray is cast straight down from a
    // candidate's own base and, if it lands on drawn geometry before it
    // reaches the terrain patch, the thing is standing on something. Only the
    // candidates pay for it. An explicit mesh list, not `intersectObject(group,
    // true)`: the scene carries objects the raycaster chokes on and one of
    // them aborts the whole cast.
    const rc = new THREE.Raycaster();
    const from = new THREE.Vector3(), dn = new THREE.Vector3(0, -1, 0);
    const rayList = [];
    t.group.traverse((o) => {
      if ((o.isMesh || o.isInstancedMesh) && o.geometry && o.material && o.visible) rayList.push(o);
    });

    // ---- only the lowest thing in its own column can be floating -----------
    const rows = new Map();
    let tested = 0, over = 0, worst = 0, worstSig = '', wx = 0, wz = 0;
    const probe = { x: 0, y: 0, z: 0 };
    for (const p of parts) {
      const k = Math.floor(p.cx / CELL) * 100000 + Math.floor(p.cz / CELL);
      const lowest = col.get(k);
      if (lowest === undefined || p.y0 > lowest + 0.05) continue;   // something under it
      const my = meshY(p.cx, p.cz); if (my === null) continue;
      const ay = t.terrainHeight(p.cx, p.cz); if (!Number.isFinite(ay)) continue;
      // UNDER THE RIBBON, THE ROAD IS THE SURFACE YOU SEE. `_blendHeight`
      // tucks the terrain up to 0.55 u under the carriageway on purpose so the
      // two can never z-fight, and the road is drawn over the result — so a
      // tyre stack or a kerb at road level is seated, not floating. 12 u is
      // the same reach `Track._seatY` uses, and it is inside the widest ribbon
      // fringe on the roster.
      probe.x = p.cx; probe.z = p.cz; probe.y = 0;
      let gy = my;
      if (t._distToTrack(p.cx, p.cz) < 12) {
        const idx = t.nearestIndex(probe, null, false);
        if (Number.isFinite(t.center[idx].y)) gy = Math.max(gy, t.center[idx].y);
      }
      // A CHASM MAKES ITS OWN RIM LOOK LIKE IT IS FLYING — the same false
      // positive tool-road-census records: the gorge carve drops the ground
      // twenty-plus units within a couple of metres, so anything standing on
      // the lip measures as airborne. Skip the carve's own footprint rather
      // than report the hole as a floating object.
      if ((t._gorgeCut?.(p.cx, p.cz) ?? 0) > 1) continue;
      tested++;
      let gap = p.y0 - gy;
      if (gap > MINGAP) {
        // START THE RAY ABOVE THE BASE, NOT BELOW IT. It used to launch from
        // `y0 - 0.02`, so a part resting EXACTLY on a surface had that surface
        // behind the ray and got no hit at all — the arbiter could only ever
        // confirm things that were already floating. That is why 87 saguaros
        // standing on CANYON RUN's cliff ribbon were reported at 40 u: the
        // ribbon was 0.5 u ABOVE each ray's origin. Launching from y0 + LIFT
        // and subtracting it back measures the real gap either way.
        const LIFT = 1.0;
        rc.set(from.set(p.cx, p.y0 + LIFT, p.cz), dn);
        rc.near = 0; rc.far = gap + LIFT;
        let hit = null;
        try { hit = rc.intersectObjects(rayList, false)[0]; } catch (e) { hit = null; }
        if (hit) {
          const rayGap = hit.distance - LIFT;      // negative = its base is buried
          if (rayGap < gap) gap = Math.max(0, rayGap);
        }
      }
      if (gap > MINGAP) {
        over++;
        const r = rows.get(p.name) ?? { name: p.name, n: 0, worst: 0, x: 0, z: 0 };
        r.n++; if (gap > r.worst) { r.worst = gap; r.x = Math.round(p.cx); r.z = Math.round(p.cz); }
        rows.set(p.name, r);
        if (gap > worst) { worst = gap; worstSig = p.name; wx = Math.round(p.cx); wz = Math.round(p.cz); }
      }
    }
    return { patch, parts: parts.length, tested, over, supp,
      worst: +worst.toFixed(2), worstSig, wx, wz,
      rows: [...rows.values()].sort((a, b) => b.worst - a.worst).slice(0, 6)
        .map((r) => ({ ...r, worst: +r.worst.toFixed(2) })) };
  };
});

const roster = await page.evaluate(async () => {
  const { LEVELS } = await import('./src/track.js');
  return LEVELS.map((l) => ({ id: l.id, name: l.name }));
});
const worlds = only.length ? roster.filter((l) => only.includes(l.id)) : roster;

const results = [];
for (const lv of worlds) {
  const r = await page.evaluate(async ({ id, MINGAP }) => {
    const g = window.__game;
    const { LEVELS } = await import('./src/track.js');
    g.state = 'title'; g.editScene = null;
    g.swapLevel(LEVELS.find((l) => l.id === id), true, null);
    // LET THE WORLD SETTLE. Anything positioned in update() — cars, pickups,
    // animals, the wheels on a car — is still at its constructor default until
    // a frame has run, and measuring before that reports a pile of parts at
    // the world origin that no player ever sees.
    for (let f = 0; f < 8; f++) await new Promise((res) => requestAnimationFrame(res));
    return window.__seatScan({ MINGAP });
  }, { id: lv.id, MINGAP: MIN });
  results.push({ ...lv, ...r });
  console.log(`  ${String(lv.id).padStart(3)} ${lv.name.padEnd(22)} floating ${String(r.over).padStart(4)} / ${r.tested}`
    + `   worst ${String(r.worst).padStart(6)} u  ${r.worst > MIN ? `${r.worstSig.slice(0, 44)} at (${r.wx},${r.wz})` : ''}`);
}

// ---- LAW 1: the instrument works ------------------------------------------
const noPatch = results.filter((r) => r.patch !== 40401);
check('LAW 1  the drawn terrain patch is found and complete on every world',
  noPatch.length === 0,
  noPatch.length ? noPatch.map((r) => `${r.name} ${r.patch}/40401`).join(', ') : `${results.length} worlds, 40401 vertices each`);
const measured = results.reduce((s, r) => s + r.tested, 0);
check('LAW 1  and it measured real geometry', measured > 40000, `${measured} column-bottom parts tested roster-wide`);
for (const k of ['foliage', 'prop', 'banner']) {
  const n = results.reduce((s, r) => s + (r.supp?.[k] ?? 0), 0);
  check(`LAW 1  the "${k}" exemption matched real geometry`, n > 0, `${n} instances suppressed roster-wide`);
}

// ---- LAW 2: the positive control -------------------------------------------
// Lift one instance of the densest scatter on the control world 6 u into the
// air and require the sweep to notice. Without this the suite could be green
// because it is measuring nothing at all — the failure mode that cost this
// repo a whole session (tests/README.md rule 4).
const ctrl = await page.evaluate(async ({ MINGAP }) => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.state = 'title'; g.editScene = null;
  g.swapLevel(LEVELS.find((l) => l.id === 1), true, null);   // PINE VALLEY
  for (let f = 0; f < 8; f++) await new Promise((res) => requestAnimationFrame(res));
  const before = (await window.__seatScan({ MINGAP })).over;
  // find the biggest instanced scatter that is not exempt, and lift slot 0
  const t = g.track;
  let victim = null;
  t.group.traverse((o) => {
    if (!o.isInstancedMesh || o.count < 50) return;
    if (o.name) return;
    if ((t.trees ?? []).some((r) => Array.isArray(r.parts) && r.parts.includes(o))) return;
    if (!victim || o.count > victim.count) victim = o;
  });
  if (!victim) return { before, after: before, lifted: false };
  // LIFT THE WHOLE MESH, not one slot. A dense scatter is its own floor: a
  // single tuft raised 6 u still has fifty neighbours sharing its 2 u column,
  // so the column rule never even tests it and the control passes on a gate
  // that is measuring nothing. Raising every instance moves the floor with it.
  const M = new (t.group.matrixWorld.constructor)();
  for (let k = 0; k < victim.count; k++) {
    victim.getMatrixAt(k, M);
    M.elements[13] += 6;
    victim.setMatrixAt(k, M);
  }
  victim.instanceMatrix.needsUpdate = true;
  const after = (await window.__seatScan({ MINGAP })).over;
  return { before, after, lifted: true, what: victim.geometry.type, n: victim.count };
}, { MINGAP: MIN });
check('LAW 2  a deliberately unseated instance is DETECTED (positive control)',
  ctrl.lifted && ctrl.after > ctrl.before,
  `PINE VALLEY ${ctrl.what} x${ctrl.n}: ${ctrl.before} floating -> ${ctrl.after} after lifting every slot 6 u`);

// ---- LAW 3: nothing floats, roster-wide ------------------------------------
for (const r of results) {
  const k = KNOWN[r.name];
  const cap = k ? k.max : MAX_FLOATERS;
  check(`LAW 3  ${r.name}: at most ${cap} parts hang over ${MIN} u${k ? ` [${k.why}]` : ''}`, r.over <= cap,
    r.over ? `${r.over}: ${r.rows.map((q) => `${q.name.slice(0, 34)} x${q.n} ${q.worst}u`).join(' | ')}` : 'clean');
}

// ---- LAW 4: and nothing floats far -----------------------------------------
// Per world, because a hundred 1.2 u grazes are a threshold and one 27 u
// boulder is the photograph — and because the pinned worlds above each have
// their own MEASURED depth, which is the number that must not grow.
for (const r of results) {
  const k = KNOWN[r.name];
  const cap = k && k.gap ? k.gap : MAX_GAP;
  check(`LAW 4  ${r.name}: nothing hangs more than ${cap} u above the drawn ground`,
    r.worst <= cap,
    r.worst > 0 ? `worst ${r.worst} u — ${r.worstSig} at (${r.wx},${r.wz})` : 'clean');
}

check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await page.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\neverything that stands, stands on the ground');
process.exit(fail ? 1 : 0);
