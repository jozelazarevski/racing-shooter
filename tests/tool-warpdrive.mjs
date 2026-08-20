/* THROWAWAY PROBE — can a knotted MOVE ROAD world be made drivable?
 *
 * Builds the reported shape (many large warps), measures lap coherence,
 * physically drives a lap, then tries to repair it with WIDEN + ROAD features
 * and measures again. Numbers only; no assertions about what "should" happen.
 *
 *   RECIPE=stack   (default) haul the same stretch again and again
 *   RECIPE=spread  12 pulls at handles spread round the lap
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const RECIPE = process.env.RECIPE ?? 'stack';
const NPULL = +(process.env.NPULL ?? 12);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 800, height: 520 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));

await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

// ---------------------------------------------------------------- helpers ---
await page.evaluate(() => {
  window.__probe = {};
  window.__probe.measure = () => {
    const t = window.__game.track;
    const N = t.center.length;
    const seg = t.segLen;
    const out = { N, segLen: +seg.toFixed(3) };
    const circ = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N - d); };

    // --- curvature -----------------------------------------------------------
    const turns = [];
    for (let i = 0; i < N; i++) {
      const p0 = t.center[(i - 1 + N) % N], p1 = t.center[i], p2 = t.center[(i + 1) % N];
      let d = Math.atan2(p2.x - p1.x, p2.z - p1.z) - Math.atan2(p1.x - p0.x, p1.z - p0.z);
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      turns.push({ i, deg: Math.abs(d) * 180 / Math.PI });
    }
    const sorted = [...turns].sort((a, b) => b.deg - a.deg);
    out.worstTurnDeg = +sorted[0].deg.toFixed(2);
    out.worstTurnAt = sorted[0].i;
    out.over13 = sorted.filter((q) => q.deg > 13).length;
    out.over20 = sorted.filter((q) => q.deg > 20).length;
    out.over45 = sorted.filter((q) => q.deg > 45).length;
    out.top8turns = sorted.slice(0, 8).map((q) => `${q.i}:${q.deg.toFixed(0)}`).join(' ');
    out.kinkStations = sorted.filter((q) => q.deg > 13).map((q) => q.i);

    // --- self-intersection ---------------------------------------------------
    const CS = 20, cells = new Map();
    for (let i = 0; i < N; i++) {
      const k = `${Math.floor(t.center[i].x / CS)},${Math.floor(t.center[i].z / CS)}`;
      let a = cells.get(k); if (!a) cells.set(k, a = []); a.push(i);
    }
    let pairs = 0, worst = null; const seen = new Set(); const touchers = new Set();
    for (let i = 0; i < N; i++) {
      const cx = Math.floor(t.center[i].x / CS), cz = Math.floor(t.center[i].z / CS);
      for (let ax = cx - 1; ax <= cx + 1; ax++) for (let az = cz - 1; az <= cz + 1; az++) {
        const a = cells.get(`${ax},${az}`); if (!a) continue;
        for (const j of a) {
          if (j <= i || circ(i, j) <= 60) continue;
          const d = Math.hypot(t.center[i].x - t.center[j].x, t.center[i].z - t.center[j].z);
          if (d >= 20) continue;
          const key = `${i},${j}`; if (seen.has(key)) continue; seen.add(key);
          pairs++; touchers.add(i); touchers.add(j);
          if (!worst || d < worst.d) worst = { i, j, d: +d.toFixed(2), stations: circ(i, j) };
        }
      }
    }
    out.crossPairs = pairs;
    out.worstCross = worst;
    out.crossStations = touchers.size;
    // SHARED TARMAC: two legs whose CARRIAGEWAYS overlap, at the same height.
    // (the field-stall mechanism: one road, traffic both ways)
    let shared = 0;
    for (const key of seen) {
      const [i, j] = key.split(',').map(Number);
      const gap = Math.hypot(t.center[i].x - t.center[j].x, t.center[i].z - t.center[j].z);
      if (gap < t.widthAt(i) + t.widthAt(j)
        && Math.abs(t.center[i].y - t.center[j].y) < 4) shared++;
    }
    out.sharedTarmacPairs = shared;
    out.overpasses = (t._overpasses || []).length;

    // --- elevation -----------------------------------------------------------
    let maxDy = 0, maxDyAt = 0;
    for (let i = 0; i < N; i++) {
      const dy = Math.abs(t.center[(i + 1) % N].y - t.center[i].y);
      if (dy > maxDy) { maxDy = dy; maxDyAt = i; }
    }
    out.maxElevJump = +maxDy.toFixed(2);
    out.maxElevJumpAt = maxDyAt;
    out.maxGradePct = +((maxDy / seg) * 100).toFixed(1);

    // --- width / spacing -----------------------------------------------------
    let minW = Infinity, minWAt = 0, sumW = 0, minSp = Infinity, maxSp = 0, len = 0;
    for (let i = 0; i < N; i++) {
      const w = t.widthAt(i); sumW += w;
      if (w < minW) { minW = w; minWAt = i; }
      const d = Math.hypot(t.center[(i + 1) % N].x - t.center[i].x,
        t.center[(i + 1) % N].z - t.center[i].z);
      minSp = Math.min(minSp, d); maxSp = Math.max(maxSp, d); len += d;
    }
    out.minWidth = +minW.toFixed(2);
    out.minWidthAt = minWAt;
    out.meanWidth = +(sumW / N).toFixed(2);
    out.minSpacing = +minSp.toFixed(2);
    out.maxSpacing = +maxSp.toFixed(2);
    out.lapLen = Math.round(len);

    // --- index ambiguity -----------------------------------------------------
    let confused = 0;
    for (let i = 0; i < N; i += 3) {
      const c = t.center[i];
      if (circ(i, t.nearestIndex({ x: c.x, y: c.y, z: c.z })) > 20) confused++;
    }
    out.ambiguousStations = confused;

    out.nanCentre = t.center.some((c) => !Number.isFinite(c.x) || !Number.isFinite(c.y)
      || !Number.isFinite(c.z));
    out.builtTunnels = (t._tunnels || []).length;
    out.builtGorge = !!t._gorge;
    return out;
  };

  /* MEASURE FIXED-STEP OR MEASURE NOTHING — the method test-field-stalls.mjs
   * documents: SwiftShader renders these worlds at a fraction of a frame per
   * second and the clock is capped per frame, so a wall-clock probe runs the
   * sim at ~1/8 speed and every "stall" it reports is an artifact. Stub the
   * clock to a true 1/60, stub the compositor, and step `_frameBody` by hand.
   * The player is driven through the REAL input object, so the whole player
   * physics path (smoothing, clamps, recovery) runs exactly as it ships. */
  window.__probe.drive = async (gameSeconds) => {
    const g = window.__game, p = g.player;
    const T0 = g.track;
    // a lookahead pursuit driver, evaluated lazily when the frame reads input
    const ctl = () => {
      const t = g.track;
      const look = (p.trackIndex + 12) % t.N;
      const target = t.pointAt(look, 0);
      let dh = Math.atan2(target.x - p.pos.x, target.z - p.pos.z) - p.heading;
      while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
      const v = Math.hypot(p.vel.x, p.vel.z);
      return { steer: Math.max(-1, Math.min(1, dh * 3)),
        throttle: v < 34 ? 1 : 0.55,
        brake: (Math.abs(dh) > 1.3 && v > 14) ? 1 : 0 };
    };
    for (const k of ['steer', 'throttle', 'brake']) {
      Object.defineProperty(g.input, k, { configurable: true, get: () => ctl()[k] });
    }
    const oldRender = g.composer?.render?.bind(g.composer);
    if (g.composer) g.composer.render = () => {};
    const oldClock = g.clock;
    let elapsed = oldClock.elapsedTime;
    g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
      get elapsedTime() { return elapsed; } };

    const tel = { gameSeconds, stuckFrames: 0, offRoadFrames: 0, sunkFrames: 0,
      nan: false, frames: 0, minSpeed: 1e9, stalls: [], sunkWorst: 0, maxProg: 0,
      backSteps: 0, metres: 0 };
    // PROGRESS THE HONEST WAY. `lap` decrements when the car noses back over
    // the line, so lap+frac is not monotonic and cannot measure a lap. Sum the
    // WRAPPED station delta instead: it is the same number the AI's `progress`
    // is built from, and it survives the counter going backwards.
    let station = 0;                                 // signed stations covered
    const aiStart = g.enemies.map((e) => e.progress ?? 0);
    let lastIdx = p.trackIndex, sameIdx = 0, prev = { x: p.pos.x, z: p.pos.z };
    let idxPrev = p.trackIndex;
    void T0;
    const FR = Math.round(gameSeconds * 60);
    for (let f = 0; f < FR; f++) {
      g._frameBody();
      tel.frames++;
      if (f % 300 === 0) await new Promise((res) => setTimeout(res, 0));
      if (!Number.isFinite(p.pos.x) || !Number.isFinite(p.pos.y) || !Number.isFinite(p.pos.z)
        || !Number.isFinite(p.vel.x)) { tel.nan = true; break; }
      {
        const NN = g.track.N;
        let d = p.trackIndex - idxPrev;
        if (d > NN / 2) d -= NN; else if (d < -NN / 2) d += NN;
        station += d;
        idxPrev = p.trackIndex;
      }
      if (f % 6) continue;                          // sample at 10 Hz
      const t = g.track;
      const prog = station / t.N;
      tel.maxProg = Math.max(tel.maxProg, prog);
      const moved = Math.hypot(p.pos.x - prev.x, p.pos.z - prev.z);
      tel.metres += moved;
      if (moved < 0.02) tel.backSteps++;
      prev = { x: p.pos.x, z: p.pos.z };
      if (moved < 0.5) tel.stuckFrames++;
      if (p.trackIndex === lastIdx) sameIdx++; else sameIdx = 0;
      lastIdx = p.trackIndex;
      const gy = t.terrainHeight(p.pos.x, p.pos.z);
      if (p.pos.y < gy - 3) {
        tel.sunkFrames++;
        tel.sunkWorst = Math.min(tel.sunkWorst, +(p.pos.y - gy).toFixed(1));
      }
      const w = t.widthAt(p.trackIndex);
      if (Math.abs(p.lateral) > w + 1) tel.offRoadFrames++;
      const v = Math.hypot(p.vel.x, p.vel.z);
      tel.minSpeed = Math.min(tel.minSpeed, v);
      if (sameIdx === 20 && tel.stalls.length < 12) {
        tel.stalls.push({ idx: p.trackIndex, prog: +prog.toFixed(3),
          x: Math.round(p.pos.x), z: Math.round(p.pos.z),
          lat: +p.lateral.toFixed(1), w: +w.toFixed(1), v: +v.toFixed(1) });
      }
      if (tel.maxProg >= 1.0) break;
    }
    g.clock = oldClock;
    if (g.composer && oldRender) g.composer.render = oldRender;

    const t = g.track;
    tel.finalProg = +(station / t.N).toFixed(3);
    tel.playerLaps = +tel.maxProg.toFixed(3);
    tel.playerMetres = Math.round(tel.metres);
    tel.lapLen = Math.round(t.N * t.segLen);
    tel.lapDone = tel.maxProg >= 1.0;
    const S = Math.max(1, Math.round(tel.frames / 6));
    tel.stuckPct = +(100 * tel.stuckFrames / S).toFixed(1);
    tel.offRoadPct = +(100 * tel.offRoadFrames / S).toFixed(1);
    tel.sunkPct = +(100 * tel.sunkFrames / S).toFixed(1);
    tel.minSpeed = +tel.minSpeed.toFixed(1);
    tel.gameTimeRan = +(tel.frames / 60).toFixed(1);
    // rivals drive themselves — the strongest "is this world drivable" signal
    tel.aiLaps = g.enemies.map((e, i) => +((e.progress ?? 0) - aiStart[i]).toFixed(2));
    tel.aiMean = +(tel.aiLaps.reduce((a, b) => a + b, 0)
      / Math.max(1, tel.aiLaps.length)).toFixed(3);
    tel.aiStalled = tel.aiLaps.filter((v) => v < 0.8).length;
    tel.aiWhere = g.enemies.map((e) => `${Math.round(e.pos.x)},${Math.round(e.pos.z)}`
      + `@${(e.trackIndex / t.N).toFixed(2)}`);
    tel.state1 = g.state;
    return tel;
  };
});

