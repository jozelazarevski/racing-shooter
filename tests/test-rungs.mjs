/* CONTRACTS ESCALATE, AND THE PLAYER WRITES THE CURVE.
 *
 * The side objectives used to be flat. DEMOLITION asked for twelve props on
 * the fiftieth race exactly as it did on the first, and paid the same 60 CR —
 * by which point a player smashes twelve props without noticing, so the
 * objective had stopped being an objective.
 *
 * Each contract now stands on a RUNG. Complete it and that contract, and only
 * that contract, steps up permanently: harder target, bigger pay, and a
 * difficulty floor at the top. Keep failing it and it stays. What that gives
 * is a difficulty curve the player writes by playing, out of a table and one
 * save field rather than a new system.
 *
 * The bound this suite exists to defend is the one ECONOMY-PLAN.md set: a full
 * sweep of three top-rung contracts is worth about ONE strong race, not three.
 * Side objectives that out-earn racing stop being side objectives.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const out = {};
  const pool = g.contractPool;

  // ---- the table itself ---------------------------------------------------
  out.everyContractHasRungs = pool.every((c) => Array.isArray(c.rungs) && c.rungs.length === 3);
  out.everyRungPays = pool.every((c) => c.rungs.every((r) => r.pay > 0));
  out.payGrowsPerRung = pool.every((c) =>
    c.rungs[1].pay > c.rungs[0].pay && c.rungs[2].pay > c.rungs[1].pay);
  // a countable contract must actually ask for MORE, or the rung is decoration
  const countable = pool.filter((c) => c.rungs[0].need !== undefined);
  out.countableCount = countable.length;
  out.targetsHarden = countable.every((c) => {
    // PODIUM ON HARD and PACIFIST harden by asking for a BETTER place, which
    // is a smaller number; everything else asks for more of something
    const [a, b, d] = c.rungs.map((r) => r.need);
    return (b > a && d > b) || (b < a && d < b);
  });
  out.topRungIsHardOnly = pool.every((c) => c.rungs[2].hard === true);

  // ---- the bound: three top rungs ~= one strong race ----------------------
  // A strong race is about 1,800 CR (ECONOMY-PLAN.md §1, measured at r148).
  const tops = pool.map((c) => c.rungs[2].pay).sort((a, b) => b - a);
  out.richestThree = tops.slice(0, 3).reduce((a, b) => a + b, 0);
  out.sweepBonus = 600;                       // SWEEP_CR
  out.bestSweep = out.richestThree + out.sweepBonus;

  // ---- what an offer actually deals ---------------------------------------
  const dealtOn = (diff, rungMap) => {
    g.career.rungs = { ...rungMap };
    g.difficulty = g.difficulties ? (g.difficulties.find((d) => d.id === diff) || g.difficulty)
      : { ...g.difficulty, id: diff };
    if (g.difficulty.id !== diff) g.difficulty = { ...g.difficulty, id: diff };
    return g._pickContracts();
  };

  // a fresh player is dealt rung I everywhere
  const fresh = dealtOn('normal', {});
  out.freshAllRungOne = fresh.every((c) => c.rungIx === 0);
  out.freshLabelled = fresh.every((c) => / I$/.test(c.label));
  out.freshOfferSize = fresh.length;
  out.freshHasSure = fresh.some((c) => c.sure);

  // a player who has climbed is dealt what they climbed to
  const climbed = {};
  for (const c of pool) climbed[c.id] = 1;
  const mid = dealtOn('normal', climbed);
  out.midAllRungTwo = mid.every((c) => c.rungIx === 1);
  out.midLabelled = mid.every((c) => / II$/.test(c.label));
  out.midPaysMore = mid.every((c) => {
    const src = pool.find((x) => x.id === c.id);
    return c.pay === src.rungs[1].pay && c.pay > src.rungs[0].pay;
  });

  // ---- the difficulty floor: rung III is not dealt below HARD -------------
  const maxed = {};
  for (const c of pool) maxed[c.id] = 2;
  const onNormal = dealtOn('normal', maxed);
  out.normalNeverTopRung = onNormal.every((c) => c.rungIx <= 1);
  const onHard = dealtOn('hard', maxed);
  out.hardDealsTopRung = onHard.every((c) => c.rungIx === 2);
  out.hardLabelled = onHard.every((c) => / III$/.test(c.label));

  // ---- the target reaches the predicate, the progress AND the wording -----
  // These three used to repeat the number independently, which is how they end
  // up disagreeing the moment one is edited.
  // Resolve a contract at a given rung the way the offer does, without
  // depending on the shuffle to deal the one we want.
  const at = (id, lvl) => {
    const src = pool.find((c) => c.id === id);
    const r = src.rungs[Math.min(src.rungs.length - 1, lvl)];
    return { need: r.need, pay: r.pay, desc: src.desc(r.need),
      prog: src.prog ? src.prog({ props: 0 }, r.need) : null, check: src.check };
  };
  const demoAt = (lvl) => at('demo', lvl);
  const d1 = demoAt(0), d3 = demoAt(2);
  out.demoNeed1 = d1.need; out.demoNeed3 = d3.need;
  out.demoDesc1 = d1.desc; out.demoDesc3 = d3.desc;
  out.demoProg3 = d3.prog;
  out.demoDescCarriesNeed = d1.desc.includes('12') && d3.desc.includes('40');
  out.demoProgCarriesNeed = d3.prog === '0/40';
  out.demoCheckUsesNeed = d3.check(g, { props: 25 }, 1, d3.need) === false
    && d3.check(g, { props: 40 }, 1, d3.need) === true;

  // ---- climbing persists, and only for the contract you climbed ----------
  g.career = { finished: {}, rungs: {} };
  g.contracts = [g._pickContracts()[0]];
  const first = g.contracts[0];
  const firstId = first.id;
  g.contractCredits = 0;
  g._completeContract(first);
  out.climbedId = g.career.rungs[firstId];
  out.othersUntouched = Object.keys(g.career.rungs).length === 1;
  out.paid = g.contractCredits === first.pay;
  // and it is written to the profile, not just held in memory
  const key = `ir-p${g.profile.id}-career`;
  out.persisted = (JSON.parse(localStorage.getItem(key) || '{}').rungs || {})[firstId] === 1;

  // a rung cannot be skipped: completing rung I twice does not reach III
  g.contracts = [g._pickContracts().find((c) => c.id === firstId)
    || { ...first, done: false, rungIx: 0 }];
  g.contracts[0].done = false;
  g._completeContract(g.contracts[0]);
  out.afterSecond = g.career.rungs[firstId];

  // completing a rung BELOW the one you stand on does not advance you
  g.career.rungs[firstId] = 2;
  const low = { ...first, done: false, rungIx: 0 };
  g.contracts = [low];
  g._completeContract(low);
  out.lowRungNoAdvance = g.career.rungs[firstId] === 2;

  // ---- an existing save has no rungs, and reads as rung I ----------------
  localStorage.setItem(key, JSON.stringify({ finished: { 1: { place: 1, stars: 3 } } }));
  g._loadProfileState();
  out.legacyLoads = !!g.career.rungs && Object.keys(g.career.rungs).length === 0;
  out.legacyKeptFinished = !!g.career.finished[1];

  g.career = { finished: {}, rungs: {} };
  return out;
});

console.log('\n--- every contract has three rungs ---');
ok(R.everyContractHasRungs, 'all thirteen carry a three-rung ladder');
ok(R.everyRungPays, 'every rung pays something');
ok(R.payGrowsPerRung, 'and pay rises with each one');
ok(R.countableCount >= 8, 'most contracts have a countable target', R.countableCount);
ok(R.targetsHarden, 'and every countable target actually hardens');
ok(R.topRungIsHardOnly, 'the top rung is HARD-only on all of them');

console.log('\n--- the bound: side objectives stay side objectives ---');
ok(R.bestSweep <= 2200,
  'the richest possible sweep is about one strong race (~1800 CR), not three',
  `${R.richestThree} + ${R.sweepBonus} = ${R.bestSweep} CR`);
ok(R.bestSweep >= 1200, 'and is still worth chasing', `${R.bestSweep} CR`);

console.log('\n--- what an offer deals ---');
ok(R.freshOfferSize === 3, 'three contracts an offer', R.freshOfferSize);
ok(R.freshHasSure, 'and never three long-shots');
ok(R.freshAllRungOne && R.freshLabelled, 'a fresh player is dealt rung I, and it says so');
ok(R.midAllRungTwo && R.midLabelled, 'a player who climbed once is dealt rung II');
ok(R.midPaysMore, 'and it pays the rung II rate');

console.log('\n--- the difficulty floor ---');
ok(R.normalNeverTopRung,
  'rung III is never dealt below HARD — the offer is always completable');
ok(R.hardDealsTopRung && R.hardLabelled, 'on HARD it is dealt, and labelled III');

console.log('\n--- one number, three places ---');
ok(R.demoNeed1 === 12 && R.demoNeed3 === 40,
  'DEMOLITION asks 12 at rung I and 40 at rung III', `${R.demoNeed1} / ${R.demoNeed3}`);
ok(R.demoDescCarriesNeed, 'the wording carries the rung target',
  `"${R.demoDesc1}" / "${R.demoDesc3}"`);
ok(R.demoProgCarriesNeed, 'so does the progress readout', R.demoProg3);
ok(R.demoCheckUsesNeed, 'and the predicate tests it, not a baked constant');

console.log('\n--- climbing, and not skipping ---');
ok(R.climbedId === 1, 'completing a contract steps THAT contract up', R.climbedId);
ok(R.othersUntouched, 'and leaves the others where they were');
ok(R.paid, 'it still pays its rung rate');
ok(R.persisted, 'the rung is written to the profile');
ok(R.afterSecond === 2, 'completing rung II reaches III', R.afterSecond);
ok(R.lowRungNoAdvance,
  'completing a rung below the one you stand on does not advance you');

console.log('\n--- a save written before any of this ---');
ok(R.legacyLoads, 'loads, with every contract at rung I');
ok(R.legacyKeptFinished, 'and keeps its finished worlds');

console.log('\n--- and none of it throws ---');
ok(errors.length === 0, 'no page errors', errors.slice(0, 4).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
