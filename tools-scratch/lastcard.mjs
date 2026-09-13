/* AT THE BOTTOM OF THE LIST, is the last world card still readable, or is the
 * sticky START RACE sitting on it? And does anything scroll sideways — the
 * tell for a child wider than the centring panel. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => window.__game.showMenu());
console.log(await p.evaluate(() => {
  const g = window.__game;
  g._chapterIn = g.chapters()[1].n; g._renderLevelCards(); g._syncBackBtn();
  const s = document.getElementById('title-screen');
  s.scrollTop = s.scrollHeight;
  const cards = [...document.querySelectorAll('#level-select .level-chip')];
  const last = cards[cards.length - 1].getBoundingClientRect();
  const btn = document.getElementById('start-btn').getBoundingClientRect();
  const wide = [];
  for (const e of document.querySelectorAll('#tab-race > *, #level-select > *')) {
    const r = e.getBoundingClientRect();
    if (r.left < -1 || r.right > innerWidth + 1) wide.push(`${e.id||e.className} ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  return [
    `last card    ${Math.round(last.top)}..${Math.round(last.bottom)}`,
    `START RACE   ${Math.round(btn.top)}..${Math.round(btn.bottom)}`,
    `overlap      ${Math.max(0, Math.round(last.bottom - btn.top))}px`,
    `doc sideways scroll ${document.documentElement.scrollWidth - innerWidth}px`,
    `overflowing children: ${wide.join(' | ') || 'none'}`,
  ].join('\n');
}));
await b.close();
