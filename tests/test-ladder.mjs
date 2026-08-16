/* HOW FAST THE ROSTER UNROLLS, AND THE FLOOR UNDER IT.
 *
 * Reported as "tracks are opening too fast". Measured on the shipped ladder,
 * a player who wins every race had 19 of the 60 worlds open after three races
 * and 58 of 60 after ten — the entire roster on the table before they had met
 * a quarter of it. The price was one star per rung, and that number was
 * load-bearing for a reason: a driver who only ever FINISHES banks exactly 1★
 * a race, so any steeper slope eventually walls them in permanently.
 *
 * So the wall is closed by a RULE and the pace is set by a NUMBER, instead of
 * one number doing both jobs badly:
 *   - `_freeUnlock` — clear everything you can afford and the cheapest world
 *     you cannot opens anyway. Progress is never slower than one world a race,
 *     whatever the price.
 *   - `isLevelUnlocked` never re-locks a world you have raced, without which
 *     a world opened by the floor slams shut the moment the ladder's own price
 *     overtakes your total, and the floor spends forever re-offering a world
 *     that is already behind you.
 *   - LADDER_SLOPE — free to be a difficulty knob now that nothing depends on
 *     it for safety.
 *
 * What this suite defends is the PAIR. Either half alone is a bug: the slope
 * without the floor strands the weakest driver, the floor without the slope
 * changes nothing. Both halves are asserted against the real 60-world price
 * table, by driving the game's own `starCost` / `isLevelUnlocked`, so a change
 * to the table cannot quietly invalidate the numbers here.
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
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const { LADDER_SLOPE } = await import('./src/main.js');
  const out = {};
  const save = g.career.finished;
  g.career.finished = {};
  out.slope = LADDER_SLOPE;

  /** Race, badly or well, every world you can currently AFFORD — the state the
   *  floor is defined against. Racing the free three is not enough: at any
   *  slope the stars they bank immediately buy the next rung. */
  const raceAllAffordable = (starsPer) => {
    for (let i = 0; i < 400; i++) {
      const todo = LEVELS.find((l) => g.starCost(l.id) <= g.totalStars() && !g.career.finished[l.id]);
      if (!todo) return;
      g.career.finished[todo.id] = { place: starsPer === 3 ? 1 : 6, stars: starsPer };
    }
  };

  // ---- the shape of the price table --------------------------------------
  const costs = LEVELS.map((l) => g.starCost(l.id));
  out.free = costs.filter((c) => c === 0).length;
  out.maxCost = Math.max(...costs);
  out.maxStars = LEVELS.length * 3;
  out.firstPriced = costs[3];
  // every price is its RUNG times the slope — including a level carrying its
  // own `cost`, which is a rung too. Without that, retuning the slope silently
  // re-orders the roster around the hand-priced regions.
  out.everyPriceIsScaled = LEVELS.every((l, i) => {
    const rung = l.cost != null ? l.cost : (i < 3 ? 0 : i - 2);
    return g.starCost(l.id) === Math.round(rung * LADDER_SLOPE);
  });
  const owned = LEVELS.filter((l) => l.cost != null);
  out.ownedCount = owned.length;
  out.ownedScaled = owned.every((l) => g.starCost(l.id) === Math.round(l.cost * LADDER_SLOPE));

  // ---- a full career, played three ways ----------------------------------
  // Every race takes the cheapest OPEN world never raced, exactly as the
  // ladder intends it to be walked, and banks a fixed result. `openAfter` is
  // the metric the report was about: how much of the roster is on the table.
  const career = (starsPer) => {
    g.career.finished = {};
    const trace = [];
    let races = 0;
    for (; races < 400; races++) {
      const open = LEVELS.filter((l) => g.isLevelUnlocked(l.id));
      trace.push(open.length);
      const todo = open.filter((l) => !g.career.finished[l.id])
        .sort((a, b) => g.starCost(a.id) - g.starCost(b.id))[0];
      if (!todo) break;
      g.career.finished[todo.id] = { place: starsPer === 3 ? 1 : starsPer === 2 ? 3 : 6,
        stars: starsPer };
    }
    const reached = LEVELS.filter((l) => g.isLevelUnlocked(l.id)).length;
    const at = (n) => trace[n] ?? trace[trace.length - 1];
    return { races, reached, a3: at(3), a10: at(10), a20: at(20) };
  };
  out.winner = career(3);
  out.podium = career(2);
  out.finisher = career(1);
  out.worlds = LEVELS.length;

  // ---- the floor, on its own ---------------------------------------------
  g.career.finished = {};
  out.freshOwesNothing = g._freeUnlock() === null;     // three free worlds unraced
  raceAllAffordable(1);                                // the worst driver in the game
  out.finisherStars = g.totalStars();
  const owed = g._freeUnlock();
  out.owedAfterFree = owed;
  out.owedIsPricedOut = owed != null && g.starCost(owed) > g.totalStars();
  out.owedIsCheapestLocked = owed != null && LEVELS
    .filter((l) => g.starCost(l.id) > g.totalStars())
    .every((l) => g.starCost(l.id) >= g.starCost(owed));
  out.owedIsOpen = owed != null && g.isLevelUnlocked(owed);
  // and it grants exactly ONE — everything dearer stays shut
  out.grantsExactlyOne = LEVELS
    .filter((l) => l.id !== owed && g.starCost(l.id) > g.totalStars())
    .every((l) => !g.isLevelUnlocked(l.id));
  // leave one affordable world unraced and the debt is cancelled
  const cheap = LEVELS.find((l) => g.starCost(l.id) === 0);
  delete g.career.finished[cheap.id];
  out.unracedCancelsTheDebt = g._freeUnlock() === null;

  // ---- a world you raced never re-locks ----------------------------------
  g.career.finished = {};
  const dear = LEVELS.find((l) => g.starCost(l.id) > 0);
  g.career.finished[dear.id] = { place: 6, stars: 1 };   // raced it via the floor
  out.racedStaysOpen = g.isLevelUnlocked(dear.id) && g.starCost(dear.id) > g.totalStars();
  out.racedNotReOffered = g._freeUnlock() !== dear.id;

  // ---- the surfaces say what the rule is ---------------------------------
  g.career.finished = {};
  raceAllAffordable(1);
  const freeId = g._freeUnlock();
  g._renderLevelCards();
  const card = document.querySelector(`#level-select .level-chip[data-lvid="${freeId}"]`);
  out.cardOpen = !!card && !card.classList.contains('locked');
  out.cardSays = card?.querySelector('.wc-best')?.textContent || '';
  out.keySays = document.getElementById('star-key')?.textContent || '';

  g.career.finished = save;
  g._renderLevelCards();
  return out;
});

