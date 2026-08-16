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
 *   INTRUDERS  GEOMETRY standing in the carriageway, collider or not. The
 *              three above all read `track.solids`, and things that are in
 *              the way without being in that list have hidden from it three
 *              times now — the barriers (r191), the bridge piers (r193, a
 *              grey column in the racing line you drive straight through),
 *              and the culvert parapets. This walks `track.group` and
 *              measures the transformed geometry, so a mesh with no collider
 *              entry is counted like any other. Ones with no collider within
 *              1.5 u are flagged BARE — that is the pier class exactly.
 *
 *              Five filters keep it honest rather than loud, and each one is
 *              a class that is on the road ON PURPOSE or is not an object at
 *              all. Geometry must stand in the DRIVE BAND — 0.35 u proud of
 *              the road and starting under 2.8 u, measured PER FOOTPRINT
 *              POINT against the road height at that point. Smashable
 *              `track.props` are excluded, the way traffic already is.
 *              Zero-thickness sheets lying down are decals. Foliage over a
 *              registered `track.trees` trunk is canopy, measured as TREES
 *              instead. And anything over 40 u across in XZ is the ground the
 *              road is drawn on. Every one of them is counted, and the bulk
 *              and the skipped are LISTED at the end — a cap that hides what
 *              it dropped reads as coverage it never gave.
 *
 *              `HITS=1` prints every hit, `BULK=1` the 12–40 u meshes that
 *              reach the band (hillsides the road climbs, mostly).
 *
 * A FALSE ALARM RECORDED SO IT IS NOT RE-HUNTED: the handover reported ~15
 * fence posts of 0.18 x 1.05 biting 9.5 u into a 9 u half-width on rural
 * worlds. They do not exist. The probe that found them filtered with
 * `Math.abs(q.width - 0.18) > 0.005`, and for a sphere or a torus `q.width`
 * is undefined, so the test is `NaN > 0.005` === false and EVERY such
 * geometry fell through the filter and was counted as a post — including the
 * 9000 u world skirt and the pickups, which is where 9.5 u came from.
 * Measured with the keys required to exist: FROST PEAK has 10 posts and
 * REDWOOD RAMPAGE 7, every one of them at 10.3 u lateral against a 9 u
 * half-width, i.e. 1.21 u OUTSIDE the drivable edge. `_buildJunctionFences`
 * was clean, as stashing it already suggested.
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

