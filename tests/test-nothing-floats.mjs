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
const MAX_FLOATERS = 14;     // measured worst world after the fix: 6
const MAX_GAP = 9.0;         // measured worst single gap after the fix: 8.78

// Worlds that carry a KNOWN, MEASURED exception. Empty is the goal; an entry
// needs a name, a number and a reason, and raising MAX_* instead would hide
// the next one on every world at once.
const KNOWN = {
  // (none)
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
  window.__seatScan = ({ lift }) => {
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
    const AIRBORNE = /^(sky|horizon|cloud|bird|sea|water|river|lake|rain|snow|dust|spark|smoke|fog|particle|chopper|heli|banner|gantry|start-lights|world-skirt|contact-shadows|.*-lightpool|.*shadow|edit-|preview|hud|arrow|marker|.*-veil|bridge|deck|overpass|tunnel|gallery|rail|parapet|lamp|wire|cable|pylon|whale|pontoon|buoy|arch|crane|cablecar|ropeway|zip|net|flag|bunting)/i;

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
      const gap = p.y0 - gy;
      if (gap > 1.0) {
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
  const r = await page.evaluate(async ({ id }) => {
    const g = window.__game;
    const { LEVELS } = await import('./src/track.js');
    g.state = 'title'; g.editScene = null;
    g.swapLevel(LEVELS.find((l) => l.id === id), true, null);
    // LET THE WORLD SETTLE. Anything positioned in update() — cars, pickups,
    // animals, the wheels on a car — is still at its constructor default until
    // a frame has run, and measuring before that reports a pile of parts at
    // the world origin that no player ever sees.
    for (let f = 0; f < 8; f++) await new Promise((res) => requestAnimationFrame(res));
    return window.__seatScan({});
  }, { id: lv.id });
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
const ctrl = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.state = 'title'; g.editScene = null;
  g.swapLevel(LEVELS.find((l) => l.id === 1), true, null);   // PINE VALLEY
  for (let f = 0; f < 8; f++) await new Promise((res) => requestAnimationFrame(res));
  const before = window.__seatScan({}).over;
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
  const M = new (t.group.matrixWorld.constructor)();
  victim.getMatrixAt(0, M);
  M.elements[13] += 6;
  victim.setMatrixAt(0, M);
  victim.instanceMatrix.needsUpdate = true;
  const after = window.__seatScan({}).over;
  return { before, after, lifted: true, what: victim.geometry.type, n: victim.count };
});
check('LAW 2  a deliberately unseated instance is DETECTED (positive control)',
  ctrl.lifted && ctrl.after > ctrl.before,
  `PINE VALLEY ${ctrl.what} x${ctrl.n}: ${ctrl.before} floating -> ${ctrl.after} after lifting one slot 6 u`);

// ---- LAW 3: nothing floats, roster-wide ------------------------------------
for (const r of results) {
  const cap = KNOWN[r.name] ?? MAX_FLOATERS;
  check(`LAW 3  ${r.name}: at most ${cap} parts hang over ${MIN} u`, r.over <= cap,
    r.over ? `${r.over}: ${r.rows.map((q) => `${q.name.slice(0, 34)} x${q.n} ${q.worst}u`).join(' | ')}` : 'clean');
}

// ---- LAW 4: and nothing floats far -----------------------------------------
const deepest = results.reduce((a, b) => (b.worst > a.worst ? b : a), results[0]);
check(`LAW 4  no single part hangs more than ${MAX_GAP} u above the drawn ground`,
  deepest.worst <= MAX_GAP,
  `worst is ${deepest.name} ${deepest.worst} u — ${deepest.worstSig} at (${deepest.wx},${deepest.wz})`);

check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await page.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\neverything that stands, stands on the ground');
process.exit(fail ? 1 : 0);
