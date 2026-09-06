/* NOTHING STANDS IN A CARRIAGEWAY — every world, every list, and the scene.
 *
 * Reported from a phone screenshot: "remove the house, remove all obstruction
 * from the roads", with a chalet standing squarely on the gravel carriageway
 * of an alpine world. `tests/test-roadclear.mjs` already pins four laws about
 * what may stand near a road, but only on a CURATED twelve — the worlds a
 * census once found something on. This is the roster-wide half: the same
 * question asked of all 68, because "is this world clean" and "is the roster
 * clean" have had different answers before (tool-road-census's header records
 * the gorge trench that cut unramped holes in two worlds for months while
 * every carriageway assertion passed).
 *
 * THE HONEST TEST, AND THE ONE THIS FILE REFUSES TO USE ------------------------
 * `bite = widthAt(i) - |point - centre[i]|`, MINIMISED OVER THE WHOLE LAP.
 * Never `lateralOffset` at the nearest index: that measures along one sample's
 * normal, and on a curve it disagrees with the real distance — the wider the
 * road, the worse. HANDOVER calls it "an offset is not a distance", and it is
 * the same mistake ten builders have now made in turn.
 *
 * TWO QUESTIONS, BECAUSE THEY HAVE HAD DIFFERENT ANSWERS -----------------------
 *   COLLIDERS  `track.buildings` / `trees` / `solids` / `barriers` — what
 *              pushes the car. A barrier is a SEGMENT, so it is sampled along
 *              its length, and it is only IN a carriageway if it also rises
 *              above that carriageway's surface: a retaining wall holding up
 *              the shelf the next leg runs along is doing its job (the
 *              `_pierInRoad` distinction — without it CLIFF KNOT reads 87
 *              intrusions that are all beneath a road).
 *   BODIES     `track.group.traverse` — every mesh and every INSTANCE, by
 *              exact point-to-OBB distance in XZ. Three defect classes have
 *              hidden in the gap between "has a collider" and "is drawn in the
 *              road" (barriers r191, bridge piers r193, sponsor boards r199),
 *              so what is DRAWN is measured separately from what collides.
 *
 * DELIBERATE EXCEPTIONS, KEPT AND REPORTED, NEVER "FIXED" ----------------------
 *   props      `_buildProps` stands crates, cones and barrels ON the drivable
 *              surface on purpose: "NOT blockers — a car drives straight
 *              through one and accelerates." Counted and printed every run so
 *              the exception stays visible, never asserted against.
 *   pylon legs RED CENTRE RUN and the CORSE-routed worlds keep the leg's MESH
 *              and drop its COLLIDER where the tower has nowhere to stand —
 *              decided with a measurement (r200), same rule the grandstand
 *              followed since r167.
 *
 * SIX LAWS:
 *   1. THE INSTRUMENT WORKS. Every world built, every world's scene walked,
 *      and each suppression class matched real geometry. A clearance check
 *      that matches nothing passes forever (tests/README.md rule 4).
 *   2. AN OBSTRUCTION IS CAUGHT. The POSITIVE CONTROL: a building is planted
 *      on the centreline of the control world and the sweep must see it.
 *   3. NO BUILDING STANDS IN A CARRIAGEWAY, ANYWHERE. Zero, roster-wide, no
 *      exceptions — this is the reported defect and it has no legitimate case.
 *   4. NO TREE TRUNK STANDS IN ONE. Same, roster-wide.
 *   5. WHAT IS DRAWN IN A CARRIAGEWAY STAYS WHERE IT WAS MEASURED. Per-world
 *      caps, with every known-open world PINNED BY NAME with its number and
 *      its reason. Shrinking that list is the work; growing it fails.
 *   6. NOR DOES A COLLIDER YOU CANNOT SEE. Boulders, hut solids and masonry
 *      runs — the same test and the same kind of pinned list.
 *
 *   node tests/test-nothing-on-road.mjs
 *   node tests/test-nothing-on-road.mjs 57 66     # only these worlds
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const only = process.argv.slice(2).map(Number).filter(Boolean);

// LAW 5's default budget. MEASURED after the fixes: every world outside the
// pinned list below scores 0-2 drawn bodies in a carriageway, and each of
// those is a contact-shadow decal or a single dodecahedron rock. 4 leaves a
// re-seed room to wobble without leaving room for a wall.
const MAXBODY = 4;

// KNOWN-OPEN, EACH BY NAME WITH ITS MEASURED NUMBER AND WHY IT IS STILL OPEN.
// Raising MAXBODY instead of writing an entry here would hide the next one on
// every world at once, which is the failure this file exists to prevent.
const KNOWN_BODY = {
  // r200 decided this deliberately, with a measurement: where a pylon has
  // nowhere clear to stand, the leg keeps its mesh and gives up its collider.
  // On TOUR DE CORSE every candidate is in somebody's road and `gridSlot(0)`
  // puts the player 0.00 u from a leg, losing 22.9 u/s a lap.
  'RED CENTRE RUN': { max: 10, why: 'pylon legs: mesh kept, collider dropped, by measurement (r200)' },
  'TOUR DES CAPS': { max: 5, why: 'the same pylon legs on the corse route' },
  'TERRAZZA ALTA': { max: 4, why: 'the same pylon legs — TERRAZZA ALTA runs the corse route' },
  // r199 found it and could not name the builder: the colours are computed, so
  // a literal grep does not reach it.
  'CINQUE TERRE': { max: 4, why: 'measured 4: a Dodecahedron rock at 6.28 u, builder unidentified since r199' },
  // HANDOVER item 3. Two legs of the lap interpenetrate, so anything correctly
  // placed beside one leg stands in the other. Fix the overlap, not the props.
  'SEA CLIFF RUN': { max: 8, why: '80 u of road stacked on road (HANDOVER item 3)' },
  'MOUNTAIN TO SEA': { max: 60, why: 'roadWidth 5 (45 u half-width): measured 47, down from 1159 before the width-cascade fix' },
  'GLACIER COL': { max: 4, why: 'a hero-bridge cable descending to road level over the deck it carries' },
};

// LAW 6's known-open list — the colliders that are still inside a drivable
// width, each by name, with its measured value and why it is there.
const KNOWN_HARD = {
  // measured 1 — a stone-bridge parapet block at 1.55 u, the arch face r199
  // identified and nobody has moved since
  'HEDGEROW DASH': { max: 2, why: 'stone-bridge parapet block, 1.55 u (r199)' },
  // measured 13 — THE DOCUMENTED FALSE POSITIVE, kept rather than filtered:
  // a tunnel bore is NARROWER than the road it carries, so its wall colliders
  // sit inside the drivable width by construction. tool-road-census records
  // this and says to compare runs against each other, not against zero.
  'COTE D AZUR': { max: 16, why: 'tunnel-bore wall colliders — narrower than the road they carry' },
  // measured 77 solids + 3 barriers, down from 185 + 26. What is left is the
  // world's own masonry, placed off its own offsets rather than off widthAt.
  'MOUNTAIN TO SEA': { max: 90, why: 'roadWidth 5: masonry builders still use their own offsets (HANDOVER)' },
  'CINQUE TERRE': { max: 2, why: 'the 1.95 u stone r199 could not attribute — colours are computed, grep does not reach it' },
  'CLIFF KNOT': { max: 4, why: 'a knotted lap: masonry beside one leg reaches the next' },
  'BRIDGE RUN': { max: 3, why: '2 bridge parapet segments at the deck edge' },
  // measured 1 and PRE-EXISTING: the same 1.37 u stone at sample 370 was there
  // before the spur-farmstead fix. The BUILDING that stood at 5.33 u on this
  // world — the reported chalet — is gone; this is what is left.
  'GLACIER COL': { max: 2, why: 'one 1.37 u stone at sample 370, pre-existing' },
  'SEA CLIFF RUN': { max: 4, why: '80 u of road stacked on road (HANDOVER item 3) — placement beside one leg lands in the other' },
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

await page.evaluate(() => {
  window.__roadScan = () => {
    const g = window.__game, t = g.track, N = t.center.length;
    g.scene.updateMatrixWorld(true);

    // broad phase over the centreline, so this is not N x every instance
    const CELL = 24, grid = new Map();
    const gkey = (cx, cz) => cx * 100003 + cz;
    for (let i = 0; i < N; i++) {
      const c = t.center[i];
      const k = gkey(Math.floor(c.x / CELL), Math.floor(c.z / CELL));
      let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i);
    }
    let maxHalf = 0;
    for (let i = 0; i < N; i++) maxHalf = Math.max(maxHalf, t.widthAt(i));

    // THE one honest measure: how far inside the drivable edge a point
    // reaches, maximised over the WHOLE lap.
    const biteAt = (x, z, r = 0) => {
      let best = -Infinity, at = -1;
      for (let i = 0; i < N; i++) {
        const c = t.center[i];
        const b = t.widthAt(i) + r - Math.hypot(x - c.x, z - c.z);
        if (b > best) { best = b; at = i; }
      }
      return { bite: best, i: at };
    };

    const out = { half: +t.widthAt(0).toFixed(1), buildings: [], trees: [], solids: [],
      barriers: [], props: 0, propWorst: 0, barSkipUnder: 0, barSkipOver: 0 };

    for (const b of (t.buildings ?? [])) {
      if (!Number.isFinite(b?.x) || !Number.isFinite(b?.z)) continue;
      const r = Number.isFinite(b.r) ? b.r : (Number.isFinite(b.w) ? b.w / 2 : NaN);
      if (!Number.isFinite(r)) continue;          // a value must EXIST to be compared
      const { bite, i } = biteAt(b.x, b.z, r);
      if (bite > 0.3) out.buildings.push({ bite: +bite.toFixed(2), i, r: +r.toFixed(2) });
    }
    for (const tr of (t.trees ?? [])) {
      if (!Number.isFinite(tr?.x)) continue;
      const r = Number.isFinite(tr.r) ? tr.r : 0.6;
      // RULES.md's clearance for a trunk is widthAt + r + the car's 1.7 radius;
      // this asks the narrower question — is the TRUNK inside the drivable
      // width — because that is the one that stops a car dead.
      const { bite, i } = biteAt(tr.x, tr.z, r);
      if (bite > 0.3) out.trees.push({ bite: +bite.toFixed(2), i, kind: tr.kind ?? '?', solid: !!tr.solid });
    }
    for (const s of (t.solids ?? [])) {
      if (!Number.isFinite(s?.x) || s.mat === 'traffic') continue;   // traffic belongs on the road
      const r = Number.isFinite(s.r) ? s.r : NaN;
      if (!Number.isFinite(r)) continue;
      const { bite, i } = biteAt(s.x, s.z, r);
      if (bite > 0.3) out.solids.push({ bite: +bite.toFixed(2), i, mat: s.mat ?? '?' });
    }
    for (const q of (t.barriers ?? [])) {
      if (!Number.isFinite(q?.x1)) continue;
      let worst = -Infinity, at = -1;
      for (const f of [0, 0.25, 0.5, 0.75, 1]) {
        const { bite, i } = biteAt(q.x1 + (q.x2 - q.x1) * f, q.z1 + (q.z2 - q.z1) * f, q.hw ?? 0);
        if (bite > worst) { worst = bite; at = i; }
      }
      if (worst <= 0.3) continue;
      // A WALL UNDER A CARRIAGEWAY IS NOT IN IT — `_pierInRoad`'s distinction.
      const roadY = t.center[at].y;
      if (Number.isFinite(q.y) && Number.isFinite(q.h)) {
        if (q.y + q.h < roadY + 0.35) { out.barSkipUnder++; continue; }
        if (q.y > roadY + 2.4) { out.barSkipOver++; continue; }
      }
      out.barriers.push({ bite: +worst.toFixed(2), i: at, kind: q.kind ?? '?', mat: q.mat ?? '?' });
    }
    for (const p of (t.props ?? [])) {
      if (!Number.isFinite(p?.x)) continue;
      const { bite } = biteAt(p.x, p.z, p.r ?? 0.6);
      if (bite > 0.3) { out.props++; out.propWorst = Math.max(out.propWorst, bite); }
    }
    out.propWorst = +out.propWorst.toFixed(2);

    // ---- BODIES: what is DRAWN in the road, by exact point-to-OBB ----------
    const SIZE_CAP = 60;    // wider than this is landscape, not furniture
    const ROOF = 2.40;      // vehicles.js hullHeight — the car's roof
    const HEAD = 1.20;      // the headroom line deckOverhead uses
    const KERB = 0.25, MIN_BITE = 0.30;
    const propRoots = new Set();
    for (const p of (t.props ?? [])) if (p.mesh) propRoots.add(p.mesh);
    const foliage = new Set();
    for (const tr of (t.trees ?? [])) {
      if (!Array.isArray(tr.parts)) continue;
      for (let i = 1; i < tr.parts.length; i++) if (tr.parts[i]) foliage.add(tr.parts[i]);
    }
    const anc = (o, set) => { let p = o; while (p) { if (set.has(p)) return true; p = p.parent; } return false; };
    const ROADNAME = /^road|^crossroad|ford-wash|skirt$/;
    const namedRoad = (o) => { let p = o;
      while (p && p !== t.group) { if (ROADNAME.test(p.name || '')) return true; p = p.parent; } return false; };
    const chainOf = (o) => { const s = []; let p = o;
      while (p && p !== t.group && s.length < 4) { s.push(p.name || p.type); p = p.parent; } return s.join('<'); };
    const bbc = new Map();
    const M4 = t.group.matrixWorld.constructor;
    const M = new M4(), INV = new M4();
    const hits = new Map();
    const supp = { scenery: 0, surface: 0, overhead: 0, prop: 0, foliage: 0, buried: 0 };
    let scanned = 0, bodies = 0;

    const consider = (m, bb, sig, isProp, isRoad, isLeaf) => {
      scanned++;
      const e = m.elements;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let c = 0; c < 8; c++) {
        const lx = (c & 1) ? bb.max.x : bb.min.x, ly = (c & 2) ? bb.max.y : bb.min.y, lz = (c & 4) ? bb.max.z : bb.min.z;
        const wx = e[0] * lx + e[4] * ly + e[8] * lz + e[12];
        const wy = e[1] * lx + e[5] * ly + e[9] * lz + e[13];
        const wz = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
        if (wx < x0) x0 = wx; if (wx > x1) x1 = wx;
        if (wy < y0) y0 = wy; if (wy > y1) y1 = wy;
        if (wz < z0) z0 = wz; if (wz > z1) z1 = wz;
      }
      const fx = x1 - x0, fz = z1 - z0, fy = y1 - y0;
      if (fx > SIZE_CAP || fz > SIZE_CAP) { supp.scenery++; return; }
      INV.copy(m).invert();
      const ie = INV.elements, reach = maxHalf + 1;
      let best = -Infinity, at = -1;
      const cx0 = Math.floor((x0 - reach) / CELL), cx1 = Math.floor((x1 + reach) / CELL);
      const cz0 = Math.floor((z0 - reach) / CELL), cz1 = Math.floor((z1 + reach) / CELL);
      for (let cx = cx0; cx <= cx1; cx++) for (let cz = cz0; cz <= cz1; cz++) {
        const cell = grid.get(gkey(cx, cz)); if (!cell) continue;
        for (const i of cell) {
          const c = t.center[i];
          const lx = ie[0] * c.x + ie[4] * c.y + ie[8] * c.z + ie[12];
          const ly = ie[1] * c.x + ie[5] * c.y + ie[9] * c.z + ie[13];
          const lz = ie[2] * c.x + ie[6] * c.y + ie[10] * c.z + ie[14];
          const qx = Math.min(Math.max(lx, bb.min.x), bb.max.x);
          const qy = Math.min(Math.max(ly, bb.min.y), bb.max.y);
          const qz = Math.min(Math.max(lz, bb.min.z), bb.max.z);
          const wx = e[0] * qx + e[4] * qy + e[8] * qz + e[12];
          const wz = e[2] * qx + e[6] * qy + e[10] * qz + e[14];
          const bite = t.widthAt(i) - Math.hypot(wx - c.x, wz - c.z);
          if (bite > best) { best = bite; at = i; }
        }
      }
      if (at < 0 || best <= MIN_BITE) return;
      // Everything past here IS in a carriageway; the rest says whether that
      // is a defect, and every verdict is COUNTED so no class is dropped in
      // silence — which is exactly how the bridge piers survived two censuses.
      const roadY = t.center[at].y;
      if (isProp) { supp.prop++; return; }
      if (isLeaf) { supp.foliage++; return; }
      if (isRoad || fy < 0.5 * Math.min(fx, fz)) { supp.surface++; return; }
      if (y1 < roadY + KERB) { supp.buried++; return; }
      if (y0 > roadY + ROOF) { supp.overhead++; return; }
      bodies++;
      const kind = y0 < roadY + HEAD ? 'STANDING' : 'GRAZING';
      const key = kind + '|' + sig;
      const h = hits.get(key) ?? { kind, sig, n: 0, worst: -Infinity, at: 0 };
      h.n++; if (best > h.worst) { h.worst = best; h.at = at; }
      hits.set(key, h);
    };

    t.group.traverse((o) => {
      if (!o.visible) return;
      const geo = o.geometry; if (!geo || (!o.isMesh && !o.isInstancedMesh)) return;
      let bb = bbc.get(geo.uuid);
      if (!bb) { if (!geo.boundingBox) geo.computeBoundingBox(); bb = geo.boundingBox; bbc.set(geo.uuid, bb); }
      if (!bb) return;
      const q = geo.parameters ?? {};
      const sig = chainOf(o) + ' | ' + geo.type.replace('Geometry', '') + '('
        + Object.entries(q).filter(([k, v]) => typeof v === 'number' && !/segment/i.test(k))
          .map(([k, v]) => `${k}=${+v.toFixed(2)}`).join(',') + ')';
      const isProp = anc(o, propRoots), isRoad = namedRoad(o), isLeaf = anc(o, foliage);
      o.updateWorldMatrix(true, false);
      if (o.isInstancedMesh) {
        for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, M); M.premultiply(o.matrixWorld); consider(M, bb, sig, isProp, isRoad, isLeaf); }
      } else { M.copy(o.matrixWorld); consider(M, bb, sig, isProp, isRoad, isLeaf); }
    });

    out.scanned = scanned;
    out.bodies = bodies;
    out.supp = supp;
    out.bodyRows = [...hits.values()].sort((a, b) => b.worst - a.worst).slice(0, 5)
      .map((h) => ({ kind: h.kind, sig: h.sig.slice(0, 70), n: h.n, bite: +h.worst.toFixed(2), i: h.at }));
    return out;
  };
});

const roster = await page.evaluate(async () => {
  const { LEVELS } = await import('./src/track.js');
  return LEVELS.map((l) => ({ id: l.id, name: l.name }));
});
const worlds = only.length ? roster.filter((l) => only.includes(l.id)) : roster;

const results = [];
for (const lv of worlds) {
  const r = await page.evaluate(async ({ id }) => {
    const g = window.__game;
    const { LEVELS } = await import('./src/track.js');
    g.state = 'title'; g.editScene = null;
    g.swapLevel(LEVELS.find((l) => l.id === id), true, null);
    for (let f = 0; f < 6; f++) await new Promise((res) => requestAnimationFrame(res));
    return window.__roadScan();
  }, { id: lv.id });
  results.push({ ...lv, ...r });
  console.log(`  ${String(lv.id).padStart(3)} ${lv.name.padEnd(22)}`
    + ` bld ${String(r.buildings.length).padStart(2)}  trees ${String(r.trees.length).padStart(3)}`
    + `  solids ${String(r.solids.length).padStart(3)}  barriers ${String(r.barriers.length).padStart(3)}`
    + `  bodies ${String(r.bodies).padStart(4)}   (props on the road, by design: ${r.props}, deepest ${r.propWorst} u)`);
  for (const b of r.bodyRows) if (b.bite > 1) console.log(`        ${b.kind} ${b.sig} x${b.n} bite ${b.bite} @${b.i}`);
}

// ---- LAW 1: the instrument works -------------------------------------------
const unbuilt = results.filter((r) => !r.scanned);
check('LAW 1  every world built and had its scene walked', unbuilt.length === 0,
  unbuilt.map((r) => r.name).join(', ') || `${results.length} worlds, ${results.reduce((s, r) => s + r.scanned, 0)} bodies measured`);
for (const k of ['prop', 'surface', 'scenery']) {
  const n = results.reduce((s, r) => s + (r.supp?.[k] ?? 0), 0);
  check(`LAW 1  the "${k}" suppression class matched real geometry`, n > 0, `${n} suppressed roster-wide`);
}
const propTotal = results.reduce((s, r) => s + r.props, 0);
console.log(`NOTE  ${propTotal} crates/cones/barrels stand on drivable surface across the roster — `
  + '_buildProps puts them there ON PURPOSE ("NOT blockers: a car drives straight through one and accelerates")');

// ---- LAW 2: the positive control --------------------------------------------
// Plant a building dead on the centreline of the control world and require the
// sweep to see it. Without this the suite could be green because its filters
// match nothing at all — the failure that cost this repo a session.
const ctrl = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.state = 'title'; g.editScene = null;
  g.swapLevel(LEVELS.find((l) => l.id === 1), true, null);   // PINE VALLEY, the control
  for (let f = 0; f < 6; f++) await new Promise((res) => requestAnimationFrame(res));
  const before = window.__roadScan().buildings.length;
  const t = g.track, c = t.center[(t.center.length * 0.4) | 0];
  t.buildings.push({ x: c.x, z: c.z, y: c.y, r: 5, w: 10, h: 5, hp: 1, parts: [] });
  const after = window.__roadScan();
  t.buildings.pop();
  return { before, after: after.buildings.length, bite: after.buildings[0]?.bite ?? 0 };
});
check('LAW 2  a building planted on the centreline is DETECTED (positive control)',
  ctrl.before === 0 && ctrl.after === 1,
  `PINE VALLEY: ${ctrl.before} -> ${ctrl.after} buildings in the road, bite ${ctrl.bite} u`);

// ---- LAW 3: no building stands in a carriageway -----------------------------
// The reported defect. GLACIER COL had one: the crossroad-spur farmstead's
// 8 x 5 u barn, whose 4.96 u 'hut' collider bit 5.33 u into a 9 u half-width
// at sample 42, because `_spurDressing` sited it `len + 15` along the SPUR and
// never asked the distance to the rest of the lap. It was the only one on the
// roster, and there is no legitimate case for a second.
for (const r of results) {
  check(`LAW 3  ${r.name}: no building stands in a carriageway`, r.buildings.length === 0,
    r.buildings.map((b) => `bite ${b.bite} u (r ${b.r}) @${b.i}`).join(', '));
}

// ---- LAW 4: no tree trunk stands in one -------------------------------------
for (const r of results) {
  check(`LAW 4  ${r.name}: no tree trunk is in a carriageway`, r.trees.length === 0,
    r.trees.slice(0, 3).map((q) => `${q.kind}${q.solid ? ' SOLID' : ''} bite ${q.bite} @${q.i}`).join(', '));
}

// ---- LAW 6: nor does a collider you cannot see ------------------------------
// Buildings and trunks are the two the report named; these are the rest of the
// collider lists — the boulder, the hut solid, the masonry run. A barrier is
// only counted when it also rises above the carriageway it reaches (see the
// scan): without that test CLIFF KNOT reads 87 intrusions that are all
// retaining walls UNDER the leg above them, and RED CENTRE RUN 15.
for (const r of results) {
  const k = KNOWN_HARD[r.name];
  const n = r.solids.length + r.barriers.length;
  const cap = k ? k.max : 0;
  check(`LAW 6  ${r.name}: at most ${cap} solid/barrier colliders in a carriageway`, n <= cap,
    n ? `${r.solids.map((q) => `${q.mat} ${q.bite}u@${q.i}`).concat(r.barriers.map((q) => `barrier(${q.kind}) ${q.bite}u@${q.i}`)).slice(0, 4).join(', ')}`
      + (k ? `  [known: ${k.why}]` : '') : 'clean');
}

// ---- LAW 5: what is drawn in a carriageway stays where it was measured -------
for (const r of results) {
  const k = KNOWN_BODY[r.name];
  const cap = k ? k.max : MAXBODY;
  check(`LAW 5  ${r.name}: at most ${cap} bodies drawn in a carriageway`, r.bodies <= cap,
    r.bodies ? `${r.bodies}: ${r.bodyRows.map((b) => `${b.sig.slice(0, 40)} x${b.n} ${b.bite}u`).join(' | ')}`
      + (k ? `  [known: ${k.why}]` : '') : 'clean');
}

check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await page.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe road belongs to the car, on all of them');
process.exit(fail ? 1 : 0);