const totals = { blockers: 0, holes: 0, floaters: 0, intruders: 0, bare: 0, trees: 0, worlds: 0, dirty: 0 };
const byKind = new Map();
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

    return { solids: (t.solids ?? []).length, blockers, stray, floaters,
      narrowest: +narrowest.toFixed(1) };
  });

  // ---- INTRUDERS: what is STANDING there, collider or not -----------------
  // Everything above reads `track.solids`. Three separate defect classes have
  // now hidden from that: the barriers (r191), the bridge piers (r193) and a
  // false alarm about fence posts (see the note at the top). A pier has no
  // collider at all — you drive through the column — so a census of colliders
  // scores the world clean while a grey pillar stands in the racing line.
  // This walks the built scene instead and measures GEOMETRY.
  const scene = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    const THREEV = window.__game.player.mesh.position.constructor;
    const M4 = window.__game.player.mesh.matrixWorld.constructor;

    // Nearest centreline sample via a hash grid. CELL must be >= the widest
    // half-width plus a margin so the 3x3 neighbourhood cannot miss a sample
    // that is genuinely close; anything with no sample in those nine cells is
    // more than a cell away from any road and is rejected without a search.
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
        const cell = grid.get(`${cx + a},${cz + b}`); if (!cell) continue;
        for (const i of cell) { const c = t.center[i];
          const d = (x - c.x) * (x - c.x) + (z - c.z) * (z - c.z);
          if (d < best) { best = d; at = i; } }
      }
      return at < 0 ? null : { d: Math.sqrt(best), i: at };
    };

    // THE DRIVE BAND, MEASURED WHERE THE THING ACTUALLY STANDS. A deck eleven
    // metres up is a bridge, not an obstacle, and a slab whose top sits level
    // with the tarmac is the ground. To be in the way a thing must STAND OUT
    // of the road (PROUD) and start below the roof of a car (ABOVE).
    //
    // The band is tested PER FOOTPRINT POINT against the road height at that
    // point, not once for the whole mesh against its nearest sample. Puddle
    // decals are the reason: `CircleGeometry` scaled to 4 u and pitched to
    // `-atan(slopeAt(i))` hugs the grade, so it is flat relative to the road
    // and 0.8 u tall in world axes. Judged as one object it looks like it
    // rears half a metre above the tarmac, and every sloped road decal in the
    // game reported as an obstacle biting 8 u into its own lane. Judged point
    // by point it is 0.04 u proud everywhere, which is what it is.
    const PROUD = 0.35, ABOVE = 2.8;
    // Anything this wide in XZ is scenery the road is drawn ON — the ribbon
    // itself, terrain, water, the world skirt, the sky dome. Skipped, and
    // COUNTED, because a silent cap reads as "nothing there".
    const BIG = 40;

    const sig = (m, g) => {
      const p = g.parameters ?? {};
      // A BufferGeometry carries no parameters — lathes, extrusions and every
      // hand-built prop land there — so fall back to its own box, which is
      // what actually identifies it in the source.
      const dims = ['width', 'height', 'depth', 'radius', 'radiusTop', 'length']
        .filter((k) => p[k] != null).map((k) => +Number(p[k]).toFixed(2)).join('x')
        || (g.boundingBox ? [g.boundingBox.max.x - g.boundingBox.min.x,
          g.boundingBox.max.y - g.boundingBox.min.y,
          g.boundingBox.max.z - g.boundingBox.min.z].map((e) => +e.toFixed(1)).join('x') : '');
      const col = m.material?.color?.getHexString?.() ?? '??';
      return `${g.type.replace('Geometry', '')}${dims ? ' ' + dims : ''} #${col}`
        + (m.isInstancedMesh ? ' [inst]' : '');
    };

    // SMASHABLE PROPS BELONG ON THE ROAD, the same way traffic does.
    // `_buildProps` puts crates, cones, barrels and snowmen deliberately on
    // the drivable surface just outside the obstacle corridor — "run wide,
    // clip an apex, and you will still smash them, which is the whole point
    // of them being there". They carry no collider (you drive through one and
    // accelerate), so every one of them reads as a bare intruder. Counting
    // them buries the real ones under forty per world.
    const props = new Set();
    for (const p of (t.props ?? [])) if (p.mesh) p.mesh.traverse((c) => props.add(c));

    // A TREE IS ITS TRUNK, NOT ITS CANOPY. A conifer is one ground-to-tip cone
    // whose skirt is far wider than anything the car can hit, and `track.trees`
    // carries the radius the game itself collides against. Measured on the
    // pristine build: PINE VALLEY 743 trees and REDWOOD RAMPAGE 792, and NOT
    // ONE has its trunk — or even its collision radius — inside a carriageway,
    // while the canopy boxes reported 29 intruders on PINE VALLEY alone. So
    // foliage sitting over a registered tree is skipped here and the trunks are
    // measured against the registry instead, which is the quantity that means
    // something. A tree PLANTED in the road still shows, in `treesOnRoad`.
    const treeAt = new Map();                       // 8 u buckets, XZ
    const tkey = (x, z) => `${Math.floor(x / 8)},${Math.floor(z / 8)}`;
    for (const q of (t.trees ?? [])) {
      const k = tkey(q.x, q.z); let a = treeAt.get(k); if (!a) treeAt.set(k, a = []); a.push(q);
    }
    const onTree = (x, z) => {
      const cx = Math.floor(x / 8), cz = Math.floor(z / 8);
      for (let a = -1; a <= 1; a++) for (let b2 = -1; b2 <= 1; b2++) {
        for (const q of (treeAt.get(`${cx + a},${cz + b2}`) ?? [])) {
          const rr = (q.r ?? 1) + 1.5;
          if ((x - q.x) ** 2 + (z - q.z) ** 2 < rr * rr) return true;
        }
      }
      return false;
    };
    let treesOnRoad = 0, treeWorst = 0;
    for (const q of (t.trees ?? [])) {
      let bd = Infinity, at = 0;
      for (let i = 0; i < N; i++) { const c = t.center[i];
        const d = (q.x - c.x) ** 2 + (q.z - c.z) ** 2; if (d < bd) { bd = d; at = i; } }
      const bite = t.widthAt(at) - (Math.sqrt(bd) - (q.r ?? 0.5));
      if (bite > 0.15) { treesOnRoad++; treeWorst = Math.max(treeWorst, bite); }
    }

    const hits = [], bulk = [], skipped = new Map();
    const v = new THREEV(), mm = new M4();
    let propHits = 0, decals = 0, foliage = 0;

    t.group.traverse((m) => {
      if (!m.isMesh || !m.geometry || m.visible === false) return;
      if (props.has(m)) { propHits++; return; }
      const g = m.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox; if (!bb) return;
      const ex = bb.max.x - bb.min.x, ey = bb.max.y - bb.min.y, ez = bb.max.z - bb.min.z;
      if (!Number.isFinite(ex) || !Number.isFinite(ez)) return;

      const count = m.isInstancedMesh ? m.count : 1;
      // sample the footprint rather than trust one origin: a long low wall's
      // centre can sit clear while its end reaches into the lane
      const step = (e) => Math.min(m.isInstancedMesh ? 4 : 6, Math.max(2, Math.ceil(e / 2)));
      const sx = step(ex), sz = step(ez);

      for (let k = 0; k < count; k++) {
        if (m.isInstancedMesh) { m.getMatrixAt(k, mm); mm.premultiply(m.matrixWorld); }
        else mm.copy(m.matrixWorld);

        // world extent of this instance, from the transformed corners
        let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
        let ymin = Infinity, ymax = -Infinity;
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) {
          v.set(a ? bb.max.x : bb.min.x, b ? bb.max.y : bb.min.y, c ? bb.max.z : bb.min.z)
            .applyMatrix4(mm);
          xmin = Math.min(xmin, v.x); xmax = Math.max(xmax, v.x);
          zmin = Math.min(zmin, v.z); zmax = Math.max(zmax, v.z);
          ymin = Math.min(ymin, v.y); ymax = Math.max(ymax, v.y);
        }
        if (xmax - xmin > BIG || zmax - zmin > BIG) {
          const s = sig(m, g); skipped.set(s, (skipped.get(s) ?? 0) + 1); continue;
        }
        // A DECAL HAS NO VOLUME TO DRIVE INTO. Puddles, bulldust holes, skid
        // marks and the batched prop shadows are zero-thickness sheets laid on
        // the tarmac. A puddle is pitched to the LONGITUDINAL grade only, so on
        // a banked corner its outer edge lifts 0.4–0.6 u clear of the surface
        // and the per-point band test — rightly — calls that proud. It is
        // still a texture. Skip sheets that are LYING DOWN; a sheet standing up
        // is a billboard or a panel and stays counted.
        const sheet = ex < 1e-6 || ey < 1e-6 || ez < 1e-6;
        if (sheet && (ymax - ymin) < 0.35 * Math.max(xmax - xmin, zmax - zmin)) { decals++; continue; }
        // Deepest reach into a carriageway, over the whole footprint, counting
        // only the points that are BOTH inside a drivable width and standing
        // proud of the road at that point.
        let bite = -Infinity, at = -1, lat = 0, proud = 0;
        for (let a = 0; a <= sx; a++) for (let c = 0; c <= sz; c++) {
          const lx = bb.min.x + (ex * a) / sx, lz = bb.min.z + (ez * c) / sz;
          v.set(lx, bb.min.y, lz).applyMatrix4(mm);
          const px = v.x, pz = v.z, y0 = v.y;
          const n = near(px, pz); if (!n) continue;
          const b = t.widthAt(n.i) - n.d;
          // NOT `|| b <= bite`: the deepest point of a footprint can be the one
          // that fails the band test — the buried end of a pier under its own
          // deck — while a shallower one stands proud of the road next door.
          // Short-circuiting on depth alone loses exactly that case.
          if (b <= 0.15) continue;
          v.set(lx, bb.max.y, lz).applyMatrix4(mm);          // the same column, up top
          const lo = Math.min(y0, v.y), hi = Math.max(y0, v.y);
          const roadY = t.center[n.i].y;
          if (hi < roadY + PROUD || lo > roadY + ABOVE) continue;   // sunk, or overhead
          if (b > bite) { bite = b; at = n.i; lat = n.d; proud = hi - roadY; }
        }
        if (at < 0) continue;

        // Does anything in `solids` already stand here? If not, this is the
        // pier class: visible, in the way, and invisible to every collider
        // census we have.
        let cd = Infinity;
        const mx = (xmin + xmax) / 2, mz = (zmin + zmax) / 2;
        for (const s of (t.solids ?? [])) {
          if (s.mat === 'traffic') continue;
          const dd = Math.hypot(s.x - mx, s.z - mz) - (s.r ?? 1);
          if (dd < cd) cd = dd;
        }
        // A LANDFORM IS NOT AN OBSTACLE. Hillsides, snowbanks and cuttings are
        // tens of metres across and the road is drawn OVER them, so where it
        // climbs one its surface grazes the mesh and every such hill reports a
        // deep bite. Everything that has ever actually stood in a carriageway
        // — piers, parapets, quay guns, gantry legs, posts — is small. Split
        // on span rather than drop the big ones, so the bulk stays readable.
        const span = Math.max(xmax - xmin, zmax - zmin);
        const mx0 = (xmin + xmax) / 2, mz0 = (zmin + zmax) / 2;
        if (onTree(mx0, mz0)) { foliage++; continue; }
        (span > 12 ? bulk : hits).push({ sig: sig(m, g), i: at, bite: +bite.toFixed(2),
          lat: +lat.toFixed(2), span: +span.toFixed(1),
          half: +t.widthAt(at).toFixed(2), h: +proud.toFixed(1),
          bare: cd > 1.5, pos: [+mx.toFixed(0), +mz.toFixed(0)].join(',') });
      }
    });

    const group = (list) => { const kinds = new Map();
      for (const h of list) { const e = kinds.get(h.sig) ?? { n: 0, bare: 0, worst: 0 };
        e.n++; if (h.bare) e.bare++; e.worst = Math.max(e.worst, h.bite); kinds.set(h.sig, e); }
      return [...kinds].map(([k, e]) => ({ k, ...e })).sort((a, b) => b.worst - a.worst); };
    hits.sort((a, b) => b.bite - a.bite);
    bulk.sort((a, b) => b.bite - a.bite);
    return { hits: hits.slice(0, 8), n: hits.length, bare: hits.filter((h) => h.bare).length,
      kinds: group(hits), props: propHits, decals, foliage,
      trees: (t.trees ?? []).length, treesOnRoad, treeWorst: +treeWorst.toFixed(2),
      bulkN: bulk.length, bulkKinds: group(bulk).slice(0, 6),
      skipped: [...skipped].map(([k, n]) => `${k} x${n}`) };
  });
  r.scene = scene;

  totals.worlds++;
  totals.blockers += r.blockers.length;
  totals.holes += r.stray.length;
  totals.floaters += r.floaters.length;
  totals.intruders += r.scene.n;
  totals.bare += r.scene.bare;
  totals.trees += r.scene.treesOnRoad;
  const dirty = r.blockers.length || r.stray.length || r.floaters.length
    || r.scene.bare || r.scene.treesOnRoad;
  if (dirty) totals.dirty++;
  for (const b of r.blockers) byKind.set(b.mat, (byKind.get(b.mat) ?? 0) + 1);

  const bits = [];
  if (r.blockers.length) {
    const kinds = {};
    for (const b of r.blockers) kinds[b.mat] = (kinds[b.mat] ?? 0) + 1;
    bits.push(`${r.blockers.length} BLOCKERS (${Object.entries(kinds)
      .map(([k, n]) => `${k}x${n}`).join(' ')}) worst bite ${r.blockers[0].bite} u`);
  }
  if (r.stray.length) bits.push(`${r.stray.length} BARE HOLES at ${r.stray.join(', ')}`);
  if (r.floaters.length) bits.push(`${r.floaters.length} FLOATERS, highest ${r.floaters[0].air} u`);
  if (r.scene.n) bits.push(`${r.scene.n} INTRUDERS (${r.scene.bare} with NO COLLIDER) `
    + `worst bite ${r.scene.hits[0].bite} u`);
  if (r.scene.treesOnRoad) bits.push(`${r.scene.treesOnRoad} TREES in the lane, `
    + `worst ${r.scene.treeWorst} u`);
  console.log(`${dirty ? '••' : '  '} ${String(lv.id).padStart(2)} ${lv.name.padEnd(22)}`
    + `${String(r.solids).padStart(5)} solids  narrowest ${String(r.narrowest).padStart(5)} u  `
    + (bits.length ? bits.join(' | ') : 'clean'));
  if (r.scene.n) for (const k of r.scene.kinds) {
    console.log(`        ${String(k.n).padStart(4)}x ${k.k.padEnd(40)} worst ${k.worst.toFixed(2)} u`
      + (k.bare ? `   ${k.bare} BARE` : '   (has colliders)'));
  }
  if (process.env.HITS) for (const h of r.scene.hits) {
    console.log(`        @${String(h.i).padStart(4)} ${h.sig.padEnd(34)} bite ${String(h.bite).padStart(5)} u `
      + `lat ${h.lat}/${h.half}  top ${h.h} u over road  span ${h.span} u  at ${h.pos}${h.bare ? '  BARE' : ''}`);
  }
  if (process.env.BULK && r.scene.bulkN) {
    console.log(`     ~~ ${r.scene.bulkN} bulk meshes over 12 u across also reach the band:`);
    for (const k of r.scene.bulkKinds) {
      console.log(`        ${String(k.n).padStart(4)}x ${k.k.padEnd(40)} worst ${k.worst.toFixed(2)} u`);
    }
  }
  rows.push({ id: lv.id, name: lv.name, ...r });
}

