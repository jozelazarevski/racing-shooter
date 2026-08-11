// AGENT SWEEP — an autopilot agent drives EVERY world in the career with real
// control inputs (no teleporting, no rail) and reports design bugs.
//
// Why not extend playtest-all.mjs: that suite rails the player along the
// centerline by writing pos/heading every 40 ms, which hides exactly the class
// of bug a driver hits — a boulder in the road, a wall you can climb, a grade
// that stalls the car, a corner nothing can hold. This agent only ever touches
// the same analog steer/throttle/brake channel a touch player uses, so anything
// it cannot get past is something a human cannot get past either.
//
//   python3 -m http.server 8901        # repo root, another shell
//   node tests/agent-sweep.mjs [--levels 1,2,3] [--secs 30] [--workers 2]
//
// Writes tests/agent-sweep-report.json next to this file; the human-readable
// bug list lives in BUGS.md.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const BASE = process.env.SWEEP_BASE || 'http://localhost:8901';
const EXEC = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium';

const arg = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : dflt;
};
const DRIVE_SECS = +arg('--secs', 30);
const WORKERS = +arg('--workers', 2);

// Level list comes from the source of truth, so a world added tomorrow is
// swept tomorrow — playtest-all.mjs hardcodes `lvl <= 28` and has been quietly
// skipping everything past ESTONIA CRESTS.
const levelsSrc = fs.readFileSync(path.join(ROOT, 'src/world/levels.js'), 'utf8');
const ALL = [...levelsSrc.matchAll(/\{\s*id:\s*(\d+),\s*name:\s*'([^']+)'|\{\s*id:\s*(\d+),\s*name:\s*"([^"]+)"/g)]
  .map((m) => ({ id: +(m[1] ?? m[3]), name: m[2] ?? m[4] }));
const pick = arg('--levels', null);
const LEVELS = pick ? ALL.filter((l) => pick.split(',').map(Number).includes(l.id)) : ALL;

const bugs = [];
const note = (lv, sev, name, detail) => {
  bugs.push({ level: lv.id, world: lv.name, sev, name, detail });
  console.log(`  ${sev === 'high' ? 'BUG ' : 'warn'} L${lv.id} ${lv.name} — ${name}: ${detail}`);
};

/** The autopilot + probe, injected into the page. Returns a report object. */
const AGENT = async (secs) => {
  const g = window.__game, t = g.track, p = g.player;
  const N = t.N;
  const wrapPi = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const out = {
    world: g.level.name, N, laps: g.level.laps ?? g.totalLaps ?? null,
    samples: [], stuck: [], events: [], lapTimes: [],
  };

  // Rendering is the only thing that is slow here: SwiftShader draws ~2 fps,
  // which clamps dt and turns a 30 s probe into 3 s of race. The simulation on
  // its own runs at 60 fps, so the sweep drives with the composer stubbed out —
  // real physics, real time. The rendered path is exercised during load and the
  // countdown (and its frame rate is measured before this point).
  const realRender = g.composer.render.bind(g.composer);
  g.composer.render = () => {};

  // ---- the agent: the same pure-pursuit + physics-braking model the shipped
  // rivals use (racing line, curvature-scaled lookahead, v = sqrt(aLat/curv)),
  // but it only ever writes the analog steer/throttle/brake a touch player
  // writes. Nothing here moves the car directly.
  let rescue = 0, rescueDir = 1, stuckT = 0, lastT = performance.now();
  const drive = setInterval(() => {
    const a = g.input.analog;
    const now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (g.state !== 'race' || !p.alive) { a.steer = a.throttle = a.brake = 0; return; }
    const i = p.trackIndex, v = p.speedAlong, sp = Math.abs(v);

    // parked against something: brake, then reverse away from the nearer edge
    if (sp < 2.2) stuckT += dt; else if (sp > 5) stuckT = 0;
    if (rescue <= 0 && stuckT > 1.5) { rescue = 2.2; rescueDir = -Math.sign(p.lateral || 1); stuckT = 0; }
    if (rescue > 0) {
      rescue -= dt;
      a.steer = rescueDir * 0.9;
      a.throttle = 0; a.brake = 1;      // brake IS reverse once stopped
      return;
    }

    const curvHere = t.curvature?.[i] ?? 0;
    const look = Math.max(5, Math.floor((6 + sp * 0.35) / (1 + 45 * curvHere)));
    const li = (i + look) % N;
    const hw = Math.min(t.widthAt?.(i) ?? 8, t.widthAt?.(li) ?? 8);
    const latLim = Math.min(7.4, hw - 1.6);
    const targetLat = clamp(t._raceLine?.[li] ?? 0, -latLim, latLim);
    const target = t.pointAt(li, targetLat);
    const dh = wrapPi(Math.atan2(target.x - p.pos.x, target.z - p.pos.z) - p.heading);
    const speedN = Math.min(1, sp / p.maxSpeed);
    const cap = Math.abs(dh) > 0.9 ? 1 : 0.6 + 0.4 * (1 - speedN);
    a.steer = clamp(dh * 3.0, -cap, cap);

    // corner-speed lookahead: brake early enough for the tightest point within
    // 90 samples, exactly like the rivals' model
    const sqA = Math.sqrt(44);            // player-grade lateral budget
    const DECEL = 26, segLen = t.segLen ?? 1;
    let vAllowed = p.maxSpeed;
    for (let k = 0; k <= 90; k += 5) {
      const j = (i + k) % N;
      let vMax = t._speedInv ? sqA * t._speedInv[j] : p.maxSpeed;
      const wj = t.widthAt?.(j) ?? 8;
      if (wj < 7.8) vMax = Math.min(vMax, 16 + 3.6 * wj);
      if (vMax >= vAllowed) continue;
      const vNow = k === 0 ? vMax : Math.sqrt(vMax * vMax + 2 * DECEL * k * segLen);
      if (vNow < vAllowed) vAllowed = vNow;
    }
    const slope = t.slopeAt?.(i) ?? 0;
    if (slope < -0.02) vAllowed *= Math.max(0.85, 1 + slope * 1.2);
    const surf = t.T?.surface;
    if (surf === 'snow') vAllowed *= 0.86; else if (surf === 'wet') vAllowed *= 0.94;
    vAllowed = Math.max(14, vAllowed);
    if (v < vAllowed - 1.5) { a.throttle = 1; a.brake = 0; }
    else if (v > vAllowed + 1.5) { a.throttle = 0; a.brake = clamp((v - vAllowed) / 8, 0.35, 1); }
    else { a.throttle = 0.6; a.brake = 0; }
  }, 20);

  // ---- probe
  const startProg = {};
  for (const e of g.enemies) startProg[e.name] = e.progress;
  const pStart = p.progress ?? 0;
  let lastProg = pStart, stallT = 0, lastLap = p.lap, lastLapT = 0;
  let worstUnder = 0, offRoadTicks = 0, ticks = 0, airTicks = 0, maxAir = 0, airRun = 0;
  let minSpeedRun = 0, wallGrind = 0;
  const t0 = performance.now(), rt0 = g.raceTime;
  const dtS = 0.25;
  while ((performance.now() - t0) / 1000 < secs && g.state === 'race') {
    await new Promise((r) => setTimeout(r, dtS * 1000));
    ticks++;
    const i = p.trackIndex;
    const groundY = t.terrainHeight(p.pos.x, p.pos.z);
    const roadY = t.pointAt(i, 0).y;
    const halfW = t.widthAt?.(i) ?? 8;
    const lat = Math.abs(p.lateral);
    const sp = Math.abs(p.speedAlong);
    const under = p.pos.y - groundY;
    if (under < worstUnder) worstUnder = under;
    if (lat > halfW + 1) offRoadTicks++;
    if (p.airborne) { airTicks++; airRun += dtS; maxAir = Math.max(maxAir, airRun); } else airRun = 0;
    if (lat > halfW - 0.4 && sp > 4) wallGrind++;
    const nan = !Number.isFinite(p.pos.x) || !Number.isFinite(p.pos.y) || !Number.isFinite(p.pos.z)
      || !Number.isFinite(p.vel.x) || !Number.isFinite(g.raceTime);

    // progress stall — the agent is trying to drive and the world is not letting it
    const prog = p.progress ?? 0;
    const moved = Math.abs(prog - lastProg) > 0.0008;
    if (moved) { stallT = 0; lastProg = prog; } else stallT += dtS;
    if (sp < 2) minSpeedRun += dtS; else minSpeedRun = 0;
    if (stallT >= 3) {
      out.stuck.push({
        t: +g.raceTime.toFixed(1), index: i, lateral: +p.lateral.toFixed(1),
        speed: +sp.toFixed(1), x: +p.pos.x.toFixed(1), z: +p.pos.z.toFixed(1),
        y: +p.pos.y.toFixed(1), groundY: +groundY.toFixed(1), roadY: +roadY.toFixed(1),
        grade: +(t.slopeAt?.(i) ?? 0).toFixed(3), halfW: +halfW.toFixed(1),
        surface: p.surface ?? null, alive: p.alive, airborne: !!p.airborne,
      });
      stallT = 0;
    }
    if (p.lap !== lastLap) {
      out.lapTimes.push(+(g.raceTime - lastLapT).toFixed(1));
      lastLapT = g.raceTime; lastLap = p.lap;
    }
    out.samples.push({
      t: +g.raceTime.toFixed(1), i, lap: p.lap, prog: +prog.toFixed(4),
      y: +p.pos.y.toFixed(2), groundY: +groundY.toFixed(2), roadY: +roadY.toFixed(2),
      lat: +p.lateral.toFixed(1), halfW: +halfW.toFixed(1), sp: +sp.toFixed(1), nan,
      hp: p.health ?? null, alive: p.alive,
      ai: g.enemies.map((e) => ({
        n: e.name, prog: +e.progress.toFixed(4), lap: e.lap, alive: e.alive,
        y: +e.pos.y.toFixed(1), lat: +(e.lateral ?? 0).toFixed(1),
        nan: !Number.isFinite(e.pos.x) || !Number.isFinite(e.pos.y),
      })),
    });
  }
  clearInterval(drive);
  g.input.analog.steer = g.input.analog.throttle = g.input.analog.brake = 0;
  g.composer.render = realRender;

  out.finalState = g.state;
  out.raceTime = +g.raceTime.toFixed(1);
  // sim seconds per wall second — below ~0.9 the box is too loaded for the
  // pace numbers below to mean anything
  out.simRatio = +((g.raceTime - rt0) / ((performance.now() - t0) / 1000)).toFixed(2);
  out.playerProgress = +((p.progress ?? 0) - pStart).toFixed(4);
  out.playerLap = p.lap;
  out.worstUnder = +worstUnder.toFixed(2);
  out.offRoadFrac = +(offRoadTicks / Math.max(1, ticks)).toFixed(2);
  out.wallGrindFrac = +(wallGrind / Math.max(1, ticks)).toFixed(2);
  out.maxAir = +maxAir.toFixed(1);
  out.deadEndSecs = +minSpeedRun.toFixed(1);
  out.aiDelta = g.enemies.map((e) => ({ n: e.name, moved: +(e.progress - startProg[e.name]).toFixed(4), lap: e.lap, alive: e.alive }));

  // ---- static world audit, run once the world is fully built ------------
  const audit = {};
  // pickups must sit on the road plane
  audit.pickups = g.pickups.length;
  audit.pickupBad = g.pickups.filter((pk) => Math.abs(pk.pos.y - t.pointAt(pk.index, pk.lateral).y) > 3).length;
  // solid scenery standing in the drivable corridor
  // A TREE IS ONLY IN THE WAY IF IT IS SOLID — vehicles.js smashes saplings,
  // cacti and snags at speed and stops the car dead on a grown trunk. Counting
  // a yielding cactus beside a boulder overstated CANYON RUN by three.
  const treeIsSolid = (x) => (x.solid === true)
    || ((x.s ?? 1) >= 1.0 && x.kind !== 'cactus' && x.kind !== 'snag' && x.solid !== false);
  const inRoad = (arr, rKey = 'r', kind = null) => {
    const hits = [];
    for (const s of arr ?? []) {
      if (!Number.isFinite(s.x) || !Number.isFinite(s.z)) continue;
      if (kind === 'tree' && !treeIsSolid(s)) continue;
      // A LANDED HAZARD IS SUPPOSED TO BE IN THE ROAD. Rockfall and toppled
      // burning trees push temporary stone solids onto the carriageway for
      // 18 s, which is the whole point of them — counting those as misplaced
      // scenery reported ROCKFALL RAVINE as broken for working correctly.
      if (s._faller) continue;
      const i = t.nearestIndex({ x: s.x, y: s.y ?? 0, z: s.z });
      const lat = Math.abs(t.lateralOffset({ x: s.x, y: 0, z: s.z }, i));
      const hw = t.widthAt?.(i) ?? 8;
      const r = s[rKey] ?? 1;
      const roadY = t.pointAt(i, 0).y;
      // a bridge pier or a hut in the valley under a viaduct sits directly
      // below the road in plan and is not in the way at all — only things at
      // road height can be driven into
      if (Number.isFinite(s.y) && Math.abs(s.y - roadY) > 5) continue;
      if (lat + r < hw - 0.5) {
        hits.push({ i, lat: +lat.toFixed(1), r: +r.toFixed(1), hw: +hw.toFixed(1), mat: s.mat ?? s.type ?? null, dy: +(s.y - roadY).toFixed(1) });
      }
    }
    return hits;
  };
  const sRoad = inRoad(t.solids), tRoad = inRoad(t.trees, 'r', 'tree'), bRoad = inRoad(t.buildings);
  audit.solidsInRoad = sRoad.slice(0, 8);
  audit.solidsInRoadN = sRoad.length;
  audit.treesInRoad = tRoad.length;
  audit.treesInRoadEg = tRoad.slice(0, 4);
  audit.buildingsInRoad = bRoad.length;
  audit.buildingsInRoadEg = bRoad.slice(0, 4);
  audit.obstaclesInRoad = inRoad(t.obstacles).length;
  // barriers laid across the road rather than along its edge
  const barAcross = [];
  for (const w of t.barriers ?? []) {
    const mx = (w.x1 + w.x2) / 2, mz = (w.z1 + w.z2) / 2;
    if (!Number.isFinite(mx)) continue;
    const i = t.nearestIndex({ x: mx, y: w.y ?? 0, z: mz });
    const hw = t.widthAt?.(i) ?? 8;
    const l1 = t.lateralOffset({ x: w.x1, y: 0, z: w.z1 }, i);
    const l2 = t.lateralOffset({ x: w.x2, y: 0, z: w.z2 }, i);
    const roadY = t.pointAt(i, 0).y;
    if (Number.isFinite(w.y) && Math.abs(w.y - roadY) > 5) continue;
    // both ends inside the corridor, or the run spans the centerline
    if ((Math.abs(l1) < hw - 1 && Math.abs(l2) < hw - 1) || (l1 * l2 < 0 && Math.min(Math.abs(l1), Math.abs(l2)) < hw - 1)) {
      barAcross.push({ i, l1: +l1.toFixed(1), l2: +l2.toFixed(1), hw: +hw.toFixed(1), mat: w.mat ?? null });
    }
  }
  audit.barriersAcrossRoad = barAcross.length;
  audit.barriersAcrossRoadEg = barAcross.slice(0, 4);
  // ramps and boost pads the racing line cannot reach
  const offRoadFurniture = (arr, latKey = 'lateral') => (arr ?? []).filter((o) => {
    const lat = Math.abs(o[latKey] ?? 0);
    const hw = t.widthAt?.(o.index ?? 0) ?? 8;
    return lat > hw;
  }).length;
  audit.rampsOffRoad = offRoadFurniture(t.ramps);
  audit.padsOffRoad = offRoadFurniture(t.boostPads);
  // road continuity: consecutive centerline steps and vertical steps
  let maxStep = 0, maxRise = 0, maxRiseAt = -1, minW = Infinity, minWAt = -1;
  for (let i = 0; i < N; i++) {
    const a = t.center[i], b = t.center[(i + 1) % N];
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    maxStep = Math.max(maxStep, d);
    const rise = Math.abs(b.y - a.y);
    if (rise > maxRise) { maxRise = rise; maxRiseAt = i; }
    const w = t.widthAt?.(i) ?? 8;
    if (w < minW) { minW = w; minWAt = i; }
  }
  audit.maxStep = +maxStep.toFixed(2);
  audit.maxRisePerSample = +maxRise.toFixed(2);
  audit.maxRiseAt = maxRiseAt;
  audit.minHalfWidth = +minW.toFixed(2);
  audit.minHalfWidthAt = minWAt;
  // steepest sustained grade (rise per unit travelled), averaged over 8 samples
  let steep = 0, steepAt = -1;
  for (let i = 0; i < N; i++) {
    let s = 0;
    for (let k = 0; k < 8; k++) s += t.slopeAt?.((i + k) % N) ?? 0;
    s = Math.abs(s / 8);
    if (s > steep) { steep = s; steepAt = i; }
  }
  audit.maxGrade = +steep.toFixed(3);
  audit.maxGradeAt = steepAt;
  // self-intersection: two far-apart samples sharing a spot need a bridge/tunnel
  const cross = [];
  for (let i = 0; i < N; i += 3) {
    for (let j = i + 40; j < N; j += 3) {
      if (Math.min(j - i, N - (j - i)) < 40) continue;
      const a = t.center[i], b = t.center[j];
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      if (d < 12) cross.push({ i, j, d: +d.toFixed(1), dy: +Math.abs(a.y - b.y).toFixed(1) });
    }
  }
  audit.crossings = cross.length;
  // COUNT FIRST, THEN TRUNCATE. Reporting `.length` of the sliced example list
  // capped every world at "6 flat crossings" — MOUNTAIN TO SEA has 58.
  const flat = cross.filter((c) => c.dy < 4);
  audit.crossingsFlatN = flat.length;
  audit.crossingsFlat = flat.slice(0, 6);
  audit.hazards = {
    decl: { fall: !!t.T.fallHazard, geys: !!t.T.geysers, strips: !!t.T.strips, crit: !!t.T.critters, chase: !!t.T.chase },
    built: { geys: g.geysers?.length ?? -1, strips: g.strips?.length ?? -1, crit: g.critters?.length ?? -1 },
  };
  audit.counts = {
    solids: t.solids?.length ?? -1, barriers: t.barriers?.length ?? -1,
    trees: t.trees?.length ?? -1, props: t.props?.length ?? -1,
    ramps: t.ramps?.length ?? -1, boostPads: t.boostPads?.length ?? -1,
    tunnels: t._tunnels?.length ?? -1, overpasses: t._overpasses?.length ?? -1,
  };
  out.audit = audit;
  return out;
};

async function sweepLevel(browser, lv) {
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  const errors = [], consoleErrs = [], failedReqs = [];
  page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 200)); });
  page.on('requestfailed', (r) => failedReqs.push(`${r.url().split('/').pop()} ${r.failure()?.errorText ?? ''}`));
  const rec = { level: lv.id, world: lv.name };
  try {
    await page.goto(`${BASE}/?level=${lv.id}&unlockall=1`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__game, null, { timeout: 60000 });
    // THE TYRE GATE STOPS A SWEEP DEAD. Five worlds demand snow tyres and
    // refuse the stock car, so an unprepared sweep reports them as "never
    // reached the race" — which is what they look like from outside, and is
    // not a bug in the world. Fit the cheapest legal set first and note that
    // the world needed it.
    rec.tyreGate = await page.evaluate(() => {
      const g = window.__game;
      const f = g.carFitness?.(g.level.id);
      if (!f || f.ok) return null;
      const key = g.cars.selected;
      g.garage.upgrades ??= {};
      g.garage.upgrades[key] = { ...(g.garage.upgrades[key] ?? {}), tires: 3 };
      g.applyUpgrades?.();
      g._syncStartButton?.();
      return { need: f.need, have: f.have, fix: f.fix?.text ?? null };
    });
    // click through the DOM: fitting a tyre repaints the garage, and the
    // sticky start button can still be moving when Playwright's actionability
    // wait gives up on it
    await page.evaluate(() => document.getElementById('start-btn').click());
    await page.evaluate(() => { window.__game.countdown = 0.01; });
    await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 45000 });
    // rendered-frame budget: how heavy is this world to actually draw? Same
    // software renderer for every world, so the number is only meaningful
    // relative to its peers — a world that draws at a third of the median has
    // too much in it.
    rec.renderFps = await page.evaluate(async () => {
      let n = 0, on = true; const tick = () => { if (on) { n++; requestAnimationFrame(tick); } };
      requestAnimationFrame(tick);
      const t0 = performance.now();
      await new Promise((r) => setTimeout(r, 4000)); on = false;
      return +(n / ((performance.now() - t0) / 1000)).toFixed(2);
    });
    const r = await page.evaluate(AGENT, DRIVE_SECS);
    Object.assign(rec, r);
    console.log(`L${lv.id} ${r.world}  prog=${r.playerProgress} lap=${r.playerLap} stuck=${r.stuck.length}`);

    // ---------------- analysis ----------------
    if (errors.length) note(lv, 'high', 'page errors', errors.slice(0, 3).join(' | '));
    if (failedReqs.length) note(lv, 'high', 'failed requests', [...new Set(failedReqs)].slice(0, 3).join(' | '));
    if (consoleErrs.length) note(lv, 'low', 'console errors', [...new Set(consoleErrs)].slice(0, 2).join(' | '));
    if (r.samples.some((s) => s.nan)) note(lv, 'high', 'NaN in player state', 'position/velocity/raceTime went non-finite');
    if (r.samples.some((s) => s.ai.some((a) => a.nan))) note(lv, 'high', 'NaN in AI state', '');

    // the agent must get round: 30 s of clean driving is ~0.6–1.0 of a lap
    if (r.playerProgress < 0.12) {
      note(lv, 'high', 'agent could not drive the lap',
        `progress ${r.playerProgress} in ${DRIVE_SECS}s (expected >0.4) — road blocked, unclimbable or spawn-trapped`);
    } else if (r.playerProgress < 0.35) {
      note(lv, 'med', 'agent lap pace very slow',
        `progress ${r.playerProgress} in ${DRIVE_SECS}s — corner/grade/surface is fighting the car`);
    }
    if (r.stuck.length) {
      const s = r.stuck[0];
      note(lv, r.stuck.length > 2 ? 'high' : 'med', `agent stuck ×${r.stuck.length}`,
        `first at sample ${s.index} (lat ${s.lateral}, grade ${s.grade}, halfW ${s.halfW}, y ${s.y} vs ground ${s.groundY}, road ${s.roadY})`);
    }
    if (r.deadEndSecs > 6) note(lv, 'high', 'car ended immobile', `${r.deadEndSecs}s below 2 u/s at the end of the run`);
    if (r.worstUnder < -3) note(lv, 'high', 'player sank under terrain', `worst ${r.worstUnder} u below ground`);
    if (r.offRoadFrac > 0.45) note(lv, 'med', 'agent spent the run off the road',
      `${Math.round(r.offRoadFrac * 100)}% of samples beyond the road edge — line does not fit the corridor`);
    if (r.maxAir > 4) note(lv, 'med', 'very long airtime', `${r.maxAir}s airborne in one flight`);

    const stuckAI = r.aiDelta.filter((a) => a.moved < 0.05);
    if (stuckAI.length) note(lv, 'high', 'AI made no progress', JSON.stringify(stuckAI));
    const freeLap = r.aiDelta.filter((a) => a.lap > 1 + Math.floor(DRIVE_SECS / 25));
    if (freeLap.length) note(lv, 'high', 'AI banked an impossible lap', JSON.stringify(freeLap));
    if (r.samples.some((s) => s.ai.some((a) => a.alive && a.y < -50))) note(lv, 'high', 'AI fell out of the world', '');
    const aiOff = r.samples.at(-1)?.ai.filter((a) => Math.abs(a.lat) > 30) ?? [];
    if (aiOff.length) note(lv, 'med', 'AI driving far off the road', JSON.stringify(aiOff.map((a) => `${a.n}@${a.lat}`)));

    const a = r.audit;
    if (a.pickupBad) note(lv, 'med', 'pickups off the road plane', `${a.pickupBad}/${a.pickups} more than 3 u from road height`);
    if (a.pickups === 0) note(lv, 'low', 'no pickups on the circuit', 'weapon/nitro economy has nothing to feed it');
    if (a.solidsInRoadN) note(lv, 'high', 'solid scenery inside the drivable road',
      `${a.solidsInRoadN} collider(s), e.g. ${JSON.stringify(a.solidsInRoad.slice(0, 3))}`);
    if (a.buildingsInRoad) note(lv, 'high', 'building inside the drivable road', `${a.buildingsInRoad}, e.g. ${JSON.stringify(a.buildingsInRoadEg)}`);
    if (a.treesInRoad) note(lv, 'high', 'tree inside the drivable road', `${a.treesInRoad}, e.g. ${JSON.stringify(a.treesInRoadEg)}`);
    if (a.barriersAcrossRoad) note(lv, 'high', 'wall segment laid across the road',
      `${a.barriersAcrossRoad}, e.g. ${JSON.stringify(a.barriersAcrossRoadEg)}`);
    if (a.rampsOffRoad) note(lv, 'med', 'launch ramps off the drivable road', `${a.rampsOffRoad}`);
    if (a.padsOffRoad) note(lv, 'med', 'boost pads off the drivable road', `${a.padsOffRoad}`);
    if (a.obstaclesInRoad > 0) note(lv, 'low', 'obstacles inside the road', `${a.obstaclesInRoad} (may be intended track furniture)`);
    if (a.maxRisePerSample > 2.5) note(lv, 'high', 'vertical step in the road surface',
      `${a.maxRisePerSample} u between samples ${a.maxRiseAt} and ${a.maxRiseAt + 1}`);
    if (a.maxGrade > 0.45) note(lv, 'med', 'grade beyond what the car can climb',
      `${a.maxGrade} rise/run at sample ${a.maxGradeAt}`);
    if (a.minHalfWidth < 3) note(lv, 'med', 'road pinches below a car-and-a-half',
      `half-width ${a.minHalfWidth} u at sample ${a.minHalfWidthAt}`);
    if (a.crossingsFlatN) note(lv, 'med', 'route crosses itself at the same height',
      `${a.crossingsFlatN} of ${a.crossings} near-passes are within 4 u vertically, e.g. ${JSON.stringify(a.crossingsFlat.slice(0, 2))} — needs a bridge or tunnel`);
    const h = a.hazards;
    if (h.decl.geys && h.built.geys <= 0) note(lv, 'high', 'geysers declared but none built', '');
    if (h.decl.strips && h.built.strips <= 0) note(lv, 'high', 'strips declared but none built', '');
    if (h.decl.crit && h.built.crit <= 0) note(lv, 'high', 'critters declared but none built', '');
  } catch (e) {
    note(lv, 'high', 'sweep crashed', `${e.message.split('\n')[0]} ${errors.slice(0, 2).join(' | ')}`);
    rec.crash = e.message.split('\n')[0];
    rec.errors = errors.slice(0, 5);
  }
  rec.pageErrors = errors.slice(0, 5);
  await page.close();
  return rec;
}

const queue = [...LEVELS];
const records = [];
await Promise.all(Array.from({ length: WORKERS }, async () => {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  while (queue.length) {
    const lv = queue.shift();
    records.push(await sweepLevel(browser, lv));
  }
  await browser.close();
}));

records.sort((a, b) => a.level - b.level);
bugs.sort((a, b) => a.level - b.level);
const slim = records.map((r) => ({ ...r, samples: undefined }));
fs.writeFileSync(path.join(HERE, 'agent-sweep-report.json'), JSON.stringify({ bugs, records: slim }, null, 1));
console.log(`\n==== ${bugs.length} ISSUES ACROSS ${records.length} WORLDS ====`);
for (const x of bugs) console.log(`[${x.sev}] L${x.level} ${x.world} — ${x.name}: ${x.detail}`);
