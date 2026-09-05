/* CP3 probe — the machine ladder.
 *   A: tierOf/carTierOf mapping sanity + chapter card chips render
 *   B: rosterProg steps at tier boundaries (per-chapter, not per-world)
 *   C: garage rung — a CLUB chapter owned-ROOKIE profile signposts the car
 *   D: showroom band headers render, current tier marked
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 640 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.goto(`${BASE}/?fresh=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game, undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game;
  const out = {};
  // A: mapping
  out.tiers = [0, 3, 7, 11, 12].map((k) => `${k}:${g.tierOf(k).name}@${g.tierOf(k).ramp}`);
  out.carTiers = ['0', '13000', '22000', '32000', '8000'].map((pz) => g.carTierOf(+pz));
  g._renderLevelCards?.();
  const chips = [...document.querySelectorAll('.chapter-card .cc-top span:last-child')]
    .map((el) => el.textContent);
  out.chipSample = [chips[0], chips[3], chips[7], chips[12]];
  // B: ramp steps by chapter of the CURRENT level (fake level ids)
  const ch = g.chapters();
  const probeAt = (k) => {
    const saved = g.level;
    g.level = ch[k].levels[0];
    const v = g.rosterProg();
    g.level = saved;
    return v;
  };
  out.ramps = [0, 3, 7, 11].map((k) => `ch${k}:${probeAt(k)}`);
  // C: garage rung — advance to chapter 3 (CLUB) owning only the starter
  g.career.trophies = { 0: { at: 1, car: 'brawler', place: 1 },
    1: { at: 1, car: 'brawler', place: 1 }, 2: { at: 1, car: 'brawler', place: 1 } };
  out.currentChapter = g.currentChapter();
  out.ownedTier = g.ownedTier();
  out.objClub = g.careerObjective();
  // ...and owning a CLUB car clears the rung
  g.cars.owned.push('dune');
  out.objAfterBuy = g.careerObjective();
  g.cars.owned.pop();
  g.career.trophies = {};
  // D: showroom bands
  g.renderCarShop?.();
  const shop = document.getElementById('car-shop');
  const heads = [...shop.children].filter((el) => el.tagName === 'DIV' && /MACHINES/.test(el.textContent))
    .map((el) => el.textContent);
  out.shopHeads = heads;
  return out;
});
console.log(JSON.stringify(r, null, 2));
console.log('pageerrors:', errs.length, errs.slice(0, 3));
await browser.close();