const log = (label, o) => console.log(label, JSON.stringify(o, null, 1));
const race = async () => {
  await page.evaluate(() => {
    const g = window.__game;
    if (g.state !== 'race') { g.resetRace?.(); g.startRace?.(); }
    g.countdown = 0.01;
  });
  await page.waitForFunction(() => window.__game.state === 'race', undefined, { timeout: 60000 });
};

// ---------------------------------------------------- PHASE 0: the shipped ---
await race();
const base = await page.evaluate(() => window.__probe.measure());
log('\n=== PHASE 0  PINE VALLEY as shipped ===\n', base);
const baseDrive = await page.evaluate(() => window.__probe.drive(180));
log('\n--- shipped: driven ---\n', baseDrive);

// ---------------------------------------------------- PHASE 1: the knot -----
const warped = await page.evaluate(async ({ recipe, n }) => {
  const g = window.__game;
  const { WorldEditor } = await import('./src/editor.js');
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();
  const out = { pulls: [], recipe };
  if (recipe === 'spread') {
    const t = g.track, N = t.center.length;
    const STEP = Math.max(1, Math.round(N / 24));
    for (let k = 0; k < n; k++) {
      const i = (Math.round(k * 24 / n) * STEP) % N;
      const c = t.center[i], nn = t.nrm[i];
      const mag = (60 + (k % 4) * 30) * (k % 2 ? -1 : 1);
      ed.warp.push({ x: c.x, z: c.z, r: Math.max(70, Math.abs(mag) * 3.2),
        dx: nn.x * mag, dz: nn.z * mag });
      out.pulls.push({ i, mag });
    }
    ed.dirty = true;
    await new Promise((res) => ed.apply(res));
  } else {
    // STACK: grab the same piece of road, haul it, APPLY, grab the moved road
    // again and haul it the same way — the "pull it further" gesture.
    let grab = 300;
    for (let k = 0; k < n; k++) {
      const t = g.track;
      const c = t.center[grab % t.center.length];
      const nn = t.nrm[grab % t.center.length];
      const mag = 120;
      const dx = nn.x * mag, dz = nn.z * mag;
      ed.warp.push({ x: c.x, z: c.z, r: Math.max(70, mag * 3.2), dx, dz });
      out.pulls.push({ grab, mag, x: Math.round(c.x), z: Math.round(c.z) });
      ed.dirty = true;
      await new Promise((res) => ed.apply(res));
      grab = g.track.nearestIndex({ x: c.x + dx, y: 0, z: c.z + dz });
    }
  }
  out.warpCount = ed.warp.length;
  out.payloadWarps = (g.editScene.warp || []).length;
  return out;
}, { recipe: RECIPE, n: NPULL });
log(`\n=== PHASE 1  ${NPULL} MOVE ROAD pulls (${RECIPE}) ===\n`, warped);