console.log(`\n===== ${totals.dirty} of ${totals.worlds} worlds have something on the road =====`);
console.log(`   blockers ${totals.blockers}   bare holes ${totals.holes}   floaters ${totals.floaters}`
  + `   intruders ${totals.intruders} (${totals.bare} with no collider)`
  + `   trees in a lane ${totals.trees}`);
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

const scenic = rows.filter((r) => r.scene.n)
  .sort((a, b) => b.scene.hits[0].bite - a.scene.hits[0].bite).slice(0, 10);
if (scenic.length) {
  console.log('\n--- deepest geometry in a carriageway (collider or not) ---');
  for (const w of scenic) {
    const h = w.scene.hits[0];
    console.log(`   ${w.name.padEnd(22)} ${h.sig.padEnd(34)} bites ${h.bite} u into ${h.half} u `
      + `at sample ${h.i} (${h.pos}), top ${h.h} u over the road${h.bare ? '  NO COLLIDER' : ''}`);
  }
}
const skipped = new Map();
for (const w of rows) for (const s of w.scene.skipped) {
  const [k, n] = [s.slice(0, s.lastIndexOf(' x')), +s.slice(s.lastIndexOf(' x') + 2)];
  skipped.set(k, (skipped.get(k) ?? 0) + n);
}
if (skipped.size) {
  // NOT silent: a cap that hides what it dropped reads as coverage it did not
  // give. Everything here was too wide in XZ to be anything but the ground
  // the road is drawn on — check the list, do not assume it.
  console.log(`\n--- too large to be an obstacle (> 40 u across), skipped ---`);
  for (const [k, n] of [...skipped].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`   ${k.padEnd(46)} x${n}`);
  }
}

await browser.close();
