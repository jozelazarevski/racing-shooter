/* Where the bar actually sits, at four scroll depths — the number that matters
 * is bar.top: anything above 0 is a strip of list showing over the header. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { const g=window.__game; g.showMenu(); g._chapterIn=g.chapters()[1].n;
  g._renderLevelCards(); g._syncBackBtn(); });
for (const f of [0, 0.25, 0.6, 1]) {
  const r = await p.evaluate((f) => {
    const s = document.getElementById('title-screen');
    s.scrollTop = (s.scrollHeight - s.clientHeight) * f;
    const bar = document.getElementById('topbar').getBoundingClientRect();
    // is anything from the list painting ABOVE the bar?
    const gap = Math.round(bar.top);
    return `top=${gap} h=${Math.round(bar.height)} left=${Math.round(bar.left)} right=${Math.round(bar.right)}`;
  }, f);
  console.log(`scroll ${String(Math.round(f*100)).padStart(3)}%   ${r}`);
}
await b.close();
