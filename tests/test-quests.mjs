/* QUESTS — the first reward in this game that is not a number.
 *
 * Asked for as "create quests or contracts that I have to race and achieve to
 * earn bonus credits or some upgrades". The last three words are the whole
 * thing: contracts pay credits, feats pay credits, podiums pay credits, and a
 * player who already has money is offered nothing by any of them. A quest pays
 * a PART.
 *
 * The three properties that make it a quest rather than a fourth contract:
 *   - it spans MANY races and survives between them;
 *   - it counts DIFFERENT worlds, not repeats of the easiest one;
 *   - it hands over an upgrade level, free, and says so before you start.
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
const page = await browser.newPage({ viewport: { width: 900, height: 760 } });
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
  g.garage.upgrades[car] = {};
  g.career.quests = {};
  g.freeRoam = false; g.missionMode = false;

  const board = g.questState();
  // every quest names a real garage line, or the reward is a typo nobody sees
  const lines = window.__UPGRADE_KEYS ?? null;

  // ---- REGIONAL LICENCE: three DIFFERENT worlds, not one world three times
  const alpine = LEVELS.filter((l) => l.region === 'ALPINE PASSES');
  const runRace = (lv, rank) => {
    g.level = lv;
    g.levelIndex = LEVELS.indexOf(lv);
    g._ct = { bigAirs: 0, rivalKills: 0, cleanLaps: 0, topKph: 0, boostHeld: 0, leftRoad: false };
    g.contractCredits = 0;
    g.raceOver = false;
    g.player.sos = g.player.maxSos;
    return g._checkQuests(rank);
  };
  // same world, three podiums — must NOT complete a 3-world licence
  runRace(alpine[0], 1); runRace(alpine[0], 1); runRace(alpine[0], 1);
  const afterRepeats = g.questState().find((q) => q.id === 'licence-alpine');
  // ...three different ones does
  runRace(alpine[1], 2);
  const won = runRace(alpine[2], 3);
  const afterThree = g.questState().find((q) => q.id === 'licence-alpine');
  const partAfter = (g.garage.upgrades[car].handling | 0);

  // ---- a podium is required: 4th place must not count
  g.career.quests = {}; g.garage.upgrades[car] = {};
  const circuits = LEVELS.filter((l) => l.region === 'GRAND CIRCUITS');
  for (const lv of circuits.slice(0, 3)) runRace(lv, 4);
  const noPodium = g.questState().find((q) => q.id === 'licence-circuit');

  // ---- IRONMAN is a STREAK: being wrecked out wipes it
  g.career.quests = {};
  runRace(LEVELS[0], 5); runRace(LEVELS[1], 5); runRace(LEVELS[2], 5);
  const streak3 = g.questState().find((q) => q.id === 'ironman').have;
  g.raceOver = true;                       // wrecked out of the fourth
  g.level = LEVELS[3]; g._ct = { bigAirs: 0, rivalKills: 0 };
  g._checkQuests(8);
  const streakBroken = g.questState().find((q) => q.id === 'ironman').have;

  // ---- a maxed line pays credits instead, so a quest is never a null reward
  g.career.quests = {};
  g.garage.upgrades[car] = { tires: 5 };
  const loose = LEVELS.filter((l) => l.id !== LEVELS[0].id).slice(0, 40);
  let paid = 0, rec = null;
  for (const lv of loose) {
    const w = runRace(lv, 1);
    if (w.some((q) => q.id === 'rally-school')) { paid = g.contractCredits; rec = 'rally-school'; break; }
  }
  const tiresStill = g.garage.upgrades[car].tires;

  // ---- and the board renders
  g.renderGarage();
  const el = document.getElementById('quest-board');
  const rows = el ? el.querySelectorAll('.qrow').length : 0;
  const head = el?.querySelector('.cb-head')?.textContent ?? '';
  const paysPart = /FREE /.test(el?.textContent ?? '');

  return {
    n: board.length,
    afterRepeats: afterRepeats.have,
    afterThree: { have: afterThree.have, done: afterThree.done },
    wonNames: won.map((q) => q.name),
    partAfter,
    noPodium: noPodium.have,
    streak3, streakBroken,
    maxedPay: paid, tiresStill, rec,
    rows, head, paysPart, lines,
  };
});

console.log(`  ${R.n} quests on the board — "${R.head}"`);
console.log(`  same world x3 → ${R.afterRepeats}/3 · three different → ${R.afterThree.have}/3`
  + ` (${R.wonNames.join(', ') || 'none'})`);

ok(R.n >= 6, 'there is a board of quests, not one', `${R.n}`);
ok(R.afterRepeats === 1,
  'podiuming the SAME world three times counts ONCE — a licence means three worlds',
  `${R.afterRepeats}/3`);
ok(R.afterThree.done && R.wonNames.length > 0,
  'three different worlds completes it', JSON.stringify(R.afterThree));
ok(R.partAfter === 1,
  'and it pays a FREE UPGRADE LEVEL — the thing no other reward in the game does',
  `handling ${R.partAfter}`);
ok(R.noPodium === 0, 'finishing 4th does not count toward a podium licence', `${R.noPodium}`);
ok(R.streak3 === 3 && R.streakBroken === 0,
  'IRONMAN is a streak: three clean finishes, then being wrecked out wipes it',
  `${R.streak3} → ${R.streakBroken}`);
ok(R.maxedPay > 0 && R.tiresStill === 5,
  'a quest whose part is already maxed pays credits instead, so it is never a null reward',
  `+${R.maxedPay} CR, tires still ${R.tiresStill}`);
ok(R.rows === R.n && R.paysPart,
  'the board renders in the garage, beside the parts it pays for',
  `${R.rows} rows`);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join('\n'));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