console.log('\n--- the price table ---');
ok(R.free === 3, 'three worlds are free, so there is a choice from the first race', `${R.free}`);
ok(R.firstPriced > 1,
  'the ladder costs more than one star a rung — the report was that it did not',
  `${R.firstPriced}★ for the first priced rung`);
ok(R.maxCost < R.maxStars * 0.6,
  'and the dearest world is still well inside what the roster can pay',
  `${R.maxCost}★ of ${R.maxStars}`);
ok(R.everyPriceIsScaled, `every price is its rung times the slope (${R.slope})`);
ok(R.ownedCount > 0 && R.ownedScaled,
  `including all ${R.ownedCount} hand-priced worlds, so the running order cannot shift`);

console.log('\n--- how fast the roster unrolls ---');
console.log(`  winner   open after 3/10/20 races: ${R.winner.a3}/${R.winner.a10}/${R.winner.a20}`);
console.log(`  podium   open after 3/10/20 races: ${R.podium.a3}/${R.podium.a10}/${R.podium.a20}`);
console.log(`  finisher open after 3/10/20 races: ${R.finisher.a3}/${R.finisher.a10}/${R.finisher.a20}`);
ok(R.winner.a3 <= 10,
  'winning your first three races does not put a sixth of the roster on the table',
  `${R.winner.a3} of ${R.worlds} open`);
ok(R.winner.a10 <= 40,
  'and ten races in, most of the roster is still ahead of you',
  `${R.winner.a10} of ${R.worlds} open`);
ok(R.winner.a20 < R.worlds,
  'the roster is not fully open even at twenty races', `${R.winner.a20} of ${R.worlds}`);
ok(R.winner.a3 >= 4 && R.winner.a10 >= 15,
  'but a winner is always visibly ahead of where they started',
  `${R.winner.a3} / ${R.winner.a10}`);
ok(R.winner.a3 >= R.podium.a3 && R.podium.a3 >= R.finisher.a3
  && R.winner.a10 >= R.podium.a10 && R.podium.a10 >= R.finisher.a10,
  'and racing better opens the roster faster, at every checkpoint',
  JSON.stringify({ w: R.winner.a10, p: R.podium.a10, f: R.finisher.a10 }));

console.log('\n--- nobody is ever walled in ---');
for (const [name, r] of [['winner', R.winner], ['podium', R.podium], ['finisher', R.finisher]]) {
  ok(r.reached === R.worlds && r.races === R.worlds,
    `a ${name} reaches all ${R.worlds} worlds, in ${R.worlds} races`,
    `reached ${r.reached}, raced ${r.races}`);
}

console.log('\n--- the floor ---');
ok(R.freshOwesNothing, 'a fresh career is owed nothing — the free worlds are unraced');
ok(R.owedAfterFree != null && R.owedIsPricedOut,
  'race everything you can afford and a world you cannot afford opens',
  `id ${R.owedAfterFree} at ${R.finisherStars}★ in hand`);
ok(R.owedIsCheapestLocked, 'and it is the cheapest one, not an arbitrary one');
ok(R.owedIsOpen, 'the unlock check agrees with the grant');
ok(R.grantsExactlyOne, 'exactly one is granted — the rest of the ladder is untouched');
ok(R.unracedCancelsTheDebt,
  'leave one affordable world unraced and nothing is granted');

console.log('\n--- a world you have raced is yours ---');
ok(R.racedStaysOpen, 'it stays open even when the ladder prices it above your total');
ok(R.racedNotReOffered, 'and the floor does not keep re-offering it');

console.log('\n--- and the surfaces say so ---');
ok(R.cardOpen, 'the granted world draws as open, not locked');
ok(/OPEN ANYWAY/.test(R.cardSays), 'its card explains why it is open', R.cardSays);
ok(/RACED EVERYTHING OPEN/.test(R.keySays),
  'and the star key stops quoting a price at a world you can already drive',
  R.keySays.slice(0, 160));

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
