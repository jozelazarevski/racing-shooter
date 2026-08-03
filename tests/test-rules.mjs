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
    const iv2 = setInterval(() => { if (Math.abs(p.lateral) > 3) p.vel.copy(p.forward).multiplyScalar(20); }, 100);
    await new Promise(res => setTimeout(res, 3500));
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
  r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    const ob = t.solids.filter(s => s.mat === 'stone' && s.r > 1.5)[0];
    p.alive = true; p.health = 100; p.invuln = 0; p.mesh.visible = true;
    p.pos.set(ob.x - (ob.r + 4.5), (ob.y ?? 0) + 0.3, ob.z);
    p.y = p.pos.y; p.vy = 0; p.airborne = false;
    p.heading = Math.PI / 2;
    p.vel.set(26, 0, 0);
    await new Promise(res => setTimeout(res, 1800));
    const d = Math.hypot(p.pos.x - ob.x, p.pos.z - ob.z);
    return { hpLoss: +(100 - p.health).toFixed(0), d: +d.toFixed(1), r: +ob.r.toFixed(1), wrecked: !p.alive };
  });
  // NOTE: player hull intake is difficulty-scaled (NORMAL x0.62, RULES.md), so
  // the raw min(85,(impact-6)x3.5) lands ~0.62x on screen. 28+ keeps STONE
  // clearly the heaviest material class (METAL caps at 24 raw = ~15 scaled).
  check('STONE head-on = heavy damage (>=28 hull after difficulty scale)', r.hpLoss >= 28 || r.wrecked, JSON.stringify(r));

  // HUT: heavy damage + planks fly + dust (probe pattern: land ON the ground
  // next to the target, force velocity straight in, generous window)
  r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    const hut = t.solids.find(s => s.mat === 'hut');
    if (!hut) return { skip: true };
    p.alive = true; p.health = 100; p.invuln = 0; p.mesh.visible = true;
    p.pos.set(hut.x - (hut.r + 8), t.terrainHeight(hut.x - (hut.r + 8), hut.z) + 0.3, hut.z);
    p.y = p.pos.y; p.vy = 0; p.airborne = false;
    p.heading = Math.PI / 2;
    const fly0 = g.flyingProps.length;
    let feed = [];
    const f = g.hud.feed.bind(g.hud);
    g.hud.feed = (m, k) => { feed.push(m); f(m, k); };
    const iv = setInterval(() => { p.vel.set(24, 0, 0); }, 80);
    // condition-driven: drive until the hut actually bites
    for (let w = 0; w < 120 && p.health > 99; w++) await new Promise(res => setTimeout(res, 200));
    await new Promise(res => setTimeout(res, 300)); // let the planks spawn
    clearInterval(iv);
    return { hpLoss: +(100 - p.health).toFixed(0), planksFlew: g.flyingProps.length > fly0,
      feed: feed.filter(m => /HUT/.test(m)).slice(0, 1) };
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
