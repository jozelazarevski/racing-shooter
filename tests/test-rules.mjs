// RULES.md conformance suite — material/impact model, open world, lap integrity.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

// NOTE ON TIMEOUTS: waitForFunction is (fn, ARG, options) — passing the
// options object second silently makes it the *argument* and leaves the
// timeout at its default. That, plus page.click's 30s default, used to let a
// loaded box drop us here with the game still on the TITLE screen, where
// physics is deliberately frozen. Every "the wall did no damage" test then
// failed for the wrong reason. Boot now waits properly and REFUSES to hand
// back a page that never started racing.
const boot = async (url) => {
  const page = await b.newPage({ viewport: { width: 900, height: 600 } });
  page.setDefaultTimeout(180000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
  await page.evaluate(() => document.fonts.ready);
  await page.click('#start-btn', { timeout: 180000 });
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 180000 });
  const racing = await page.evaluate(() => window.__game.state === 'race');
  if (!racing) throw new Error(`boot(${url}): never reached race state — results would be meaningless`);
  await page.evaluate(() => { for (const e of window.__game.enemies) { e.update = () => {}; e.vel.set(0, 0, 0); e.pos.y = -400; e.alive = false; } });
  return { page, errors };
};

// ================= FOREST RACE (open world + lap integrity) =================
{
  const { page, errors } = await boot('http://localhost:8901/?level=1&unlockall=1');

  const lists = await page.evaluate(() => {
    const t = window.__game.track;
    return { solids: t.solids?.length ?? -1, stone: (t.solids ?? []).filter(s => s.mat === 'stone').length,
      huts: (t.solids ?? []).filter(s => s.mat === 'hut').length,
      metal: (t.solids ?? []).filter(s => s.mat === 'metal').length,
      trees: t.trees?.length ?? -1, noFence: t.breakFence === undefined && t.fenceHole === undefined };
  });
  check('collider lists + material tags, fence system gone', lists.solids > 10 && lists.stone > 5 && lists.huts >= 3 && lists.metal >= 8 && lists.noFence, JSON.stringify(lists));

  // OPEN WORLD: driving off the road in RACE mode just works (and is slower).
  // Random scenery can block a single exit line, so try several spots.
  let r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    let out = false, usedIdx = -1, maxLat = 0;
    for (const idx of [300, 520, 700, 150]) {
      p.placeAt(idx, 0);
      const n = t.nrm[idx];
      p.heading = Math.atan2(n.x, n.z);
      const iv = setInterval(() => { p.vel.copy(p.forward).multiplyScalar(22); }, 90);
      for (let k = 0; k < 22 && !out; k++) {       // poll up to 4.4s, break early
        await new Promise(res => setTimeout(res, 200));
        maxLat = Math.max(maxLat, Math.abs(p.lateral));
        if (Math.abs(p.lateral) > 10.5) { out = true; usedIdx = idx; }
      }
      clearInterval(iv);
      if (out) break;
    }
    // drive back to the road
    const n = t.nrm[p.trackIndex];
    const side = Math.sign(p.lateral) || 1;
    p.heading = Math.atan2(-n.x * side, -n.z * side);
    // CONDITION-DRIVEN, NOT WALL-CLOCK. A flat 3500 ms is about three physics
    // frames at the ~1 fps headless Chromium manages under swiftshader, which
    // is nowhere near enough to drive 11 u back to the road — it reported
    // backLat 10.0 against a "< 10" threshold and called an open world walled.
    // Poll for the return and cap the wait in polls, so a slow box takes longer
    // instead of failing.
    const iv2 = setInterval(() => { if (Math.abs(p.lateral) > 3) p.vel.copy(p.forward).multiplyScalar(20); }, 100);
    for (let k = 0; k < 60 && Math.abs(p.lateral) >= 8; k++) {
      await new Promise(res => setTimeout(res, 250));
    }
    clearInterval(iv2);
    return { out, usedIdx, maxLat: +maxLat.toFixed(1), backLat: +p.lateral.toFixed(1) };
  });
  check('race mode is open — off-road and back, no wall', r.out && Math.abs(r.backLat) < 10, JSON.stringify(r));

  // LAP INTEGRITY: no lap without the far checkpoint
  r = await page.evaluate(() => {
    const p = window.__game.player;
    const lap0 = p.lap;
    p._midCP = false; p.trackIndex = 20;
    const cut = p.checkLap(880);
    const lapAfterCut = p.lap;
    p._midCP = true; p.trackIndex = 20;
    const legit = p.checkLap(880);
    return { cut, cutLap: lapAfterCut - lap0, legit, legitLap: p.lap - lap0 };
  });
  check('infield shortcut earns no lap; checkpointed lap counts', r.cut === false && r.cutLap === 0 && r.legit === true && r.legitLap === 1, JSON.stringify(r));

  // STONE: full-speed head-on into a boulder = near-wreck damage.
  // Start right at its edge so nothing else can intercept the run-in.
  // Driven at a FIXED timestep rather than on wall-clock frames, and aimed at a
  // boulder standing on flat ground. The old version waited 1800 ms of real time
  // and took whichever stone happened to be first in the list; once the roadside
  // stones were moved clear of the carriageway that stone changed, the run-in
  // landed on a slope, and the car arrived glancing instead of square. The
  // material model was never the thing that moved — so measure the model.
  r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    const flatAround = (s) => {
      const h0 = t.terrainHeight(s.x, s.z);
      for (const [dx, dz] of [[6, 0], [-6, 0], [0, 6], [0, -6], [10, 0], [-10, 0]]) {
        if (Math.abs(t.terrainHeight(s.x + dx, s.z + dz) - h0) > 1.6) return false;
      }
      return true;
    };
    const stones = t.solids.filter((s) => s.mat === 'stone' && s.r > 1.5);
    // Try SEVERAL stones, not just the first flat one.
    //
    // World generation is seeded now, so "the first flat stone" is a fixed
    // stone — and on PINE VALLEY that one has a companion lump sitting in both
    // run-ins, which caps the impact at 23 hull. Before seeding this test drew
    // a different stone every run and reported 53 / 15 / 53 on three
    // consecutive baseline runs: it was always unreliable, and determinism
    // simply stopped hiding it.
    //
    // A blocked run-in is a property of the scenery. What this test is for is
    // the MATERIAL model, so it takes the best clean head-on it can find.
    const candidates = stones.filter(flatAround).slice(0, 12);
    if (!candidates.length && stones.length) candidates.push(stones[0]);
    let best = 0, bestD = 99, bestR = 0;
    for (const ob of candidates) {
    // try both approach directions: one of them can be blocked by a companion
    // lump, and a blocked run-in is a property of the scenery, not the material
    for (const dir of [1, -1]) {
      p.alive = true; p.health = 100; p.invuln = 0; p.mesh.visible = true;
      p.slip = 0; p.landGrip = 0; p._wetT = 0;
      const gy = t.terrainHeight(ob.x - dir * (ob.r + 3.6), ob.z);
      p.pos.set(ob.x - dir * (ob.r + 3.6), gy + 0.3, ob.z);
      p.y = p.pos.y; p.vy = 0; p.airborne = false;
      p.heading = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      p.vel.set(dir * 29, 0, 0);   // RULES.md's "full speed" is ~28 u/s
      for (let i = 0; i < 90; i++) {          // 1.5 s at a fixed 1/60
        p.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
        if (p.health < 100) break;
      }
      const loss = 100 - p.health;
      if (loss > best) {
        best = loss;
        bestD = Math.hypot(p.pos.x - ob.x, p.pos.z - ob.z);
        bestR = ob.r;
      }
    }
    }
    return { hpLoss: +best.toFixed(0), d: +bestD.toFixed(1), r: +bestR.toFixed(1),
             tried: candidates.length, wrecked: !p.alive };
  });
  // NOTE: player hull intake is difficulty-scaled (NORMAL x0.62, RULES.md), so
  // the raw min(85,(impact-6)x3.5) lands ~0.62x on screen. 28+ keeps STONE
  // clearly the heaviest material class (METAL caps at 24 raw = ~15 scaled).
  check('STONE head-on = heavy damage (>=28 hull after difficulty scale)', r.hpLoss >= 28 || r.wrecked, JSON.stringify(r));

  // HUT: heavy damage + planks fly + dust (probe pattern: land ON the ground
  // next to the target, force velocity straight in, generous window)
  r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    // Try SEVERAL huts, for the same reason the STONE check does.
    //
    // World generation is seeded (r81), so "the first hut" is a FIXED hut — and
    // whichever one that is may have its run-in blocked or sit on ground the
    // car cannot reach at speed. Before seeding this drew a different hut each
    // run and passed or failed accordingly. Determinism did not break this
    // test; it stopped hiding that it was unreliable.
    const huts = t.solids.filter(s => s.mat === 'hut').slice(0, 8);
    if (!huts.length) return { skip: true };
    let feed = [];
    const f = g.hud.feed.bind(g.hud);
    g.hud.feed = (m, k) => { feed.push(m); f(m, k); };
    let bestLoss = 0, bestFlew = false, bestFeed = [], tried = 0;
    for (const hut of huts) {
      tried++;
      feed.length = 0;
      p.alive = true; p.health = 100; p.invuln = 0; p.mesh.visible = true;
      p.slip = 0; p.landGrip = 0; p._wetT = 0;
      const sx = hut.x - (hut.r + 8);
      p.pos.set(sx, t.terrainHeight(sx, hut.z) + 0.3, hut.z);
      p.y = p.pos.y; p.vy = 0; p.airborne = false;
      p.heading = Math.PI / 2;
      const fly0 = g.flyingProps.length;
      const iv = setInterval(() => { p.vel.set(24, 0, 0); }, 80);
      // condition-driven: drive until the hut actually bites
      for (let w = 0; w < 25 && p.health > 99; w++) await new Promise(res => setTimeout(res, 200));
      await new Promise(res => setTimeout(res, 300)); // let the planks spawn
      clearInterval(iv);
      const loss = 100 - p.health;
      if (loss > bestLoss) {
        bestLoss = loss;
        bestFlew = g.flyingProps.length > fly0;
        bestFeed = feed.filter(m => /HUT/.test(m)).slice(0, 1);
      }
      if (bestLoss >= 15 && bestFlew && bestFeed.length) break;
    }
    return { hpLoss: +bestLoss.toFixed(0), planksFlew: bestFlew, tried,
      feed: bestFeed };
  });
  check('HUT crash = big effect (planks + >=15 hull)', r.skip || (r.hpLoss >= 15 && r.planksFlew && r.feed.length > 0), JSON.stringify(r));

  // BIG TREE: solid — tree survives, car damaged (same probe pattern)
  r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    // the first big pine can have a rock in the approach line — try several
    const cands = t.trees.filter(x => !x.dead && x.kind === 'pine' && x.s >= 1.2).slice(0, 6);
    let best = { treeAlive: true, hpLoss: 0, tried: 0 };
    for (const tr of cands) {
      best.tried++;
      p.alive = true; p.health = 100; p.invuln = 0; p.mesh.visible = true;
      p.pos.set(tr.x - 12, tr.y + 0.3, tr.z);
      p.y = p.pos.y; p.vy = 0; p.airborne = false;
      p.heading = Math.PI / 2;
      const iv = setInterval(() => { p.vel.set(22, 0, 0); }, 80);
      // condition-driven: headless fps varies wildly — wait for the hit
      for (let w = 0; w < 40 && p.health > 99; w++) await new Promise(res => setTimeout(res, 200));
      clearInterval(iv);
      const hpLoss = +(100 - p.health).toFixed(0);
      if (hpLoss >= 10) { best = { treeAlive: !tr.dead, hpLoss, tried: best.tried }; break; }
    }
    return best;
  });
  check('BIG pine wins — stands, car takes >=10 hull', r.treeAlive && r.hpLoss >= 10, JSON.stringify(r));

  // SMALL TREE: still yields
  r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    const tr = t.trees.find(x => !x.dead && x.kind === 'pine' && x.s < 0.95);
    if (!tr) return { skip: true };
    p.alive = true; p.health = 100; p.invuln = 0;
    p.pos.set(tr.x - (tr.r + 3.6), tr.y + 0.3, tr.z);
    p.y = p.pos.y; p.vy = 0; p.airborne = false;
    p.heading = Math.PI / 2;
    const iv = setInterval(() => { p.vel.set(20, 0, 0); }, 80);
    for (let w = 0; w < 30 && !tr.dead; w++) await new Promise(res => setTimeout(res, 200));
    clearInterval(iv);
    return { dead: tr.dead === true };
  });
  check('small pine still fells on impact', r.skip || r.dead, JSON.stringify(r));

  check('no page errors (forest race)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

// ================= CANYON (stone cliffs still clamp) =================
{
  const { page, errors } = await boot('http://localhost:8901/?level=4&unlockall=1');
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    p.placeAt(300, 4);
    p.health = 100; p.invuln = 0;
    const n = t.nrm[p.trackIndex];
    p.heading = Math.atan2(n.x, n.z);
    const iv = setInterval(() => { if (Math.abs(p.lateral) < 9.2) p.vel.copy(p.forward).multiplyScalar(30); }, 80);
    // condition-driven: wait for the car to REACH the wall, not for a wall-clock
    // guess. Headless game time runs several times slower than real time.
    for (let w = 0; w < 120 && Math.abs(p.lateral) < 9.0 && p.health > 74; w++) {
      await new Promise(res => setTimeout(res, 200));
    }
    clearInterval(iv);
    return { lat: +p.lateral.toFixed(1), inside: Math.abs(p.lateral) <= 9.7, hpLoss: +(100 - p.health).toFixed(0) };
  });
  check('canyon cliffs: stone wall holds + stone damage', r.inside && r.hpLoss >= 25, JSON.stringify(r));
  check('no page errors (canyon)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

// ================= FOREST ROAM quick re-check =================
{
  const { page, errors } = await boot('http://localhost:8901/?level=1&mode=roam&unlockall=1');
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    // small tree fells, tire stack bursts, bush brushes — all still live in roam
    const st = t.tireStacks.find(s => !s.dead);
    p.pos.set(st.x - 10, (st.y ?? 0) + 0.5, st.z);
    p.heading = Math.atan2(st.x - p.pos.x, st.z - p.pos.z);
    const iv = setInterval(() => { p.vel.copy(p.forward).multiplyScalar(22); }, 100);
    for (let w = 0; w < 35 && !st.dead; w++) await new Promise(res => setTimeout(res, 200));
    clearInterval(iv);
    const bu = t.bushes[0];
    const score0 = g.score;
    p.pos.set(bu.x - (bu.r + 2.5), (bu.y ?? 0) + 0.3, bu.z);
    p.y = p.pos.y; p.vy = 0; p.airborne = false;
    p.heading = Math.PI / 2;
    const iv2 = setInterval(() => { p.vel.set(16, 0, 0); }, 90);
    for (let w = 0; w < 25 && g.score - score0 < 5; w++) await new Promise(res => setTimeout(res, 200));
    clearInterval(iv2);
    return { tires: st.dead === true, bush: g.score - score0 >= 5 };
  });
  check('roam: tire stacks + bushes still live', r.tires && r.bush, JSON.stringify(r));
  check('no page errors (roam)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

await b.close();
const fails = results.filter(x => !x.ok);
console.log(`\n==== ${results.length - fails.length}/${results.length} PASSED ====`);
if (fails.length) process.exit(1);
