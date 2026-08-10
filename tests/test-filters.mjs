/* TRACK-LIST FILTERS.
 *
 * A filter can look like it works while lying: a chip that hides the wrong
 * cards, a count that disagrees with the list under it, a stored filter that
 * survives a reload and silently hides the roster. So every check here reads
 * the RENDERED cards — what is actually on screen — and cross-checks it
 * against the facets the world reports for itself.
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
const page = await browser.newPage({ viewport: { width: 900, height: 620 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS, worldFacets } = await import('./src/track.js');
  const out = {};

  // ---- FACETS: every world must classify, or a chip silently loses it -----
  out.total = LEVELS.length;
  out.noScenery = LEVELS.filter((l) => !worldFacets(l).scenery.length).map((l) => l.theme);
  out.thin = LEVELS.filter((l) => {
    const f = worldFacets(l);
    return !f.time.length || !f.weather.length || !f.road.length;
  }).map((l) => l.name);
  out.times = {};
  for (const l of LEVELS) {
    const t = worldFacets(l).time[0];
    out.times[t] = (out.times[t] || 0) + 1;
  }
  // the levels a NIGHT filter must produce, computed independently of the UI
  out.nightNames = LEVELS.filter((l) => worldFacets(l).time[0] === 'NIGHT')
    .map((l) => l.name).sort();

  // ---- the bar itself -----------------------------------------------------
  localStorage.removeItem('ir-filters');
  g.filters = null;
  document.getElementById('world-filters').dataset.built = '';
  document.getElementById('world-filters').innerHTML = '';
  g._renderLevelCards();
  const host = document.getElementById('world-filters');
  out.groups = host.querySelectorAll('.wf-group').length;
  out.chips = host.querySelectorAll('.wf-chip').length;
  out.hasSearch = !!document.getElementById('wf-search');

  const cards = () => [...document.querySelectorAll('#level-select .level-chip[data-time]')];
  const shownCards = () => cards().filter((c) => !c.classList.contains('wf-out'));
  const shownNames = () => shownCards()
    .map((c) => c.querySelector('.wc-name').textContent.replace('🔒 ', '').trim()).sort();
  const chip = (text) => [...host.querySelectorAll('.wf-chip')]
    .find((c) => c.textContent.includes(text));
  const count = () => document.getElementById('wf-count').textContent;

  out.cardsRendered = cards().length;
  out.allShown = shownCards().length;
  out.countClean = count();

  // ---- one chip -----------------------------------------------------------
  chip('NIGHT').click();
  out.nightShown = shownNames();
  out.nightCount = count();
  out.nightPure = shownCards().every((c) => c.dataset.time === 'NIGHT');
  // a heading with nothing under it is a filtered list that looks broken
  out.emptyHeads = [...document.querySelectorAll('#level-select .region-head')]
    .filter((h) => !h.classList.contains('wf-out'))
    .filter((h) => {
      const row = h.nextElementSibling;
      return !row || ![...row.children].some((c) => !c.classList.contains('wf-out'));
    }).length;

  // ---- OR inside a group --------------------------------------------------
  chip('DAY').click();
  out.dayNight = shownCards().length;
  chip('DAY').click();                            // back to NIGHT only

  // ---- AND across groups --------------------------------------------------
  chip('💧 WET').click();
  out.nightWet = shownCards().length;
  out.nightWetPure = shownCards().every((c) =>
    c.dataset.time === 'NIGHT' && c.dataset.road.split(' ').includes('WET'));
  chip('💧 WET').click();
  chip('NIGHT').click();                          // clean again
  out.backToAll = shownCards().length;

  // ---- an impossible combination must say so, not look broken -------------
  chip('🌋 VOLCANIC').click();
  chip('🌊 COAST').click();                       // OR: volcanic or coast
  out.orScenery = shownCards().length;
  chip('🌋 VOLCANIC').click();
  chip('🌊 COAST').click();
  chip('🏙 CITY').click();
  chip('❄ SNOW/ICE').click();                     // a snow-road city: none exist
  out.impossible = shownCards().length;
  out.impossibleMsg = count();
  document.getElementById('wf-clear').click();
  out.afterClear = shownCards().length;
  out.afterClearMsg = count();

  // ---- search -------------------------------------------------------------
  const type = (v) => {
    const s = document.getElementById('wf-search');
    s.value = v;
    s.dispatchEvent(new Event('input'));
  };
  type('spa');                       // a route key, not the theme it wears
  out.spa = shownNames();
  type('night');                     // a facet word, without touching a chip
  out.searchNight = shownNames();
  type('mediterranean');             // a region
  out.med = shownCards().length;
  type('zzzz');
  out.miss = shownCards().length;
  out.missMsg = count();
  type('');

  // ---- the fold -----------------------------------------------------------
  // Folding must never hide a filter that is ON, or the list looks broken
  // with nothing on screen explaining why.
  chip('🌧 RAIN').click();
  document.getElementById('wf-toggle').click();
  out.collapsed = host.classList.contains('wf-collapsed');
  const vis = (el) => !!el.offsetParent;
  out.onChipVisible = vis(chip('🌧 RAIN'));
  out.offChipHidden = !vis(chip('🌪 DUST'));
  out.weatherRowVisible = vis(host.querySelector('.wf-group:not(.wf-empty)'));
  out.emptyRows = host.querySelectorAll('.wf-group.wf-empty').length;
  out.foldLabel = document.getElementById('wf-toggle').textContent;
  out.searchStillVisible = vis(document.getElementById('wf-search'));
  out.countStillVisible = vis(document.getElementById('wf-count'));
  out.foldedShown = shownCards().length;
  document.getElementById('wf-toggle').click();
  out.reopened = !host.classList.contains('wf-collapsed');
  out.reopenedChip = vis(chip('🌪 DUST'));
  document.getElementById('wf-clear').click();

  // ---- persistence --------------------------------------------------------
  chip('🌙 NIGHT').click();
  const stored = localStorage.getItem('ir-filters');
  out.stored = stored;
  g._renderLevelCards();             // a career reset rebuilds the whole list
  out.afterRebuild = shownCards().length;
  out.chipStillOn = chip('🌙 NIGHT').classList.contains('on');

  // ---- a stored tag this build no longer has must not hide everything -----
  localStorage.setItem('ir-filters', JSON.stringify({ time: ['ECLIPSE'], q: '' }));
  g.filters = null;
  g._renderLevelCards();
  out.unknownTag = shownCards().length;

  localStorage.removeItem('ir-filters');
  g.filters = null;
  g._renderLevelCards();
  return out;
});

console.log('\n--- track-list filters ---');
ok(R.noScenery.length === 0,
  'every theme on the roster has a SCENERY facet', R.noScenery.join(','));
ok(R.thin.length === 0,
  'every world reports a time, a weather and a road', R.thin.join(','));
ok(R.times.NIGHT > 0 && R.times.DUSK > 0 && R.times.DAY > 0,
  'the roster splits across all three times of day', JSON.stringify(R.times));
ok(R.groups === 4 && R.chips >= 20 && R.hasSearch,
  'the bar renders every group, its chips and the search box',
  `${R.groups} groups / ${R.chips} chips`);
ok(R.cardsRendered === R.total && R.allShown === R.total,
  'nothing is hidden until a filter is set', `${R.allShown}/${R.total}`);
ok(R.countClean === `${R.total} WORLDS`, 'the count reads the whole roster', R.countClean);
ok(JSON.stringify(R.nightShown) === JSON.stringify(R.nightNames),
  'NIGHT shows exactly the night worlds and no others',
  `${R.nightShown.join('|')} vs ${R.nightNames.join('|')}`);
ok(R.nightPure, 'every card left standing under NIGHT really is a night world');
ok(R.nightCount === `SHOWING ${R.nightNames.length} OF ${R.total} WORLDS`,
  'the count agrees with the list under it', R.nightCount);
ok(R.emptyHeads === 0, 'no region heading is left standing over an empty row', R.emptyHeads);
ok(R.dayNight === R.times.DAY + R.times.NIGHT,
  'chips inside a group are OR', `${R.dayNight} vs ${R.times.DAY + R.times.NIGHT}`);
ok(R.nightWet > 0 && R.nightWet < R.nightNames.length + 1 && R.nightWetPure,
  'groups combine as AND — a wet night stage, not either', R.nightWet);
ok(R.backToAll === R.total, 'turning a chip back off restores the roster', R.backToAll);
ok(R.orScenery > 0, 'a two-chip scenery filter unions the two', R.orScenery);
ok(R.impossible === 0 && /NO WORLD MATCHES/.test(R.impossibleMsg),
  'an impossible combination says so instead of looking broken', R.impossibleMsg);
ok(R.afterClear === R.total && R.afterClearMsg === `${R.total} WORLDS`,
  'CLEAR puts every world back', `${R.afterClear} / ${R.afterClearMsg}`);
ok(R.spa.length === 1 && R.spa[0] === 'SPA-FRANCORCHAMPS',
  'search finds a world by its route key, not just its name', R.spa.join('|'));
ok(R.searchNight.length === R.times.NIGHT,
  'search finds worlds by a facet word with no chip touched', R.searchNight.join('|'));
ok(R.med > 4, 'search finds a whole region', R.med);
ok(R.miss === 0 && /NO WORLD MATCHES/.test(R.missMsg), 'a search with no hits says so', R.missMsg);
ok(R.collapsed && R.searchStillVisible && R.countStillVisible,
  'the bar folds and keeps the search box and the count');
ok(R.onChipVisible && R.offChipHidden,
  'folded, a chip that is ON stays on screen and the rest go away',
  `on:${R.onChipVisible} off-hidden:${R.offChipHidden}`);
ok(R.emptyRows === 3 && R.weatherRowVisible,
  'folded, only the groups with something set are left', R.emptyRows);
ok(/FILTERS 1/.test(R.foldLabel), 'the folded button says how many are set', R.foldLabel);
ok(R.foldedShown > 0 && R.foldedShown < R.total,
  'folding changes nothing about what is filtered', R.foldedShown);
ok(R.reopened && R.reopenedChip, 'unfolding brings every chip back');
ok(/NIGHT/.test(R.stored || ''), 'the choice is stored', String(R.stored).slice(0, 80));
ok(R.afterRebuild === R.times.NIGHT && R.chipStillOn,
  'a list rebuild keeps the filter and the chip that set it', R.afterRebuild);
ok(R.unknownTag === R.total,
  'a stored tag this build no longer knows is dropped, not obeyed', R.unknownTag);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
