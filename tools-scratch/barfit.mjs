/* DOES THE TOP BAR'S "WHERE YOU ARE" LABEL ACTUALLY FIT?
 * It has child spans, so a leaf-only truncation test skips it — and the first
 * screenshot of this audit shows it reading "CHAPTER 1  FIRS…". Ask it
 * directly, on every chapter, at the narrowest phone the game targets. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const W of [320, 360, 390, 430]) {
  const page = await b.newPage({ viewport: { width: W, height: 800 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(600000);
  await page.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game, undefined, { timeout: 600000 });
  await page.waitForTimeout(1400);
  const r = await page.evaluate(() => {
    document.getElementById('tab-btn-race')?.click();
    const out = [];
    const cards = [...document.querySelectorAll('#level-select .chapter-card')];
    for (let i = 0; i < Math.min(cards.length, 8); i++) {
      cards[i].click();
      const e = document.getElementById('topbar-where');
      if (!e) continue;
      const full = (e.textContent || '').replace(/\s+/g, ' ').trim();
      const cut = e.scrollWidth > e.clientWidth + 1;
      out.push({ full, cut, sw: e.scrollWidth, cw: e.clientWidth });
      document.getElementById('topbar-back')?.click();
    }
    return out;
  });
  const bad = r.filter((x) => x.cut);
  console.log(`  ${W}px: ${bad.length}/${r.length} chapter titles truncated`);
  for (const x of bad.slice(0, 4)) console.log(`      "${x.full}" needs ${x.sw}, has ${x.cw}`);
  await page.close();
}
await b.close();
