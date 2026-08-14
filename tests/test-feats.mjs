/* TRACK FEATS — the garage becomes a set of keys, not a slider.
 *
 * Asked for as "add more fun elements per track like I have to upgrade enough
 * or buy elements, make it more complex".
 *
 * Contracts are the DAILY money game: three picks, reshuffled every day,
 * doable anywhere. They answer "what shall I do in this race" and never make
 * one world feel different from the next, nor give any reason to buy a
 * PARTICULAR upgrade.
 *
 * A feat is the other axis: permanent (once per world, banked in the career),
 * FIXED to the world rather than rerolled, and gated behind one named line of
 * the garage at a named level. One archetype per upgrade, so every part you
 * can buy has worlds that ask for it. A locked feat is SHOWN, because seeing
 * "GORGE LEAP · needs DAMPERS 2" on a track you cannot yet beat is the whole
 * mechanism — it turns the credits you are saving into a thing you are
 * saving FOR.
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
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const car = g.cars.selected;
  g.garage.upgrades ??= {};
  g.garage.upgrades[car] = {};                 // stock car: everything shut
  g.career.feats = {};

  const one = g.featsOf(1);
  // stable across calls AND across a rebuild — a world's pair is its identity
  const again = g.featsOf(1);
  // every world gets a pair, and the pool is spread rather than one archetype
  const per = LEVELS.map((l) => g.featsOf(l.id).map((f) => f.id));
  const used = new Set(per.flat());

  // stock car: a gated feat is locked, and the card says which part opens it
  g._renderLevelCards();
  const chipOf = (id) => [...document.querySelectorAll(
    `#level-select .level-chip[data-lvid="${id}"] .wc-feat`)].map((e) => e.textContent.trim());
  const lockedChips = chipOf(1);

  // buy exactly the part the first feat names, to its level
  const f0 = one[0];
  g.garage.upgrades[car][f0.need.key] = f0.need.lvl;
  const opened = g.featsOf(1);
  g._renderLevelCards();
  const openChips = chipOf(1);

  // one short of the gate must NOT open it
  g.garage.upgrades[car][f0.need.key] = f0.need.lvl - 1;
  const short = g.featsOf(1).find((f) => f.id === f0.id).locked;
  g.garage.upgrades[car][f0.need.key] = f0.need.lvl;

  // a LOCKED feat is never banked, however well the race went
  g.level = LEVELS[0];
  g.freeRoam = false; g.missionMode = false;
  g.contractCredits = 0;
  const lockedOne = g.featsOf(1).find((f) => f.locked);
  g._ct = { bigAirs: 99, rivalKills: 99, cleanLaps: 99, topKph: 999, boostHeld: 99, leftRoad: false };
  g.deaths = 0;
  g.player.health = g.player.maxHealth;
  g._checkFeats(1);
  const bankedIds = g.career.feats[1] ?? [];
  const lockedStayedShut = lockedOne ? !bankedIds.includes(lockedOne.id) : true;
  const openWasBanked = bankedIds.includes(f0.id);
  const paid = g.contractCredits;

  // banking is permanent and does not pay twice
  g.contractCredits = 0;
  g._checkFeats(1);
  const noDoublePay = g.contractCredits === 0;

  return {
    ids: one.map((f) => f.id), stable: JSON.stringify(one.map((f) => f.id)) === JSON.stringify(again.map((f) => f.id)),
    allHavePair: per.every((p) => p.length === 2), archetypesUsed: used.size,
    lockedChips, openChips, short, lockedStayedShut, openWasBanked, paid, noDoublePay,
    gates: g.featsOf(1).map((f) => f.need.key),
  };
});

console.log('  PINE VALLEY feats:', R.ids.join(', '), '— gates:', R.gates.join(', '));
console.log('  stock card:', JSON.stringify(R.lockedChips));
console.log('  after buying the gate:', JSON.stringify(R.openChips));

ok(R.allHavePair, 'every world asks for exactly two feats');
ok(R.stable, 'a world keeps the same pair — it is part of the track, not a daily reroll');
ok(R.archetypesUsed >= 6, 'the roster spreads across the archetypes rather than repeating one',
  `${R.archetypesUsed} of 7 used`);
ok(R.lockedChips.some((c) => c.startsWith('🔒')),
  'a stock car sees the feat LOCKED, naming the part that opens it', JSON.stringify(R.lockedChips));
ok(R.openChips.length && !R.openChips.every((c) => c.startsWith('🔒')),
  'buying that part opens it on the card', JSON.stringify(R.openChips));
ok(R.short, 'one level short of the gate does NOT open it');
ok(R.openWasBanked && R.paid > 0, 'clearing an open feat banks it and pays', `paid ${R.paid}`);
ok(R.lockedStayedShut,
  'a LOCKED feat is never banked, however well the race went — otherwise the gate is decoration');
ok(R.noDoublePay, 'and a banked feat never pays a second time');
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join('\n'));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
