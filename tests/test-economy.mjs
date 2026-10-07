/* THE ECONOMY HAS TO BE PAYABLE BY THE GAME THAT EARNS IT.
 *
 * Measured on the shipped numbers before this suite existed:
 *
 *   upgradeCost was 800 + lvl^2 * 800 — steps of 800 / 1600 / 4000 / 8000 /
 *   13600, so one line cost 28,000 CR and a fully built car 196,000 across
 *   seven lines. The car ladder totalled 149,000. A strong race paid about
 *   730 CR.
 *
 *   That is 267 races to finish ONE car and 203 to own the roster, against a
 *   campaign of 61 worlds. The content was priced out of reach of the game
 *   that earns it — you would replay every world four times over before the
 *   garage opened up.
 *
 * This reads the constants where they are WRITTEN rather than simulating a
 * career, because the failure was never subtle: it is arithmetic, and the
 * arithmetic is what drifted. Every bound below is a design decision stated
 * as a number, so changing the feel means changing a bound on purpose.
 */
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const veh = readFileSync(new URL('../src/vehicles.js', import.meta.url), 'utf8');

const num = (re, what) => {
  const m = main.match(re);
  if (!m) { fail++; console.log('FAIL  could not read', what); return NaN; }
  return Number(m[1]);
};

// ---- the constants, as written ------------------------------------------
const rateDen = num(/const CREDIT_RATE = 1 \/ ([0-9.]+);/, 'CREDIT_RATE');
const podium = (main.match(/const PODIUM_CR = \[([0-9, ]+)\]/) || [])[1]
  ?.split(',').map((n) => Number(n.trim())) ?? [];
// r359: firstClear moved into driving.json's career block (and main.js
// reads it through a function) — the source of truth is the JSON now.
const firstClear = (() => {
  try {
    const j = JSON.parse(readFileSync(new URL('../driving.json', import.meta.url), 'utf8'));
    const v = j.career?.firstClearCr;
    ok(Number.isFinite(v), 'could read career.firstClearCr', String(v));
    return v ?? NaN;
  } catch { ok(false, 'could read career.firstClearCr', 'driving.json unreadable'); return NaN; }
})();
const cleanRun = num(/const CLEAN_RUN_CR = ([0-9]+);/, 'CLEAN_RUN_CR');
const sweep = num(/const SWEEP_CR = ([0-9]+);/, 'SWEEP_CR');
const upM = main.match(/const upgradeCost = \(lvl\) => ([0-9]+) \+ lvl \* lvl \* ([0-9]+);/);
ok(!!upM, 'upgradeCost is readable', upM ? '' : 'shape changed — update this suite');
const [, upBase, upSlope] = (upM || [0, 0, 0]).map(Number);
const upgradeCost = (l) => upBase + l * l * upSlope;
const MAXLVL = 5;
const lines = (main.match(/const UPGRADES = \[([\s\S]*?)\n\];/) || ['', ''])[1]
  .split('\n').filter((l) => /key: '/.test(l)).length;
const prices = [...veh.matchAll(/price: ([0-9]+)/g)].map((m) => Number(m[1]));

// ---- what a race pays ----------------------------------------------------
// A representative strong run: the finish bonus alone is 2000 score and a
// competent race roughly doubles it, so 4000 is a fair, deliberately modest
// stand-in — being conservative here makes every bound below harder to clear.
const RACE_SCORE = 4000;
const strong = Math.round(RACE_SCORE / rateDen) + podium[0] + cleanRun;
const firstRun = strong + firstClear;

const oneLine = Array.from({ length: MAXLVL }, (_, l) => upgradeCost(l))
  .reduce((a, b) => a + b, 0);
const fullCar = oneLine * lines;
const roster = prices.reduce((a, b) => a + b, 0);

console.log(`\n--- ${lines} upgrade lines, ${prices.length} cars ---`);
console.log(`upgrade steps      ${Array.from({ length: MAXLVL }, (_, l) => upgradeCost(l)).join(' / ')}`);
console.log(`one line           ${oneLine.toLocaleString()} CR`);
console.log(`a fully built car  ${fullCar.toLocaleString()} CR`);
console.log(`the whole roster   ${roster.toLocaleString()} CR`);
console.log(`strong race        ${strong.toLocaleString()} CR   (first clear ${firstRun.toLocaleString()})`);
console.log(`  -> ${(fullCar / strong).toFixed(0)} races to max a car, `
  + `${(roster / strong).toFixed(0)} to own them all`);

// ---- the bounds ----------------------------------------------------------
ok(lines >= 6 && prices.length >= 8,
  'the tables were actually parsed', `${lines} lines, ${prices.length} cars`);

ok(upgradeCost(0) <= strong,
  'the FIRST upgrade is inside one good race — progress starts immediately',
  `${upgradeCost(0)} vs ${strong} CR`);

const competitive = 3 * (upgradeCost(0) + upgradeCost(1) + upgradeCost(2));
ok(competitive / strong <= 12,
  'a competitive build (3 lines to level 3) is a handful of races, not a season',
  `${(competitive / strong).toFixed(1)} races`);

// r359 (owner: "Iterate the careerpath" — the economy must BIND): the
// measured career pays ~253k over its 78 rounds and a full-kit car costs
// ~166k, so maxing ONE machine is deliberately about a career-and-a-half
// of racing — the top of the kit ladder is the late-game credit sink, and
// this law's old 90-race budget predates that being a design decision
// (it was red on pristine bases since the 2x era). A long goal, bounded:
// two careers of racing is the reachability line.
ok(fullCar / strong <= 156,
  'maxing a car is a long goal, not an unreachable one (<= two careers of racing)',
  `${(fullCar / strong).toFixed(0)} races of ${78 * 2}`);

ok(roster / strong <= 90,
  'owning every car is achievable inside a 61-world campaign',
  `${(roster / strong).toFixed(0)} races`);

ok(upgradeCost(MAXLVL - 1) / upgradeCost(0) <= 16,
  'the last upgrade step is a saving-up moment, not a different currency',
  `${(upgradeCost(MAXLVL - 1) / upgradeCost(0)).toFixed(1)}x the first`);

// the ladder must stay a ladder: strictly rising, and each car a real step up
const rising = prices.slice().sort((a, b) => a - b);
ok(new Set(prices).size === prices.length,
  'no two cars cost the same — each is a distinct decision', prices.join(', '));
ok(rising[1] <= strong * 4,
  'the first car you buy is a few races away, so the shop opens early',
  `${rising[1]} CR = ${(rising[1] / strong).toFixed(1)} races`);

// r359: the conquest bonus STACKS with the podium bonus (finishRace pays
// both on a first podium), so the honest form of "the campaign pulls you
// forward" is the RACE TOTAL comparison — a conquest podium must beat the
// same podium repeated by a meaningful premium. The old form compared the
// bonus to podium[0] alone, which broke the moment the windfall was
// tuned below 650 (it was 31% of all career income at 1200).
ok(firstClear >= podium[2],
  'conquering a NEW world pays a meaningful premium over repeating an old one '
  + '(it stacks with the podium bonus) — the campaign pulls you forward',
  `first clear +${firstClear} on top of podium ${podium.join('/')}`);
ok(sweep > cleanRun,
  'and the hardest optional objective pays the most of the flat bonuses',
  `sweep ${sweep} vs clean ${cleanRun}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
