/* ROSTER SWEEP — "what stands in a carriageway" and "what hangs in the air",
 * both measured in ONE browser session (swapLevel, not a page reload per
 * world: 68 reloads is 35 minutes, 68 swaps is under ten).
 *
 * ROAD. The honest test is `widthAt(i) - distance to centreline sample i`,
 * minimised over the WHOLE lap — never `lateralOffset` at the nearest index,
 * which measures along one sample's normal and disagrees with the real
 * distance on every curve (HANDOVER: "an offset is not a distance").
 * Two questions are asked, because they have had different answers:
 *   COLLIDERS  track.buildings / trees / solids / barriers — what pushes you.
 *   BODIES     track.group.traverse, every mesh and every INSTANCE, by exact
 *              point-to-OBB distance — what you SEE standing in the road.
 * Suppression classes are the census's, and every one of them is COUNTED.
 *
 * AIR. An item is seated if its lowest point is on the ground AT ITS OWN
 * (x, z). Two grounds exist and they are not the same thing:
 *   terrainHeight()      the analytic surface the CAR stands on
 *   the terrain MESH     the 10 u grid the PLAYER sees, drawn 0.12 u lower
 * Scatter is placed against the first and judged by eye against the second,
 * so this measures BOTH gaps and prints them side by side.
 *
 * A TOOL: prints and exits 0.
 *   node tools-scratch/onroad.mjs                 # every world, both metrics
 *   node tools-scratch/onroad.mjs 6 48 65         # only these
 *   MODE=air|road node tools-scratch/onroad.mjs   # one metric only
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8920';
const only = process.argv.slice(2).map(Number).filter(Boolean);
const MODE = process.env.MODE ?? 'both';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 300 } });
page.setDefaultTimeout(900000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));

await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 });

const roster = await page.evaluate(async () => {
  const { LEVELS } = await import('./src/track.js');
  return LEVELS.map((l) => ({ id: l.id, name: l.name, theme: l.theme }));
});
const worlds = only.length ? roster.filter((l) => only.includes(l.id)) : roster;

// ---------------------------------------------------------------- measure --
await page.exposeFunction('__log', (s) => console.log(s));

const measure = async (lv) => page.evaluate(async ({ lv, MODE }) => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const level = LEVELS.find((l) => l.id === lv.id);
  g.state = 'title'; g.editScene = null;
  g.swapLevel(level, true, null);
  for (let f = 0; f < 6; f++) await new Promise((r) => requestAnimationFrame(r));
  const t = g.track, N = t.center.length;
  g.scene.updateMatrixWorld(true);

  // -- the one honest road test, shared by both sections ---------------------
  // bite = how far inside the drivable edge the point reaches, maximised over
  // the lap. > 0 means it is standing on road the car is entitled to use.
  const CELL = 24, grid = new Map();
  const gkey = (cx, cz) => cx * 100003 + cz;
  for (let i = 0; i < N; i++) {
    const c = t.center[i];
    const k = gkey(Math.floor(c.x / CELL), Math.floor(c.z / CELL));
    let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i);
  }
  let maxHalf = 0, minHalf = Infinity;
  for (let i = 0; i < N; i++) { const w = t.widthAt(i); if (w > maxHalf) maxHalf = w; if (w < minHalf) minHalf = w; }

  const biteAt = (x, z, r = 0) => {          // full-lap scan, exact
    let best = -Infinity, at = -1;
    for (let i = 0; i < N; i++) {
      const c = t.center[i];
      const b = t.widthAt(i) + r - Math.hypot(x - c.x, z - c.z);
      if (b > best) { best = b; at = i; }
    }
    return { bite: best, i: at };
  };

  const out = { id: lv.id, name: level.name, theme: level.theme,
    half: +t.widthAt(0).toFixed(1), minHalf: +minHalf.toFixed(1), maxHalf: +maxHalf.toFixed(1),
    surface: t.T?.surface ?? t.T?.grip ?? null, ground: t.T?.ground?.kind ?? null,
    hutCount: t.T?.hutCount, frontage: !!t.T?.frontage, cliffWalls: !!t.T?.cliffWalls };

  if (MODE !== 'air') {
    // ---- COLLIDER LISTS ----------------------------------------------------
    const col = [];
    const push = (list, kind, rOf) => {
      for (const o of (t[list] ?? [])) {
        if (!o || !Number.isFinite(o.x) || !Number.isFinite(o.z)) continue;
        if (o.mat === 'traffic') continue;      // traffic belongs on the road
        const r = rOf(o);
        if (!Number.isFinite(r)) continue;      // a value must EXIST to be compared
        const { bite, i } = biteAt(o.x, o.z, r);
        if (bite > 0.3) col.push({ kind: o.mat ? `${kind}:${o.mat}` : kind, bite: +bite.toFixed(2), i, n: 1 });
      }
    };
    push('buildings', 'building', (o) => o.r ?? (o.w ? o.w / 2 : 0));
    push('trees', 'tree', (o) => o.r ?? 0.6);
    push('solids', 'solid', (o) => o.r ?? Math.max(o.halfX ?? 0, o.halfZ ?? 0));
    push('props', 'prop', (o) => o.r ?? 0.6);
    // barriers are SEGMENTS, not dots — measure both ends and the middle
    for (const q of (t.barriers ?? [])) {
      if (!Number.isFinite(q?.x1)) continue;
      let worst = -Infinity, at = -1;
      for (const f of [0, 0.25, 0.5, 0.75, 1]) {
        const { bite, i } = biteAt(q.x1 + (q.x2 - q.x1) * f, q.z1 + (q.z2 - q.z1) * f, 0);
        if (bite > worst) { worst = bite; at = i; }
      }
      if (worst > 0.3) col.push({ kind: `barrier:${q.kind ?? '?'}`, bite: +worst.toFixed(2), i: at, n: 1 });
    }
    const byKind = new Map();
    for (const c of col) {
      const k = byKind.get(c.kind) ?? { kind: c.kind, n: 0, worst: 0, i: 0 };
      k.n++; if (c.bite > k.worst) { k.worst = c.bite; k.i = c.i; }
      byKind.set(c.kind, k);
    }
    out.colliders = [...byKind.values()].sort((a, b) => b.worst - a.worst);

    // ---- BODIES: the built scene graph, exact point-to-OBB ------------------
    // (the census's method, verbatim in intent: r199 built it because three
    // defect classes hid in the gap between "has a collider" and "is drawn")
    const SIZE_CAP = 60, ROOF = 2.40, HEAD = 1.20, KERB = 0.25, MIN_BITE = 0.30;
    const propRoots = new Set();
    for (const p of (t.props ?? [])) if (p.mesh) propRoots.add(p.mesh);
    const foliage = new Set();
    for (const tr of (t.trees ?? [])) {
      if (!Array.isArray(tr.parts)) continue;
      for (let pi = 1; pi < tr.parts.length; pi++) if (tr.parts[pi]) foliage.add(tr.parts[pi]);
    }
    const anc = (o, set) => { let p = o; while (p) { if (set.has(p)) return true; p = p.parent; } return false; };
    const chain = (o) => { const s = []; let p = o;
      while (p && p !== t.group) { s.push(p.name || p.type); p = p.parent; } return s.join(' < ') || 'group'; };
    const ROADNAME = /^road|^crossroad|ford-wash|skirt$/;
    const namedRoad = (o) => { let p = o;
      while (p && p !== t.group) { if (ROADNAME.test(p.name || '')) return true; p = p.parent; } return false; };
    const bbCache = new Map();
    const bbOf = (gm) => { let bb = bbCache.get(gm.uuid);
      if (!bb) { if (!gm.boundingBox) gm.computeBoundingBox(); bb = gm.boundingBox; bbCache.set(gm.uuid, bb); }
      return bb; };
    const Mat4 = t.group.matrixWorld.constructor;
    const M = new Mat4(), INV = new Mat4();
    const hits = new Map();
    const supp = { scenery: 0, surface: 0, overhead: 0, prop: 0, foliage: 0, buried: 0 };
    let bodies = 0;

    const worldAABB = (bb, m) => {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      const e = m.elements;
      for (let c = 0; c < 8; c++) {
        const lx = (c & 1) ? bb.max.x : bb.min.x, ly = (c & 2) ? bb.max.y : bb.min.y, lz = (c & 4) ? bb.max.z : bb.min.z;
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
      if (at < 0 || best <= MIN_BITE) return;
      const roadY = t.center[at].y;
      if (prop) { supp.prop++; return; }
      if (leaf) { supp.foliage++; return; }
      if (road || fy < 0.5 * Math.min(fx, fz)) { supp.surface++; return; }
      if (A.y1 < roadY + KERB) { supp.buried++; return; }
      if (A.y0 > roadY + ROOF) { supp.overhead++; return; }
      const kind = A.y0 < roadY + HEAD ? 'STANDING' : 'GRAZING';
      const h = hits.get(kind + '|' + sig) ?? { kind, sig, n: 0, worst: -Infinity, at: 0, lo: 0, hi: 0 };
      h.n++;
      if (best > h.worst) { h.worst = best; h.at = at; h.lo = A.y0 - roadY; h.hi = A.y1 - roadY; }
      hits.set(kind + '|' + sig, h);
    };
    t.group.traverse((o) => {
      if (!o.visible) return;
      const gm = o.geometry; if (!gm || (!o.isMesh && !o.isInstancedMesh)) return;
      const bb = bbOf(gm);
      const q = gm.parameters ?? {};
      const gtype = gm.type.replace('Geometry', '') + '(' + Object.entries(q)
        .filter(([k, v]) => typeof v === 'number' && !/segment/i.test(k))
        .map(([k, v]) => `${k}=${+v.toFixed(2)}`).join(',') + ')';
      const sig = `${chain(o)} | ${gtype}`;
      const prop = anc(o, propRoots), road = namedRoad(o), leaf = anc(o, foliage);
      o.updateWorldMatrix(true, false);
      if (o.isInstancedMesh) {
        for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, M); M.premultiply(o.matrixWorld); consider(M, bb, sig, prop, road, leaf); }
      } else { M.copy(o.matrixWorld); consider(M, bb, sig, prop, road, leaf); }
    });
    out.bodies = [...hits.values()].map((h) => ({ kind: h.kind, sig: h.sig, n: h.n,
      bite: +h.worst.toFixed(2), i: h.at, lo: +h.lo.toFixed(2), hi: +h.hi.toFixed(2) }))
      .sort((a, b) => b.bite - a.bite);
    out.supp = supp; out.scanned = bodies;
  }

  // ---- AIR ----------------------------------------------------------------
  if (MODE !== 'road') {
    // THE GROUND THE PLAYER SEES. The near terrain patch is a 10 u grid of
    // `_terrainMeshHeight` samples drawn 0.12 u low, and between its vertices
    // the drawn surface is the LINEAR CHORD, not the analytic curve. On a
    // steep flank the curve stands well above the chord — so an item seated
    // exactly on terrainHeight() is still drawn hanging over the hillside.
    // Reproduce the patch's own arithmetic rather than trusting a name.
    const SIZE = 2000, SEG = 200, STEP = SIZE / SEG, HALF = SIZE / 2;
    const meshY = (x, z) => {
      if (Math.abs(x) >= HALF - STEP || Math.abs(z) >= HALF - STEP) return null;
      const gx = (x + HALF) / STEP, gz = (z + HALF) / STEP;
      const i0 = Math.floor(gx), j0 = Math.floor(gz);
      const fx = gx - i0, fz = gz - j0;
      const X = (i) => i * STEP - HALF, Z = (j) => j * STEP - HALF;
      const h = (i, j) => t._terrainMeshHeight(X(i), Z(j)) - 0.12;
      const h00 = h(i0, j0), h10 = h(i0 + 1, j0), h01 = h(i0, j0 + 1), h11 = h(i0 + 1, j0 + 1);
      // PlaneGeometry splits each cell a-b-c / b-d-c, i.e. along the
      // (fx + fz = 1) diagonal. Use the triangle the point is actually in;
      // bilinear would smooth away the very error being measured.
      return (fx + fz <= 1)
        ? h00 + (h10 - h00) * fx + (h01 - h00) * fz
        : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
    };

    // Items that are MEANT to be in the air, exempted BY NAME with a reason.
    const AIRBORNE = /^(sky|horizon|cloud|bird|sea|water|river|lake|rain|snow|dust|spark|smoke|fog|particle|chopper|heli|banner|gantry|start-lights|world-skirt|contact-shadows|.*-lightpool|.*shadow|edit-|preview|hud|arrow|marker|.*-veil|bridge|deck|overpass|tunnel|gallery|rail|parapet|lamp|wire|cable|pylon|balloon|drone|whale|pontoon|buoy)/i;

    const items = [];      // (x, z, base y, label)
    const add = (x, z, y, label) => { if (Number.isFinite(x) && Number.isFinite(y)) items.push({ x, z, y, label }); };
    // The SCATTERED DECOR the report named, taken from the game's own lists so
    // the label points at a builder rather than at a coordinate.
    for (const tr of (t.trees ?? [])) add(tr.x, tr.z, tr.y ?? NaN, `tree:${tr.kind ?? '?'}`);
    for (const b of (t.bushes ?? [])) add(b.x, b.z, (b.y ?? NaN) - (b.r ?? 1) * 0.3, 'bush');
    for (const s of (t.solids ?? [])) {
      if (s.mat === 'traffic') continue;
      add(s.x, s.z, s.y ?? NaN, `solid:${s.mat ?? '?'}`);
    }
    for (const b of (t.buildings ?? [])) add(b.x, b.z, b.y ?? NaN, 'building');

    // ...and every DRAWN instance, which is the only way to see a tuft: the
    // grass has no collider and appears in no list.
    const Mat4b = t.group.matrixWorld.constructor;
    const MM = new Mat4b();
    const bb2 = new Map();
    const rows = new Map();
    const note = (label, gap, gapA, x, z) => {
      const r = rows.get(label) ?? { label, n: 0, over: 0, worst: 0, worstA: 0, x: 0, z: 0 };
      r.n++;
      if (gap > 1.0) { r.over++; if (gap > r.worst) { r.worst = gap; r.worstA = gapA; r.x = Math.round(x); r.z = Math.round(z); } }
      rows.set(label, r);
    };
    const seat = (m, bb, label) => {
      const e = m.elements;
      let y0 = Infinity, cx = 0, cz = 0, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let c = 0; c < 8; c++) {
        const lx = (c & 1) ? bb.max.x : bb.min.x, ly = (c & 2) ? bb.max.y : bb.min.y, lz = (c & 4) ? bb.max.z : bb.min.z;
        const wx = e[0] * lx + e[4] * ly + e[8] * lz + e[12];
        const wy = e[1] * lx + e[5] * ly + e[9] * lz + e[13];
        const wz = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
        if (wy < y0) y0 = wy;
        if (wx < x0) x0 = wx; if (wx > x1) x1 = wx;
        if (wz < z0) z0 = wz; if (wz > z1) z1 = wz;
      }
      if (!Number.isFinite(y0)) return;
      if (x1 - x0 > 30 || z1 - z0 > 30) return;        // landscape, not decor
      if (x1 - x0 < 1e-4 && z1 - z0 < 1e-4) return;    // a parked pool slot
      cx = (x0 + x1) / 2; cz = (z0 + z1) / 2;
      const my = meshY(cx, cz); if (my === null) return;
      const ay = t.terrainHeight(cx, cz);
      note(label, y0 - my, y0 - ay, cx, cz);
    };
    t.group.traverse((o) => {
      if (!o.visible) return;
      const gm = o.geometry; if (!gm || (!o.isMesh && !o.isInstancedMesh)) return;
      let name = o.name;
      if (!name) { const ch = []; for (let p = o.parent; p && ch.length < 3; p = p.parent) if (p.name) ch.push(p.name);
        name = (ch[0] ? ch[0] + '/' : '') + gm.type.replace('Geometry', ''); }
      if (AIRBORNE.test(name)) return;
      for (let p = o; p; p = p.parent) if (!p.visible) return;
      let bb = bb2.get(gm.uuid);
      if (!bb) { gm.computeBoundingBox(); bb = gm.boundingBox; bb2.set(gm.uuid, bb); }
      if (!bb) return;
      o.updateWorldMatrix(true, false);
      if (o.isInstancedMesh) {
        for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, MM); MM.premultiply(o.matrixWorld); seat(MM, bb, name); }
      } else { MM.copy(o.matrixWorld); seat(MM, bb, name); }
    });
    out.air = [...rows.values()].filter((r) => r.over)
      .map((r) => ({ ...r, worst: +r.worst.toFixed(2), worstA: +r.worstA.toFixed(2) }))
      .sort((a, b) => b.worst - a.worst);
    out.airTotal = [...rows.values()].reduce((s, r) => s + r.n, 0);
    out.airOver = [...rows.values()].reduce((s, r) => s + r.over, 0);
  }
  return out;
}, { lv, MODE });

// ------------------------------------------------------------------ print --
const all = [];
for (const lv of worlds) {
  let r;
  try { r = await measure(lv); } catch (e) { console.log(`SKIP ${lv.id} ${lv.name}: ${String(e).slice(0, 120)}`); continue; }
  all.push(r);
  const road = (r.colliders ?? []).reduce((s, c) => s + c.n, 0)
    + (r.bodies ?? []).reduce((s, b) => s + b.n, 0);
  console.log(`\n=== ${String(r.id).padStart(2)} ${r.name} (${r.theme})  half ${r.minHalf}-${r.maxHalf} u ===`);
  if (MODE !== 'air') {
    console.log(`  ROAD  colliders ${(r.colliders ?? []).reduce((s, c) => s + c.n, 0)}   bodies ${(r.bodies ?? []).reduce((s, b) => s + b.n, 0)} of ${r.scanned} scanned`);
    for (const c of (r.colliders ?? []).slice(0, 8)) console.log(`        ${c.kind.padEnd(20)} x${String(c.n).padStart(4)}  deepest ${c.worst} u @${c.i}`);
    for (const b of (r.bodies ?? []).slice(0, 8)) console.log(`        ${b.kind} ${b.sig.slice(0, 78)}  x${b.n}  bite ${b.bite} @${b.i} y ${b.lo}..${b.hi}`);
    const s = r.supp ?? {};
    console.log(`        suppressed: prop ${s.prop} foliage ${s.foliage} surface ${s.surface} overhead ${s.overhead} buried ${s.buried} scenery ${s.scenery}`);
  }
  if (MODE !== 'road') {
    console.log(`  AIR   ${r.airOver} of ${r.airTotal} drawn parts stand over 1.0 u above the DRAWN ground`);
    for (const a of (r.air ?? []).slice(0, 10)) {
      console.log(`        ${a.label.padEnd(28)} ${String(a.over).padStart(5)}/${String(a.n).padEnd(6)} worst ${String(a.worst).padStart(7)} u (vs analytic ${a.worstA}) at (${a.x},${a.z})`);
    }
  }
}

console.log('\n================ ROSTER ================');
for (const r of all) {
  const cn = (r.colliders ?? []).reduce((s, c) => s + c.n, 0);
  const bn = (r.bodies ?? []).reduce((s, b) => s + b.n, 0);
  console.log(`${String(r.id).padStart(3)} ${r.name.padEnd(22)} road ${String(cn).padStart(4)}c/${String(bn).padStart(4)}b   air ${String(r.airOver ?? 0).padStart(5)}/${r.airTotal ?? 0}`);
}
if (errors.length) console.log('\nPAGE ERRORS:', errors.slice(0, 8));
await browser.close();
