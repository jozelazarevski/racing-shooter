/* THE MENU AT SEVERAL WIDTHS.
 * "Make it less wide" needs a width to compare against, and the report is a
 * screenshot with no device in it. Render the tracks list at a phone width, a
 * large phone, a tablet and a desktop, and measure what the world card
 * actually spans in CSS pixels at each. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const OUT = process.env.OUT ?? '/tmp/menushot';
fs.mkdirSync(OUT, { recursive: true });
const SIZES = [[390, 844], [430, 932], [820, 1180], [1320, 1130]];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const [w, h] of SIZES) {
  const page = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  page.setDefaultTimeout(600000);
  await page.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => document.getElementById('level-select'), undefined, { timeout: 600000 });
  await page.waitForTimeout(1200);
  // the tracks tab shows CHAPTERS first in timeline view; open one so the
  // world cards the report is about are actually on screen
  await page.evaluate(() => {
    document.getElementById('tab-btn-race')?.click();
    const ch = document.querySelector('#level-select .chapter-card');
    if (ch) ch.click();
  });
  await page.waitForTimeout(900);
  const m = await page.evaluate(() => {
    const p = document.querySelector('.menu-panel:not(.off)');
    const c = document.querySelector('#level-select .level-chip');
    const r = (e) => e ? { x: Math.round(e.getBoundingClientRect().x), w: Math.round(e.getBoundingClientRect().width) } : null;
    return { panel: r(p), card: r(c), vw: innerWidth };
  });
  console.log(`  ${String(w).padStart(4)}x${h}: panel ${JSON.stringify(m.panel)}  card ${JSON.stringify(m.card)}`);
  await page.screenshot({ path: `${OUT}/menu-${w}.png` });
  await page.close();
}
await b.close();
