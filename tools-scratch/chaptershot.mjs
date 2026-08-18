/* THE CHAPTER BOARD, RENDERED. Opens the menu's track tab with a given career
 * state and photographs it — the headers, the gate line and the padlocks are a
 * layout question and the only way to answer one is to look. */
import { chromium } from 'playwright-core';
import { promises as fs } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const OUT = process.env.OUT ?? '/tmp/chapters.png';
const RACED = +(process.env.RACED ?? 0);      // how many chapter-1 worlds raced
const W = +(process.env.W ?? 460), H = +(process.env.H ?? 900);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: true,
  isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.setDefaultTimeout(600000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
await p.evaluate((raced) => {
  const g = window.__game;
  g.unlockAll = false;
  g.career.finished = {};
  const ch = g.chapters();
  for (let i = 0; i < raced && i < ch[0].levels.length; i++) {
    g.career.finished[ch[0].levels[i].id] = { place: i === 0 ? 1 : 3, stars: i === 0 ? 3 : 2 };
  }
  g._chapterIn = null;
  // showMenu(), not `state = 'menu'` — the game's menu state is called
  // 'title', and setting a state name it does not use left the BACK button
  // hidden in a probe while the real menu showed it perfectly well.
  g.showMenu();
  g._syncBackBtn?.();
}, RACED);
// ENTER a chapter if asked, exactly as a tap would
if (process.env.ENTER) {
  await p.evaluate((n) => {
    const c = [...document.querySelectorAll('.chapter-card')]
      .find((e) => e.dataset.chn === String(n));
    if (c) c.click();
  }, process.env.ENTER);
  await p.evaluate(() => window.__game._syncBackBtn?.());
}
if (process.env.SEARCH) {
  await p.evaluate((q) => {
    const s = document.getElementById('wf-search');
    s.value = q; s.dispatchEvent(new Event('input'));
  }, process.env.SEARCH);
}
for (let f = 0; f < 8; f++) await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
// The board auto-scrolls to the next track, which is exactly what buries the
// header this probe exists to look at. SCROLL_TO names a chapter number to
// bring to the top instead (0 = the very top of the list).
await p.evaluate((n) => {
  const sel = document.getElementById('level-select');
  const sc = sel.closest('.screen');
  if (!sc) return;
  if (!n) { sc.scrollTop = 0; return; }
  // at the INDEX the target is a chapter CARD; inside a chapter it is a header
  const card = document.querySelector(`.chapter-card[data-chn="${n}"]`);
  const head = card || [...document.querySelectorAll('.chapter-head')]
    .find((h) => (h.querySelector('.ch-n')?.textContent || '').trim() === `CHAPTER ${n}`);
  if (head) sc.scrollTop = head.offsetTop - sc.offsetTop - 8;
}, +(process.env.SCROLL_TO ?? 0));
for (let f = 0; f < 4; f++) await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
await p.screenshot({ path: OUT, fullPage: !!process.env.FULL });
const info = await p.evaluate(() => ({
  heads: [...document.querySelectorAll('.chapter-head')].length,
  first: document.querySelector('.chapter-head')?.innerText?.replace(/\s+/g, ' ').slice(0, 120),
  key: document.getElementById('star-key')?.innerText?.replace(/\s+/g, ' ').slice(0, 200),
  chapterCards: document.querySelectorAll('.chapter-card').length,
  worldCards: document.querySelectorAll('#level-select .level-chip:not(.wf-out)').length,
  count: document.getElementById('wf-count')?.textContent || '',
  bar: !!document.querySelector('.chapter-bar'),
}));
console.log(OUT, JSON.stringify(info, null, 1), errs.length ? 'ERR ' + errs[0] : '');
await b.close();
