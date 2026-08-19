import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 430, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const vis = () => p.evaluate(() => {
  const e = document.getElementById('ch-back-float');
  return { pill: !!e && !e.classList.contains('hidden'),
    chapter: window.__game._chapterIn ?? null,
    cards: document.querySelectorAll('#level-select .level-chip').length,
    chapCards: document.querySelectorAll('.chapter-card').length };
});
const show = async t => console.log(`${t.padEnd(30)} ${JSON.stringify(await vis())}`);
await p.evaluate(() => window.__game.showMenu());
await show('chapter index');
await p.evaluate(() => { const g=window.__game; g._chapterIn=g.chapters()[1].n; g._renderLevelCards(); g._syncBackBtn(); });
await show('inside a chapter');
// scroll to the bottom then TAP the pill, as a thumb would
await p.evaluate(() => { const s=document.getElementById('level-select').closest('.screen'); s.scrollTop=s.scrollHeight; });
await p.click('#ch-back-float');
await show('after tapping the pill');
await p.evaluate(() => document.getElementById('tab-btn-garage').click());
await show('on the GARAGE tab');
await p.evaluate(() => { window.__game.state='race'; window.__game._syncBackBtn(); });
await show('mid-race');
if (errs.length) console.log('ERR ' + errs.slice(0,2).join(' | '));
await b.close();
