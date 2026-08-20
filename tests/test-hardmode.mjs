/* r172 — THE FOUR RULES THAT MAKE A RACE COST SOMETHING.
 *
 * Asked for in one message: eight cars on the grid rather than six, three
 * wrecks and the race is over, ice and water that actually feel slippery —
 * "especially with wrong tires, which I need to buy" — and a car that is
 * written off if it sits in the snow on road rubber going nowhere.
 *
 * They are one suite because they are one idea. Each on its own is a knob;
 * together they are the reason to walk into the garage. The tyre rule makes
 * the wrong car slide, the bog rule makes sliding into the scenery cost a
 * hull, and the hull limit makes the third one end your afternoon.
 *
 * The one property every assertion here has to protect: a CORRECTLY EQUIPPED
 * car must be almost untouched. If turning up on the right compound got harder
 * too, this would just be a difficulty increase with extra steps.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

/* ---- 1. EIGHT CARS ------------------------------------------------------ */
{
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 420 } });
  page.setDefaultTimeout(600000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
    undefined, { timeout: 600000 });

  const R = await page.evaluate(() => {
    const g = window.__game;
    const names = g.enemies.map((e) => e.name);
    // grid slots must not stack two cars on one square
    const slots = g.enemies.map((e, i) => g.track.gridSlot(i + 1));
    const key = (s) => `${s.index}:${s.lateral}`;
    return {
      field: 1 + g.enemies.length,
      names,
      unique: new Set(names).size,
      slotsUnique: new Set([g.track.gridSlot(0), ...slots].map(key)).size,
      counter: document.getElementById('racer-count')?.textContent,
      hudField: g.fieldSize,
    };
  });
  console.log(`  grid: ${R.names.join(', ')}`);
  ok(R.field === 8, 'eight cars line up, not six', `${R.field}`);
  ok(R.unique === R.names.length,
    'and no rival is a repaint of another — seven distinct machines',
    `${R.unique} unique of ${R.names.length}`);
  ok(R.slotsUnique === 8, 'eight distinct grid slots', `${R.slotsUnique}`);
  ok(R.counter === '8', 'the HUD counts out of 8', `${R.counter}`);

  // the ordinal has to keep working past the old end of the table
  const ords = await page.evaluate(() => {
    const g = window.__game;
    const out = [];
    for (let r = 1; r <= 8; r++) {
      g.playerRank = r;
      g.state = 'race';
      g.player.finished = false;
      g.finishRace();
      out.push({ r, place: document.getElementById('result-place').textContent,
        score: document.getElementById('r-score').textContent });
    }
    return out;
  });
  console.log('  places:', ords.map((o) => o.place).join(' '));
  ok(ords.map((o) => o.place).join(' ') === '1ST 2ND 3RD 4TH 5TH 6TH 7TH 8TH',
    'every finishing position has a correct ordinal, 7th and 8th included',
    ords.map((o) => o.place).join(' '));
  ok(errors.length === 0, 'no page errors from the wider grid', errors.slice(0, 3).join('\n'));
  await browser.close();
}

