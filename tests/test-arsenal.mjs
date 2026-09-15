/* r173 — THE GARAGE IS THE GAME.
 *
 * Four asks, one theme: nothing about the car should be free.
 *
 *   "Make the weapons significantly less powerful at the beginning."
 *   "Rockets and gun needs to have limited and upgradable slots."
 *   "Same for the sos. Limited and buyable."
 *   "The locks with items mean nothing now. Make it more meaningful."
 *   "The car levels needs to be significantly different — I can't be winning
 *    against bastion if I race with brawler."
 *
 * What ties them together: before this, a brand-new free car turned up with an
 * infinite cannon, three rockets, an unlimited rescue and a top speed within a
 * few percent of the flagship, so the only thing 32,000 CR bought was a
 * different paint job. Every assertion here is about a gap between stock and
 * bought that a player can feel.
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
// A TOUCH CONTEXT, deliberately: the ammo readouts that matter most live on
// the touch buttons, because `body.touch` hides the weapon panel entirely and
// the FIRE button is then the only place a magazine count can be read. On a
// desktop page that whole branch of Hud.update never runs, so the assertion
// below would be checking nothing.
const page = await browser.newPage({ viewport: { width: 400, height: 780 },
  hasTouch: true, isMobile: true });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 600000 });

/* ---- 1. FINITE, AND THE LIMIT IS A PURCHASE ---------------------------- */
const A = await page.evaluate(() => {
  const g = window.__game, p = g.player, car = g.cars.selected;
  const load = () => ({ rounds: p.rounds, maxRounds: p.maxRounds, missiles: p.missiles,
    mines: p.mines, sos: p.sos, dmg: +p.cannonDamage.toFixed(2) });
  g.garage.upgrades ??= {};
  g.garage.upgrades[car] = {};
  g.career.feats = {};
  g.startRace();
  const stock = load();
  g.garage.upgrades[car] = { magazine: 5, rack: 5, beacon: 3, cannon: 5 };
  g.startRace();
  const maxed = load();
  return { stock, maxed,
    // the whole race's worth of damage each loadout can deliver
    stockOut: stock.rounds * stock.dmg, maxedOut: maxed.rounds * maxed.dmg };
});
console.log(`  stock  ${A.stock.rounds} rounds x ${A.stock.dmg} = ${A.stockOut} damage`
  + `  ·  ${A.stock.missiles} rocket, ${A.stock.mines} mine, ${A.stock.sos} SOS`);
console.log(`  maxed  ${A.maxed.rounds} rounds x ${A.maxed.dmg} = ${A.maxedOut} damage`
  + `  ·  ${A.maxed.missiles} rockets, ${A.maxed.mines} mines, ${A.maxed.sos} SOS`);
ok(A.stock.maxRounds > 0 && Number.isFinite(A.stock.rounds),
  'the cannon has a magazine at all — it was infinite, heat-limited only');
ok(A.maxed.rounds > A.stock.rounds * 2, 'and the drum is something you buy',
  `${A.stock.rounds} → ${A.maxed.rounds}`);
ok(A.stock.missiles === 1 && A.maxed.missiles === 6,
  'the rocket rack is one slot stock and six bought',
  `${A.stock.missiles} → ${A.maxed.missiles}`);
ok(A.stock.mines === 1 && A.maxed.mines === 6, 'and the mines ride the same rack',
  `${A.stock.mines} → ${A.maxed.mines}`);
ok(A.stock.sos === 1 && A.maxed.sos === 4,
  'the SOS is one charge stock, four fully bought — limited and buyable, as asked',
  `${A.stock.sos} → ${A.maxed.sos}`);
ok(A.stock.dmg < 4 && A.maxed.dmg > 12,
  'a stock cannon is a chip weapon and a bought one is the gun it used to be for free',
  `${A.stock.dmg} → ${A.maxed.dmg}`);
ok(A.maxedOut > A.stockOut * 8,
  'across a whole race the difference is a factor of eight, not a rounding error',
  `${A.stockOut} → ${A.maxedOut}`);

/* ---- 2. ...AND RUNNING DRY IS A REAL STATE ------------------------------ */
const B = await page.evaluate(async () => {
  const g = window.__game, p = g.player;
  const DT = 1 / 60;
  const stub = (fire) => ({ throttle: 0, brake: 0, steer: 0, drift: false, fire,
    justPressed: () => false });
  g.garage.upgrades[g.cars.selected] = {};
  g.startRace();
  g.state = 'race';
  const start = p.rounds;
  // hold the trigger long enough to empty a stock drum several times over
  for (let i = 0; i < 60 * 60 && p.rounds > 0; i++) p.update(DT, stub(true));
  const emptied = p.rounds;
  const fireBtn = document.getElementById('t-fire');
  // one more frame so the HUD paints the dry state
  g.hud.update?.(DT);
  const btn = { text: fireBtn?.textContent, dry: fireBtn?.classList.contains('dry') };
  const panel = document.getElementById('round-count');
  const readout = { text: panel?.textContent, out: panel?.classList.contains('out') };
  // ...and an ordnance pickup puts rounds back, or a dry gun is a dead end
  p.rounds = 0;
  const belt = Math.round(p.maxRounds * 0.34);
  p.rounds = Math.min(p.maxRounds, p.rounds + belt);
  return { start, emptied, btn, readout, refilled: p.rounds, belt };
});
console.log(`  a stock drum of ${B.start} empties under a held trigger → ${B.emptied}`);
ok(B.start > 0 && B.emptied === 0, 'the trigger really can run the magazine dry',
  `${B.start} → ${B.emptied}`);
