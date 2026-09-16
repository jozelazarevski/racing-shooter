import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 830 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
console.log(await p.evaluate(() => {
  const g = window.__game;
  g.showMenu();
  g._chapterIn = g.chapters()[1].n; g._renderLevelCards(); g._syncBackBtn();
  const e = document.getElementById('back-btn');
  const cs = getComputedStyle(e);
  const r = e.getBoundingClientRect();
  const ms = document.getElementById('menu-status');
  return JSON.stringify({ hidden: e.classList.contains('hidden'), display: cs.display,
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    statusDisplay: getComputedStyle(ms).display, statusJustify: getComputedStyle(ms).justifyContent,
    parentRect: (() => { const q = ms.getBoundingClientRect(); return { x: Math.round(q.x), w: Math.round(q.width) }; })() });
}));
await b.close();
