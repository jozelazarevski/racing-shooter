/* WHAT IS ON THE ROAD, ACROSS THE WHOLE ROSTER.
 *
 * `test-carriageway` measures the same quantity but only on the six worlds a
 * census once found problems on. That is a guard against those regressions
 * coming back — it is not an answer to "is the roster clean", and the two
 * questions have had different answers before: the gorge trench cut unramped
 * holes in CANYON RUN and RED CENTRE RUN for months while every carriageway
 * assertion passed, because no test walked the worlds it happened on.
 *
 * So this walks ALL of them and reports five things per world:
 *
 *   BLOCKERS   a solid whose radius reaches inside the drivable width. These
 *              push the car. Measured as `|lateral| - radius` against that
 *              sample's OWN half-width, because the roster runs from 7 u
 *              pinches to 13 u boulevards and one constant would be wrong at
 *              both ends.
 *   HOLES      road samples with no surface that are not at a gorge jump —
 *              the r179 class of defect, which is invisible until you drive
 *              into it at 60 u/s.
 *   FLOATERS   solids whose base sits well above the ground under them.
 *   NARROWS    the tightest drivable width on the lap, so a world that is
 *              merely hard to thread is not confused with one that is blocked.
 *   BODIES     what you can SEE standing in the road — see below.
 *
 * ---- WHY BODIES EXISTS: THE COLLIDER BLIND SPOT ---------------------------
 * Everything above reads `track.solids`, i.e. COLLIDERS. Three separate defect
 * classes have now hidden in the gap between "has a collider" and "is drawn in
 * the road": the barrier runs (r191), the bridge piers (r193 — meshes with no
 * collider at all, so both this census and test-carriageway scored those
 * worlds clean while a grey column stood in the racing line), and the trackside
 * furniture audit that followed r195. So BODIES walks the BUILT SCENE GRAPH —
 * `track.group.traverse`, every mesh and every INSTANCE of every InstancedMesh
 * — and measures each one against the carriageway.
 *
 * Measuring "every mesh" naively is useless: the sky dome, the world skirt and
 * the road ribbon itself all overlap every carriageway trivially. So a body is
 * measured with an exact point-to-OBB distance in XZ (a long thin wall must
 * measure by its NEAREST FACE, not by a bounding disc — r191's "walls are
 * segments, not dots", one dimension further out) and then classified. Four
 * classes are SUPPRESSED, and every one of them is COUNTED and printed, because
 * a silent filter reads as "nothing there" — which is exactly how the piers
 * survived two censuses:
 *
 *   scenery   footprint > 60 u. Landscape, not furniture: terrain, horizon
 *             rings, haze bands, the 9000 u world skirt, the road ribbon.
 *   surface   a SHEET — wide in both horizontal axes, thin vertically, or a
 *             mesh the builder named as roadway. Road patches, crossroad
 *             spurs, ford washes, contact shadows, a traffic cone's base
 *             plate. These lie ON the carriageway by design. A wall or parapet
 *             is thin in ONE axis and so is not caught by this.
 *   overhead  its underside clears the car's roof. Gantries, bridge soffits,
 *             tunnel crowns, tree canopies — all of which are SUPPOSED to span
 *             a road.
 *   prop      it belongs to `track.props`. `_buildProps` puts crates, cones
 *             and barrels on the drivable surface ON PURPOSE ("the stuff you
 *             are MEANT to smash"); they are not blockers and a car drives
 *             through one and accelerates. Rocks and timber already take the
 *             trackside-only branch.
 *   foliage   a tree's crown, i.e. `parts[1..]` of an entry in `track.trees`.
 *             A TREE'S COLLIDER IS ITS TRUNK — "collision r tracks the TRUNK,
 *             not the canopy" — and a crown leaning over a rural road is what
 *             makes a forest read as a tunnel. The trunk itself, `parts[0]`,
 *             is measured like anything else, and `tools-scratch/trees.mjs`
 *             is its dedicated acceptance test.
 *
 * The thresholds are the GAME'S OWN numbers, not invented ones: 2.4 u is
 * `hullHeight` from vehicles.js (the car's roof) and 1.2 u is the headroom
 * line `deckOverhead` already uses. What survives is reported as STANDING (it
 * stands in the road) or GRAZING (it clears the bonnet but not the roof), with
 * the ancestor chain, geometry and colour of each one, so a finding names its
 * builder instead of starting another hunt.
 *
 * KNOWN FALSE POSITIVE, not filtered because filtering it would hide real
 * ones: a TUNNEL BORE is narrower than the road it carries, and its wall
 * colliders sit at the bore's half-width. Those show as BLOCKERS on every
 * world with a tunnel and they are the tunnel doing its job. Read `stone`
 * counts on SUZUKA, HARBOR QUAY, COTE D AZUR and SILVERSTONE with that in
 * mind, and compare runs against each other rather than against zero.
 *
 * A TOOL, not a test: it prints a census and exits 0. The pass/fail line
 * belongs in test-carriageway, which is where a fix gets pinned once this has
 * found something.
 *
 *   node tests/tool-road-census.mjs            # every world
 *   node tests/tool-road-census.mjs 4 32 40    # only these
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const only = process.argv.slice(2).map(Number).filter(Boolean);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);

await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const roster = await page.evaluate(async () => {
  const { LEVELS } = await import('./src/track.js');
  return LEVELS.map((l) => ({ id: l.id, name: l.name }));
});
const worlds = only.length ? roster.filter((l) => only.includes(l.id)) : roster;

const totals = { blockers: 0, holes: 0, floaters: 0, worlds: 0, dirty: 0, bodies: 0 };
const byKind = new Map();
const byBuilder = new Map();
const suppTotal = { scenery: 0, surface: 0, overhead: 0, prop: 0, foliage: 0, buried: 0 };
const rows = [];

for (const lv of worlds) {
  await page.goto(`${BASE}/?level=${lv.id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const built = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!built) { console.log(`SKIP  ${lv.name}`); continue; }

  const r = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    // Nearest point on the centreline POLYLINE, not the nearest sample's
    // normal: on a hairpin the other leg swings underneath and the error is
    // the same size as the thing being measured.
    const nearest = (x, z) => {
      let best = Infinity, at = 0;
      for (let i = 0; i < N; i++) {
        const c = t.center[i];
        const d = (x - c.x) * (x - c.x) + (z - c.z) * (z - c.z);
        if (d < best) { best = d; at = i; }
      }
      return { d: Math.sqrt(best), i: at };
    };

    // ---- BLOCKERS ---------------------------------------------------------
    const blockers = [];
    let narrowest = Infinity;
    for (let i = 0; i < N; i++) narrowest = Math.min(narrowest, t.widthAt(i));
    for (const s of (t.solids ?? [])) {
      if (!Number.isFinite(s.x) || !Number.isFinite(s.z)) continue;
      // TRAFFIC BELONGS ON THE ROAD. traffic.js parks its avoid-marker at a
      // sentinel coordinate and its live vehicles drive the carriageway on
      // purpose; counting either as an intrusion buries the real ones.
      if (s.mat === 'traffic') continue;
      const { d, i } = nearest(s.x, s.z);
      const rad = s.r ?? 1;
      const half = t.widthAt(i);
      // how far INSIDE the drivable edge the solid reaches; > 0 means it is
      // standing on road the car is entitled to use
      const bite = half - (d - rad);
      if (bite > 0.15) {
        blockers.push({ mat: s.mat ?? '?', i, bite: +bite.toFixed(2),
          lat: +d.toFixed(2), r: +rad.toFixed(2), half: +half.toFixed(2) });
      }
    }
    blockers.sort((a, b) => b.bite - a.bite);

    // ---- HOLES ------------------------------------------------------------
    const gorges = (t._jumpGorges ?? []).map((G) => G.i);
    const holes = [];
    if (t._jumpCut) {
      let run = null;
      for (let i = 0; i < N; i++) {
        if (t._jumpCut[i] > 0.5) { if (!run) { run = [i, i]; holes.push(run); } else run[1] = i; }
        else run = null;
      }
    }
    const stray = holes.filter((h) => !gorges.some((gi) => t._circDist(h[0], gi) <= 10))
      .map((h) => `${h[0]}-${h[1]}`);

    // ---- FLOATERS ---------------------------------------------------------
    const floaters = [];
    for (const s of (t.solids ?? [])) {
      if (s.y == null || !Number.isFinite(s.y) || s.mat === 'traffic') continue;
      // A CHASM MAKES ITS OWN RIM LOOK LIKE IT IS FLYING. `terrainHeight`
      // reads the carve, so anything standing on the lip of a gorge measures
      // as twenty-plus metres of air. Skip the carve's footprint rather than
      // report the hole as a floating object.
      if ((t._gorgeCut?.(s.x, s.z) ?? 0) > 1) continue;
      const g = t.terrainHeight(s.x, s.z);
      if (!Number.isFinite(g)) continue;
      const air = s.y - g;
      if (air > 2.5) floaters.push({ mat: s.mat ?? '?', air: +air.toFixed(1) });
    }
    floaters.sort((a, b) => b.air - a.air);

    // ---- BODIES -----------------------------------------------------------
    // The collider blind spot: walk what was BUILT, not what was registered.
    const SIZE_CAP = 60;    // wider than this is landscape, not furniture
    const ROOF = 2.40;      // vehicles.js hullHeight default — the car's roof
    const HEAD = 1.20;      // the headroom line deckOverhead already uses
    const KERB = 0.25;      // below this a body's top cannot obstruct anything
    const MIN_BITE = 0.30;

    // broad phase over the centreline, so this is not 900 x every instance
    const CELL = 24, grid = new Map();
    const gkey = (cx, cz) => cx * 100003 + cz;
    for (let i = 0; i < N; i++) {
      const c = t.center[i];
      const k = gkey(Math.floor(c.x / CELL), Math.floor(c.z / CELL));
      let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i);
    }
    let maxHalf = 0;
    for (let i = 0; i < N; i++) maxHalf = Math.max(maxHalf, t.widthAt(i));

    // `_buildProps` deliberately stands crates, cones and barrels on the
    // drivable surface. Mark their subtrees so intended clutter is separated
    // from the unexplained kind rather than burying it.
    const propRoots = new Set();
    for (const p of (t.props ?? [])) if (p.mesh) propRoots.add(p.mesh);
    const isProp = (o) => { let p = o; while (p) { if (propRoots.has(p)) return true; p = p.parent; } return false; };

    // A TREE'S COLLIDER IS ITS TRUNK, and the game says so where it plants the
    // forest corridors: "collision r tracks the TRUNK, not the canopy (the
    // canopy overhangs the road; only the trunk is solid)". A crown leaning
    // over a rural road is the design working — it is what makes a forest read
    // as a tunnel through the woods — so counting foliage as an intrusion
    // buries the trunks, which are the part that can stop a car. Measured on
    // r199: of 287 bodies roster-wide, ~170 were crowns, and PINE VALLEY alone
    // contributed 104 while every one of its trunks was clear.
    // Each tree records its meshes in `parts`, TRUNK FIRST, so suppress
    // parts[1..] and leave parts[0] to be measured like anything else.
    // `tools-scratch/trees.mjs` is the acceptance test for the trunks
    // themselves, against RULES.md's `widthAt + r + car radius`.
    const foliage = new Set();
    for (const tr of (t.trees ?? [])) {
      const parts = tr.parts;
      if (!Array.isArray(parts)) continue;
      for (let pi = 1; pi < parts.length; pi++) if (parts[pi]) foliage.add(parts[pi]);
    }
    const isFoliage = (o) => { let p = o; while (p) { if (foliage.has(p)) return true; p = p.parent; } return false; };

    const chain = (o) => { const s = []; let p = o;
      while (p && p !== t.group) { s.push(p.name || p.type); p = p.parent; }
      return s.join(' < ') || 'group'; };
    // a mesh the builder NAMED as roadway is roadway, whatever shape it is:
    // a crossroad spur dropping down a hillside is not a thin sheet by AABB
    const ROADNAME = /^road|^crossroad|ford-wash|skirt$/;
    const namedRoad = (o) => { let p = o;
      while (p && p !== t.group) { if (ROADNAME.test(p.name || '')) return true; p = p.parent; }
      return false; };

    const bbCache = new Map();
    const bbOf = (g) => { let bb = bbCache.get(g.uuid);
      if (!bb) { if (!g.boundingBox) g.computeBoundingBox(); bb = g.boundingBox; bbCache.set(g.uuid, bb); }
      return bb; };
    const Mat4 = t.group.matrixWorld.constructor;
    const M = new Mat4(), INV = new Mat4();

    const bodyHits = new Map();
    const supp = { scenery: 0, surface: 0, overhead: 0, prop: 0, foliage: 0, buried: 0 };
    let bodies = 0;

    const worldAABB = (bb, m) => {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      const e = m.elements;
      for (let c = 0; c < 8; c++) {
        const lx = (c & 1) ? bb.max.x : bb.min.x;
        const ly = (c & 2) ? bb.max.y : bb.min.y;
        const lz = (c & 4) ? bb.max.z : bb.min.z;
        const wx = e[0] * lx + e[4] * ly + e[8] * lz + e[12];
        const wy = e[1] * lx + e[5] * ly + e[9] * lz + e[13];
        const wz = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
        if (wx < x0) x0 = wx; if (wx > x1) x1 = wx;
        if (wy < y0) y0 = wy; if (wy > y1) y1 = wy;
        if (wz < z0) z0 = wz; if (wz > z1) z1 = wz;
      }
      return { x0, x1, y0, y1, z0, z1 };
    };

    const consider = (m, bb, sig, prop, road, leaf) => {
      bodies++;
      const A = worldAABB(bb, m);
      const fx = A.x1 - A.x0, fz = A.z1 - A.z0, fy = A.y1 - A.y0;
      if (fx > SIZE_CAP || fz > SIZE_CAP) { supp.scenery++; return; }

      // narrow phase: exact point-to-OBB distance in XZ
      INV.copy(m).invert();
      const ie = INV.elements, e = m.elements, reach = maxHalf + 1;
      let best = -Infinity, at = -1;
      const cx0 = Math.floor((A.x0 - reach) / CELL), cx1 = Math.floor((A.x1 + reach) / CELL);
      const cz0 = Math.floor((A.z0 - reach) / CELL), cz1 = Math.floor((A.z1 + reach) / CELL);
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
      if (at < 0 || best <= MIN_BITE) return;   // not in a carriageway at all

      // Everything past here IS in a carriageway; the rest says whether that
      // is a defect. Each verdict is counted so no class is dropped silently.
      const roadY = t.center[at].y;
      if (prop) { supp.prop++; return; }
      if (leaf) { supp.foliage++; return; }
      if (road || fy < 0.5 * Math.min(fx, fz)) { supp.surface++; return; }
      if (A.y1 < roadY + KERB) { supp.buried++; return; }   // top under the kerb
      if (A.y0 > roadY + ROOF) { supp.overhead++; return; }

      const kind = A.y0 < roadY + HEAD ? 'STANDING' : 'GRAZING';
      // keyed by kind+signature, but the two are kept as FIELDS rather than
      // packed into the key: a signature contains spaces, so splitting one
      // back apart needs a separator that cannot occur in it, and reaching
      // for a control character to get one leaves a source file that `grep`
      // reports as binary.
      const hk = kind + '\u0000' + sig;
      const h = bodyHits.get(hk) ?? { kind, sig, n: 0, worst: -Infinity, at: 0, half: 0, y0: 0, y1: 0, roadY: 0 };
      h.n++;
      if (best > h.worst) { h.worst = best; h.at = at; h.half = t.widthAt(at);
        h.y0 = A.y0; h.y1 = A.y1; h.roadY = roadY; }
      bodyHits.set(hk, h);
    };

    t.group.traverse((o) => {
      if (!o.visible) return;
      const g = o.geometry; if (!g || (!o.isMesh && !o.isInstancedMesh)) return;
      const bb = bbOf(g);
      const q = g.parameters ?? {};
      const gtype = g.type.replace('Geometry', '') + '(' + Object.entries(q)
        .filter(([k, v]) => typeof v === 'number' && !/segment/i.test(k))
        .map(([k, v]) => `${k}=${+v.toFixed(2)}`).join(',') + ')';
      const mm = Array.isArray(o.material) ? o.material[0] : o.material;
      const sig = `${chain(o)} | ${gtype} | ${mm?.color ? '#' + mm.color.getHexString() : '?'}`;
      const prop = isProp(o), road = namedRoad(o), leaf = isFoliage(o);
      o.updateWorldMatrix(true, false);
      if (o.isInstancedMesh) {
        for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, M); M.premultiply(o.matrixWorld); consider(M, bb, sig, prop, road, leaf); }
      } else { M.copy(o.matrixWorld); consider(M, bb, sig, prop, road, leaf); }
    });

    const bodyRows = [...bodyHits.values()].map((h) => {
      return { kind: h.kind, sig: h.sig, n: h.n, bite: +h.worst.toFixed(2), i: h.at, half: +h.half.toFixed(2),
        lo: +(h.y0 - h.roadY).toFixed(2), hi: +(h.y1 - h.roadY).toFixed(2) };
    }).sort((a, b) => b.bite - a.bite);

    return { solids: (t.solids ?? []).length, blockers, stray, floaters,
      narrowest: +narrowest.toFixed(1), bodies, bodyRows, supp };
  });

  const nBodies = r.bodyRows.reduce((a, h) => a + h.n, 0);
  totals.worlds++;
  totals.blockers += r.blockers.length;
  totals.holes += r.stray.length;
  totals.floaters += r.floaters.length;
  totals.bodies += nBodies;
  const dirty = r.blockers.length || r.stray.length || r.floaters.length || nBodies;
  if (dirty) totals.dirty++;
  for (const b of r.blockers) byKind.set(b.mat, (byKind.get(b.mat) ?? 0) + 1);
  for (const k of Object.keys(suppTotal)) suppTotal[k] += r.supp[k];
  for (const h of r.bodyRows) {
    const bk = `${h.kind}\u0000${h.sig}`;
    const e = byBuilder.get(bk) ?? { kind: h.kind, sig: h.sig, n: 0, worst: 0, where: '' };
    e.n += h.n;
    if (h.bite > e.worst) { e.worst = h.bite; e.where = `${lv.name} sample ${h.i}`; }
    byBuilder.set(bk, e);
  }

  const bits = [];
  if (r.blockers.length) {
    const kinds = {};
    for (const b of r.blockers) kinds[b.mat] = (kinds[b.mat] ?? 0) + 1;
    bits.push(`${r.blockers.length} BLOCKERS (${Object.entries(kinds)
      .map(([k, n]) => `${k}x${n}`).join(' ')}) worst bite ${r.blockers[0].bite} u`);
  }
  if (r.stray.length) bits.push(`${r.stray.length} BARE HOLES at ${r.stray.join(', ')}`);
  if (r.floaters.length) bits.push(`${r.floaters.length} FLOATERS, highest ${r.floaters[0].air} u`);
  if (nBodies) bits.push(`${nBodies} BODIES in the carriageway, worst bite ${r.bodyRows[0].bite} u`);
  console.log(`${dirty ? '••' : '  '} ${String(lv.id).padStart(2)} ${lv.name.padEnd(22)}`
    + `${String(r.solids).padStart(5)} solids  narrowest ${String(r.narrowest).padStart(5)} u  `
    + (bits.length ? bits.join(' | ') : 'clean'));
  rows.push({ id: lv.id, name: lv.name, ...r });
}

console.log(`\n===== ${totals.dirty} of ${totals.worlds} worlds have something on the road =====`);
console.log(`   blockers ${totals.blockers}   bare holes ${totals.holes}   floaters ${totals.floaters}`
  + `   bodies ${totals.bodies}`);
// THE SUPPRESSED COUNTS ARE PART OF THE ANSWER. A filter that is not printed
// reads as "nothing there", which is how the piers survived two censuses.
console.log(`   bodies suppressed: ${suppTotal.prop} intended props, ${suppTotal.foliage} tree foliage, `
  + `${suppTotal.surface} road surfaces, ${suppTotal.overhead} overhead, `
  + `${suppTotal.buried} under the kerb, ${suppTotal.scenery} scenery`);
if (byKind.size) {
  console.log('\n--- blockers by material ---');
  for (const [k, n] of [...byKind].sort((a, b) => b[1] - a[1])) console.log(`   ${k.padEnd(14)} ${n}`);
}
const worst = rows.filter((r) => r.blockers.length)
  .sort((a, b) => b.blockers[0].bite - a.blockers[0].bite).slice(0, 10);
if (worst.length) {
  console.log('\n--- deepest single intrusions ---');
  for (const w of worst) {
    const b = w.blockers[0];
    console.log(`   ${w.name.padEnd(22)} ${b.mat} bites ${b.bite} u into a ${b.half} u half-width `
      + `(sample ${b.i}, centre ${b.lat} u out, r ${b.r})`);
  }
}

if (byBuilder.size) {
  console.log('\n--- bodies in the carriageway, by builder signature ---');
  for (const e of [...byBuilder.values()].sort((a, b) => b.worst - a.worst)) {
    console.log(`   ${e.kind.padEnd(8)} x${String(e.n).padStart(4)}  worst ${String(e.worst).padStart(6)} u  (${e.where})`);
    console.log(`          ${e.sig}`);
  }
}

await browser.close();
