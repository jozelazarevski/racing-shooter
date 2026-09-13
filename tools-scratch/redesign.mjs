/* THE REDESIGN, MEASURED. Two questions only:
 *   1. how much of the phone is chrome before the first world card, and
 *   2. is there exactly ONE way back out of a chapter, at every scroll depth.
 * Both are the report this change answers ("Redesign", with a screenshot of a
 * screen carrying three ALL CHAPTERS controls and half a card visible). */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });

const probe = () => p.evaluate(() => {
  const on = (e) => {
    if (!e || e.classList.contains('hidden')) return null;
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
  };
  // every control on screen that takes you back out of a chapter
  const backs = [];
  for (const [name, el] of [['header BACK', document.getElementById('back-btn')],
    ['top bar', document.getElementById('topbar-back')],
    ['in-list bar', document.querySelector('#level-select .ch-back')]]) {
    const r = on(el);
    if (r && r.bottom > 0 && r.top < innerHeight) backs.push(`${name}@${r.top}`);
  }
  const card = document.querySelector('#level-select .level-chip')
    || document.querySelector('.chapter-card');
  return {
    backs,
    firstCardTop: card ? Math.round(card.getBoundingClientRect().top) : null,
    chapCards: document.querySelectorAll('.chapter-card').length,
    worldCards: document.querySelectorAll('#level-select .level-chip').length,
  };
});
const line = async (t) => {
  const r = await probe();
  console.log(`${t.padEnd(26)} back:[${(r.backs.join(', ') || '—').padEnd(24)}] `
    + `firstCard@${String(r.firstCardTop).padStart(5)}  ${r.chapCards}ch/${r.worldCards}w`);
};
const scroll = (f) => p.evaluate((f) => {
  const s = document.getElementById('title-screen');
  s.scrollTop = (s.scrollHeight - s.clientHeight) * f;
}, f);

await p.evaluate(() => window.__game.showMenu());
await line('chapter index, top');
await p.evaluate(() => { const g=window.__game; g._chapterIn=g.chapters()[1].n; g._renderLevelCards(); g._syncBackBtn(); });
await line('in chapter, top');
for (const f of [0.4, 1]) { await scroll(f); await line(`in chapter, ${Math.round(f*100)}% down`); }
// TAP it from the bottom of the list, as a thumb would
await p.click('#topbar-back');
await line('after tapping the bar');
await p.evaluate(() => document.getElementById('tab-btn-garage').click());
await line('GARAGE tab');
await p.evaluate(() => { window.__game.state='race'; window.__game._syncBackBtn(); });
await line('mid-race');
if (errs.length) console.log('ERR ' + errs.slice(0,2).join(' | '));
await b.close();
