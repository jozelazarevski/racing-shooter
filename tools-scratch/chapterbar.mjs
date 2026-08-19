/* IS THE "ALL CHAPTERS" CONTROL REACHABLE ONCE YOU ARE DOWN THE LIST?
 *
 * Reported as "I need a back to all chapters button once I'm in chapter" —
 * about a build that HAS one. So the question is not whether it exists but
 * whether it is on screen when you need it, which is after you have scrolled
 * past a few worlds. Measures both back affordances at three scroll positions.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 430, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage();
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(() => {
  const g = window.__game;
  g.showMenu();
  g._chapterIn = g.chapters()[1].n;          // a chapter with 8 worlds
  g._renderLevelCards();
  g._syncBackBtn();
  const sel = document.getElementById('level-select');
  const sc = sel.closest('.screen');
  const look = (tag) => {
    const vh = sc.clientHeight, top = sc.getBoundingClientRect().top;
    const on = (el) => {
      if (!el) return null;
      const q = el.getBoundingClientRect();
      const rel = q.top - top;
      return { top: Math.round(rel), h: Math.round(q.height),
        onScreen: q.height > 0 && rel > -q.height && rel < vh };
    };
    return { tag, scroll: Math.round(sc.scrollTop),
      bar: on(document.querySelector('.chapter-bar')),
      btn: on(document.getElementById('back-btn')),
      float: (() => { const e = document.getElementById('ch-back-float');
        if (!e || e.classList.contains('hidden')) return null;
        const q = e.getBoundingClientRect();
        return { top: Math.round(q.top), h: Math.round(q.height),
          onScreen: q.top > -q.height && q.top < innerHeight }; })(),
      cards: sel.querySelectorAll('.level-chip').length };
  };
  const out = [];
  sc.scrollTop = 0; out.push(look('at the top'));
  sc.scrollTop = sc.scrollHeight * 0.4; out.push(look('40% down'));
  sc.scrollTop = sc.scrollHeight; out.push(look('at the bottom'));
  const cs = getComputedStyle(document.querySelector('.chapter-bar'));
  return { out, sticky: cs.position, stickyTop: cs.top,
    scrollerOverflow: getComputedStyle(sc).overflowY,
    parentOverflow: getComputedStyle(sel).overflow };
});
console.log(`chapter-bar position:${r.sticky} top:${r.stickyTop} | scroller overflow-y:${r.scrollerOverflow} | #level-select overflow:${r.parentOverflow}`);
console.log('\nwhere               scroll   chapter-bar            BACK button        FIXED pill');
for (const q of r.out) {
  const f = (x) => (x ? `${x.onScreen ? 'ON ' : 'off'} top:${String(x.top).padStart(6)}` : 'absent      ');
  console.log(`${q.tag.padEnd(18)} ${String(q.scroll).padStart(6)}   ${f(q.bar).padEnd(22)} ${f(q.btn).padEnd(18)} ${f(q.float)}`);
}
await b.close();
