/* EVERY MENU STATE, AND WHAT TAKES YOU BACK FROM IT. The report is "I miss the
 * back button" — so the question is not "does a control exist" but "is it in
 * the same place, saying the same thing, every time". */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });

const look = () => p.evaluate(() => {
  const seen = [];
  for (const [where, el] of [['header', document.getElementById('back-btn')],
    ['topbar', document.getElementById('topbar-back')]]) {
    const host = el?.closest('#topbar') || el;
    if (!el || el.classList.contains('hidden') || host?.classList.contains('hidden')) continue;
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    seen.push(`${where} "${el.textContent.trim()}" @${Math.round(r.left)},${Math.round(r.top)}`);
  }
  return seen.join('  +  ') || '(nothing)';
});
const row = async (t) => console.log(`${t.padEnd(24)} ${await look()}`);

await p.evaluate(() => window.__game.showMenu());
await row('TRACKS, chapter index');
await p.evaluate(() => { const g=window.__game; g._chapterIn=g.chapters()[1].n; g._renderLevelCards(); g._syncBackBtn(); });
await row('TRACKS, in a chapter');
for (const tab of ['mode','jobs','garage','settings']) {
  await p.evaluate((t) => document.getElementById(`tab-btn-${t}`).click(), tab);
  await row(`${tab.toUpperCase()} tab`);
}
await p.evaluate(() => document.getElementById('tab-btn-race').click());
await row('back on TRACKS');
// AND IT MUST NOT SCROLL AWAY — the old header button did, on every tab
await p.evaluate(() => document.getElementById('tab-btn-garage').click());
await p.evaluate(() => { const s=document.getElementById('title-screen'); s.scrollTop = s.scrollHeight; });
await row('GARAGE, scrolled down');
await p.evaluate(() => { const g=window.__game; document.getElementById('tab-btn-race').click();
  g._chapterIn=g.chapters()[1].n; g._renderLevelCards(); g._syncBackBtn();
  const s=document.getElementById('title-screen'); s.scrollTop = s.scrollHeight; });
await row('chapter, scrolled down');
// and the label beside it says where you are
console.log('label beside it: ' + await p.evaluate(() => document.getElementById('topbar-where').textContent.trim()));
if (errs.length) console.log('ERR ' + errs.slice(0,2).join(' | '));
await b.close();
