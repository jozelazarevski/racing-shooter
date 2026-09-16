import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 620 } });
await p.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.levels, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game;
  const iceLv = g.levels.find(l => (g.surfaceOf?.(l) ?? l.surface) === 'ice' || /FROST|GLACIER|ICE|SNOW/.test(l.name)) ?? g.levels[0];
  g.cars.selected = 'brawler'; g.garage.upgrades = {};
  g._renderLevelCards();
  const chips = [...document.querySelectorAll('#level-select .level-chip')];
  const names = chips.slice(0, 3).map(el => el.querySelector('.wc-name')?.textContent);
  const withBad = chips.filter(el => el.querySelector('.wc-surf.bad')).length;
  const withFix = chips.filter(el => el.querySelector('.wc-fix')).length;
  return { total: chips.length, sampleNames: names, withBad, withFix,
    firstChipHTML: chips[0]?.outerHTML.slice(0, 600) };
});
console.log(JSON.stringify(r, null, 1));
await p.close(); await browser.close();
