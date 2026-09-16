/* HOW MUCH OF THE PHONE IS CHROME, block by block, at the chapter index and
 * inside a chapter. Run against two ports to diff a redesign against the build
 * it replaces:  BASE=http://localhost:8958 node tools-scratch/chrome.mjs */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const W = +(process.env.W ?? 390);
const ctx = await b.newContext({ viewport: { width: W, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => window.__game.showMenu());

const measure = () => p.evaluate(() => {
  const s = document.getElementById('title-screen');
  s.scrollTop = 0;
  const h = (sel) => {
    const e = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!e || e.classList?.contains('hidden')) return 0;
    const r = e.getBoundingClientRect();
    return r.height ? Math.round(r.height) : 0;
  };
  const parts = {
    topbar: h('#topbar'),
    title: h('.game-title'),
    tagline: h('.game-sub'),
    chips: h('#menu-status'),
    tabs: h('#menu-tabs'),
    head: h('#tab-race .panel-head'),
    starKey: h('#star-key'),
    filters: h('#world-filters'),
    listBar: h('#level-select .chapter-bar'),
  };
  const card = document.querySelector('#level-select .level-chip')
    || document.querySelector('.chapter-card');
  return { parts, toFirstCard: card ? Math.round(card.getBoundingClientRect().top) : null };
});
const show = async (t) => {
  const r = await measure();
  const bits = Object.entries(r.parts).filter(([, v]) => v)
    .map(([k, v]) => `${k} ${v}`).join(' · ');
  console.log(`${t}\n  ${bits}\n  chrome above the first card: ${r.toFirstCard}px of 830\n`);
};
await show('CHAPTER INDEX');
await p.evaluate(() => { const g=window.__game; g._chapterIn=g.chapters()[1].n; g._renderLevelCards(); g._syncBackBtn(); });
await show('INSIDE CHAPTER 2');
await b.close();
