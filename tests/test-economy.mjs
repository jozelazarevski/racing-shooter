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
const firstClear = num(/const FIRST_CLEAR_CR = ([0-9]+);/, 'FIRST_CLEAR_CR');
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

ok(fullCar / strong <= 90,
  'maxing a car is a long goal, not an unreachable one',
  `${(fullCar / strong).toFixed(0)} races`);

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

ok(firstClear >= podium[0],
  'conquering a NEW world pays more than repeating an old one — the campaign '
  + 'pulls you forward', `first clear ${firstClear} vs podium ${podium[0]}`);
ok(sweep > cleanRun,
  'and the hardest optional objective pays the most of the flat bonuses',
  `sweep ${sweep} vs clean ${cleanRun}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
