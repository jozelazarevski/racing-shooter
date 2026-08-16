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

// ---- the ladder is one ladder, in career order ----------------------------
const ladder = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.career.finished = {};
  g._setTracksView('timeline');
  const sel = document.getElementById('level-select');
  const cards = [...sel.querySelectorAll('.level-chip')];
  return {
    view: g.tracksView,
    tlClass: sel.classList.contains('tl-view'),
    heads: sel.querySelectorAll('.region-head').length,
    cards: cards.length,
    worlds: LEVELS.length,
    rungs: cards.map((c) => +c.dataset.rung),
    ids: cards.map((c) => +c.dataset.lvid),
    careerIds: LEVELS.map((l) => l.id),
    heading: sel.querySelector('.region-head')?.textContent || '',
  };
});
ok(ladder.view === 'timeline' && ladder.tlClass, 'timeline is the default view');
ok(ladder.heads === 1, 'the ladder is ONE run, not one per region', `${ladder.heads} headers`);
ok(ladder.cards === ladder.worlds, `every world is on the ladder (${ladder.cards})`);
ok(ladder.rungs.every((r, i) => r === i + 1),
  'rungs count 1..N with no gaps and no jumps',
  `got ${ladder.rungs.slice(0, 8).join(',')}…`);
ok(JSON.stringify(ladder.ids) === JSON.stringify(ladder.careerIds),
  'and they are in CAREER order, which is the order the unlock price counts in');
ok(/CAREER LADDER/.test(ladder.heading) && /OPEN/.test(ladder.heading),
  'the heading states how far along the roster you are', ladder.heading);

// ---- available vs locked is stated on the card ----------------------------
const states = await page.evaluate(() => {
  const g = window.__game;
  const cards = [...document.querySelectorAll('#level-select .level-chip')];
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
    lockedGatesPriced: rows.filter((r) => r.locked).every((r) => /NEEDS \d+★/.test(r.gate)),
    matchesRule: rows.every((r) => r.locked !== g.isLevelUnlocked(r.id)),
  };
});
ok(states.open === 3, 'a fresh career shows exactly the three free worlds as available', `${states.open}`);
ok(states.everyOpenSaysSo && states.everyLockedSaysSo, 'every rung states whether it is open or locked');
ok(states.lockedGatesPriced, 'and a locked rung says what it costs, not just that it is shut');
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
  //    Note the `_freeUnlock` term: since r178 the floor keeps exactly one
  //    priced-out world open at all times, so "nothing open is outstanding" is
  //    never literally true and a loop that waited for it would never finish.
  g.career.finished = {};
  let guard = 0;
  while (guard++ < 80) {
    const missing = LEVELS.filter((l) => g.isLevelUnlocked(l.id) && !g.career.finished[l.id]
      && l.id !== g._freeUnlock());
    if (!missing.length) break;
    for (const l of missing) g.career.finished[l.id] = { place: 1, stars: 3 };
  }
  g.career.finished[LEVELS[4].id] = { place: 3, stars: 2 };   // one left unfinished
  out.starsLeft = { name: g.nextTrack()?.lv.name, why: g.nextTrack()?.why, expect: LEVELS[4].name };
  // 4. THE FLOOR. This case used to be "a gate priced out of reach → point at
  //    the gate you are working toward". Since r178 there is no such state to
  //    point at: race everything you can afford and the cheapest world you
  //    cannot opens by itself, so the answer is always something to drive.
  //    Built on the driver the floor exists for — one who only ever finishes
  //    last, and so can never buy their way up the ladder.
  g.career.finished = {};
  for (let i = 0; i < 400; i++) {
    const todo = LEVELS.find((l) => g.starCost(l.id) <= g.totalStars() && !g.career.finished[l.id]);
    if (!todo) break;
    g.career.finished[todo.id] = { place: 6, stars: 1 };
  }
  const freeId = g._freeUnlock();
  const free = LEVELS.find((l) => l.id === freeId);
  out.floor = { why: g.nextTrack()?.why, name: g.nextTrack()?.lv.name,
    granted: free?.name, open: !!freeId && g.isLevelUnlocked(freeId),
    priced: !!freeId && g.starCost(freeId) > g.totalStars(),
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
ok(next.floor.granted && next.floor.open && next.floor.priced,
  'a driver who only ever finishes last still has a new world open to them',
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

// ---- a card the filter has hidden is not somewhere to scroll to -----------
const filtered = await page.evaluate(() => {
  const g = window.__game;
  const sel = document.getElementById('level-select');
  const scroller = sel.closest('.screen');
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
