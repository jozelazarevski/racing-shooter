/* r353 — CP5: THE CAREER SIM (CAREER_PATH.md's acceptance gate).
 *
 * A scripted career plays the path front to back against the game's OWN
 * machinery — no arithmetic stand-ins for code that exists:
 *
 *   CS1  no dead ends: a finishing-only driver (1★/world, place 6) opens
 *        every finale and every chapter of the roster, to the end
 *   CS4  the signpost never lies: at every state of that walk,
 *        careerObjective() names a real, available action (never null,
 *        never a shut world)
 *   CS2  solvency: a podium-most bot (P1/P2/P3 rotation, modest race
 *        score, no feat/contract income — conservative) banks enough by
 *        each tier boundary to buy the tier's entry car + 2 kit levels,
 *        BUYING each entry car along the way. Income runs through
 *        finishRace() itself, staged per round like test-career K16.
 *   CS3  the wall is measured as the MACHINE DELTA: same bot, same world,
 *        same grid — the DUNE with kit must be materially quicker against
 *        the grid than the stock BRAWLER. The plan's absolute wording
 *        ("a stock ROOKIE car cannot podium a CLUB finale") is NOT
 *        assertable here: the centreline bot is a metronome (no mistakes,
 *        full throttle, perfect line) and outpaces even the kit-leaned
 *        +32% grid stock (measured 0.836× grid lap). The absolute wall is
 *        a function of driver skill, and no competent HUMAN lap has ever
 *        been measured on any world — HANDOVER's standing top item. The
 *        delta is what the game controls; the delta is what this asserts.
 *   CS5  regression is the standing battery (airace, progression, career,
 *        drift, patch02, hudfreeze) — run per deploy, not re-run here.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 800, height: 520 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=1&go=1&fresh=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

// ---- CS1 + CS4: the finishing-only walk (pure state) ----------------------
const walk = await p.evaluate(() => {
  const g = window.__game;
  g.career.finished = {}; g.career.trophies = {}; g.career.seasons = {};
  g.career.seasonHistory = [];
  const ch = g.chapters();
  const out = { deadEnd: null, objBad: [], steps: 0 };
  const objOk = () => {
    const o = g.careerObjective();
    if (!o || typeof o !== 'string' || !o.length) return `null at step ${out.steps}`;
    return null;
  };
  for (let k = 0; k < ch.length; k++) {
    if (!g.isChapterOpen(k)) { out.deadEnd = `chapter ${k} shut`; break; }
    const fin = g.finaleOf(k);
    for (const lv of ch[k].levels) {
      if (lv === fin) continue;
      if (!g.isLevelUnlocked(lv.id)) { out.deadEnd = `world ${lv.id} shut in open ch ${k}`; break; }
      g.career.finished[lv.id] = { place: 6, stars: 1 };
      out.steps++;
      const bad = objOk(); if (bad) out.objBad.push(bad);
    }
    if (out.deadEnd) break;
    if (!g.isFinaleOpen(k)) { out.deadEnd = `finale of ch ${k} shut after racing the chapter`; break; }
    g.career.finished[fin.id] = { place: 6, stars: 1 };
    out.steps++;
    const bad = objOk(); if (bad) out.objBad.push(bad);
  }
  out.lastOpen = g.chapters().every((c, k) => g.isChapterOpen(k));
  return out;
});
check('CS1  a finishing-only driver reaches the end of the roster (no dead ends)',
  walk.deadEnd === null && walk.lastOpen, walk.deadEnd ?? `${walk.steps} worlds raced, all chapters open`);
check('CS4  the signpost speaks at every state of the walk',
  walk.objBad.length === 0, walk.objBad.slice(0, 3).join(' | ') || `${walk.steps} states checked`);

// ---- CS2: solvency through finishRace() itself ----------------------------
const eco = await p.evaluate(() => {
  const g = window.__game;
  // fresh economy; the walk above left a full career — reset
  g.career.finished = {}; g.career.trophies = {}; g.career.seasons = {};
  g.career.seasonHistory = []; delete g.career.sponsors;
  g.garage.credits = 0;
  g.cars.owned = ['brawler']; g.cars.selected = 'brawler';
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.startRace?.();
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const ch = g.chapters();
  const boundary = [];
  const savedLevel = g.level, savedIdx = g.levelIndex;
  const pol = [1, 2, 3];                       // podium-most rotation
  let raceN = 0, raceErrs = 0;
  let lastTier = 0;
  const spends = [];
  for (let k = 0; k < ch.length; k++) {
    const tier = g.tierOf(k);
    if (tier.idx > lastTier) {
      // r359: the KIT-HONEST need. The flat 4,000 allowance ignored the
      // real ladder — upgradeCost(lvl) = 600 + lvl²·500, so kitting the
      // new car's four performance lines (engine/tires/handling/nitro) to
      // the tier's expected level costs 6.8k at CLUB (lvl 2), 17.2k at
      // PRO (lvl 3), 37.6k at WORKS (lvl 4). The boundary asks for the
      // car AND that kit, and the sim SPENDS both — the next boundary is
      // measured on what an equipped player actually carries forward.
      const upCost = (lvl) => 600 + lvl * lvl * 500;
      let kitNeed = 0;
      for (let line = 0; line < 4; line++) {
        for (let l2 = 0; l2 <= tier.idx; l2++) kitNeed += upCost(l2);
      }
      const entry = tier.carMin;
      boundary.push({ tier: tier.name, bank: g.garage.credits,
        need: entry + kitNeed, ok: g.garage.credits >= entry + kitNeed });
      g.garage.credits -= entry + kitNeed;
      spends.push(entry + kitNeed);
      lastTier = tier.idx;
    }
    for (const lv of ch[k].levels) {
      const rank = pol[raceN % pol.length];
      raceN++;
      try {
        g.level = lv;
        g.levelIndex = Math.max(0, (window.__LEVELS ?? []).findIndex?.((l) => l.id === lv.id));
        g.state = 'race';
        g.enemies.forEach((e, i) => { e.alive = true; e._wraps = 10 - (i + 1); e.trackIndex = 0; });
        g.player._wraps = 12; g.player.trackIndex = 0;
        g.playerRank = rank;
        g.player.finished = false;
        g.raceOver = false;
        g.startScore = 0; g.score = 4000;      // a modest, quiet race
        g.deaths = 1;                          // no clean-run bonus (conservative)
        g.contracts = [];
        // r359: resetRace zeroes the pot between real races — the staged
        // loop must too, or every race re-pays the whole accumulated pot
        // (measured: race 5 paid race 4's 2,400 CR again; CS2's 8.8x was
        // inflated by the compounding)
        g.contractCredits = 0;
        g.finishRace();
      } catch (e) { raceErrs++; }
    }
  }
  g.level = savedLevel; g.levelIndex = savedIdx;
  return { boundary, bank: g.garage.credits, races: raceN, raceErrs, spends };
});
console.log('  boundaries:', JSON.stringify(eco.boundary));
console.log(`  ${eco.races} rounds staged, ${eco.raceErrs} errored, final bank ${eco.bank.toLocaleString()} CR`);
check('CS2  every tier boundary is solvent (entry car + tier kit), buying and kitting along the way',
  eco.boundary.length === 3 && eco.boundary.every((b) => b.ok) && eco.raceErrs === 0,
  eco.boundary.map((b) => `${b.tier}: ${b.bank.toLocaleString()}/${b.need.toLocaleString()}`).join('  '));
// r359: ...AND THE CEILING. The r353 run read "8.8x solvent" — half of
// that was the staged loop re-paying the contract pot every race (real
// races reset it; the sim now does too), and the rest was a need model
// with no kit in it. With honest books and a kit-honest need, the margin
// law is two-sided: never insolvent (above), never so rich the garage
// stops being a question. Band chosen from the measured runs.
check('CS2b the garage asks a real question (boundary margin 1.2-4.5x)',
  eco.boundary.every((b) => b.bank >= b.need * 1.2 && b.bank <= b.need * 4.5),
  eco.boundary.map((b) => `${b.tier}: ${(b.bank / b.need).toFixed(1)}x`).join('  '));

await p.close();

// ---- CS3: the wall, driven — same bot, same world, two machines -----------
const CLUB_WORLD = await (async () => {
  const q = await browser.newPage();
  await q.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 300000 });
  await q.waitForFunction(() => window.__game?.chapters, undefined, { timeout: 300000 });
  const id = await q.evaluate(() => {
    // the first chapter of CLUB = ROOKIE's toChapter + 1
    const kClub = window.__DRIVING.career.tiers[0].toChapter + 1;
    return window.__game.chapters()[kClub].levels[0].id;
  });
  await q.close();
  return id;
})();

const lapWith = async (carKey, ups) => {
  const q = await browser.newPage({ viewport: { width: 640, height: 400 } });
  q.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
  await q.goto(`${BASE}/?level=${CLUB_WORLD}&go=1&fresh=1&unlockall=1`,
    { waitUntil: 'load', timeout: 300000 });
  await q.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });
  const r = await q.evaluate(async ({ carKey, ups }) => {
    const g = window.__game, t = g.track, N = t.center.length;
    const { CAR_CATALOG } = await import('./src/vehicles.js');
    const car = CAR_CATALOG.find((cc) => cc.key === carKey);
    g.cars.selected = carKey;
    if (ups) g.garage.upgrades = { [carKey]: ups };
    g.swapPlayerCar?.(car);
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    g.resetRace(); g.startRace?.();
    const f = () => new Promise((r2) => requestAnimationFrame(r2));
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; await f(); }
    const c = g.player;
    c.invuln = 9999;                     // the wall is pace, not weapons
    // r364: races are ONE lap, so the first car over the line ends the race
    // and freezes raceTime — every later lap-1 stamp then reads the winner's
    // time and bot-vs-grid collapses to 1.000×. The quantity here is per-LAP
    // pace, so the sim races a lap count nobody reaches.
    g.lapsTotal = 99;
    let botLap = null;
    const rivalLap = new Array(g.enemies.length).fill(null);
    const CAP = 300 * 60;
    for (let k2 = 0; k2 < CAP; k2++) {
      const i = t.nearestIndex(c.pos, c.trackIndex);
      const aim = (i + 6) % N;
      const a = t.center[aim];
      const want = Math.atan2(a.x - c.pos.x, a.z - c.pos.z);
      let d = want - c.heading;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      g.input.analog = { steer: Math.max(-1, Math.min(1, d * 1.9)), throttle: 1, brake: 0 };
      g.frame();
      c.health = c.maxHealth;
      if (botLap === null && (c.lap ?? 1) >= 2) botLap = g.raceTime;
      g.enemies.forEach((e, j) => { if (rivalLap[j] === null && (e.lap ?? 1) >= 2) rivalLap[j] = g.raceTime; });
      if (botLap !== null && rivalLap.every((x) => x !== null)) break;
    }
    const done = rivalLap.filter((x) => x !== null);
    return { botLap, gridMean: done.length ? done.reduce((s, x) => s + x, 0) / done.length : null,
      gridDone: done.length, car: g.cars.selected };
  }, { carKey, ups });
  await q.close();
  return r;
};

const stock = await lapWith('brawler', null);
const tiered = await lapWith('dune', { engine: 3, tires: 3, handling: 2 });
console.log(`  CLUB world ${CLUB_WORLD}: stock BRAWLER lap-1 ${stock.botLap?.toFixed(1)}s vs grid ${stock.gridMean?.toFixed(1)}s (${stock.gridDone}/7); `
  + `kitted DUNE ${tiered.botLap?.toFixed(1)}s vs grid ${tiered.gridMean?.toFixed(1)}s (${tiered.gridDone}/7)`);
const stockGap = stock.botLap && stock.gridMean ? stock.botLap / stock.gridMean : null;
const tieredGap = tiered.botLap && tiered.gridMean ? tiered.botLap / tiered.gridMean : null;
check('CS3  the machine moves the bot from off the pace to on it (same bot, same grid)',
  stockGap !== null && tieredGap !== null && tieredGap < stockGap - 0.02,
  `stock ${stockGap?.toFixed(3)}× grid, tiered ${tieredGap?.toFixed(3)}× grid`);

check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
console.log('CS5  regression = the standing battery (airace/progression/career/drift/patch02/hudfreeze), run per deploy');

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe career holds front to back');
process.exit(fail ? 1 : 0);
