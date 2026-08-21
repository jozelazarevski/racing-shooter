/* THE GARAGE, PHONE-SIZED, SCROLLED TO THE UPGRADE LADDERS.
 * The report is about the rows' artwork, so the shot has to be of the rows —
 * the tab opens on the build bay and the ladders are below the fold. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const OUT = process.env.OUT ?? '/tmp/garage';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
page.setDefaultTimeout(600000);
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message)));
await page.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game, undefined, { timeout: 600000 });
await page.waitForTimeout(1500);
await page.evaluate(() => { document.getElementById('tab-btn-garage')?.click(); });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.up-card, .upgrade-card, [class*=uc-]')].length;
  const imgs = [...document.querySelectorAll('.uc-ic img')].length;
  const glyphs = [...document.querySelectorAll('.uc-ic')]
    .filter((e) => !e.querySelector('img')).map((e) => e.textContent.trim());
  const first = document.querySelector('.uc-ic');
  return { rows, imgs, glyphs, hasIcHost: !!first };
});
console.log(JSON.stringify(info));
// scroll to the ladders and shoot
for (const y of [0, 900, 1800, 2700]) {
  await page.evaluate((yy) => { document.getElementById('title-screen').scrollTo(0, yy); }, y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/garage-${y}.png` });
}
console.log('page errors:', errs.slice(0, 3).join(' | ') || 'none');
await b.close();