const knot = await page.evaluate(() => window.__probe.measure());
log('\n--- the knot, measured ---\n', knot);

// ---------------------------------------------------- PHASE 2: drive it -----
await page.evaluate(() => { window.__game.editor._quietExit(); });
await race();
const knotDrive = await page.evaluate(() => window.__probe.drive(180));
log('\n=== PHASE 2  driving the knot ===\n', knotDrive);

// ---------------------------------------------------- PHASE 3: repair -------
const repair = await page.evaluate(async (K) => {
  const g = window.__game, ed = g.editor;
  ed.enter();
  const t = g.track;
  const out = { widenTaps: 0, widenRefused: 0, roadNotes: [], refusals: [] };
  ed._pickTool('widen');
  ed.narrowMode = false;
  ed.radius = 60;
  ed._widenStep = 8;
  const spots = [...new Set([...K.kinks.slice(0, 80), ...K.crossers.slice(0, 40),
    K.minWidthAt, K.worstTurnAt])].filter((v) => v != null);
  out.spots = spots.length;
  for (const i of spots) {
    const c = t.center[i % t.center.length];
    for (let k = 0; k < 6; k++) {
      const before = ed.widen.length;
      ed._widenAt({ x: c.x, z: c.z });
      if (ed.widen.length === before) {
        out.widenRefused++;
        if (out.refusals.length < 4) out.refusals.push(ed.statusEl.textContent.slice(0, 80));
        break;
      }
      out.widenTaps++;
    }
  }
  out.widenRecords = ed.widen.length;

  ed._pickTool('road');
  ed.roadMode = 'tunnel';
  for (const i of spots.slice(0, 10)) {
    const c = t.center[i % t.center.length];
    ed._roadAt({ x: c.x, z: c.z });
    if (out.roadNotes.length < 6) out.roadNotes.push(ed.statusEl.textContent.slice(0, 95));
  }
  out.tunnelsRequested = ed.roadFeat.tunnels.length;
  ed.roadMode = 'bridge';
  const cb = t.center[(spots[0] ?? 100) % t.center.length];
  ed._roadAt({ x: cb.x, z: cb.z });
  out.roadNotes.push('BRIDGE: ' + ed.statusEl.textContent.slice(0, 95));
  out.bridgeFrac = ed.roadFeat.bridge;

  ed.dirty = true;
  await new Promise((res) => ed.apply(res));
  out.builtTunnels = (g.track._tunnels || []).length;
  out.builtGorge = !!g.track._gorge;
  return out;
}, { kinks: knot.kinkStations, crossers: knot.worstCross
  ? [knot.worstCross.i, knot.worstCross.j] : [],
minWidthAt: knot.minWidthAt, worstTurnAt: knot.worstTurnAt });
log('\n=== PHASE 3  repair with WIDEN + ROAD ===\n', repair);

