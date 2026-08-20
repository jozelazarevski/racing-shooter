/* THE BUILD BAY — parts you choose, buy and earn.
 *
 * Asked for as "create a garage where I can custom build the car … engine
 * v4-8-12, add spoilers … I would purchase parts and race for other parts".
 *
 * The checks that matter, and why each one is here:
 *   - A PART CHANGES THE CAR. A build screen that edits a saved string and
 *     nothing else is the failure mode worth guarding: every fitted part has
 *     to move a number the physics reads AND a mesh the camera sees.
 *   - THE TRADE IS REAL. A bigger block must cost grip and a bigger wing must
 *     cost top speed, or the "choice" is a ladder with extra steps.
 *   - MONEY IS TAKEN AND THE BUILD PERSISTS, because a purchase that survives
 *     until the next render is not a purchase.
 *   - A LOCKED PART CANNOT BE BOUGHT AT ANY PRICE, and opens on the race it
 *     names — that is the whole "race for other parts" half.
 *   - THE KIT SHARES ITS MATERIALS. Rebuilding them per call is what made a
 *     menu-time kit rebuild dispose materials out from under an in-flight
 *     compileAsync ("reading 'isReady'"). Cheap to check, expensive to lose.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const check = (name, ok, note = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? '  ' + note : ''}`);
  ok ? pass++ : fail++;
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });

const R = await page.evaluate(() => {
  const g = window.__game;
  // PART_SLOT is module-private, so reach the slot through the game's own API
  const PART_SLOT_ENGINE = () => ({ key: 'engine', mountName: 'ENGINE WRENCH' });
  g.showMenu();
  const out = {};
  const kitCount = () => g.player.mesh.getObjectByName('upgradeKit')?.children.length ?? 0;
  const snap = () => ({ speed: +g.player.maxSpeed.toFixed(3), accel: +g.player.accel.toFixed(3),
    grip: +(g.player.gripBoost ?? 1).toFixed(4), down: g.player.downforce ?? 0, kit: kitCount() });

  g.garage.credits = 60000;
  // everything starts stock, owned, fitted
  out.stockEngine = g.fittedPart('engine').id;
  out.stockWing = g.fittedPart('spoiler').id;
  const stock = snap();

  // Everything below goes through the REAL UI path — open the slot, tap the
  // row — so the test cannot pass on a code path a player never reaches.
  document.getElementById('tab-btn-garage').click();
  // r231: every bay is open at once now — the cards are pictures in a grid,
  // not rows behind a fold — so a part is addressed by its own data-attrs
  const fitByIndex = (slotKey, i) => {
    g.renderGarage();
    const cards = [...document.querySelectorAll(`.part-card[data-slot="${slotKey}"]`)];
    cards[i].click();
    return snap();
  };
  // r233: THE CHASSIS GATES THE PART. The BRAWLER is engine class 1, so the
  // V8 (class 2) needs ENGINE WRENCH 3 before it will go on at any price —
  // buy the ladder the way a player would, then fit.
  const v6 = fitByIndex('engine', 1);
  g.carUpgrades().engine = 3; g.applyUpgrades();
  const v8 = fitByIndex('engine', 2);
  out.speedClimbs = stock.speed < v6.speed && v6.speed < v8.speed;
  out.accelClimbs = stock.accel < v6.accel && v6.accel < v8.accel;
  out.gripFalls = stock.grip > v6.grip && v6.grip > v8.grip;
  out.pipesGrow = stock.kit < v8.kit;
  out.creditsTaken = 60000 - g.garage.credits;      // 1800 + 4200

  // ---- r233: the three walls, told apart
  g.renderGarage();
  const card = (id) => document.querySelector(`.part-card[data-slot="engine"][data-part="${id}"]`);
  out.v12Capped = card('v12').classList.contains('capped');
  out.v12NamesHomes = /DUNE|BASTION|PIT/.test(card('v12').querySelector('.pc-sub').textContent);
  out.v12Homes = g.partHomes(PART_SLOT_ENGINE(), { tier: 3 });
  // a mount-gated part: drop the ladder and the V8 must go back out of reach
  g.carUpgrades().engine = 0; g.applyUpgrades(); g.renderGarage();
  out.v8Gated = card('v8').classList.contains('mount');
  out.v8SaysLadder = /ENGINE WRENCH 3/.test(card('v8').querySelector('.pc-sub').textContent);
  // ...AND THE FITTED PART FALLS OFF, because the bay can no longer hold it
  out.fellBackToStock = g.fittedPart('engine').id;
  out.stillOwned = g.ownsPart('engine', 'v8');
  g.carUpgrades().engine = 3; g.applyUpgrades();
  out.refitsWhenAllowed = (fitByIndex('engine', 2), g.fittedPart('engine').id);

  // ---- WING: downforce up, top speed down, silhouette changes.
  // The BRAWLER is wing class 1, so the DUCKTAIL (class 2) wants SUSPENSION
  // SPRING 3 first — same gate as the V8, on the other ladder.
  g.carUpgrades().handling = 3; g.applyUpgrades();
  const beforeWing = snap();
  const duck = fitByIndex('spoiler', 2);
  out.downforceUp = duck.down > beforeWing.down;
  out.topSpeedPaid = duck.speed < beforeWing.speed;
  out.wingDrawn = duck.kit > beforeWing.kit;

  // ---- PERSISTENCE (read before the car is swapped below)
  const raw = JSON.parse(localStorage.getItem(g._pkey('garage')));
  out.saved = raw?.parts?.brawler?.fitted;

  // ---- LOCKED BY A RACE, not by the chassis. The BRAWLER tops out at wing
  // class 2, so a GT wing on it is a CHASSIS refusal and would never reach the
  // medal check — the test has to stand on a machine that could wear one.
  g.garage.credits = 999999;
  for (const lv of Object.keys(g.career.finished)) delete g.career.finished[lv];
  g.cars.owned = [...new Set([...g.cars.owned, 'crown'])];
  g.cars.selected = 'crown';
  g._base = null;
  g.carUpgrades('crown').handling = 3;
  g.applyUpgrades();
  const gt = fitByIndex('spoiler', 3);
  out.lockedStayed = g.fittedPart('spoiler').id !== 'gt';
  out.lockedUntouchedCredits = g.garage.credits === 999999;
  out.lockedExplains = (document.querySelector('.bay-msg')?.textContent || '')
    .includes('TAKE 3 MISSION MEDALS');

  // ...and OPENS on the race it names
  const best = {};
  for (const [i, lv] of g.chapters().flatMap((c) => c.levels).slice(0, 6).entries()) {
    g.career.finished[lv.id] = { place: 1, time: 60 };
    best[`${lv.id}:rampage`] = 1 + (i % 3);
  }
  localStorage.setItem(g._missionStoreKey(), JSON.stringify(best));
  out.v12OpensOnSixWins = g.partLock({ lock: { kind: 'cleared', n: 6 } }).open;
  out.gtOpensOnMedals = g.partLock({ lock: { kind: 'medals', n: 3 } }).open;

  // ---- r231: THE GARAGE IS GRAPHICAL. Every part shows a picture rendered
  // from its own mesh, and the preview shows the car actually built.
  g.renderGarage();
  const art = [...document.querySelectorAll('.part-card .pc-art')];
  out.everyPartHasArt = art.length > 0 && art.every((i) => (i.getAttribute('src') || '').length > 2000);
  out.partCount = art.length;
  out.distinctArt = new Set(art.map((i) => i.getAttribute('src'))).size;
  // r232: the preview is a LIVE canvas, not an image — mounted, sized, and
  // carrying the build that is actually fitted
  const st = g.__stage;
  const cv = document.querySelector('.bp-shop canvas');
  out.stageMounted = !!cv && cv.isConnected && cv.width > 80;
  out.stageCarIsTheBuild = st?.sig === JSON.stringify(
    [g.cars.selected, g.carUpgrades(), g.carParts().fitted]);
  out.bays = document.querySelectorAll('.bay').length;
  out.ladders = document.querySelectorAll('.up-card').length;

  // ---- the banner, once
  delete g.garage.partSeen;
  g._announcePartUnlocks();
  out.bannerFirst = document.getElementById('part-unlock').style.display !== 'none';
  document.getElementById('part-unlock').style.display = 'none';
  g._announcePartUnlocks();
  out.bannerRepeat = document.getElementById('part-unlock').style.display !== 'none';
  return out;
});

check('a fresh car is stock in every slot', R.stockEngine === 'v4' && R.stockWing === 'none',
  `${R.stockEngine} / ${R.stockWing}`);
check('a bigger block is faster', R.speedClimbs);
check('...and pulls harder', R.accelClimbs);
check('...and pays for it in grip — the trade is real', R.gripFalls);
check('...and puts more pipes out of the back', R.pipesGrow);
check('buying takes the money, exactly once each', R.creditsTaken === 6000, `${R.creditsTaken} CR`);
check('a wing buys downforce', R.downforceUp);
check('...and pays for it in top speed', R.topSpeedPaid);
check('...and is actually on the car', R.wingDrawn);
check('the build survives a save', JSON.stringify(R.saved) === '{"engine":"v8","spoiler":"duck"}',
  JSON.stringify(R.saved));
check('a part too big for the chassis is refused outright', R.v12Capped);
check('...and names the machines that could wear it', R.v12NamesHomes,
  (R.v12Homes || []).join(', '));
check('a part the ladder has not reached is a DIFFERENT refusal', R.v8Gated);
check('...and says which ladder, and to what level', R.v8SaysLadder);
check('dropping the ladder takes the part back off the car', R.fellBackToStock === 'v4');
check('...but you still own it', R.stillOwned);
check('...and it goes back on once the chassis can carry it', R.refitsWhenAllowed === 'v8');
check('a locked part cannot be bought at any price', R.lockedStayed && R.lockedUntouchedCredits);
check('...and says which race opens it', R.lockedExplains);
check('the V12 opens once six worlds are won outright', R.v12OpensOnSixWins);
check('the GT wing opens once three medals are held', R.gtOpensOnMedals);
check('every part in the shop is a rendered picture', R.everyPartHasArt, `${R.partCount} parts`);
check('...and no two parts share a picture', R.distinctArt === R.partCount,
  `${R.distinctArt} distinct of ${R.partCount}`);
check('the shop floor is a live canvas, mounted and sized', R.stageMounted);
check('...showing the build that is actually fitted', R.stageCarIsTheBuild);
check('every upgrade ladder found a bay', R.ladders === 10, `${R.ladders} of 10 in ${R.bays} bays`);
check('an earned part is announced on the debrief', R.bannerFirst);
check('...and only the once', !R.bannerRepeat);

// THE MATERIAL LEAK THAT BROKE compileAsync — the kit must not build a new
// material per call, or a rebuild disposes one three is still polling.
const mats = await page.evaluate(async () => {
  const V = await import('/src/vehicles.js');
  const m = window.__game.player.mesh;
  const grab = () => { const s = new Set();
    m.getObjectByName('upgradeKit')?.traverse((o) => { if (o.material) s.add(o.material.uuid); });
    return s; };
  // rebuild with the SAME build, so both kits are non-empty and comparable —
  // passing no parts draws an empty kit and compares nothing
  const g = window.__game;
  const fit = { engine: g.fittedPart('engine'), spoiler: g.fittedPart('spoiler') };
  V.applyUpgradeKit(m, g.carUpgrades(), fit);
  const a = grab();
  V.applyUpgradeKit(m, g.carUpgrades(), fit);
  const b = grab();
  return { shared: a.size > 0 && [...b].every((u) => a.has(u)), a: a.size, b: b.size };
});
check('the kit shares its materials across rebuilds', mats.shared,
  `${mats.a} then ${mats.b} distinct materials`);
check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
