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
  // ASK THE GAME, DO NOT RE-DERIVE IT. These three used to be reimplemented
  // here, and a check that reimplements a rule is how it comes to disagree
  // with the code it checks — this file once counted cacti the car smashes by
  // design. `roadAudit()` lives in track.js beside the functions that answer
  // it, and the release gate and the in-game ?audit=1 overlay call the same one.
  const audit = t.roadAudit();
  const bySource = {};
  for (const h of audit.inLane) {
    const k = source(h);
    bySource[k] ??= { inLane: 0, near: 0 };
    bySource[k].inLane++; bySource[k].near++;
  }
  const barIn = audit.counts.barIn;
  const deckShort = audit.counts.noFloor;
  const worstEdge = audit.noFloor[0] ?? null;

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
    inLane: audit.counts.inLane, nearRule: audit.counts.nearRule, bySource, barIn,
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