const fixed = await page.evaluate(() => window.__probe.measure());
log('\n--- after repair, measured ---\n', fixed);

await page.evaluate(() => { window.__game.editor._quietExit(); });
await race();
const fixedDrive = await page.evaluate(() => window.__probe.drive(180));
log('\n=== PHASE 4  driving the repaired knot ===\n', fixedDrive);

// ---------------------------------------------------- summary ---------------
const row = (k, a, b, c) => console.log(
  String(k).padEnd(22), String(a).padStart(11), String(b).padStart(11), String(c).padStart(11));
console.log('\n================ SHIPPED / WARPED / REPAIRED ================');
row('', 'shipped', 'warped', 'repaired');
row('worst turn deg', base.worstTurnDeg, knot.worstTurnDeg, fixed.worstTurnDeg);
row('stations >13deg', base.over13, knot.over13, fixed.over13);
row('stations >20deg', base.over20, knot.over20, fixed.over20);
row('stations >45deg', base.over45, knot.over45, fixed.over45);
row('crossing pairs', base.crossPairs, knot.crossPairs, fixed.crossPairs);
row('shared tarmac', base.sharedTarmacPairs, knot.sharedTarmacPairs, fixed.sharedTarmacPairs);
row('overpasses built', base.overpasses, knot.overpasses, fixed.overpasses);
row('min width', base.minWidth, knot.minWidth, fixed.minWidth);
row('mean width', base.meanWidth, knot.meanWidth, fixed.meanWidth);
row('max elev jump', base.maxElevJump, knot.maxElevJump, fixed.maxElevJump);
row('max grade %', base.maxGradePct, knot.maxGradePct, fixed.maxGradePct);
row('min spacing', base.minSpacing, knot.minSpacing, fixed.minSpacing);
row('lap length', base.lapLen, knot.lapLen, fixed.lapLen);
row('ambiguous idx', base.ambiguousStations, knot.ambiguousStations, fixed.ambiguousStations);
row('tunnels built', base.builtTunnels, knot.builtTunnels, fixed.builtTunnels);
row('gorge built', base.builtGorge, knot.builtGorge, fixed.builtGorge);
row('LAP COMPLETED', baseDrive.lapDone, knotDrive.lapDone, fixedDrive.lapDone);
row('player laps/90s', baseDrive.playerLaps, knotDrive.playerLaps, fixedDrive.playerLaps);
row('player metres', baseDrive.playerMetres, knotDrive.playerMetres, fixedDrive.playerMetres);
row('AI metres', ...[baseDrive, knotDrive, fixedDrive].map((d) => Math.round(d.aiMean * d.lapLen)));
row('AI stalled (<0.8)', baseDrive.aiStalled, knotDrive.aiStalled, fixedDrive.aiStalled);
row('lap progress', baseDrive.finalProg, knotDrive.finalProg, fixedDrive.finalProg);
row('game-s simulated', baseDrive.gameTimeRan, knotDrive.gameTimeRan, fixedDrive.gameTimeRan);
row('stuck %', baseDrive.stuckPct, knotDrive.stuckPct, fixedDrive.stuckPct);
row('off-road %', baseDrive.offRoadPct, knotDrive.offRoadPct, fixedDrive.offRoadPct);
row('sunk %', baseDrive.sunkPct, knotDrive.sunkPct, fixedDrive.sunkPct);
row('worst sink', baseDrive.sunkWorst, knotDrive.sunkWorst, fixedDrive.sunkWorst);
row('stall events', baseDrive.stalls.length, knotDrive.stalls.length, fixedDrive.stalls.length);
row('min speed', baseDrive.minSpeed, knotDrive.minSpeed, fixedDrive.minSpeed);
row('NaN', baseDrive.nan, knotDrive.nan, fixedDrive.nan);
row('AI laps/90s (mean)', baseDrive.aiMean, knotDrive.aiMean, fixedDrive.aiMean);

console.log('\nAI laps, shipped :', JSON.stringify(baseDrive.aiLaps));
console.log('AI laps, warped  :', JSON.stringify(knotDrive.aiLaps), JSON.stringify(knotDrive.aiWhere));
console.log('AI laps, repaired:', JSON.stringify(fixedDrive.aiLaps), JSON.stringify(fixedDrive.aiWhere));
console.log('\nknot stalls:', JSON.stringify(knotDrive.stalls));
console.log('repaired stalls:', JSON.stringify(fixedDrive.stalls));
console.log('\npage errors:', errors.length);
for (const e of errors.slice(0, 8)) console.log('  ', e);
await browser.close();