/* ---- 2. THREE HULLS ----------------------------------------------------- */
{
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 420 } });
  page.setDefaultTimeout(600000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
    undefined, { timeout: 600000 });

  const H = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const kill = async () => {
      p.invuln = 0; p.alive = true; p.health = p.maxHealth;
      p.destroy(null);
      await frame();
    };
    g.career.finished = {};
    const before = JSON.stringify(g.career.finished);
    const credits = g.garage.credits;

    await kill();
    const after1 = { deaths: g.deaths, state: g.state, pips: document.getElementById('deaths').textContent };
    await kill();
    const after2 = { deaths: g.deaths, state: g.state, pips: document.getElementById('deaths').textContent };
    // the second wreck must still leave a race running to lose
    await kill();
    const after3 = { deaths: g.deaths, state: g.state, pips: document.getElementById('deaths').textContent,
      place: document.getElementById('result-place').textContent,
      credits: document.getElementById('r-credits').textContent,
      sub: document.querySelector('#results .game-sub').textContent,
      again: document.getElementById('restart-btn').textContent,
      nextShown: document.getElementById('next-level-btn').style.display !== 'none' };

    // ...and the car must NOT redeploy onto an empty race
    const posA = p.pos.clone();
    for (let i = 0; i < 30; i++) await frame();
    const revived = p.alive;

    return { after1, after2, after3, revived,
      careerUntouched: JSON.stringify(g.career.finished) === before,
      creditsUntouched: g.garage.credits === credits,
      lives: g.hullLives };
  });
  console.log(`  wreck 1 ${H.after1.pips} · wreck 2 ${H.after2.pips} · wreck 3 → ${H.after3.state} "${H.after3.place}"`);
  ok(H.lives === 3, 'the budget is three hulls', `${H.lives}`);
  ok(H.after1.state === 'race' && H.after2.state === 'race',
    'the first two wrecks are survivable — the race goes on',
    `${H.after1.state} / ${H.after2.state}`);
  ok(H.after1.pips === '◆◆◇' && H.after2.pips === '◆◇◇',
    'and the HUD counts DOWN what is left, not up what is gone',
    `${H.after1.pips} then ${H.after2.pips}`);
  ok(H.after3.state === 'finished' && H.after3.place === 'DESTROYED',
    'the third ends it', `${H.after3.state} / ${H.after3.place}`);
  ok(!H.revived, 'and the car does not redeploy into a race that is over');
  ok(H.after3.credits === '+0' && H.creditsUntouched,
    'nothing is paid for being wrecked out', H.after3.credits);
  ok(H.careerUntouched,
    'and nothing is banked — no place, no star, the world keeps its old best');
  ok(/WRECKED OUT/.test(H.after3.sub) && H.after3.again === 'RESTART TRACK' && !H.after3.nextShown,
    'the card says what happened and offers the track again, not the next one',
    `${H.after3.sub} / ${H.after3.again}`);

  // a restart hands all three back
  const fresh = await page.evaluate(() => {
    const g = window.__game;
    g.startRace?.();
    return { deaths: g.deaths, out: g.player.outOfHulls, over: g.raceOver,
      again: document.getElementById('restart-btn').textContent };
  });
  ok(fresh.deaths === 0 && fresh.out === false && fresh.over === false,
    'restarting the track hands all three hulls back', JSON.stringify(fresh));
  ok(errors.length === 0, 'no page errors from the hull limit', errors.slice(0, 3).join('\n'));
  await browser.close();
}

