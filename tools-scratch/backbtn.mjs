/* THE BACK LADDER, WALKED. Asked for as "I need back button".
 *
 * Checks the three things that make a back button trustworthy: it appears only
 * when it leads somewhere, it says WHERE, and the phone's own back gesture
 * drives the same ladder instead of leaving the game. The last one is the
 * whole point on a phone and is the one a click-only test would miss, so the
 * gesture is driven through `history.back()` rather than by calling goBack().
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 430, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage();
p.setDefaultTimeout(600000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const read = () => p.evaluate(() => {
  const g = window.__game, b2 = document.getElementById('back-btn');
  return { state: g.state, target: g.backTarget()?.at ?? null,
    shown: !!b2 && !b2.classList.contains('hidden'),
    label: (b2?.textContent || '').trim().replace(/\s+/g, ' '),
    chapter: g._chapterIn ?? null,
    tab: ['race', 'mode', 'jobs', 'garage', 'settings']
      .find((t) => document.getElementById(`tab-btn-${t}`)?.classList.contains('current')) };
});
const show = async (tag) => console.log(`${tag.padEnd(34)} ${JSON.stringify(await read())}`);

await p.evaluate(() => { window.__game.showMenu(); });
await show('menu, tracks, chapter index');

await p.evaluate(() => document.getElementById('tab-btn-garage').click());
await show('after opening GARAGE');
await p.evaluate(() => document.getElementById('back-btn').click());
await show('after tapping BACK');

// into a chapter, then out with the PHONE'S OWN gesture
await p.evaluate(() => {
  const g = window.__game;
  g._chapterIn = g.chapters()[2].n;
  g._renderLevelCards();
  g._syncBackBtn();
});
await show('inside chapter 3');
await p.goBack();                       // the swipe-back / hardware back
await show('after the phone back gesture');

// and it does not trap you: at the top of the ladder back leaves the page
await p.evaluate(() => document.getElementById('tab-btn-mode').click());
await show('MODE tab (one level up available)');
await p.evaluate(() => { window.__game.goBack(); });
const top = await read();
console.log(`${'at the top of the ladder'.padEnd(34)} ${JSON.stringify(top)}`);
console.log(`\nbutton hidden at the top: ${!top.shown}`);
if (errs.length) console.log('PAGE ERRORS: ' + errs.slice(0, 3).join(' | '));
await b.close();
