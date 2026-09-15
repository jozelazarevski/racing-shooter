/* The orange BACK button inside its bar: contained, tappable, not clipped. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
for (const W of [320, 390]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 830 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); p.setDefaultTimeout(600000);
  await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  console.log(await p.evaluate((W) => {
    const g = window.__game; g.showMenu(); g._chapterIn = g.chapters()[1].n;
    g._renderLevelCards(); g._syncBackBtn();
    const bar = document.getElementById('topbar').getBoundingClientRect();
    const btn = document.getElementById('topbar-back').getBoundingClientRect();
    const lbl = document.getElementById('topbar-where').getBoundingClientRect();
    const cs = getComputedStyle(document.getElementById('topbar-back'));
    return `${W}px  bar ${Math.round(bar.top)}..${Math.round(bar.bottom)}  `
      + `btn ${Math.round(btn.top)}..${Math.round(btn.bottom)} (${Math.round(btn.width)}x${Math.round(btn.height)})  `
      + `inside=${btn.top >= bar.top && btn.bottom <= bar.bottom}  `
      + `label starts ${Math.round(lbl.left - btn.right)}px clear  bg=${cs.backgroundImage.slice(0, 34)}`;
  }, W));
  await ctx.close();
}
await b.close();