/* ---- 3. SLIPPERY, AND WORSE ON THE WRONG RUBBER -------------------------- */
{
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 420 } });
  page.setDefaultTimeout(600000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  // FROST PEAK — a declared snow world, so `slick` is 1 here
  await page.goto(`${BASE}/?level=3&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
    undefined, { timeout: 600000 });

  const G = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    g.__gripProbe = {};
    // Read the LATERAL GRIP the physics is actually running, at a fixed
    // mismatch. Driving a lap per configuration and comparing times measures
    // the whole simulation and repeats badly (see the tyrePenalty note); the
    // grip term is the thing the change is about, and it is exact.
    const read = async (under, over = 0) => {
      p._tyreUnder = under; p._tyreOver = over;
      g.input.analog.throttle = 0.8; g.input.analog.steer = 0.5;
      for (let i = 0; i < 12; i++) await frame();
      return { grip: +g.__gripProbe.grip.toFixed(3), slick: p._slick, f: +p._tyreFactor.toFixed(3) };
    };
    const right = await read(0);
    const one = await read(1);
    const two = await read(2);
    g.input.analog.throttle = 0; g.input.analog.steer = 0;
    return { right, one, two, surf: g.track.T.surface };
  });
  console.log(`  FROST PEAK (${G.surf}, slick ${G.right.slick}):  correct ${G.right.grip}`
    + ` · one class short ${G.one.grip} (×${G.one.f}) · two short ${G.two.grip} (×${G.two.f})`);
  ok(G.right.slick === 1, 'a snow world asks everything of the compound', `${G.right.slick}`);
  ok(G.one.grip < G.right.grip * 0.7,
    'one class short on ice costs a third of the grip, not a rounding error',
    `${G.one.grip} vs ${G.right.grip}`);
  ok(G.two.grip < G.right.grip * 0.35,
    'two short is a skating rink — "super hard to drive", as asked',
    `${G.two.grip} vs ${G.right.grip}`);
  ok(G.two.grip > 0, 'but never zero: a crawl still steers, so it is recoverable');

  // ...and the SAME mismatch on a dry road must barely matter
  const D = await page.evaluate(async () => {
    const t = await import('./src/vehicles.js');
    return {
      dry2: +t.tyrePenalty(0, 2, 0).toFixed(3),
      wet2: +t.tyrePenalty(0, 2, 0.55).toFixed(3),
      ice2: +t.tyrePenalty(0, 2, 1).toFixed(3),
      iceRight: +t.tyrePenalty(0, 0, 1).toFixed(3),
    };
  });
  console.log(`  two classes short:  dry ×${D.dry2} · wet ×${D.wet2} · ice ×${D.ice2}`);
  ok(D.dry2 > 0.7 && D.ice2 < 0.35,
    'the price of the wrong compound depends on the road — cheap on dry tarmac, ruinous on ice',
    JSON.stringify(D));
  ok(D.dry2 > D.wet2 && D.wet2 > D.ice2, 'and it steepens monotonically with the surface');
  ok(D.iceRight === 1,
    'the right tyres pay NOTHING, even on ice — this is a reason to shop, not a tax');
  ok(errors.length === 0, 'no page errors from the surface model', errors.slice(0, 3).join('\n'));
  await browser.close();
}

/* ---- 4. BOGGED DOWN ----------------------------------------------------- */
{
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 420 } });
  page.setDefaultTimeout(600000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  await page.goto(`${BASE}/?level=3&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
    undefined, { timeout: 600000 });

  const B = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    // DRIVEN AT A FIXED STEP, NOT ON ANIMATION FRAMES.
    //
    // The rule is a five-SECOND timer, and under swiftshader this page runs
    // about 2.5 physics steps per second — measured, after the first cut of
    // this test failed: nine seconds of wall clock bought 23 steps and 1.05 s
    // of game time, so the timer could never reach 5 and the suite reported a
    // rule that was in fact working perfectly. Waiting longer would make the
    // suite a four-minute wait for one assertion. The rule lives entirely
    // inside PlayerCar.update, so it is driven directly at a known dt.
    const DT = 1 / 60;
    const stub = (throttle) => ({ throttle, brake: 0, steer: 0, drift: false,
      justPressed: () => false });
    // ...and hold the car still from INSIDE the step, so the "no forward
    // progress" test sees a stopped car rather than one the physics has
    // already accelerated away.
    const realStep = p.step.bind(p);
    p.step = (dt, inputs) => { realStep(dt, inputs); p.vel.set(0, 0, 0); p.vy = 0; };
    const arm = () => {
      g.deaths = 0; g.raceOver = false; g.state = 'race';
      p.outOfHulls = false; p.alive = true; p.health = p.maxHealth;
      p.invuln = 0; p._bogT = 0; p._wedgeT = 0; p._lostT = 0;
      p.mesh.visible = true;
    };
    const run = (secs, throttle) => {
      const input = stub(throttle);
      const steps = Math.round(secs / DT);
      for (let i = 0; i < steps; i++) {
        if (!p.alive) return +(i * DT).toFixed(1);
        p.update(DT, input);
      }
      return +(steps * DT).toFixed(1);
    };

    // (a) correctly shod on the same snow: held throttle, going nowhere, and
    //     the car must SURVIVE — this is the rescue net's job, not a wreck
    arm(); p._tyreUnder = 0;
    run(9, 1);
    const shodSurvived = p.alive;

    // (b) under-tyred on the same snow: written off
    arm(); p._tyreUnder = 1;
    const bogSecs = run(9, 1);
    const bogWrecked = !p.alive;
    const bogDeaths = g.deaths;

    // (c) off the throttle it never fires — a parked car is not destroyed
    arm(); p._tyreUnder = 2;
    run(9, 0);
    const idleSurvived = p.alive;
    p.step = realStep;
    return { shodSurvived, bogSecs, bogWrecked, bogDeaths, idleSurvived };
  });
  console.log(`  under-tyred, dug in: wrecked after ${B.bogSecs}s`);
  ok(B.shodSurvived,
    'the RIGHT tyres in the same snow are never written off for being stuck — that is the rescue net\'s job');
  ok(B.bogWrecked && B.bogSecs >= 4 && B.bogSecs <= 7.5,
    'the wrong tyres, dug in under power, cost a hull at about 5 s',
    `wrecked=${B.bogWrecked} after ${B.bogSecs}s`);
  ok(B.bogDeaths === 1, 'and it spends a hull, so three of them end the race', `${B.bogDeaths}`);
  ok(B.idleSurvived, 'a car sitting still off the throttle is never destroyed for parking');

  // and it must never fire on a dry world, where the compound is not the point
  const dry = await page.evaluate(() => {
    const g = window.__game, p = g.player;
    const DT = 1 / 60;
    const realStep = p.step.bind(p);
    p.step = (dt, inputs) => { realStep(dt, inputs); p.vel.set(0, 0, 0); p.vy = 0; };
    g.deaths = 0; g.raceOver = false; g.state = 'race';
    p.outOfHulls = false; p.alive = true; p.health = p.maxHealth; p.invuln = 0;
    p._bogT = 0; p._wedgeT = 0; p._lostT = 0; p.mesh.visible = true;
    g.track.T.surface = undefined;                 // pretend the world is dry
    p._tyreUnder = 2;
    const input = { throttle: 1, brake: 0, steer: 0, drift: false, justPressed: () => false };
    for (let i = 0; i < 9 * 60 && p.alive; i++) p.update(DT, input);
    const alive = p.alive;
    p.step = realStep;
    return alive;
  });
  ok(dry, 'and never on a dry road, where what you fitted is not what stopped you');
  ok(errors.length === 0, 'no page errors from the bog rule', errors.slice(0, 3).join('\n'));
  await browser.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
