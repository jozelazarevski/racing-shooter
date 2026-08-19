/* EVERY RIVER ON THE ROSTER, MEASURED OFF THE BUILT GEOMETRY.
 *
 * The river has been fixed at least four times — disconnected quads with hard
 * ends, a ribbon folded through itself on a 6.7 u radius, blue shards where
 * ridges pushed through a level surface, water hanging over a fall with
 * daylight under its lip. Each of those was found by looking at a screenshot
 * of one world. This asks the same questions of all of them at once, and asks
 * them of the VERTICES that were actually built rather than of the plan they
 * were built from — a plan and a mesh agreeing is precisely what several of
 * those fixes were about.
 *
 * FOUR OF THE FIRST SIX LAWS WERE WRONG, and every one of them was confidently
 * wrong on all five worlds it was first run against. They are written up here
 * because the shape of each mistake is the point:
 *
 *   "ABOVE ITS BANK" sampled the ground 13 u either side and took the LOWER of
 *   the two. A river running along a hillside has a low bank on its downhill
 *   side — that is what a river on a slope IS. The test flagged 17-27% of the
 *   stations of every world for being a normal river. It now takes the HIGHER
 *   bank, which is the actual question: if even the high side is under the
 *   surface, the water has nothing holding it in.
 *
 *   "RUNS UPHILL" read the surface by searching every water vertex for the one
 *   nearest a centreline sample. Rivers meander, so at a bend the spatially
 *   nearest vertex belongs to the NEXT reach, 40 u away along the flow and
 *   several units lower. The 3.6 u "climb" on AMAZON RAPIDS was two different
 *   parts of the river being compared with each other. Vertices are now binned
 *   by `_riverNearest`, the game's own along-the-line lookup.
 *
 *   "ON THE CARRIAGEWAY" excluded fords by index distance (|k| < 12) while
 *   sampling every 11th index — so it only ever forgave the ford station
 *   itself, not its 34 u straight lead-in. Measured in WORLD UNITS now.
 *
 *   "FOLDS" measured circumradius on the 11 u polyline while the constraint
 *   that shapes it was applied to a resampling at getLength()/24 — a different
 *   spacing measures a different curve. Sampled at a fixed 24 u arc now, the
 *   spacing the relaxation actually used.
 *
 * AND TWO MORE WERE STILL WRONG AFTER THAT, both for the same reason — they
 * asked the PLAN a question only the MESH can answer:
 *
 *   "ABOVE ITS HIGHER BANK" measured the whole centreline, and a river's
 *   centreline runs 2600 u out past the world edge at both ends so it never
 *   appears to start. PINE VALLEY's worst station was at (1700, 500) — r 1772,
 *   past the 1620 rim, 1530 u from the nearest road. Out there the ground is
 *   not carved and the line simply rides over it. Every "spilling bank" on
 *   every world was a tail. The audit now stops at the rim.
 *
 *   "ON THE CARRIAGEWAY" tested the centreline against the road. Rendered, the
 *   flagged station on PINE VALLEY is the start gantry with dry tarmac under
 *   it: the ribbon's width is driven to nothing where it meets a road and the
 *   crossing is drawn by the separate ford-wash mesh instead. The line is
 *   there; the water is not. It now tests WATER VERTICES.
 *
 *   ...and even testing the mesh was not enough on its own. PINE VALLEY still
 *   reported water 0.2 u from the centreline at the start gantry, where the
 *   render plainly shows dry tarmac. `_buildRiver` drives the ribbon's width
 *   to zero rather than deleting rows, so those rows still HAVE vertices —
 *   every column collapsed onto the centreline, drawing zero-area quads. A
 *   vertex is only water if the row it belongs to has width, so rows are
 *   binned and any narrower than a metre are ignored.
 *
 *   ...and the row-width filter that was written to explain those flags turned
 *   out to remove NOTHING: `_buildRiver` only pinches the ribbon to zero
 *   inside a jump gorge, never at a road. The real reason the gantry renders
 *   dry is that the stream passes UNDER the deck — the water is there, 1.2 u
 *   below the tarmac, with the road drawn over it. So the road law compares
 *   HEIGHTS: water laterally inside the carriageway is only a defect if it is
 *   also at or above the road surface. The filter is kept because a pinched
 *   row is still not a station, and it reports how many it found.
 *
 *   ...and the rim was still the wrong boundary. Rendered, every surviving
 *   "spilling bank" on PINE VALLEY and OASIS AMBUSH sits 1377-1408 u from the
 *   nearest road, at r 1616-1618 — the last metre inside the 1620 rim, where
 *   the boundary wall rises and the river runs out over it. Nobody drives
 *   there and nobody can see it from anywhere they do drive. The reach that
 *   counts is the one within sight of the road; the rest is reported as a
 *   count and judged by nothing.
 *
 *   ...and the last two flags standing were rendered too, and are also not
 *   there. "Water 0.89 u over the carriageway" on OASIS AMBUSH and 0.21 u on
 *   PINE VALLEY are both the start gantry with dry tarmac under it: sub-metre
 *   disagreement between the water strip and the road mesh at a crossing the
 *   stream passes beneath. "Runs uphill 1.2-2.1 u" is at the same crossings —
 *   the bed is shaped DOWN to pass under a deck and comes back up after it,
 *   which is a culvert, not a river climbing a hill.
 *
 *   So the thresholds are set where the eye is: a bank must be more than a
 *   metre under the water before it counts as spilling, water must stand more
 *   than 0.3 u proud of a road, and the uphill law skips the 25 u either side
 *   of a carriageway where the bed is deliberately dipped. Raw counts are
 *   printed either way — the thresholds decide what gets CALLED a defect, not
 *   what gets measured.
 *
 *   ...and a vertex is not water if it is INVISIBLE. The strip writes a
 *   4-component `color` attribute whose w is per-vertex alpha, and the ribbon
 *   is faded out — not deleted — where it runs under a road deck. Three
 *   renders aimed straight at "water 4.7 / 5.2 u over the carriageway" on
 *   REDWOOD RAMPAGE and PIKES PEAK came back as dry tarmac with a start gantry
 *   over it, because those vertices carry alpha 0. Every law now reads the
 *   alpha first, and vertices under a tenth of opacity are not there.
 *
 * THE LAWS, as they now stand:
 *
 *   1. WATER DOES NOT RUN UPHILL, measured along the flow.
 *   2. WATER DOES NOT SIT ABOVE ITS HIGHER BANK.
 *   3. A RIVER IS A CHANNEL, NOT PAINT: the higher bank must stand over it.
 *   4. THE WATER SITS ON ITS BED, not in the air over it.
 *   5. NO WATER ON THE CARRIAGEWAY EXCEPT AT A FORD.
 *   6. A RIVER HAS NO ENDS: both tails leave the visible world.
 *   7. A RIBBON MAY NOT FOLD.
 *
 * Explorer, not a gate: prints numbers and exits 0.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const ONLY = process.env.LEVELS ? process.env.LEVELS.split(',').map(Number) : null;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 300 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));

await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });

const R = await page.evaluate(async (only) => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  for (const lv of LEVELS) {
    if (only && !only.includes(lv.id)) continue;
    g.state = 'title'; g.editScene = null;
    g.swapLevel(lv, true, null);
    for (let f = 0; f < 8; f++) await new Promise((res) => requestAnimationFrame(res));
    const t = g.track;
    g.scene.updateMatrixWorld(true);
    const row = { id: lv.id, name: lv.name,
      river: !!t._river, creeks: (t.creeks ?? []).length, fords: (t.fords ?? []).length };
    if (!t._river) { out.push(row); continue; }

    // ---- the WATER MESH, by name, and its world-space vertices
    let water = null;
    t.group.traverse((o) => { if (o.name === 'river-water' && o.geometry) water = o; });
    if (!water) { row.note = 'no river-water mesh'; out.push(row); continue; }
    water.updateMatrixWorld(true);
    const pos = water.geometry.attributes.position;
    const col = water.geometry.attributes.color;
    const m = water.matrixWorld.elements;
    const V = [];
    let clear = 0;
    for (let i = 0; i < pos.count; i++) {
      // ALPHA FIRST. The ribbon is faded out, not deleted, where it passes
      // under a road; those vertices are geometry that draws nothing.
      const a = (col && col.itemSize === 4) ? col.getW(i) : 1;
      if (a < 0.1) { clear++; continue; }
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      V.push([m[0] * x + m[4] * y + m[8] * z + m[12],
        m[1] * x + m[5] * y + m[9] * z + m[13],
        m[2] * x + m[6] * y + m[10] * z + m[14]]);
    }
    row.verts = V.length; row.clear = clear;

    const Rv = t._river, line = Rv.line, half = Rv.half, bank = Rv.bank;
    // ---- THE SURFACE, BINNED ALONG THE FLOW. Every water vertex is assigned
    // the along-the-line index the game's own `_riverNearest` gives it, and a
    // station's surface is the mean of the vertices that landed on it. A
    // straight nearest-vertex search does not work here: at a meander the
    // spatially nearest vertex belongs to the next reach.
    //
    // ...AND A PINCHED ROW IS NOT A STATION. Where the ribbon meets a road its
    // width is driven to zero rather than the row being dropped, so every
    // column collapses onto the centreline and draws nothing. Those rows were
    // producing the "runs uphill" and "hangs over its bed" flags on four
    // worlds — rendered, every one of them is the start gantry with dry tarmac
    // under it. Width is measured first and narrow rows never enter any law.
    const bins = new Map(), spread = new Map();
    for (const v of V) {
      const nk = t._riverNearest(v[0], v[2]);
      if (!nk || !Number.isFinite(nk.k)) continue;
      const lp = line[nk.k];
      spread.set(nk.k, Math.max(spread.get(nk.k) ?? 0,
        Math.hypot(v[0] - lp.x, v[2] - lp.z)));
      let a = bins.get(nk.k);
      if (!a) bins.set(nk.k, a = []);
      a.push(v[1]);
    }
    row.pinched = [...spread.values()].filter((w) => w < 1).length;
    // ...and ONLY THE REACH A PLAYER CAN GET TO. Both tails run out to r 2600
    // by design so the river never appears to start; past the 1620 rim the
    // ground is not carved and the line rides over whatever is there.
    const SEEN = Number(window.__riverSeen ?? 500);   // u from the nearest road
    const st = [];
    let outside = 0;
    for (const [k, ys] of [...bins.entries()].sort((a, b) => a[0] - b[0])) {
      const p = line[k];
      if ((spread.get(k) ?? 0) < 1) continue;          // pinched to nothing
      if (t._distToTrack(p.x, p.z) > SEEN) { outside++; continue; }
      st.push({ k, x: p.x, z: p.z,
        y: ys.reduce((a, b) => a + b, 0) / ys.length, n: ys.length });
    }
    row.reach = st.length; row.outside = outside;

    // 1. uphill along the flow
    let rise = 0, riseAt = null;
    const fwd = (Rv.flow ?? 1) > 0;
    for (let i = 1; i < st.length; i++) {
      const a = fwd ? st[i - 1] : st[i], b = fwd ? st[i] : st[i - 1];
      // a bed dipped to pass under a deck is a culvert, not a climb
      if (t._distToTrack(b.x, b.z) < 25 || t._distToTrack(a.x, a.z) < 25) continue;
      const up = b.y - a.y;
      if (up > rise) { rise = up; riseAt = b.k; }
    }
    row.rise = +rise.toFixed(2); row.riseAt = riseAt;

    // 2/3. THE HIGHER BANK. A river on a hillside legitimately has a low bank
    // downhill; what it may not have is water standing over BOTH sides.
    let above = 0, worstAbove = 0, worstAboveAt = null;
    let minBank = Infinity, minBankAt = null;
    // 4. ...and the bed directly under the water: a surface floating well over
    // its own channel floor is the "river hanging in the air" report.
    let air = 0, worstAir = 0, worstAirAt = null;
    for (const s of st) {
      const k = s.k;
      const a = line[Math.max(0, k - 1)], b = line[Math.min(line.length - 1, k + 1)];
      let tx = b.x - a.x, tz = b.z - a.z;
      const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
      const nx = tz, nz = -tx;
      const off = half * 1.36 + bank + 1.5;
      let lift = -Infinity;
      for (const sgn of [1, -1]) {
        const gx = s.x + nx * off * sgn, gz = s.z + nz * off * sgn;
        lift = Math.max(lift, t.terrainHeight(gx, gz) - s.y);
      }
      if (lift < 0) { above++; if (-lift > worstAbove) { worstAbove = -lift; worstAboveAt = k; } }
      if (lift < minBank) { minBank = lift; minBankAt = k; }
      const gap = s.y - t.terrainHeight(s.x, s.z);
      if (gap > 3.5) { air++; if (gap > worstAir) { worstAir = gap; worstAirAt = k; } }
    }
    row.st = st.length;
    row.above = above; row.worstAbove = +worstAbove.toFixed(2); row.worstAboveAt = worstAboveAt;
    row.minBank = +minBank.toFixed(2); row.minBankAt = minBankAt;
    row.air = air; row.worstAir = +worstAir.toFixed(2); row.worstAirAt = worstAirAt;

    // 4. water on the carriageway away from a ford
    // IN WORLD UNITS. A ford carries a 34 u straight lead-in either side by
    // construction, so "near a ford" has to be a distance, not an index count
    // taken at whatever spacing this loop happens to sample at.
    const fordPts = (Rv.fords ?? []).map((f) => t.center[f.i]);
    let onRoad = 0, onRoadWorst = null;
    const V3 = new (t.center[0].constructor)();
    for (const v of V) {
      const nk = t._riverNearest(v[0], v[2]);
      if (!nk || !Number.isFinite(nk.k) || (spread.get(nk.k) ?? 0) < 1) continue;
      const d = t._distToTrack(v[0], v[2]);
      const ci = t.nearestIndex(V3.set(v[0], 0, v[2]));
      const hw = (t.widthAt ? t.widthAt(ci) : 9);
      if (d > hw) continue;
      if (fordPts.some((f) => Math.hypot(f.x - v[0], f.z - v[2]) < 45)) continue;
      // UNDER THE DECK IS NOT ON THE ROAD. A stream crossing beneath the
      // carriageway is invisible and intended; what matters is water standing
      // at or above the surface you drive on.
      const lat = t.lateralOffset(V3.set(v[0], 0, v[2]), ci);
      const roadY = t.groundHeightAt ? t.groundHeightAt(ci, lat) : t.center[ci].y;
      const over = v[1] - roadY;
      if (over < 0.3) continue;
      onRoad++;
      if (!onRoadWorst || over > onRoadWorst.over) {
        onRoadWorst = { at: [Math.round(v[0]), Math.round(v[2])], d: +d.toFixed(1),
          over: +over.toFixed(2) };
      }
    }
    row.onRoad = onRoad; row.onRoadWorst = onRoadWorst;

    // 5. both tails leave the world
    row.rA = Math.round(Math.hypot(line[0].x, line[0].z));
    row.rB = Math.round(Math.hypot(line[line.length - 1].x, line[line.length - 1].z));

    // 7. tightest turn, sampled at the SAME 24 u arc the relaxation used.
    // Measuring circumradius on the 11 u polyline measures a different curve
    // and reported every world as folding.
    const ARC = 24;
    const stride = Math.max(1, Math.round(ARC / 11));
    const coarseLine = line.filter((_, i) => i % stride === 0);
    let minRad = Infinity, minRadAt = null;
    for (let i = 1; i < coarseLine.length - 1; i++) {
      const A = coarseLine[i - 1], C = coarseLine[i], D = coarseLine[i + 1];
      const ab = Math.hypot(C.x - A.x, C.z - A.z);
      const bc = Math.hypot(D.x - C.x, D.z - C.z);
      const ac = Math.hypot(D.x - A.x, D.z - A.z);
      const area = Math.abs((C.x - A.x) * (D.z - A.z) - (D.x - A.x) * (C.z - A.z)) / 2;
      const rad = area < 1e-6 ? Infinity : (ab * bc * ac) / (4 * area);
      if (rad < minRad) { minRad = rad; minRadAt = i * stride; }
    }
    row.minRad = +minRad.toFixed(1); row.minRadAt = minRadAt;
    row.need = +((half * 1.36 + bank) * 1.15).toFixed(1);
    out.push(row);
  }
  return out;
}, ONLY);

const withRiver = R.filter((r) => r.river);
console.log(`\n${R.length} worlds, ${withRiver.length} carry a river, `
  + `${R.filter((r) => r.creeks).length} carry dry creeks, `
  + `${R.filter((r) => r.fords).length} carry fords\n`);

const flag = [];
for (const r of R) {
  if (!r.river) {
    if (r.creeks || r.fords) {
      console.log(`   L${String(r.id).padStart(2, '0')} ${r.name.padEnd(22)} no river  (${r.creeks} creeks, ${r.fords} fords)`);
    }
    continue;
  }
  if (r.note) { console.log(`   L${String(r.id).padStart(2, '0')} ${r.name.padEnd(22)} ${r.note}`); flag.push(r); continue; }
  const bad = [];
  if (r.rise > 0.5) bad.push(`RUNS UPHILL ${r.rise} u at ${r.riseAt}`);
  if (r.worstAbove > 1.0 && r.above > r.st * 0.05) bad.push(`ABOVE ITS HIGHER BANK at ${r.above}/${r.st} stations, worst ${r.worstAbove} u at ${r.worstAboveAt}`);
  else if (r.minBank < 0.4) bad.push(`NO CHANNEL: the higher bank is only ${r.minBank} u over the water at ${r.minBankAt}`);
  if (r.air > 0) bad.push(`HANGS OVER ITS BED at ${r.air}/${r.st} stations, worst ${r.worstAir} u of air at ${r.worstAirAt}`);
  if (r.onRoad > 0) bad.push(`WATER ON THE CARRIAGEWAY: ${r.onRoad} vertices away from any ford (${JSON.stringify(r.onRoadWorst)})`);
  if (r.rA < 2000 || r.rB < 2000) bad.push(`A TAIL STOPS INSIDE THE WORLD (r ${r.rA} / ${r.rB})`);
  if (r.minRad < r.need) bad.push(`FOLDS: turn radius ${r.minRad} u against ${r.need} needed, at ${r.minRadAt}`);
  console.log(`   L${String(r.id).padStart(2, '0')} ${r.name.padEnd(22)} ${String(r.fords).padStart(2)} fords  `
    + `${String(r.st).padStart(3)} stations in sight of the road (+${r.outside} beyond, ${r.pinched} pinched, ${r.clear} faded out)  `
    + `bank ${String(r.minBank).padStart(6)} u  `
    + `rise ${String(r.rise).padStart(5)}  turn ${String(r.minRad).padStart(7)}/${r.need}  tails ${r.rA}/${r.rB}`
    + (bad.length ? `\n        -> ${bad.join('\n        -> ')}` : ''));
  if (bad.length) flag.push({ ...r, bad });
}

console.log(`\n===== ${flag.length} of ${withRiver.length} rivers have something to answer for =====`);
for (const f of flag) console.log(`   L${String(f.id).padStart(2, '0')} ${f.name}: ${(f.bad ?? [f.note]).join(' | ')}`);
if (errors.length) console.log('\nPAGE ERRORS', [...new Set(errors)].slice(0, 5));
await browser.close();
