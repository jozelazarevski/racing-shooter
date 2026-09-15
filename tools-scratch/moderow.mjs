/* The three mode chips: one row or a stack? Same `top` for all three means one
 * row. Also checks nothing overflows its own chip. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
for (const W of [320, 360, 390, 430, 620]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 830 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); p.setDefaultTimeout(600000);
  await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  console.log(await p.evaluate((W) => {
    window.__game.showMenu();
    document.getElementById('tab-btn-mode').click();
    const chips = [...document.querySelectorAll('#mode-select .mode-chip')];
    const tops = chips.map((c) => Math.round(c.getBoundingClientRect().top));
    const oneRow = new Set(tops).size === 1;
    const clipped = chips.filter((c) => c.scrollWidth > c.clientWidth + 1).map((c) => c.textContent.trim());
    const w = chips.map((c) => Math.round(c.getBoundingClientRect().width));
    return `${String(W).padStart(4)}px  oneRow=${oneRow ? 'YES' : 'NO  tops=' + tops}  `
      + `widths=[${w}]  h=${Math.round(chips[0].getBoundingClientRect().height)}  `
      + `clipped=${clipped.length ? clipped.join('|') : 'none'}`;
  }, W));
  await ctx.close();
}
await b.close();
