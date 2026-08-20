/* HOW THE ROSTER UNROLLS, AND THE FLOOR UNDER IT.
 *
 * This suite used to defend a PER-WORLD STAR LADDER: every world carried a
 * price, `_freeUnlock` handed over the cheapest one you could not afford once
 * you had raced everything you could, and LADDER_SLOPE set the pace. That
 * mechanism is gone. Worlds now open by CHAPTER (see CHAPTERS in track.js):
 * one gate in front of each chapter, and every world inside an open chapter is
 * raceable immediately, in any order.
 *
 * THE PROPERTIES ARE THE SAME PROPERTIES. That is the point of rewriting this
 * file rather than deleting it — the mechanism changed, the guarantees did
 * not, and a suite that only ever knew how to check prices would have gone
 * green on a career that could strand a player:
 *
 *   - NOBODY IS EVER WALLED IN. The gate asks for 1.8 stars a world while a
 *     driver who only ever FINISHES banks exactly 1, so the gate alone strands
 *     that player permanently at chapter 2. The floor in `isChapterOpen` is
 *     what closes it: race a chapter OUT and the next opens regardless. Both
 *     halves are asserted, because either alone is a bug — the gate without
 *     the floor is a wall, the floor without the gate is no structure at all.
 *
 *   - A WORLD YOU HAVE RACED NEVER RE-LOCKS.
 *
 *   - DRIVING BETTER GETS YOU THROUGH FASTER, at every checkpoint.
 *
 *   - THE SURFACES SAY WHAT THE RULE IS. A shut chapter has to state its price
 *     somewhere a player can read it, or the padlock is just a padlock.
 *
 * Everything is driven through the game's own `chapters` / `chapterNeed` /
 * `isChapterOpen` / `isLevelUnlocked`, so a change to the chapter table cannot
 * quietly invalidate the numbers here.
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
  const { LEVELS, CHAPTER_GATE } = await import('./src/track.js');
  const out = {};
  const save = g.career.finished;
  g.unlockAll = false;
  out.gate = CHAPTER_GATE;
  out.worlds = LEVELS.length;

  // ---- the shape of the chapter table ------------------------------------
  const chs = g.chapters();
  out.n = chs.length;
  out.sizes = chs.map((c) => c.levels.length);
  out.needs = chs.map((c) => g.chapterNeed(c._k));
  // partition: every world in exactly one chapter, and chapters run in career
  // order without gaps — a chapter that is not a contiguous slice of the
  // career would put one chapter's worlds under another chapter's header
  out.covered = chs.reduce((n, c) => n + c.levels.length, 0);
  out.everyWorldPlaced = LEVELS.every((l) => g.chapterOf(l.id) >= 0);
  out.contiguous = chs.every((c, k) => k === 0 || c.start === chs[k - 1].end);
  out.startsAtZero = chs[0].start === 0;
  out.endsAtRoster = chs[chs.length - 1].end === LEVELS.length;
  // every gate is its chapter's size times the fraction, so retuning the
  // fraction cannot silently make one chapter unreachable
  out.everyGateIsScaled = chs.every((c) =>
    g.chapterNeed(c._k) === Math.ceil(c.levels.length * 3 * CHAPTER_GATE));
  // the gate must be reachable at all: you cannot need more stars than the
  // chapter can hold
  out.everyGateFits = chs.every((c) => g.chapterNeed(c._k) <= c.levels.length * 3);

  // ---- a full career, played three ways ----------------------------------
  // Every race takes the first open world never raced — the board's own
  // reading order. `openAfter` is the pacing metric.
  const career = (starsPer) => {
    g.career.finished = {};
    const trace = [];
    let races = 0;
    for (; races < 500; races++) {
      const open = LEVELS.filter((l) => g.isLevelUnlocked(l.id));
      trace.push(open.length);
      const todo = open.find((l) => !g.career.finished[l.id]);
      if (!todo) break;
      g.career.finished[todo.id] = { place: starsPer === 3 ? 1 : starsPer === 2 ? 3 : 6,
        stars: starsPer };
    }
    const at = (n) => trace[n] ?? trace[trace.length - 1];
    return { races, reached: LEVELS.filter((l) => g.isLevelUnlocked(l.id)).length,
      a3: at(3), a6: at(6), a10: at(10), a20: at(20) };
  };
  out.winner = career(3);
  out.podium = career(2);
  out.finisher = career(1);

  // ---- the gate, on its own ----------------------------------------------
  // podium every world in chapter 1 and the gate is paid without racing it out
  g.career.finished = {};
  const c0 = chs[0], c1 = chs[1];
  let banked = 0;
  for (const l of c0.levels) {
    if (banked >= g.chapterNeed(0)) break;
    g.career.finished[l.id] = { place: 1, stars: 3 };
    banked += 3;
  }
  out.paidEarly = g.isChapterOpen(1);
  out.paidEarlyUnraced = c0.levels.filter((l) => !g.career.finished[l.id]).length;
  out.paidEarlyDoesNotSkip = !g.isChapterOpen(2);

  // ---- the floor, on its own ---------------------------------------------
  // THE FLOOR HAS TO BE TESTED AGAINST A DRIVER THE GATE CAN STRAND, and that
  // is the whole reason it exists: 1 star a world against a gate wanting 1.8.
  g.career.finished = {};
  for (const l of c0.levels) g.career.finished[l.id] = { place: 6, stars: 1 };
  out.floorStars = g.chapterStars(0);
  out.floorNeed = g.chapterNeed(0);
  out.floorIsShortOfGate = out.floorStars < out.floorNeed;
  out.floorOpensAnyway = g.isChapterOpen(1);
  out.floorGrantsExactlyOne = !g.isChapterOpen(2);
  // leave ONE world in the chapter unraced and the floor is not owed
  const last = c0.levels[c0.levels.length - 1];
  delete g.career.finished[last.id];
  out.unracedHoldsTheGate = !g.isChapterOpen(1);
  out.unracedLevelsShut = c1.levels.every((l) => !g.isLevelUnlocked(l.id));

  // ---- a world you raced never re-locks ----------------------------------
  g.career.finished = {};
  const deep = chs[Math.min(4, chs.length - 1)].levels[0];
  g.career.finished[deep.id] = { place: 6, stars: 1 };
  out.racedStaysOpen = g.isLevelUnlocked(deep.id);
  out.racedChapterStillShut = !g.isChapterOpen(g.chapterOf(deep.id));

  // ---- a fresh career ----------------------------------------------------
  g.career.finished = {};
  out.freshOpen = LEVELS.filter((l) => g.isLevelUnlocked(l.id)).length;
  out.freshIsChapterOne = out.freshOpen === c0.levels.length;
  out.freshNext = g.nextTrack()?.lv?.id;
  out.freshNextIsFirst = out.freshNext === c0.levels[0].id;

  // ---- the surfaces say what the rule is ---------------------------------
  // Read at BOTH levels of the board, because they say different halves of it:
  // the chapter INDEX has to price the gate, and the world cards inside a shut
  // chapter have to say which chapter they are waiting on.
  g._chapterIn = null;
  g._renderLevelCards();
  out.keySays = document.getElementById('star-key')?.textContent || '';
  out.heading = g._ladderHeading();
  const cards = [...document.querySelectorAll('.chapter-card')];
  out.headCount = cards.length;
  out.indexHasNoWorlds = document.querySelectorAll('#level-select .level-chip').length === 0;
  out.shutHeadSays = cards[1]?.textContent?.replace(/\s+/g, ' ') || '';
  out.shutHeadIsLocked = !!cards[1]?.classList.contains('locked');
  // ...then enter the shut chapter — you are allowed to look at what you are
  // working toward, and what you see there must still read as locked
  g._chapterIn = c1.n;
  g._renderLevelCards();
  const shutCard = document.querySelector(`#level-select .level-chip[data-lvid="${c1.levels[0].id}"]`);
  out.shutCardLocked = !!shutCard && shutCard.classList.contains('locked');
  out.shutCardSays = shutCard?.querySelector('.wc-best')?.textContent || '';
  out.shutChapterEnterable = !!shutCard;
  g._chapterIn = null;

  g.career.finished = save;
  g._renderLevelCards();
  return out;
});

console.log('\n--- the shape of the chapter table ---');
console.log(`  ${R.n} chapters over ${R.worlds} worlds: sizes ${R.sizes.join('/')}`);
console.log(`  gates: ${R.needs.join('/')}★  (fraction ${R.gate})`);
ok(R.covered === R.worlds && R.everyWorldPlaced,
  'every world is in exactly one chapter', `${R.covered} of ${R.worlds}`);
ok(R.contiguous && R.startsAtZero && R.endsAtRoster,
  'and the chapters are contiguous slices of career order, covering all of it');
ok(R.n >= 6, 'the roster is broken into enough parts to read as chapters', `${R.n}`);
ok(R.everyGateIsScaled,
  `every gate is its chapter's stars times the fraction (${R.gate})`);
ok(R.everyGateFits, 'and no gate asks for more stars than its chapter can hold');

console.log('\n--- how fast the roster unrolls ---');
console.log(`  winner   open after 3/6/10/20 races: ${R.winner.a3}/${R.winner.a6}/${R.winner.a10}/${R.winner.a20}`);
console.log(`  podium   open after 3/6/10/20 races: ${R.podium.a3}/${R.podium.a6}/${R.podium.a10}/${R.podium.a20}`);
console.log(`  finisher open after 3/6/10/20 races: ${R.finisher.a3}/${R.finisher.a6}/${R.finisher.a10}/${R.finisher.a20}`);
ok(R.winner.a20 >= R.podium.a20 && R.podium.a20 >= R.finisher.a20,
  'racing better opens the roster faster, or at least never slower',
  JSON.stringify({ w: R.winner.a20, p: R.podium.a20, f: R.finisher.a20 }));
ok(R.winner.a20 > R.finisher.a20,
  'and by twenty races a winner is genuinely ahead of a last-place finisher',
  `${R.winner.a20} vs ${R.finisher.a20}`);

console.log('\n--- nobody is ever walled in ---');
for (const [name, r] of [['winner', R.winner], ['podium', R.podium], ['finisher', R.finisher]]) {
  ok(r.reached === R.worlds && r.races === R.worlds,
    `a ${name} reaches all ${R.worlds} worlds, in ${R.worlds} races`,
    `reached ${r.reached}, raced ${r.races}`);
}

console.log('\n--- the gate ---');
ok(R.paidEarly, 'pay the gate and the next chapter opens with worlds still unraced behind you',
  `${R.paidEarlyUnraced} left unraced in chapter 1`);
ok(R.paidEarlyUnraced > 0, 'and that is a real shortcut, not a full clear in disguise',
  `${R.paidEarlyUnraced} unraced`);
ok(R.paidEarlyDoesNotSkip, 'paying one gate opens ONE chapter, not the rest of the roster');

console.log('\n--- the floor ---');
ok(R.floorIsShortOfGate,
  'the worst driver in the game cannot pay the gate — which is why there is a floor',
  `${R.floorStars}★ banked against ${R.floorNeed}★ wanted`);
ok(R.floorOpensAnyway, 'race the chapter out and the next one opens regardless of stars');
ok(R.floorGrantsExactlyOne, 'exactly one chapter is granted — the rest stay shut');
ok(R.unracedHoldsTheGate, 'leave one world in the chapter unraced and nothing is granted');
ok(R.unracedLevelsShut, 'and every world of the next chapter is still locked');

console.log('\n--- a world you have raced is yours ---');
ok(R.racedStaysOpen, 'it stays open even though its chapter has not been reached');
ok(R.racedChapterStillShut, 'and racing it does not open the chapter around it');

console.log('\n--- a fresh career ---');
ok(R.freshIsChapterOne, 'opens exactly chapter one', `${R.freshOpen} worlds open`);
ok(R.freshNextIsFirst, 'and points at its first world');

console.log('\n--- and the surfaces say so ---');
ok(R.headCount === R.n && R.indexHasNoWorlds,
  'the board opens on an index — one card per chapter, no world cards',
  `${R.headCount} chapter cards of ${R.n}`);
ok(/CHAPTER 1 OF /.test(R.heading), 'the heading says which chapter you are in', R.heading);
ok(/CHAPTER 2/.test(R.keySays) && /★/.test(R.keySays),
  'the star key names the next chapter and what it costs', R.keySays.slice(0, 170));
ok(/OR RACE ALL/.test(R.keySays),
  'and states the floor too — a player who cannot podium must be told the other way through',
  R.keySays.slice(0, 170));
ok(R.shutHeadIsLocked && /NEEDS \d+★/.test(R.shutHeadSays),
  'a shut chapter draws as shut and prices its gate', R.shutHeadSays.slice(0, 120));
ok(R.shutChapterEnterable,
  'you can still enter a shut chapter to see what you are working toward');
ok(R.shutCardLocked, 'and its worlds draw as locked');
ok(/CHAPTER/.test(R.shutCardSays),
  'each naming the chapter it is waiting on, not a per-world price that no longer exists',
  R.shutCardSays);

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
