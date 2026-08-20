/* THE PART ICONS, BIG, ON ONE SHEET.
 * Judging a 40 px thumbnail inside a garage screenshot is how a shield ends up
 * edge-on and nobody notices. Ask the game for the same data URLs the rows
 * use and lay them out at size. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const OUT = process.env.OUT ?? '/tmp/icons';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 900, height: 700 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game, undefined, { timeout: 600000 });
await page.waitForTimeout(1200);
const urls = await page.evaluate(() => {
  const icons = window.__game._partIcons();
  const want = ['up:engine', 'up:handling', 'up:nitro', 'up:armor', 'up:dampers',
    'up:beacon', 'weapon:cannon', 'weapon:rack', 'weapon:magazine', 'tyre:gravel'];
  const out = {};
  for (const k of want) out[k] = icons[k] ?? null;
  return out;
});
const missing = Object.entries(urls).filter(([, v]) => !v).map(([k]) => k);
console.log('missing:', missing.length ? missing.join(', ') : 'none');
await page.setContent(`<body style="margin:0;background:#1a1208;display:grid;
  grid-template-columns:repeat(5,1fr);gap:4px;padding:6px;font:11px monospace;color:#ffd">
  ${Object.entries(urls).map(([k, v]) => `<div style="text-align:center">
     <img src="${v}" style="width:100%;background:#2a1e10"><div>${k}</div></div>`).join('')}
  </body>`);
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/icons.png` });
await b.close();
