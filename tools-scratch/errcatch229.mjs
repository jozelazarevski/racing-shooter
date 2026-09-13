import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 } });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = [];
p.on('pageerror', e => errs.push('PAGEERR ' + e.message + '\n   ' + String(e.stack).split('\n').slice(1,4).join('\n   ')));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0,300)); });
await p.goto('http://localhost:8958/?level=1&go=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => window.__game.showMenu());
// what test-filters does: search across chapters, which changes the board, and
// pick a world in another chapter — a LEVEL SWAP
await p.evaluate(() => { const g = window.__game; g._chapterIn = g.chapters()[1].n; g._renderLevelCards(); });
await p.evaluate(() => { const g = window.__game; g.filters.q = 'amazon'; g._applyWorldFilter(); });
await p.evaluate(() => document.querySelector('#level-select .level-chip')?.click());
await new Promise(r => setTimeout(r, 3000));
await p.evaluate(() => { const g = window.__game; g.filters.q = ''; g._applyWorldFilter(); });
await new Promise(r => setTimeout(r, 3000));
console.log(errs.length ? errs.slice(0,4).join('\n') : 'no errors');
await b.close();