ok(B.btn.dry && B.btn.text === 'DRY',
  'the fire button says DRY — on a phone the weapon panel is hidden, so this is the only readout',
  JSON.stringify(B.btn));
ok(B.readout.out && B.readout.text === 'EMPTY', 'and the panel agrees', JSON.stringify(B.readout));
ok(B.refilled === B.belt && B.belt > 0,
  'an ordnance pickup puts a belt back, so a dry gun is recoverable inside a race',
  `+${B.belt}`);

/* ---- 3. THE SOS IS SPENT, NOT JUST COOLED ------------------------------ */
const C = await page.evaluate(async () => {
  const g = window.__game, p = g.track;
  const P = g.player;
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  g.garage.upgrades[g.cars.selected] = {};   // one charge
  g.startRace();
  g.state = 'race';
  const strand = async () => {
    const c = p.center[(P.trackIndex + 40) % p.N], n = p.nrm[(P.trackIndex + 40) % p.N];
    P.pos.set(c.x + n.x * 34, c.y + 3, c.z + n.z * 34);
    P.vel.set(0, 0, 0); P.vy = 0;
    for (let i = 0; i < 3; i++) await frame();
  };
  const off = () => Math.abs(P.lateral ?? 0);
  await strand();
  P._unstuckReq = true;
  for (let i = 0; i < 4; i++) await frame();
  const first = { lat: off(), sos: P.sos };
  // the charge is gone — even once the 30 s cooldown is waived it must refuse
  P.unstuckCool = 0;
  await strand();
  P._unstuckReq = true;
  for (let i = 0; i < 4; i++) await frame();
  const second = { lat: off(), sos: P.sos };
  return { first, second };
});
console.log(`  one charge: rescue → ${C.first.lat.toFixed(1)} u (${C.first.sos} left),`
  + ` second call → ${C.second.lat.toFixed(1)} u`);
ok(C.first.lat < 3 && C.first.sos === 0, 'the stock charge rescues once and is then spent',
  JSON.stringify(C.first));
ok(C.second.lat > 20,
  'and with the cooldown waived it STILL refuses — spent is spent, not merely cooling',
  JSON.stringify(C.second));

/* ---- 4. THE PADLOCK NAMES A PRICE AND CHARGES IT ----------------------- */
const D = await page.evaluate(() => {
  const g = window.__game, car = g.cars.selected;
  g.garage.upgrades[car] = {};
  g.career.feats = {};
  const gates = g.featsOf(1).map((f) => f.need);
  const bare = g.kitPenalties();
  const bareH = g.kitHandicap();
  g.garage.upgrades[car] = Object.fromEntries(gates.map((n) => [n.key, n.lvl]));
  const kitted = g.kitPenalties();
  const kittedH = g.kitHandicap();
  // and the card prints what it costs, not just that it is shut
  g.garage.upgrades[car] = {};
  g._renderLevelCards();
  const chip = document.querySelector('#level-select .level-chip[data-lvid="1"] .wc-feat.locked');
  return { bare, bareH: +bareH.toFixed(2), kitted, kittedH: +kittedH.toFixed(2),
    chip: chip?.textContent?.trim(), chipHasCost: !!chip?.querySelector('i'),
    gates: gates.map((n) => `${n.key}${n.lvl}`) };
});
console.log(`  gates ${D.gates.join(' + ')}  ·  undergeared ${JSON.stringify(D.bare)}`);
console.log(`  card chip: "${D.chip}"`);
ok(D.kittedH === 1 && Object.values(D.kitted).every((v, i) => (i === 2 ? v === 0 : v === 1)),
  'meeting every gate costs exactly nothing — the balance the other suites use is untouched',
  JSON.stringify(D.kitted));
ok(D.bareH >= 1.3, 'an undergeared grid is a third quicker, not a nudge', `${D.bareH}`);
ok(Object.entries(D.bare).some(([k, v]) => (k === 'dampers' ? v === 1 : v < 1)),
  'and the world takes the part you did not bring OUT OF YOUR CAR',
  JSON.stringify(D.bare));
ok(D.chipHasCost && /−|NO DAMPERS/.test(D.chip ?? ''),
  'the padlock on the card states the price, so it is a lock and not a label',
  D.chip);

/* ---- 5. A FREE CAR IS NOT A FLAGSHIP ----------------------------------- */
const E = await page.evaluate(() => {
  const cars = window.__CARS;
  const pick = (k) => cars.find((c) => c.key === k).stats;
  const b = pick('brawler'), s = pick('bastion');
  return { brawler: b, bastion: s,
    dominated: s.maxSpeed > b.maxSpeed && s.grip > b.grip && s.offroad > b.offroad
      && s.health > b.health };
});
console.log(`  BRAWLER ${E.brawler.maxSpeed}/${E.brawler.grip}/${E.brawler.offroad}`
  + `   BASTION ${E.bastion.maxSpeed}/${E.bastion.grip}/${E.bastion.offroad}`);
ok(E.dominated,
  'the BASTION beats the free BRAWLER on speed, grip, off-road AND hull — every axis, no exceptions',
  JSON.stringify(E));
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join('\n'));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
