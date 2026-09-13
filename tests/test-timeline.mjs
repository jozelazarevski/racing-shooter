/* THE ROSTER AS A LADDER, OPENED WHERE YOU LEFT OFF.
 *
 * Asked for as "track leveling and timeline; show available tracks; auto
 * scroll to the available next track".
 *
 * Sixty worlds in a region-grouped grid answer "show me a night rally in the
 * desert" well and "what do I race next" not at all — the one card that
 * matters is somewhere in a wall of sixty, and the player has to know the
 * unlock rule to find it. The TIMELINE view lays the same roster out in
 * career order, which IS the price order (starCost counts rungs), badges the
 * rung you are up to, and scrolls to it.
 *
 * The checks that matter, and why each one is here:
 *   - ONE UNBROKEN LADDER. Regions do not own contiguous blocks of career
 *     order — PINE VALLEY holds rungs 1, 6, 11, 12, 13 — so a timeline that
 *     kept the region headers counted "1, 6, 11, 3" and read as broken. The
 *     first cut did exactly that; this pins the fix.
 *   - nextTrack() in each of its three situations, because they are three
 *     different questions and the wrong answer sends the player to the wrong
 *     card.
 *   - THE SCROLL ACTUALLY MOVES, and lands the card on screen. A scroll that
 *     silently no-ops is the whole feature failing quietly.
 *   - REGIONS still works, because two views exist on purpose and the
 *     browsing one is what the filters were built for.
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

// ---- the board is two levels: a chapter index, and one chapter at a time ---
//
// The timeline view used to be one run of every world on the roster. It is now
// a drill-down — reported as "package them in separate sections that I can
// enter ... no endless scrolling" — so what this block checks is that the
// index is an INDEX (chapters, no worlds) and that entering one shows THAT
// chapter and nothing else.
const ladder = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.career.finished = {};
  g._chapterIn = null;
  g._setTracksView('timeline');
  const sel = document.getElementById('level-select');
  const out = {
    view: g.tracksView,
    tlClass: sel.classList.contains('tl-view'),
    chapters: g.chapters().length,
    worlds: LEVELS.length,
    heading: g._ladderHeading(),
    // the index
    idxChapterCards: sel.querySelectorAll('.chapter-card').length,
    idxWorldCards: sel.querySelectorAll('.level-chip').length,
    idxNames: [...sel.querySelectorAll('.chapter-card .cc-name')].map((e) => e.textContent),
    // ...and none of the REGIONS view's furniture, which would mean the board
    // had fallen back to grouping the progression by region
    idxRegionRows: sel.querySelectorAll('.region-row').length,
  };
  // ENTER a chapter, by clicking it, exactly as a player would
  const mid = g.chapters()[3];
  [...sel.querySelectorAll('.chapter-card')]
    .find((c) => +c.dataset.chn === mid.n)?.click();
  const cards = [...sel.querySelectorAll('.level-chip')];
  out.inN = mid.n;
  out.inSize = mid.levels.length;
  out.inCards = cards.length;
  out.inIds = cards.map((c) => +c.dataset.lvid);
  out.inWant = mid.levels.map((l) => l.id);
  out.inChapterCards = sel.querySelectorAll('.chapter-card').length;
  out.inBar = !!document.querySelector('#topbar:not(.hidden)');
  out.inRungs = cards.map((c) => +c.dataset.rung);
  // BACK OUT again
  document.getElementById('topbar-back')?.click();
  out.backToIndex = sel.querySelectorAll('.chapter-card').length === out.idxChapterCards
    && sel.querySelectorAll('.level-chip').length === 0;
  // ...and the whole roster is still reachable, chapter by chapter
  let seen = 0;
  for (const c of g.chapters()) {
    g._chapterIn = c.n;
    g._renderLevelCards();
    seen += sel.querySelectorAll('.level-chip').length;
  }
  out.everyWorldReachable = seen;
  g._chapterIn = null;
  g._renderLevelCards();
  return out;
});
ok(ladder.view === 'timeline' && ladder.tlClass, 'timeline is the default view');
ok(ladder.idxChapterCards === ladder.chapters && ladder.idxWorldCards === 0,
  'it opens on a chapter INDEX — one card per chapter, and not a single world card',
  `${ladder.idxChapterCards} chapter cards / ${ladder.idxWorldCards} world cards`);
ok(ladder.idxRegionRows === 0,
  'and the index is not the region view wearing a hat', `${ladder.idxRegionRows} region rows`);
ok(ladder.inCards === ladder.inSize && ladder.inChapterCards === 0 && ladder.inBar,
  `entering chapter ${ladder.inN} shows its ${ladder.inSize} worlds, and only those`,
  `${ladder.inCards} cards, ${ladder.inChapterCards} chapter cards, bar:${ladder.inBar}`);
ok(JSON.stringify(ladder.inIds) === JSON.stringify(ladder.inWant),
  'exactly the worlds that chapter holds, in career order',
  `${ladder.inIds.join(',')} vs ${ladder.inWant.join(',')}`);
ok(ladder.inRungs.every((r, i) => i === 0 || r === ladder.inRungs[i - 1] + 1),
  'their rungs still run consecutively — a chapter is a contiguous slice of the career',
  `got ${ladder.inRungs.join(',')}`);
ok(ladder.backToIndex, 'and backing out returns to the index');
ok(ladder.everyWorldReachable === ladder.worlds,
  'every world on the roster is reachable by entering some chapter',
  `${ladder.everyWorldReachable} of ${ladder.worlds}`);
ok(/CHAPTER \d+ OF \d+/.test(ladder.heading) && /OPEN/.test(ladder.heading),
  'the heading states which chapter you are in and how far along the roster',
  ladder.heading);
ok(ladder.idxNames.length === ladder.chapters && ladder.idxNames.every((n) => n.trim()),
  'and every chapter card names itself', ladder.idxNames.slice(0, 3).join(' / '));

// ---- available vs locked is stated on the card ----------------------------
// Read across TWO chapters: the open one and the shut one after it, because a
// board where every card is open cannot demonstrate that a locked card says
// what it is waiting on. The index shows no world cards at all, so this has to
// enter them.
const states = await page.evaluate(() => {
  const g = window.__game;
  const cards = [];
  for (const n of [g.chapters()[0].n, g.chapters()[1].n]) {
    g._chapterIn = n;
    g._renderLevelCards();
    cards.push(...document.querySelectorAll('#level-select .level-chip'));
  }
  const read = (c) => ({
    id: +c.dataset.lvid,
    locked: c.classList.contains('locked'),
    state: c.querySelector('.tl-state')?.textContent || '',
    gate: c.querySelector('.wc-best')?.textContent || '',
  });
  const rows = cards.map(read);
  return {
    open: rows.filter((r) => !r.locked).length,
    everyOpenSaysSo: rows.filter((r) => !r.locked).every((r) => r.state && r.state !== 'LOCKED'),
    everyLockedSaysSo: rows.filter((r) => r.locked).every((r) => r.state === 'LOCKED'),
    // A LOCKED RUNG SAYS WHAT STANDS IN FRONT OF IT. That used to be a star
    // price per world (`NEEDS 27★`); under chapters no world has a price of
    // its own, so what a locked card owes the player is the CHAPTER it is
    // waiting on — and the chapter's own header carries the number.
    // CP2 (r348): the one exception is a chapter's own FINALE, whose door is
    // inside its own chapter — its card prices that door instead
    lockedGatesPriced: rows.filter((r) => r.locked)
      .every((r) => /CHAPTER \d+/.test(r.gate) || /FINALE — \d+★ OR RACE/.test(r.gate)),
    matchesRule: rows.every((r) => r.locked !== g.isLevelUnlocked(r.id)),
    chapterOneSize: g.chapters()[0].levels.length,
    finaleShut: !g.isLevelUnlocked(g.finaleOf(0).id),
    lockedSeen: rows.filter((r) => r.locked).length,
  };
});
ok(states.open === states.chapterOneSize - 1 && states.finaleShut,
  'a fresh career shows the first chapter as available, its finale shut (CP2)',
  `${states.open} open, chapter 1 holds ${states.chapterOneSize}`);
ok(states.lockedSeen > 0,
  'and the second chapter really is shut — otherwise the checks below prove nothing',
  `${states.lockedSeen} locked cards seen`);
ok(states.everyOpenSaysSo && states.everyLockedSaysSo, 'every rung states whether it is open or locked');
ok(states.lockedGatesPriced,
  'and a locked rung names the chapter it is waiting on, not just that it is shut');
ok(states.matchesRule, 'the lock drawn on the card is the lock the game enforces');

// ---- nextTrack, in each of its three situations ---------------------------
const next = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = {};
  // 1. nothing raced: the first rung you can enter
  g.career.finished = {};
  out.fresh = { name: g.nextTrack()?.lv.name, why: g.nextTrack()?.why, first: LEVELS[0].name };
  // 2. some cleared: the first OPEN rung you have never driven
  g.career.finished = { [LEVELS[0].id]: { place: 1, stars: 3 }, [LEVELS[1].id]: { place: 1, stars: 3 } };
  out.partway = { name: g.nextTrack()?.lv.name, why: g.nextTrack()?.why, expect: LEVELS[2].name };
  // 3. everything open is raced, one still holding stars → go back for them.
  //    The old `_freeUnlock` term is gone with the per-world floor it guarded
  //    against: under chapters, winning everything simply opens the next
  //    chapter, so the loop terminates on its own once the roster runs out.
  g.career.finished = {};
  let guard = 0;
  while (guard++ < 200) {
    const missing = LEVELS.filter((l) => g.isLevelUnlocked(l.id) && !g.career.finished[l.id]);
    if (!missing.length) break;
    for (const l of missing) g.career.finished[l.id] = { place: 1, stars: 3 };
  }
  g.career.finished[LEVELS[4].id] = { place: 3, stars: 2 };   // one left unfinished
  out.starsLeft = { name: g.nextTrack()?.lv.name, why: g.nextTrack()?.why, expect: LEVELS[4].name };
  // 4. THE FLOOR, which is now a CHAPTER floor. Built on the driver it exists
  //    for — one who only ever finishes last, and so can never pay a gate that
  //    asks 1.8 stars a world. Race chapter one out at P6 and chapter two has
  //    to be open anyway, with something in it to drive.
  g.career.finished = {};
  const c0 = g.chapters()[0], c1 = g.chapters()[1];
  for (const l of c0.levels) g.career.finished[l.id] = { place: 6, stars: 1 };
  const nt = g.nextTrack();
  out.floor = { why: nt?.why, name: nt?.lv.name,
    granted: c1.name, open: g.isChapterOpen(1),
    short: g.chapterNeed(0) - g.chapterStars(0),        // they never paid the gate
    inNextChapter: c1.levels.some((l) => l.id === nt?.lv.id),
    stars: g.totalStars(), raced: Object.keys(g.career.finished).length };
  g.career.finished = {};
  return out;
});
ok(next.fresh.why === 'unraced' && next.fresh.name === next.fresh.first,
  'a fresh career points at the first rung', JSON.stringify(next.fresh));
ok(next.partway.why === 'unraced' && next.partway.name === next.partway.expect,
  'partway through, it points at the first OPEN rung never driven', JSON.stringify(next.partway));
ok(next.starsLeft.why === 'stars' && next.starsLeft.name === next.starsLeft.expect,
  'with everything driven, it points at the world still holding stars', JSON.stringify(next.starsLeft));
ok(next.floor.open && next.floor.short > 0,
  'a driver who only ever finishes last opens the next chapter without paying its gate',
  JSON.stringify(next.floor));
ok(next.floor.inNextChapter,
  'and is pointed at a world inside it, not back at what they just raced',
  JSON.stringify(next.floor));
ok(next.floor.why && next.floor.why !== 'locked',
  'so the answer is never a padlock to look at — there is no shut-gate state left',
  JSON.stringify(next.floor));

// ---- the auto-scroll actually moves, and lands the card on screen ---------
const scroll = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  // far enough down the ladder that the card is well off-screen at rest
  g.career.finished = {};
  for (let k = 0; k < 12; k++) g.career.finished[LEVELS[k].id] = { place: 1, stars: 3 };
  // ...and INSIDE the chapter that holds it. At the index there are no world
  // cards at all, so the scroll would have nothing to aim at — which is the
  // index doing its job, not the scroll failing. The chapter card case is
  // covered separately below.
  g._chapterIn = g.chapters()[g.chapterOf(g.nextTrack().lv.id)].n;
  g._renderLevelCards();
  const sel = document.getElementById('level-select');
  const scroller = sel.closest('.screen');
  scroller.scrollTop = 0;
  const want = g.nextTrack().lv.id;
  const card = sel.querySelector(`.level-chip[data-lvid="${want}"]`);
  const before = scroller.scrollTop;
  const got = g._scrollToNextTrack('auto');
  const after = scroller.scrollTop;
  const cRect = card.getBoundingClientRect();
  const sRect = scroller.getBoundingClientRect();
  return { want, got, before, after,
    onScreen: cRect.top >= sRect.top - 1 && cRect.bottom <= sRect.bottom + 1,
    badged: card.classList.contains('next') && !!card.querySelector('.tl-next'),
    badgeCount: sel.querySelectorAll('.tl-next').length };
});
ok(scroll.got === scroll.want, 'the scroll targets the next track', JSON.stringify(scroll));
ok(scroll.after > scroll.before, 'and it actually moves the list', `${scroll.before} → ${scroll.after}`);
ok(scroll.onScreen, 'the next track ends up fully on screen');
ok(scroll.badged && scroll.badgeCount === 1, 'exactly one rung wears the NEXT badge', `${scroll.badgeCount}`);

// ---- and from the INDEX, it aims at the chapter that holds it -------------
const idxScroll = await page.evaluate(() => {
  const g = window.__game;
  g._chapterIn = null;
  g._renderLevelCards();
  const sel = document.getElementById('level-select');
  const scroller = sel.closest('.screen');
  scroller.scrollTop = 0;
  const want = g.nextTrack().lv.id;
  const wantCh = g.chapters()[g.chapterOf(want)].n;
  const got = g._scrollToNextTrack('auto');
  const here = sel.querySelector('.chapter-card.here');
  return { got, want, wantCh, hereN: here ? +here.dataset.chn : null,
    worldCards: sel.querySelectorAll('.level-chip').length };
});
ok(idxScroll.worldCards === 0 && idxScroll.got === idxScroll.want,
  'at the index it still answers WHICH world is next, with no world card on the page',
  JSON.stringify(idxScroll));
ok(idxScroll.hereN === idxScroll.wantCh,
  'and the chapter holding it is the one marked as where you are',
  JSON.stringify(idxScroll));

// ---- a card the filter has hidden is not somewhere to scroll to -----------
const filtered = await page.evaluate(() => {
  const g = window.__game;
  const sel = document.getElementById('level-select');
  const scroller = sel.closest('.screen');
  // a search flattens the board across every chapter, so this exercises the
  // no-match case on the flat list rather than inside one chapter
  g._chapterIn = null;
  g.filters.q = 'zzzznotaworld';
  g._applyWorldFilter();
  scroller.scrollTop = 0;
  const got = g._scrollToNextTrack('auto');
  const moved = scroller.scrollTop;
  g.filters.q = '';
  g._applyWorldFilter();
  return { got, moved };
});
ok(filtered.got === null && filtered.moved === 0,
  'a filtered-out next track is left alone rather than scrolled to', JSON.stringify(filtered));

// ---- REGIONS still works, and the choice sticks ---------------------------
const regions = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g._setTracksView('regions');
  const sel = document.getElementById('level-select');
  const stored = localStorage.getItem('ir-tracks-view');
  const heads = [...sel.querySelectorAll('.region-head')].map((h) => h.textContent);
  const out = {
    tlClass: sel.classList.contains('tl-view'),
    heads: heads.length,
    regions: new Set(LEVELS.map((l) => l.region || 'CHAMPIONSHIP')).size,
    stored,
    cards: sel.querySelectorAll('.level-chip').length,
    stillBadged: sel.querySelectorAll('.tl-next').length,
  };
  g._setTracksView('timeline');
  return out;
});
ok(!regions.tlClass && regions.heads === regions.regions,
  'REGIONS restores a header per region', `${regions.heads} of ${regions.regions}`);
ok(regions.cards === ladder.worlds, 'with every world still listed');
ok(regions.stored === 'regions', 'and the chosen view is remembered');
ok(regions.stillBadged === 1, 'the next track stays marked in the regions view too');

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join('\n'));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
