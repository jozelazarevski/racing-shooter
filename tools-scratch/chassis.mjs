/* NOT EVERY PART FITS EVERY CHASSIS — the whole roster, in one table.
 * Also proves the three walls are told apart, and that a ladder actually
 * raises the ceiling. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(await p.evaluate(() => {
  const g = window.__game;
  const V = g.constructor;
  const cars = [...document.querySelectorAll('.car-card')].length;
  const out = [];
  const CARS = ['brawler','sleek','crown','dune','flatsix','bastion','alpine','pit'];
  const head = 'chassis    ENGINE stock->maxed      WING stock->maxed';
  out.push(head);
  for (const key of CARS) {
    const line = [];
    for (const slot of ['engine','spoiler']) {
      const s = g.constructor === null ? null : null;
      const now = g.mountMax(slot, key, g.carUpgrades(key));
      const maxed = g.mountMax(slot, key, Object.fromEntries(
        Object.keys(g.carUpgrades(key)).map(k => [k, 5])));
      line.push(`${now} -> ${maxed}`);
    }
    out.push(`${key.padEnd(10)} ${line[0].padEnd(24)} ${line[1]}`);
  }
  return out.join('\n');
}));
console.log('\n--- what each wall says, on the SLEEK (engine base 0) ---');
console.log(await p.evaluate(() => {
  const g = window.__game;
  g.cars.owned = [...new Set([...g.cars.owned, 'sleek'])];
  g.cars.selected = 'sleek';
  g.garage.credits = 99999;
  g.showMenu(); document.getElementById('tab-btn-garage').click(); g.renderGarage();
  return [...document.querySelectorAll('.part-card[data-slot="engine"]')].map((c) => {
    const cls = [...c.classList].filter(x => x !== 'part-card').join('.') || '-';
    return `${c.querySelector('.pc-name').textContent.padEnd(13)} [${cls.padEnd(16)}] `
      + `${c.querySelector('.pc-act').textContent.padEnd(16)} ${c.querySelector('.pc-sub').textContent}`;
  }).join('\n');
}));
console.log('\n--- buy ENGINE WRENCH to 2, and the V6 should open ---');
console.log(await p.evaluate(() => {
  const g = window.__game;
  const up = g.carUpgrades(); up.engine = 2; g.applyUpgrades(); g.renderGarage();
  const v6 = document.querySelector('.part-card[data-slot="engine"][data-part="v6"]');
  return `class now ${g.mountMax('engine')} · V6 card: ${v6.querySelector('.pc-act').textContent}`;
}));
if (errs.length) console.log('ERR ' + errs.slice(0,3).join(' | '));
await b.close();
