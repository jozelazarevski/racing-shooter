/* FOUR LAWS ABOUT WHAT IS ALLOWED NEAR A CARRIAGEWAY.
 *
 * `tool-road-census` and `tools-scratch/stacked.mjs` are EXPLORERS: they print
 * numbers and exit 0, and they are how each of the defects below was found.
 * This is the other half — the pass/fail line, so none of them can come back
 * quietly. Every threshold here is a measured number, not a guess, and the
 * comment on each law says which defect it was taken from.
 *
 *   1. NOTHING BARE STANDS DEEP IN A LANE. Geometry with no collider is still
 *      something you steer around and drive through. This is the class that
 *      hid from every collider census: barriers (r191), bridge piers (r193),
 *      stone-bridge arch faces, overpass deck rails, sponsor hoardings.
 *   2. NO TREE TRUNK IS IN A CARRIAGEWAY. Roster-wide and cheap, because it
 *      reads `track.trees` — the radius the game itself collides against.
 *      SUZUKA had 14, and they are `solid: true` pines: hitting one stops a
 *      car dead.
 *   3. THE START GANTRY HANGS AT ITS DESIGNED HEIGHT ON EVERY WORLD. 11 of 61
 *      worlds do not start at y = 0, and the whole structure used to be built
 *      at absolute heights — SUZUKA's lights housing sat 2.57 u UNDER its own
 *      grid. This law is the one the census could NOT have caught: a buried
 *      object is not standing proud of the road.
 *   4. ROAD DOES NOT GET STACKED ON ROAD. Two carriageways within 18 u of each
 *      other and level in Y interpenetrate. Three such stretches are KNOWN and
 *      still open (see HANDOVER item 1); this pins the list so a fourth, or a
 *      worse one, fails instead of going unnoticed for another few sessions.
 *
 *   node tests/test-roadclear.mjs          # the curated world list below
 *   ALL=1 node tests/test-roadclear.mjs    # every world (slower)
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// Each of these earns its place by a defect measured ON it. PINE VALLEY is the
// control: it starts at y = 0, has no knot and was clean throughout, so a
// failure there means the harness broke rather than the world.
const CURATED = [
  [1, 'PINE VALLEY'],        // control
  [4, 'CANYON RUN'],         // cacti trunks in the lane; cliff-wall hoardings
  [7, 'GLACIAL PASS'],       // hoardings; the bore the reach fix rescued
  [28, 'ESTONIA CRESTS'],    // 6.5 u fallen logs across the line
  [32, 'RED CENTRE RUN'],    // start line at y = -3.99
  [34, 'MONACO STREETS'],    // hoarding posts from a second leg
  [37, 'SUZUKA'],            // 14 corridor pines; start line at y = 7.87
  [54, 'COTE D AZUR'],       // sea foam, the overlay rule
  [55, 'BRIDGE RUN'],        // hoarding over a second leg
  [57, 'MOUNTAIN TO SEA'],   // two stacked-road stretches
  [59, 'CLIFF KNOT'],        // start line at y = 3.57
  [60, 'SEA CLIFF RUN'],     // arch face, deck rails, stacked road
];

// LAW 1's threshold. The census reports from 0.15 u; this gates at 3.0 u
// because the tool is the finer instrument and a test that fails on a 0.4 u
// kerb becomes a test people delete. Everything this session fixed was 4.2 u
// or deeper, and the deepest thing left on the roster is a 6.28 u rock — which
// is why the known-remaining list below is explicit rather than a raised bar.
const DEEP = 3.0;

// LAW 1 and LAW 4 both have KNOWN, OPEN entries. They are listed here by name
// with their measured value, so the suite is green on today's truth and goes
// red the moment any of it gets worse or spreads. Shrinking this list is the
// work; growing it silently is the thing to catch.
const KNOWN_BARE = {
  'RED CENTRE RUN': { max: 6.0, why: 'gantry cabin/braces: tower spot is scored by a FLAT _clearsRoad, which cannot see a leg passing at the cabin\'s own height 10 u up' },
  'CINQUE TERRE': { max: 7.0, why: 'a Dodecahedron rock, builder unidentified (colours are computed, so grep will not find it)' },
};
// Counted as RUNS, and each stretch is found from both sides, so the two
// clashes on MOUNTAIN TO SEA are four runs and the one on SEA CLIFF RUN is two.
const KNOWN_STACKED = {
  'SEA CLIFF RUN': 2,        // 538-566 <-> 658-685, 1.91 u apart, 1.08-2.36 u dy
  'MOUNTAIN TO SEA': 4,      // 135-154 <-> 356-371, and 418-434 <-> 631-647
};

const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });

let worlds = CURATED;
if (process.env.ALL) {
  const roster = await page.evaluate(async () => {
    const { LEVELS } = await import('./src/track.js');
    return LEVELS.map((l) => [l.id, l.name]);
  });
  worlds = roster;
}
console.log(`${worlds.length} worlds\n`);

for (const [id, name] of worlds) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const built = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!built) { check(`${name}: the world builds`, false, 'timed out'); continue; }

  const r = await page.evaluate(({ DEEP }) => {
    const t = window.__game.track, N = t.center.length;
    const V = window.__game.player.mesh.position.constructor;
    const M4 = window.__game.player.mesh.matrixWorld.constructor;

    // ---- shared: nearest centreline sample, via a 16 u hash grid ----------
    const CELL = 16, grid = new Map();
    for (let i = 0; i < N; i++) {
      const c = t.center[i];
      const k = `${Math.floor(c.x / CELL)},${Math.floor(c.z / CELL)}`;
      let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i);
    }
    const near = (x, z) => {
      const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
      let best = Infinity, at = -1;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        for (const i of (grid.get(`${cx + a},${cz + b}`) ?? [])) {
          const c = t.center[i];
          const d = (x - c.x) ** 2 + (z - c.z) ** 2;
          if (d < best) { best = d; at = i; }
        }
      }
      return at < 0 ? null : { d: Math.sqrt(best), i: at };
    };

    // ---- LAW 1: nothing BARE stands deep in a lane ------------------------
    // The census's filters, in the order they were earned. See its header for
    // why each exists; changing one here without changing it there makes the
    // explorer and the gate disagree, which is worse than either being wrong.
    const props = new Set();
    for (const p of (t.props ?? [])) if (p.mesh) p.mesh.traverse((c) => props.add(c));
    const treeAt = new Map();
    for (const q of (t.trees ?? [])) {
      const k = `${Math.floor(q.x / 8)},${Math.floor(q.z / 8)}`;
      let a = treeAt.get(k); if (!a) treeAt.set(k, a = []); a.push(q);
    }
    const onTree = (x, z) => {
      const cx = Math.floor(x / 8), cz = Math.floor(z / 8);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        for (const q of (treeAt.get(`${cx + a},${cz + b}`) ?? [])) {
          const rr = (q.r ?? 1) + 1.5;
          if ((x - q.x) ** 2 + (z - q.z) ** 2 < rr * rr) return true;
        }
      }
      return false;
    };
    const v = new V(), mm = new M4();
    let worstBare = 0, worstSig = '', worstAt = -1;
    t.group.traverse((m) => {
      if (!m.isMesh || !m.geometry || m.visible === false || props.has(m)) return;
      if (m.material && m.material.depthWrite === false) return;      // an overlay
      const g = m.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox; if (!bb) return;
      const ex = bb.max.x - bb.min.x, ey = bb.max.y - bb.min.y, ez = bb.max.z - bb.min.z;
      if (!Number.isFinite(ex) || !Number.isFinite(ez)) return;
      const count = m.isInstancedMesh ? m.count : 1;
      const step = (e) => Math.min(m.isInstancedMesh ? 4 : 6, Math.max(2, Math.ceil(e / 2)));
      const sx = step(ex), sz = step(ez);
      for (let k = 0; k < count; k++) {
        if (m.isInstancedMesh) { m.getMatrixAt(k, mm); mm.premultiply(m.matrixWorld); }
        else mm.copy(m.matrixWorld);
        let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
        let ymin = Infinity, ymax = -Infinity;
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) {
          v.set(a ? bb.max.x : bb.min.x, b ? bb.max.y : bb.min.y, c ? bb.max.z : bb.min.z)
            .applyMatrix4(mm);
          xmin = Math.min(xmin, v.x); xmax = Math.max(xmax, v.x);
          zmin = Math.min(zmin, v.z); zmax = Math.max(zmax, v.z);
          ymin = Math.min(ymin, v.y); ymax = Math.max(ymax, v.y);
        }
        if (xmax - xmin > 40 || zmax - zmin > 40) continue;            // a landform
        const span = Math.max(xmax - xmin, zmax - zmin);
        const mx = (xmin + xmax) / 2, mz = (zmin + zmax) / 2;
        if (span > 12 || onTree(mx, mz)) continue;                     // bulk / canopy
        const sheetAxis = ex < 1e-6 ? 0 : ey < 1e-6 ? 1 : ez < 1e-6 ? 2 : -1;
        if (sheetAxis >= 0) {
          const e = mm.elements, o = sheetAxis * 4;
          const L = Math.hypot(e[o], e[o + 1], e[o + 2]) || 1;
          if (Math.abs(e[o + 1] / L) > 0.87) continue;                 // lying decal
        }
        let bite = -Infinity, at = -1;
        for (let a = 0; a <= sx; a++) for (let c = 0; c <= sz; c++) {
          const lx = bb.min.x + (ex * a) / sx, lz = bb.min.z + (ez * c) / sz;
          v.set(lx, bb.min.y, lz).applyMatrix4(mm);
          const px = v.x, pz = v.z, y0 = v.y;
          const n = near(px, pz); if (!n) continue;
          const b = t.widthAt(n.i) - n.d;
          if (b <= DEEP) continue;
          v.set(lx, bb.max.y, lz).applyMatrix4(mm);
          const lo = Math.min(y0, v.y), hi = Math.max(y0, v.y);
          const roadY = t.center[n.i].y;
          if (hi < roadY + 0.35 || lo > roadY + 2.8) continue;
          if (b > bite) { bite = b; at = n.i; }
        }
        // NOT `return`: this is the per-INSTANCE loop, and returning here would
        // abandon every remaining instance of an InstancedMesh after the first
        // one that missed — silently under-reporting exactly the batched
        // scenery this law exists to catch.
        if (at < 0) continue;
        // BARE = no collider anywhere near it. A thing with a collider is the
        // BLOCKERS measure's business and test-carriageway already guards it.
        let cd = Infinity;
        for (const s of (t.solids ?? [])) {
          if (s.mat === 'traffic') continue;
          const dd = Math.hypot(s.x - mx, s.z - mz) - (s.r ?? 1);
          if (dd < cd) cd = dd;
        }
        if (cd <= 1.5) continue;
        if (bite > worstBare) {
          worstBare = bite; worstAt = at;
          const p = g.parameters ?? {};
          const dims = ['width', 'height', 'depth', 'radius', 'radiusTop']
            .filter((q) => p[q] != null).map((q) => +Number(p[q]).toFixed(2)).join('x');
          worstSig = `${g.type.replace('Geometry', '')}${dims ? ' ' + dims : ''}`
            + ` #${m.material?.color?.getHexString?.() ?? '??'}`;
        }
      }
    });

    // ---- LAW 2: no tree TRUNK in a carriageway ---------------------------
    let treesIn = 0, treeWorst = 0, treeKind = '';
    for (const q of (t.trees ?? [])) {
      const n = near(q.x, q.z); if (!n) continue;
      const bite = t.widthAt(n.i) - (n.d - (q.r ?? 0.5));
      if (bite > 0.15) { treesIn++; if (bite > treeWorst) { treeWorst = bite; treeKind = q.kind ?? '?'; } }
    }

    // ---- LAW 3: the start gantry hangs at its designed height -------------
    // The lights housing is a 7.4 x 2.6 x 1.2 box; its underside must clear the
    // START LINE's own road height by the same amount on every world.
    const road0 = t.center[0].y;
    let housing = null;
    t.group.traverse((m) => {
      const p = m.geometry?.parameters; if (!p) return;
      const eq = (a, x) => a != null && Math.abs(a - x) < 1e-6;
      if (eq(p.width, 7.4) && eq(p.height, 2.6) && eq(p.depth, 1.2)) {
        m.getWorldPosition(v);
        housing = +(v.y - 1.3 - road0).toFixed(2);
      }
    });

    // ---- LAW 4: road is not stacked on road ------------------------------
    const runs = [];
    {
      const hit = new Array(N).fill(null);
      for (let i = 0; i < N; i++) {
        let bd = Infinity, bj = -1;
        for (let j = 0; j < N; j++) {
          const lap = Math.min((i - j + N) % N, (j - i + N) % N);
          if (lap < 40) continue;
          const dx = t.center[i].x - t.center[j].x, dz = t.center[i].z - t.center[j].z;
          const d2 = dx * dx + dz * dz;
          if (d2 < bd) { bd = d2; bj = j; }
        }
        const d = Math.sqrt(bd), dy = Math.abs(t.center[i].y - t.center[bj].y);
        if (d < 18 && dy < 6) hit[i] = { j: bj, d, dy };
      }
      let cur = null;
      for (let i = 0; i < N; i++) {
        if (!hit[i]) { cur = null; continue; }
        if (cur && Math.min((hit[i].j - cur.j + N) % N, (cur.j - hit[i].j + N) % N) > 25) cur = null;
        if (!cur) { cur = { i0: i, d: hit[i].d, dy: hit[i].dy, j: hit[i].j, n: 0 }; runs.push(cur); }
        cur.j = hit[i].j; cur.n++;
        cur.d = Math.min(cur.d, hit[i].d); cur.dy = Math.min(cur.dy, hit[i].dy);
      }
    }

    return {
      start: +road0.toFixed(2), housing,
      bare: +worstBare.toFixed(2), sig: worstSig, at: worstAt,
      treesIn, treeWorst: +treeWorst.toFixed(2), treeKind,
      // COUNT THE RUNS, DO NOT HALVE THEM. Every stretch is found twice, once
      // from each side, so halving looks right — and it is a fudge that broke
      // the first time it met a ONE-SAMPLE touch whose mirror fell below
      // threshold, reporting 3 for a world with two stretches. The raw count
      // of SUSTAINED runs needs no cleverness and cannot drift: a stretch is
      // 3+ consecutive samples, a single sample is a graze, and the expected
      // number per world below is measured rather than derived.
      stacked: runs.filter((q) => q.n >= 3).length,
      stackDetail: runs.filter((q) => q.n >= 3).slice(0, 4)
        .map((q) => `${q.i0}+${q.n} ${q.d.toFixed(2)}u/${q.dy.toFixed(2)}u`),
    };
  }, { DEEP });

  // ---- LAW 1 -------------------------------------------------------------
  const allow = KNOWN_BARE[name];
  if (allow) {
    check(`${name}: known-bare stays within its measured bound`, r.bare <= allow.max,
      `worst ${r.bare} u (bound ${allow.max}) — ${allow.why}`);
  } else {
    check(`${name}: nothing bare stands deeper than ${DEEP} u in a lane`, r.bare === 0,
      r.bare ? `${r.sig} bites ${r.bare} u at sample ${r.at}` : 'clean');
  }

  // ---- LAW 2 -------------------------------------------------------------
  check(`${name}: no tree trunk is in a carriageway`, r.treesIn === 0,
    r.treesIn ? `${r.treesIn} trunks, worst ${r.treeWorst} u (${r.treeKind})` : 'clean');

  // ---- LAW 3 -------------------------------------------------------------
  if (r.housing === null) {
    console.log(`NOTE  ${name}: no start gantry on this world`);
  } else {
    check(`${name}: the start lights hang 5.30 u over their own grid`,
      Math.abs(r.housing - 5.30) < 0.05,
      `start line y = ${r.start}, underside ${r.housing} u over it`);
  }

  // ---- LAW 4 -------------------------------------------------------------
  const want = KNOWN_STACKED[name] ?? 0;
  check(`${name}: road stacked on road stays at ${want}`, r.stacked === want,
    r.stacked ? `${r.stacked} stretch(es): ${r.stackDetail.join(', ')}` : 'none');
}

await page.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe road belongs to the car');
process.exit(fail ? 1 : 0);
