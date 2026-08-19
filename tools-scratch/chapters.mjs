/* THE CHAPTER LADDER, DRIVEN. Three player profiles walk the whole career and
 * the run reports what opens when — the same shape of simulation the old star
 * ladder was tuned against, restated for chapters.
 *
 * The property that matters most is the FLOOR: a driver who only ever FINISHES
 * banks 1 star a world against a gate asking 1.8, so without the "race the
 * chapter out and the next one opens" rule they are walled in permanently.
 * That is asserted, not assumed. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 900, height: 700 } });
p.setDefaultTimeout(600000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const R = await p.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = { chapters: [], errors: [] };
  g.unlockAll = false;
  const save = g.career.finished;

  const chs = g.chapters();
  out.nChapters = chs.length;
  out.worlds = LEVELS.length;
  let covered = 0;
  for (const c of chs) {
    covered += c.levels.length;
    out.chapters.push({ n: c.n, name: c.name, size: c.levels.length,
      first: c.levels[0].name, last: c.levels[c.levels.length - 1].name,
      need: g.chapterNeed(c._k), max: c.levels.length * 3 });
  }
  out.covered = covered;

  // every world lands in exactly one chapter
  out.everyWorldPlaced = LEVELS.every((l) => g.chapterOf(l.id) >= 0);
  out.noDoubleCount = covered === LEVELS.length;

  // ---- three careers -----------------------------------------------------
  const career = (starsPer) => {
    g.career.finished = {};
    const trace = [];
    let races = 0;
    for (; races < 400; races++) {
      const open = LEVELS.filter((l) => g.isLevelUnlocked(l.id));
      trace.push(open.length);
      const todo = open.find((l) => !g.career.finished[l.id]);
      if (!todo) break;
      g.career.finished[todo.id] = { place: starsPer === 3 ? 1 : starsPer === 2 ? 3 : 6,
        stars: starsPer };
    }
    const reached = LEVELS.filter((l) => g.isLevelUnlocked(l.id)).length;
    const at = (n) => trace[n] ?? trace[trace.length - 1];
    return { races, reached, a3: at(3), a6: at(6), a10: at(10), a20: at(20) };
  };
  out.winner = career(3);
  out.podium = career(2);
  out.finisher = career(1);

  // ---- the floor, on its own --------------------------------------------
  // the worst driver in the game: finish last, every time, forever
  g.career.finished = {};
  const first = g.chapters()[0];
  for (const l of first.levels) g.career.finished[l.id] = { place: 6, stars: 1 };
  out.floorStars = g.chapterStars(0);
  out.floorNeed = g.chapterNeed(0);
  out.floorIsShortOfGate = out.floorStars < out.floorNeed;
  out.floorOpensAnyway = g.isChapterOpen(1);

  // and it does NOT open the one after that
  out.floorGrantsExactlyOne = !g.isChapterOpen(2);

  // leave one world in the chapter unraced and the floor is not owed
  g.career.finished = {};
  for (const l of first.levels.slice(0, -1)) g.career.finished[l.id] = { place: 6, stars: 1 };
  out.unracedHoldsTheGate = !g.isChapterOpen(1);

  // ---- a raced world never re-locks --------------------------------------
  g.career.finished = {};
  const deep = g.chapters()[4].levels[0];
  g.career.finished[deep.id] = { place: 6, stars: 1 };
  out.racedStaysOpen = g.isLevelUnlocked(deep.id);

  // ---- fresh save: chapter 1 open, chapter 2 shut ------------------------
  g.career.finished = {};
  out.freshOpen = LEVELS.filter((l) => g.isLevelUnlocked(l.id)).length;
  out.freshChapter1 = g.isChapterOpen(0);
  out.freshChapter2 = g.isChapterOpen(1);
  out.freshGateLine = g.chapterGateLine();
  out.freshNext = g.nextTrack()?.lv?.name;
  out.heading = g._ladderHeading();

  g.career.finished = save;
  return out;
});
console.log(`chapters ${R.nChapters}, worlds ${R.worlds}, covered ${R.covered}`);
console.log('  n  size  need/max  first world                last world');
for (const c of R.chapters) {
  console.log(`  ${String(c.n).padStart(2)} ${String(c.size).padStart(4)}  ${String(c.need).padStart(3)}/${String(c.max).padEnd(3)}  ${c.first.padEnd(24)} ${c.last}`);
}
console.log('\nevery world in exactly one chapter:', R.everyWorldPlaced && R.noDoubleCount);
console.log('fresh save: worlds open', R.freshOpen, '| ch1', R.freshChapter1, '| ch2', R.freshChapter2);
console.log('  next:', R.freshNext, '\n  gate:', R.freshGateLine, '\n  head:', R.heading);
console.log('\ncareer walk (worlds open after N races):');
for (const [k, v] of [['winner', R.winner], ['podium', R.podium], ['finisher', R.finisher]]) {
  console.log(`  ${k.padEnd(9)} races ${String(v.races).padStart(3)}  reached ${String(v.reached).padStart(3)}/${R.worlds}   @3 ${v.a3}  @6 ${v.a6}  @10 ${v.a10}  @20 ${v.a20}`);
}
console.log('\nthe floor:');
console.log('  finisher banks', R.floorStars, 'in chapter 1, gate wants', R.floorNeed, '=> short:', R.floorIsShortOfGate);
console.log('  chapter 2 opens anyway:', R.floorOpensAnyway, '| grants exactly one:', R.floorGrantsExactlyOne);
console.log('  one world left unraced holds the gate:', R.unracedHoldsTheGate);
console.log('  a raced world never re-locks:', R.racedStaysOpen);
if (errs.length) console.log('\nPAGE ERRORS:', errs.slice(0, 3));
await b.close();
