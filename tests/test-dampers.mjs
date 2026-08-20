/* BIG AIRS ARE SURVIVABLE, AND BUYABLE.
 *
 * Landing damage was a fixed curve with no answer in the garage: free below
 * 19 u/s of impact, then 8 hull per unit. A 30 u/s touchdown — an ordinary big
 * jump — took 88 of a stock 100-point hull, so the report was simply "big airs
 * cause the car to get wrecked", and nothing you could buy changed it.
 *
 * LONG-TRAVEL DAMPERS is the answer: it raises the speed a landing is free at
 * and cuts what the overflow costs. This suite pins both ends of that — the
 * stock car survives a jump it used to die on, and the upgrade is worth
 * buying — plus the thing an upgrade must never do, which is make a genuine
 * cliff free.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game, p = g.player;
  const out = {};


  // Drive onLand directly with a chosen impact speed: the flight itself is the
  // ballistics code's business and is covered elsewhere — what is on trial
  // here is the price of the touchdown.
  const land = (impact, lvl) => {
    p.alive = true;
    p.maxHealth = 100;
    p.health = 100;
    p.damperLvl = lvl;
    p._impactVy = -impact;
    p._airT = 0;
    p.onLand();
    return { hp: Math.max(0, Math.round(p.health)), alive: p.alive };
  };

  out.stock = {};
  out.maxed = {};
  for (const v of [18, 22, 26, 30, 34, 40, 50, 60, 85]) {
    out.stock[v] = land(v, 0);
    out.maxed[v] = land(v, 5);
  }
  // The garage really does carry the line. `carUpgrades` seeds one key per
  // entry in the UPGRADES table, so asking the profile is the same as asking
  // the table — and it does not need the panel to have been opened.
  out.upgradeKeys = Object.keys(g.carUpgrades());
  // and buying it reaches the car through applyUpgrades, not just the save
  g.carUpgrades().dampers = 3;
  g.applyUpgrades();
  out.appliedLvl = g.player.damperLvl;
  g.carUpgrades().dampers = 0;
  g.applyUpgrades();
  p.alive = true; p.health = p.maxHealth;
  return out;
});

console.log('\nimpact   stock hull   maxed hull');
for (const v of [18, 22, 26, 30, 34, 40, 50, 60, 85]) {
  console.log(`${String(v).padStart(6)}   ${String(R.stock[v].hp).padStart(10)}   ${String(R.maxed[v].hp).padStart(10)}`);
}

console.log('\n--- a stock car ---');
ok(R.stock[18].hp === 100 && R.stock[22].hp === 100,
  'an ordinary ramp landing is still free', `${R.stock[18].hp} / ${R.stock[22].hp}`);
ok(R.stock[30].alive,
  'a 30 u/s big air no longer wrecks a stock car', `${R.stock[30].hp} hull left`);
ok(R.stock[30].hp < 100,
  'but it still hurts — a big air is not free', R.stock[30].hp);
ok(!R.stock[50].alive,
  'a 50 u/s cliff fall still writes the car off', `${R.stock[50].hp} hull left`);

console.log('\n--- with LONG-TRAVEL DAMPERS at level 5 ---');
ok(R.maxed[34].hp === 100,
  'a landing that costs a stock car dearly is free on full dampers',
  `stock ${R.stock[34].hp} vs maxed ${R.maxed[34].hp}`);
ok(R.maxed[40].hp > R.stock[40].hp + 30,
  'the upgrade is worth buying at the top of the range',
  `stock ${R.stock[40].hp} vs maxed ${R.maxed[40].hp}`);
// 50 is the anchor, not 40: a stock car is wrecked there and full dampers
// walk away with most of the hull. Picking 40 first was my error — the stock
// car survives that one too, so the assertion proved nothing.
ok(R.maxed[50].alive && !R.stock[50].alive,
  'it turns a wreck into a survivable landing',
  `stock ${R.stock[50].hp} (alive=${R.stock[50].alive}) vs maxed ${R.maxed[50].hp}`);
ok(!R.maxed[85].alive && !R.stock[85].alive,
  'and a real cliff is still fatal at any level',
  `stock ${R.stock[85].hp}, maxed ${R.maxed[85].hp}`);
ok(R.maxed[60].hp > 0 && R.maxed[60].hp < R.maxed[50].hp,
  'the cost keeps climbing with the drop — dampers raise the ceiling, not remove it',
  `50 -> ${R.maxed[50].hp}, 60 -> ${R.maxed[60].hp}`);

console.log('\n--- the garage ---');
ok(R.upgradeKeys.includes('dampers'),
  'the upgrade is a real line in the UPGRADES table', R.upgradeKeys.join(' | '));
ok(R.appliedLvl === 3,
  'buying it reaches the car through applyUpgrades, not just the save file',
  `player.damperLvl = ${R.appliedLvl}`);

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
