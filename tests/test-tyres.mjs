/* TYRES: the rule that decides where a car may race.
 *
 * The old affinity system was advice — a chip that said "weak" while the car
 * drove the stage perfectly well. This is a RULE, so every check here asks
 * whether the game actually refuses, actually unlocks, and actually feels
 * different, rather than whether the label is present.
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
const page = await browser.newPage({ viewport: { width: 900, height: 620 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const T = await import('./src/track.js');
  const V = await import('./src/vehicles.js');
  const out = {};

  // ---- every world classifies, and the split is real ---------------------
  const counts = [0, 0, 0];
  const unmapped = [];
  for (const lv of T.LEVELS) {
    const c = T.surfaceClass(lv);
    if (c === undefined || c === null) unmapped.push(lv.name);
    else counts[c]++;
  }
  out.counts = counts;
  out.unmapped = unmapped;
  // the classification must not just track `loose`, which conflates wet
  const byName = (n) => T.surfaceClass(T.LEVELS.find((l) => l.name === n));
  out.spaSealed = byName('ARDENNES SWEEP') === T.SEALED;
  out.silverstoneSealed = byName('AERODROME CIRCUIT') === T.SEALED;
  out.duneLoose = byName('THE DUNE SERPENT') === T.LOOSE;
  out.dustLoose = byName('DUST CANYON') === T.LOOSE;
  out.frostIce = byName('FROST PEAK') === T.ICE;

  // ---- car classes -------------------------------------------------------
  out.brawler = V.tyreClass('brawler', null);
  out.crown = V.tyreClass('crown', null);
  out.dune = V.tyreClass('dune', null);
  // one TIRES level lifts a class; three lifts two
  out.brawlerL1 = V.tyreClass('brawler', { tires: 1 });
  out.crownL1 = V.tyreClass('crown', { tires: 1 });
  out.crownL3 = V.tyreClass('crown', { tires: 3 });

  // ---- CONTRACT CHANGED, DELIBERATELY: the gate PRICES, it does not refuse.
  // One eligible car per surface turned the roster into one car per trail —
  // reported as exactly that — so `ok` now means "in the ideal window" and a
  // mismatch races anyway with a stated grip penalty. What must still be true:
  // the mismatch is REAL in the physics, every label states the price, and
  // the fix is still named so the incentive to buy the right machine stays.
  const iceLv = T.LEVELS.find((l) => T.surfaceClass(l) === T.ICE);
  const looseLv = T.LEVELS.find((l) => T.surfaceClass(l) === T.LOOSE);
  const sealedLv = T.LEVELS.find((l) => T.surfaceClass(l) === T.SEALED);
  out.iceName = iceLv.name;

  g.state = 'title';            // swapLevel refuses mid-race
  g.freeRoam = false;
  g.garage.upgrades = {};
  g.cars.owned = ['brawler'];
  g.cars.selected = 'brawler';
  g.swapLevel(iceLv, true, null);
  out.onIce = g.level.name;

  const fIce = g.carFitness(iceLv.id);
  out.blockedOnIce = !fIce.ok;
  out.fixNamesPrice = /\d/.test(fIce.fix.text) && /GARAGE|BUY|DRIVE/.test(fIce.fix.text);
  out.fixText = fIce.fix.text;

  // pressing START now TAKES the start — the mismatch is priced, not barred
  g.state = 'title';
  g.freeRoam = false;
  g.startRace();
  out.refusedState = g.state;
  out.underReached = g.player._tyreUnder;   // the physics got the number
  g.state = 'title';

  // the button says so before you press it
  g._syncStartButton();
  const btn = document.getElementById('start-btn');
  out.btnText = btn.textContent;
  out.btnBlocked = btn.classList.contains('blocked');

  // the card says so too, with the fix on it
  g._renderLevelCards();
  const card = [...document.querySelectorAll('#level-select .level-chip')]
    .find((el) => el.querySelector('.wc-name')
      && el.querySelector('.wc-name').textContent.replace('🔒 ', '').trim() === iceLv.name);
  out.cardWarns = !!(card && card.querySelector('.wc-surf.bad'));
  out.cardHasFix = !!(card && card.querySelector('.wc-fix'));

  // ---- buying the tyre opens it ------------------------------------------
  g.garage.upgrades = { brawler: { tires: 1 } };
  const fAfter = g.carFitness(iceLv.id);
  out.openedByUpgrade = fAfter.ok;
  g.state = 'title';
  g.startRace();
  out.startedAfter = g.state !== 'title';
  g.state = 'title';

  // ---- free roam is exempt ------------------------------------------------
  g.garage.upgrades = {};
  g.freeRoam = true;
  g.state = 'title';
  g.startRace();
  out.roamAllowed = g.state !== 'title';
  g.freeRoam = false;
  g.state = 'title';

  // ---- a road car is shut out of the loose stages -------------------------
  g.cars.owned = ['brawler', 'crown'];
  g.cars.selected = 'crown';
  g.garage.upgrades = {};
  out.crownOnLoose = !g.carFitness(looseLv.id).ok;
  out.crownOnSealed = g.carFitness(sealedLv.id).ok;
  // ...and is told to drive the car it already has
  const fL = g.carFitness(looseLv.id);
  out.crownAdvice = fL.fix.text;

  // ---- TOO MUCH TYRE IS NOT A STATE ANY MORE, AND THAT IS THE FIX --------
  //
  // This block used to assert that a DUNE is shut out of the sealed circuits
  // because its all-terrain rubber is two classes over. That WAS true while
  // the compound was a consequence of the car; it is false now, and being
  // false is the whole point. AUTO fits what the world asks for, capped by
  // what you own, so a car with a high ceiling simply fits DOWN and is ideal.
  // Reported as "what's the point if I don't buy them?" — the answer has to
  // be that owning a better compound widens where you are ideal and costs you
  // nothing anywhere, which is only true if over-tyred stops being a trap.
  g.cars.owned = ['brawler', 'crown', 'dune'];
  g.cars.selected = 'dune';
  g.garage.upgrades = {};
  g.garage.fitted = {};
  const fDuneSealed = g.carFitness(sealedLv.id);
  out.duneAutoSealed = fDuneSealed.ok && fDuneSealed.pen === 0;
  out.duneAutoFits = V.TYRE_LABEL[g.fittedTyre('dune', T.LEVELS.find((l) => l.id === sealedLv.id))];
  // ...and an EXPLICIT over-fit is still priced, and still tells you it is free to undo
  g.garage.fitted = { dune: 2 };
  const fDuneForced = g.carFitness(sealedLv.id);
  out.duneForcedBlocked = !fDuneForced.ok && !!fDuneForced.tooMuch;
  out.duneAdvice = fDuneForced.fix.text;
  g.garage.fitted = {};
  // ...and on a LOOSE stage the same car AUTO-fits gravel: the ideal window is
  // "the compound the world asks for", and owning more never forces you past it.
  out.duneOnLoose = g.carFitness(looseLv.id).ok;
  out.duneAutoLoose = V.TYRE_LABEL[g.fittedTyre('dune', T.LEVELS.find((l) => l.id === looseLv.id))];
  // and nothing in the catalogue is legal everywhere
  out.coversAll = V.CAR_CATALOG.filter((c) =>
    T.LEVELS.every((l) => {
      const need = T.surfaceClass(l), have = V.tyreClass(c.key, null);
      return have >= need && have - need <= 1;
    })).map((c) => c.name);

  // ---- over-tyred costs you -----------------------------------------------
  g.cars.selected = 'dune';
  g.cars.owned = ['brawler', 'crown', 'dune'];
  // OVER-TYRED IS A CHOICE NOW, so it has to be chosen to be measured. The
  // player deliberately fits SNOW on a loose stage — one class over, legal,
  // and priced — and the number has to reach the car, not just the card.
  g.garage.fitted = { dune: 2 };
  g.swapLevel(looseLv, true, null);
  const fOver = g.carFitness(looseLv.id);
  out.overFlag = fOver.over;
  g._applyTyreClass();
  out.playerOver = g.player._tyreOver;
  g.garage.fitted = {};
  // AND IT REACHES THE PHYSICS — asserted on the rule, not on a driven lap.
  // A driven A/B was tried first and abandoned: even with a fresh car per run
  // and six-run averages, the SAME configuration measured 14.114 then 12.666,
  // drifting one way, so the rig was reading accumulated state rather than
  // tyres. The penalty is a pure function now, and this checks that function
  // and that the player is actually handed the number.
  out.pen0 = V.tyrePenalty(0);
  out.pen1 = V.tyrePenalty(1);
  out.pen2 = V.tyrePenalty(2);
  // ...and the under-spec direction, which used to be a refusal and is now
  // the steeper penalty of the two — worse than over by design
  out.penU1 = V.tyrePenalty(0, 1);
  out.penU2 = V.tyrePenalty(0, 2);
  g.cars.selected = 'brawler';
  g.garage.upgrades = {};
  return out;
});

console.log('\n--- tyres: cars, surfaces and the rule between them ---');
ok(R.onIce === R.iceName, 'the test really is standing on the ice world', `${R.onIce} vs ${R.iceName}`);
ok(R.unmapped.length === 0, 'every world classifies to a surface', R.unmapped.join(','));
ok(R.counts.every((c) => c >= 4),
  'all three surfaces are actually used', `sealed ${R.counts[0]} / loose ${R.counts[1]} / ice ${R.counts[2]}`);
ok(R.spaSealed && R.silverstoneSealed,
  'a wet circuit is SEALED, not loose — the classification is not just `loose`');
ok(R.duneLoose && R.dustLoose, 'sand and desert dirt are LOOSE, whatever `loose` said');
ok(R.frostIce, 'a snow world is ICE');
ok(R.brawler === 1 && R.crown === 0 && R.dune === 2,
  'cars carry a tyre class from the stat they already had',
  `brawler ${R.brawler} crown ${R.crown} dune ${R.dune}`);
ok(R.brawlerL1 === 2 && R.crownL1 === 1 && R.crownL3 === 2,
  'a TIRES level raises the class — the upgrade now opens regions',
  `${R.brawlerL1}/${R.crownL1}/${R.crownL3}`);
ok(R.blockedOnIce, `the starter car is outside the window on ${R.iceName}`);
ok(R.fixNamesPrice, 'the mismatch still names a priced, actionable fix', R.fixText);
ok(R.refusedState === 'countdown' || R.refusedState === 'race',
  'pressing START takes the start — priced, not barred', R.refusedState);
// BRAWLER is class 1 and ice needs 2 — the gap is ONE class, and a first
// cut of this assertion demanded two, which is a fact about the assertion
ok(R.underReached === 1,
  'and the physics is handed the under-spec gap', R.underReached);
ok(/WRONG TYRES.*%/.test(R.btnText) && !R.btnBlocked,
  'the button states the price instead of blocking', R.btnText);
ok(R.cardWarns && R.cardHasFix, 'the track card carries the demand and the fix');
ok(R.openedByUpgrade && R.startedAfter,
  'fitting the tyre opens the world and the race starts', R.startedAfter);
ok(R.roamAllowed,
  'free roam is exempt — you may go and find out why the rule exists', R.roamAllowed);
ok(R.crownOnLoose && R.crownOnSealed,
  'a road car pays on loose stages and is at home on the circuits');
ok(/DRIVE YOUR|GARAGE/.test(R.crownAdvice),
  'it points at a machine already owned rather than a shop', R.crownAdvice);
ok(R.duneAutoSealed && R.duneAutoFits === 'ROAD',
  'an all-terrain car AUTO-fits road rubber on a sealed circuit and is ideal — owning '
  + 'the best compound must never cost you anywhere', `fits ${R.duneAutoFits}`);
ok(R.duneForcedBlocked,
  'but choosing to run over-tyred on purpose is still priced');
// SINCE THE TYRE BAY, over-tyred is a FREE fix and the advice says so.
// It used to read "DRIVE YOUR x" or "BUY THE x" — and both could name a
// machine you were already sitting in, which is how CANYON RUN came to tell a
// BRAWLER driver to BUY THE BRAWLER for 0 CR. The stronger claim now: the
// remedy must be free and local, never a purchase, because class can go DOWN.
ok(/TYRE BAY/.test(R.duneAdvice) && /FREE/.test(R.duneAdvice),
  'and the remedy is a free refit, not a car you have to buy', R.duneAdvice);
ok(R.penU1 < R.pen1 && R.penU2 < R.penU1 && R.penU2 <= 0.7,
  'under-spec costs MORE grip than over-spec, and two classes more than one',
  `under1 ${R.penU1}, under2 ${R.penU2}, over1 ${R.pen1}`);
ok(R.duneOnLoose && R.duneAutoLoose === 'GRAVEL',
  'and on a loose stage it fits gravel — the window is what the world asks for, '
  + 'never the most expensive thing you own', `fits ${R.duneAutoLoose}`);
ok(R.coversAll.length === 0,
  'NO single car is legal on every world — the roster is mutually exclusive',
  R.coversAll.join(','));
ok(R.overFlag > 0 && R.playerOver > 0,
  'deliberately fitting more tyre than the world wants is still flagged over-tyred',
  `${R.overFlag}/${R.playerOver}`);
ok(R.pen0 === 1 && R.pen1 < 1 && R.pen2 < R.pen1,
  'over-tyred costs grip, and costs more the further over it is',
  `${R.pen0} / ${R.pen1} / ${R.pen2}`);
ok(R.playerOver > 0,
  'and the number reaches the CAR, not just the card', R.playerOver);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
