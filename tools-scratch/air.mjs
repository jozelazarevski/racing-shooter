/* WHAT HANGS IN THE AIR — measured against the ground the PLAYER SEES.
 *
 * Reported from a phone screenshot: "levitating grass and stone" on a dark
 * steep hillside. `tests/tool-float-census.mjs` could not see it, because it
 * compares a part's base with `terrainHeight(x, z)` — and every scatter
 * builder in the game SEATS its items on exactly that function, so the answer
 * it computes is 0 by construction wherever the placement is honest.
 *
 * THE GROUND IS TWO DIFFERENT SURFACES:
 *   terrainHeight()      analytic. What the car's wheels stand on.
 *   the near terrain MESH  a 10 u grid of `_terrainMeshHeight` samples drawn
 *                        0.12 u low. Between its vertices the drawn surface is
 *                        the LINEAR CHORD across a 10 u cell, not the curve.
 * On a steep flank the curve stands well above its own chord, so an item
 * seated exactly on the analytic ground is DRAWN hanging over the hillside.
 * This tool reads the REAL vertex buffer out of the scene — no reconstruction,
 * no assumption about which mesh it is — and reports both gaps side by side,
 * so the cause is visible in the numbers rather than inferred.
 *
 * THE COLUMN RULE, taken from tool-float-census: per-part height is
 * meaningless (a roof legitimately sits 9 u up because its walls reach the
 * ground). Bucket every drawn part's footprint into a 2 u grid and keep the
 * LOWEST piece over each cell; only a part that IS the lowest thing in its own
 * column can be floating.
 *
 * A TOOL: prints and exits 0.
 *   node tools-scratch/air.mjs           # every world
 *   node tools-scratch/air.mjs 6 48      # only these
 *   MIN=1.5 node tools-scratch/air.mjs   # gap threshold
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8920';
const only = process.argv.slice(2).map(Number).filter(Boolean);
const MIN = +(process.env.MIN ?? 1.0);

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

const measure = async (lv) => page.evaluate(async ({ lv, MIN }) => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const level = LEVELS.find((l) => l.id === lv.id);
  g.state = 'title'; g.editScene = null;
  g.swapLevel(level, true, null);
  for (let f = 0; f < 6; f++) await new Promise((r) => requestAnimationFrame(r));
  const t = g.track, N = t.center.length;
  g.scene.updateMatrixWorld(true);

  // ---- the DRAWN ground, read out of the scene -----------------------------
  // Found by its geometry parameters, and the find is ASSERTED: a probe that
  // matches nothing would otherwise report every world as perfectly seated.
  let gm = null;
  t.group.traverse((o) => {
    if (gm || !o.isMesh || !o.geometry?.parameters) return;
    const p = o.geometry.parameters;
    if (p.width === 2000 && p.height === 2000 && p.widthSegments === 200) gm = o;
  });
  if (!gm) return { id: lv.id, name: level.name, error: 'near terrain patch not found' };
  gm.updateWorldMatrix(true, false);
  const gp = gm.geometry.attributes.position;
  const SEG = 200, STEP = 10, HALF = 1000, W = SEG + 1;
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
  let filled = 0;
  for (let k = 0; k < H.length; k++) if (Number.isFinite(H[k])) filled++;

  const meshY = (x, z) => {
    const gx = (x + HALF) / STEP, gz = (z + HALF) / STEP;
    const i0 = Math.floor(gx), j0 = Math.floor(gz);
    if (i0 < 0 || j0 < 0 || i0 + 1 >= W || j0 + 1 >= W) return null;
    const fx = gx - i0, fz = gz - j0;
    const h00 = H[j0 * W + i0], h10 = H[j0 * W + i0 + 1];
    const h01 = H[(j0 + 1) * W + i0], h11 = H[(j0 + 1) * W + i0 + 1];
    if (!Number.isFinite(h00 + h10 + h01 + h11)) return null;
    // the flat triangles the GPU actually rasterises, not a bilinear smoothing
    // of them — bilinear would average away the very error being measured
    return (fx + fz <= 1)
      ? h00 + (h10 - h00) * fx + (h01 - h00) * fz
      : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
  };

  // ---- what is legitimately airborne, exempted BY NAME ---------------------
  const AIRBORNE = /^(sky|horizon|cloud|bird|sea|water|river|lake|rain|snow|dust|spark|smoke|fog|particle|chopper|heli|banner|gantry|start-lights|world-skirt|contact-shadows|.*-lightpool|.*shadow|edit-|preview|hud|arrow|marker|.*-veil|bridge|deck|overpass|tunnel|gallery|rail|parapet|lamp|wire|cable|pylon|whale|pontoon|buoy|arch|crane|cablecar|ropeway|zip|net|flag|bunting)/i;

  const CELL = 2;
  const col = new Map();
  const parts = [];
  const MM = t.group.matrixWorld.constructor ? new (t.group.matrixWorld.constructor)() : null;
  const bbc = new Map();

  const consider = (m, bb, name) => {
    const e = m.elements;
    let y0 = Infinity, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, y1 = -Infinity;
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
    if (y1 - y0 < 1e-4 && x1 - x0 < 1e-4 && z1 - z0 < 1e-4) return;   // parked pool slot
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    if (Math.abs(cx) > 940 || Math.abs(cz) > 940) return;             // outside the near patch
    parts.push({ name, y0, cx, cz, h: y1 - y0 });
    const i0 = Math.floor(x0 / CELL), i1 = Math.floor(x1 / CELL);
    const j0 = Math.floor(z0 / CELL), j1 = Math.floor(z1 / CELL);
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 4000) return;                 // landscape footprint
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
    if (AIRBORNE.test(name)) return;
    for (let p = o; p; p = p.parent) if (!p.visible) return;
    let bb = bbc.get(geo.uuid);
    if (!bb) { geo.computeBoundingBox(); bb = geo.boundingBox; bbc.set(geo.uuid, bb); }
    if (!bb) return;
    o.updateWorldMatrix(true, false);
    if (o.isInstancedMesh) {
      for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, MM); MM.premultiply(o.matrixWorld); consider(MM, bb, name); }
    } else { MM.copy(o.matrixWorld); consider(MM, bb, name); }
  });

  // ---- pass 2: only the lowest thing in its own column can be floating -----
  const rows = new Map();
  const grades = [], seatedGrades = [], gaps = [];
  let seated = 0, tested = 0;
  const probe = { x: 0, y: 0, z: 0 };
  for (const p of parts) {
    const k = Math.floor(p.cx / CELL) * 100000 + Math.floor(p.cz / CELL);
    const lowest = col.get(k);
    if (lowest === undefined || p.y0 > lowest + 0.05) continue;      // something under it
    const my = meshY(p.cx, p.cz); if (my === null) continue;
    let ay = t.terrainHeight(p.cx, p.cz);
    if (!Number.isFinite(ay)) continue;
    // WHERE THE ROAD IS THE GROUND. On an embankment, a shelf or a viaduct the
    // kerbs and verges sit at road level quite correctly; measuring them
    // against the valley floor reports the whole roadside as floating.
    probe.x = p.cx; probe.z = p.cz; probe.y = 0;
    const idx = t.nearestIndex(probe, null, false);
    const half = (t.widthAt ? t.widthAt(idx) : 7) + 10;
    let gy = my;
    if (t._distToTrack(p.cx, p.cz) < half && Number.isFinite(t.center[idx].y)) {
      gy = Math.max(gy, t.center[idx].y - 1.0);
      ay = Math.max(ay, t.center[idx].y - 1.0);
    }
    tested++;
    const gap = p.y0 - gy, agap = p.y0 - ay;
    // THE SLOPE UNDER IT, because two causes look identical in a photograph:
    // a height MISMATCH (the drawn ground is not the ground the placer asked)
    // and a FOOTPRINT artefact (a flat-based object seated at its centre
    // height genuinely hangs on its downhill side). They need different fixes,
    // so measure the grade and let the distribution say which it is.
    const E = 4;
    const sx = (t.terrainHeight(p.cx + E, p.cz) - t.terrainHeight(p.cx - E, p.cz)) / (2 * E);
    const sz = (t.terrainHeight(p.cx, p.cz + E) - t.terrainHeight(p.cx, p.cz - E)) / (2 * E);
    const grade = Math.hypot(sx, sz);
    const r = rows.get(p.name) ?? { name: p.name, n: 0, over: 0, worst: 0, worstA: 0, x: 0, z: 0, h: 0, grade: 0, gradeSum: 0, gradeN: 0 };
    r.n++;
    if (gap > MIN) {
      r.over++; r.gradeSum += grade; r.gradeN++;
      if (gap > r.worst) { r.worst = gap; r.worstA = agap; r.x = Math.round(p.cx); r.z = Math.round(p.cz); r.h = p.h; r.grade = grade; }
      grades.push(grade); gaps.push({ gap, agap, grade });
    } else { seated++; seatedGrades.push(grade); }
    rows.set(p.name, r);
  }
  const list = [...rows.values()].filter((r) => r.over).sort((a, b) => b.worst - a.worst)
    .map((r) => ({ ...r, worst: +r.worst.toFixed(2), worstA: +r.worstA.toFixed(2), h: +r.h.toFixed(1),
      grade: +r.grade.toFixed(2), meanGrade: +(r.gradeSum / Math.max(1, r.gradeN)).toFixed(2) }));
  const pct = (a, q) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2); };
  // Does the gap track the MESH or the ANALYTIC ground? If floaters sit at
  // ~0 analytic gap and a large mesh gap, the drawn 10 u grid is the cause.
  const meshOnly = gaps.filter((q) => Math.abs(q.agap) < 0.75).length;
  return { id: lv.id, name: level.name, theme: level.theme, vertsFound: filled,
    parts: parts.length, tested, seated, over: tested - seated, rows: list,
    tunnels: (t._tunnels ?? []).length, valleyWalls: !!t.T?.valleyWalls,
    gradeFloat: { p50: pct(grades, 0.5), p90: pct(grades, 0.9), max: pct(grades, 0.999) },
    gradeSeated: { p50: pct(seatedGrades, 0.5), p90: pct(seatedGrades, 0.9) },
    meshOnly };
}, { lv, MIN });

const all = [];
for (const lv of worlds) {
  let r;
  try { r = await measure(lv); } catch (e) { console.log(`SKIP ${lv.id} ${lv.name}: ${String(e).slice(0, 160)}`); continue; }
  all.push(r);
  if (r.error) { console.log(`\n=== ${r.id} ${r.name}: ${r.error}`); continue; }
  console.log(`\n=== ${String(r.id).padStart(2)} ${r.name} (${r.theme})  ground verts ${r.vertsFound}/40401 ===`);
  console.log(`  ${r.over} of ${r.tested} column-bottom parts stand over ${MIN} u above the DRAWN ground (${r.parts} parts scanned)`);
  console.log(`  bores ${r.tunnels}  valleyWalls ${r.valleyWalls}  |  grade under FLOATERS p50 ${r.gradeFloat.p50} p90 ${r.gradeFloat.p90} max ${r.gradeFloat.max}`
    + `   under SEATED p50 ${r.gradeSeated.p50} p90 ${r.gradeSeated.p90}   mesh-only ${r.meshOnly}/${r.over}`);
  for (const row of r.rows.slice(0, 12)) {
    console.log(`    ${row.name.padEnd(28)} ${String(row.over).padStart(5)}/${String(row.n).padEnd(6)}`
      + ` worst ${String(row.worst).padStart(7)} u  (analytic ${String(row.worstA).padStart(7)}) grade ${row.grade} at (${row.x},${row.z}) h=${row.h}`);
  }
}
console.log('\n================ ROSTER ================');
for (const r of all) {
  if (r.error) { console.log(`${String(r.id).padStart(3)} ${r.name.padEnd(22)} ${r.error}`); continue; }
  console.log(`${String(r.id).padStart(3)} ${r.name.padEnd(22)} floating ${String(r.over).padStart(5)} / ${r.tested}`
    + `   worst ${r.rows[0] ? r.rows[0].worst + ' u ' + r.rows[0].name : '-'}`);
}
if (errors.length) console.log('\nPAGE ERRORS:', errors.slice(0, 8));
await browser.close();
