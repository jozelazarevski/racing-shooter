// WORLD MATRIX — every world against everything measurable at build time:
// what stands in the drivable lane and which builder put it there, walls laid
// inside the road, self-crossings with no vertical separation, road width,
// grade, draw cost, and the tyre gate.
//
// Split from agent-sweep.mjs because none of it needs the car to move: the
// whole roster is covered in ~15 minutes instead of ~55. The driving column
// (lap pace, stalls) comes from the sweep and is merged in by the renderer.
//
//   python3 -m http.server 8901      # repo root, another shell
//   node tests/world-matrix.mjs      # writes tests/world-matrix.json
//   node tests/world-matrix-render.mjs   # writes BUGS-MATRIX.md
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const src = fs.readFileSync('src/world/levels.js', 'utf8');
const LEVELS = [...src.matchAll(/\{\s*id:\s*(\d+),\s*name:\s*('([^']+)'|"([^"]+)")/g)]
  .map((m) => ({ id: +m[1], name: m[3] ?? m[4] }));
console.log(`roster: ${LEVELS.length}`);

const PROBE = () => {
  const g = window.__game, t = g.track, N = t.N;
  // map a collider back to the builder that placed it, by material+radius
  const source = (h) => {
    if (h.what === 'tree') return 'tree';
    const r = h.r, m = h.mat;
    if (m === 'stone' && Math.abs(r - 1.4) < 0.06) return 'parapet';
    if (m === 'wood' && Math.abs(r - 0.35) < 0.06) return 'fordMarker';
    if (m === 'stone' && Math.abs(r - 1.2) < 0.06) return 'overpassRail';
    if (m === 'metal' && Math.abs(r - 0.6) < 0.06) return 'gantryLeg';
    if (m === 'metal' && Math.abs(r - 2.5) < 0.06) return 'grandstand';
    if (m === 'stone' && Math.abs(r - 1.5) < 0.06) return 'quayCannon';
    if (m === 'metal' && Math.abs(r - 0.45) < 0.06) return 'narrowPost';
    if (m === 'stone' && Math.abs(r - 2.7) < 0.06) return 'boulder';
    return 'other';
  };
  // A TREE IS ONLY IN THE WAY IF IT IS SOLID. vehicles.js smashes saplings,
  // cacti and snags at speed and stops the car dead on a grown trunk, so a
  // yielding cactus standing in the lane costs paint, not a lap — counting it
  // beside a boulder overstated CANYON RUN by three.
  const treeIsSolid = (t2) => (t2.solid === true)
    || ((t2.s ?? 1) >= 1.0 && t2.kind !== 'cactus' && t2.kind !== 'snag' && t2.solid !== false);
  const scan = (arr, label, carR) => {
    const out = [];
    for (const s of arr ?? []) {
      if (s._faller) continue;                       // landed hazards belong there
      if (label === 'tree' && !treeIsSolid(s)) continue;
      const { x, z } = s;
      if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
      const i = t.nearestIndex({ x, y: s.y ?? 0, z });
      const lat = Math.abs(t.lateralOffset({ x, y: 0, z }, i));
      const hw = t.widthAt?.(i) ?? 9;
      const roadY = t.pointAt(i, 0).y;
      if (Number.isFinite(s.y) && Math.abs(s.y - roadY) > 5) continue;
      const r = s.r ?? 1;
      if (lat >= hw + r + carR) continue;            // clears the promised width
      out.push({ what: label, i, lat: +lat.toFixed(1), r: +r.toFixed(2), hw: +hw.toFixed(1),
        mat: s.mat ?? s.kind ?? null, inLane: lat + r < hw - 0.5 });
    }
    return out;
  };
  const hits = [...scan(t.solids, 'solid', 1.8), ...scan(t.trees, 'tree', 1.7), ...scan(t.buildings, 'building', 1.8)];
  const bySource = {};
  for (const h of hits) {
    const k = source(h);
    bySource[k] ??= { inLane: 0, near: 0 };
    bySource[k].near++; if (h.inLane) bySource[k].inLane++;
  }

  // barriers laid inside the road rather than beyond its edge
  let barIn = 0;
  for (const w of t.barriers ?? []) {
    const mx = (w.x1 + w.x2) / 2, mz = (w.z1 + w.z2) / 2;
    if (!Number.isFinite(mx)) continue;
    const i = t.nearestIndex({ x: mx, y: w.y ?? 0, z: mz });
    const hw = t.widthAt?.(i) ?? 9;
    const roadY = t.pointAt(i, 0).y;
    if (Number.isFinite(w.y) && Math.abs(w.y - roadY) > 5) continue;
    const l1 = t.lateralOffset({ x: w.x1, y: 0, z: w.z1 }, i);
    const l2 = t.lateralOffset({ x: w.x2, y: 0, z: w.z2 }, i);
    if ((Math.abs(l1) < hw - 1 && Math.abs(l2) < hw - 1)
      || (l1 * l2 < 0 && Math.min(Math.abs(l1), Math.abs(l2)) < hw - 1)) barIn++;
  }

  // IS THERE FLOOR UNDER THE WIDTH THE ROAD ADVERTISES? Walk out from the
  // centreline until the physics ground drops more than 2 u below the road
  // surface: that is the real edge of the deck, and it must not be inside the
  // width the road promises. RED CENTRE RUN had 19 samples where the edge was
  // ZERO — a gorge cut applied away from its own jump, so the road had a 21 u
  // hole in it and the car fell through the world.
  // A declared jump gorge is SUPPOSED to have no floor — that is the jump.
  // Anywhere else, a hole in the road is a hole in the road.
  const inGorge = (i) => (t._jumpGorges ?? []).some((G) => {
    const d = Math.abs(i - G.i), c = Math.min(d, N - d);
    return c <= (G.gapS ?? 0) + 8;
  });
  let deckShort = 0, worstEdge = null;
  for (let i = 0; i < N; i++) {
    if (inGorge(i)) continue;
    const road = t.pointAt(i, 0).y;
    const hw = t.widthAt?.(i) ?? 9;
    let edge = hw;
    for (let lat = 0.5; lat <= hw; lat += 0.5) {
      if (t.groundHeightAt(i, lat) < road - 2 || t.groundHeightAt(i, -lat) < road - 2) { edge = lat - 0.5; break; }
    }
    if (edge < hw - 0.4) {
      deckShort++;
      if (!worstEdge || edge < worstEdge.edge) worstEdge = { i, edge: +edge.toFixed(1), hw: +hw.toFixed(1) };
    }
  }

  // geometry
  let minW = Infinity, maxRise = 0, steep = 0;
  for (let i = 0; i < N; i++) {
    const w = t.widthAt?.(i) ?? 9;
    if (w < minW) minW = w;
    maxRise = Math.max(maxRise, Math.abs(t.center[(i + 1) % N].y - t.center[i].y));
    let s = 0;
    for (let k = 0; k < 8; k++) s += t.slopeAt?.((i + k) % N) ?? 0;
    steep = Math.max(steep, Math.abs(s / 8));
  }
  let cross = 0, flat = 0;
  for (let i = 0; i < N; i += 3) {
    for (let j = i + 40; j < N; j += 3) {
      if (Math.min(j - i, N - (j - i)) < 40) continue;
      const a = t.center[i], b = t.center[j];
      if (Math.hypot(b.x - a.x, b.z - a.z) < 12) { cross++; if (Math.abs(a.y - b.y) < 4) flat++; }
    }
  }
  const f = g.carFitness?.(g.level.id);
  return {
    id: g.level.id, world: g.level.name, theme: g.level.theme, region: g.level.region,
    surface: t.T?.surface ?? 'dry', laps: g.level.laps ?? 3, starCost: g.starCost?.(g.level.id) ?? null,
    inLane: hits.filter((h) => h.inLane).length, nearRule: hits.length, bySource, barIn,
    deckShort, worstEdge,
    minHalfWidth: +minW.toFixed(1), maxGrade: +steep.toFixed(3), maxRise: +maxRise.toFixed(2),
    crossings: cross, flatCrossings: flat,
    pickups: g.pickups?.length ?? 0,
    pickupBad: (g.pickups ?? []).filter((pk) => Math.abs(pk.pos.y - t.pointAt(pk.index, pk.lateral).y) > 3).length,
    counts: { solids: t.solids?.length ?? 0, trees: t.trees?.length ?? 0, props: t.props?.length ?? 0,
      barriers: t.barriers?.length ?? 0, buildings: t.buildings?.length ?? 0, ramps: t.ramps?.length ?? 0,
      pads: t.boostPads?.length ?? 0, tunnels: t._tunnels?.length ?? 0, overpasses: t._overpasses?.length ?? 0,
      fords: t.fords?.length ?? 0 },
    hazards: { fall: !!t.T.fallHazard, geysers: !!t.T.geysers, strips: !!t.T.strips,
      critters: !!t.T.critters, chase: !!t.T.chase },
    tyreGate: f && !f.ok ? { need: f.need, have: f.have, cost: f.fix?.cost ?? null } : null,
  };
};

const queue = [...LEVELS], out = [];
await Promise.all(Array.from({ length: 2 }, async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  while (queue.length) {
    const lv = queue.shift();
    const page = await b.newPage({ viewport: { width: 640, height: 420 } });
    const errs = []; page.on('pageerror', (e) => errs.push(e.message.split('\n')[0]));
    try {
      await page.goto(`http://localhost:8901/?level=${lv.id}&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForFunction(() => window.__game && window.__game.track, null, { timeout: 120000 });
      const r = await page.evaluate(PROBE);
      r.renderFps = await page.evaluate(async () => {
        let n = 0, on = true; const tick = () => { if (on) { n++; requestAnimationFrame(tick); } };
        requestAnimationFrame(tick); const t0 = performance.now();
        await new Promise((res) => setTimeout(res, 4000)); on = false;
        return +(n / ((performance.now() - t0) / 1000)).toFixed(2);
      });
      r.pageErrors = errs.length;
      out.push(r);
      console.log(`L${r.id} ${r.world}: ${r.inLane} in lane, ${r.nearRule} near rule`
        + `${r.deckShort ? `, NO FLOOR under ${r.deckShort} samples (worst edge ${r.worstEdge.edge} of ${r.worstEdge.hw})` : ''}`
        + `, fps ${r.renderFps}`);
    } catch (e) {
      out.push({ id: lv.id, world: lv.name, error: e.message.split('\n')[0] });
      console.log(`L${lv.id} ${lv.name}: FAILED ${e.message.split('\n')[0]}`);
    }
    await page.close();
  }
  await b.close();
}));
out.sort((a, b) => a.id - b.id);
fs.writeFileSync('tests/world-matrix.json', JSON.stringify(out, null, 1));
console.log(`\ndone: ${out.length} worlds`);
