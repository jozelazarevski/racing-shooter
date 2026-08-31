/* PATCH_02 v1.3 — recording C's scoreboard, as laws.
 *
 * Four fixes, and an attribution that matters more than one of them:
 *
 *   8   CHECKPOINT MISSED at the grid crossing of every race AFTER the
 *       session's first. Root cause was `_everCP1` — set in checkLap, never
 *       cleared, surviving into the next race. (The marquee itself is gone
 *       under CORRIDOR §8; this pins the FLAG, because a stale flag would
 *       still refuse the lap count even with nothing left to shout.)
 *   15  "Large blue trucks stand on and around the grid." Measured (r301,
 *       this suite's own probe): traffic NEVER builds on autumnwood — Maple
 *       Mile's grid census at GO is three rivals at 7-14 u and zero props,
 *       and the player reaches ~59 km/h by GO+2 s. The trucks in the
 *       recording were the rival grid. The spec's law is still worth having
 *       where traffic DOES exist, so the junction exclusion is tested by
 *       INJECTING a junction onto the grid of a stage that has shuttles.
 *   16  Finish gantry chokepoint: tyre stacks near the line are culled to
 *       the corridor, and the rubber-band CHASE disengages near the lap
 *       boundary so the pack stops timing its arrival to the player's.
 *   17  Dark-stage readability: dusk/night palettes brighten obstacle
 *       materials 15% so the props read against the gloom.
 *
 * Plus CORRIDOR R9: a missed gate returns the car to the gate after the
 * grace, via the same free return everything else uses.
 *
 *   node tests/test-patch13.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg, extra); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

const raceOn = async (level) => {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  p.setDefaultTimeout(300000);
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e.message)));
  await p.goto(`${BASE}/?level=${level}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
    undefined, { timeout: 180000 });
  await p.evaluate(async () => {
    const g = window.__game;
    if (g.composer) g.composer.render = () => {};
    let elapsed = g.clock.elapsedTime;
    g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
      get elapsedTime() { return elapsed; } };
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g._frameBody(); }
  });
  return { p, errors };
};

// ============================== MAPLE MILE ===============================
// Recording C's own stage: fixes 8, 15 (the grid half), 16, and R9.
{
  const { p, errors } = await raceOn(69);

  const A = await p.evaluate(async () => {
    const g = window.__game, pl = g.player, t = g.track, N = t.center.length;

    // fix 15 — the grid census at GO: rivals are a grid, anything else is a
    // blockade. Nothing but rivals may stand within 15 u of the player.
    const props = [];
    for (const s of t.solids ?? []) {
      if (Math.hypot(s.x - pl.pos.x, s.z - pl.pos.z) < 15) props.push(`solid:${s.mat}`);
    }
    for (const o of t.obstacles ?? []) {
      if (o.dead || o.culled) continue;
      if (Math.hypot(o.x - pl.pos.x, o.z - pl.pos.z) < 15) props.push(`obstacle:${o.type ?? '?'}`);
    }
    const traffic = (g.__traffic?.ents ?? []).length;

    // ...and the launch is free: recording C had speed 0 until GO+5.5 s
    g.input.analog.throttle = 1; g.input.analog.brake = 0; g.input.analog.steer = 0;
    let kmh2 = 0;
    for (let f = 1; f <= 120; f++) { g._frameBody(); if (f === 120) kmh2 = Math.hypot(pl.vel.x, pl.vel.z) * 3.6; }
    g.input.analog.throttle = 0;

    // fix 16 — the gantry corridor: no live tyre stack inside the widened
    // line near the lap boundary (the density pass's own criteria, asserted
    // as an invariant so a later prop pass cannot quietly re-narrow it)
    const rep = t._densityReport ?? null;
    const sampleLen = Math.max(1, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
    const gateSamples = Math.max(4, Math.round(80 / sampleLen));
    let choking = 0;
    for (const st of t.tireStacks ?? []) {
      if (st.dead || st.culled) continue;
      const gi = t.nearestIndex(st, null);
      if (Math.min(gi, N - gi) > gateSamples) continue;
      const cc = t.center[gi];
      if (Math.hypot(st.x - cc.x, st.z - cc.z) <= (t.widthAt?.(gi) ?? 9) + 6) choking++;
    }

    // fix 16 — the chase half of the band is OFF near the line
    const e = (g.enemies ?? []).find((c) => c.alive);
    let nearFlag = null, midFlag = null;
    if (e) {
      e.placeAt(Math.round(N * 0.95) % N, 0, true);
      g._frameBody();
      nearFlag = e._nearLine;
      e.placeAt(Math.round(N * 0.5) % N, 0, true);
      g._frameBody();
      midFlag = e._nearLine;
    }

    // fix 8 — the flag that survived across races dies with the race
    for (const c of [pl, ...g.enemies]) { c._everCP1 = true; c._cpMask = 7; c._midCP = true; }
    g.resetRace();
    const stale = [pl, ...g.enemies].filter((c) => c._everCP1 || c._cpMask || c._midCP).length;

    return { traffic, props, kmh2: +kmh2.toFixed(0), rep, choking,
      gateClear: rep?.gateClear ?? 0, nearFlag, midFlag, stale, cars: 1 + g.enemies.length };
  });

  ok(A.traffic === 0 && A.props.length === 0,
    'fix 15: the Maple Mile grid holds rivals and NOTHING else',
    `traffic=${A.traffic}, props within 15 u: [${A.props.join(', ')}]`);
  ok(A.kmh2 > 30, 'fix 15: the launch is free — moving well before GO+2 s',
    `${A.kmh2} km/h at GO+2 s (recording C: 0 km/h until GO+5.5 s)`);
  ok(!!A.rep && A.choking === 0,
    'fix 16: no live tyre stack narrows the line within 80 m of the gantry',
    `density pass ran, gateClear culled ${A.gateClear}, still choking: ${A.choking}`);
  ok(A.nearFlag === true && A.midFlag === false,
    'fix 16: the rubber-band chase stands down near the lap boundary',
    `_nearLine at 95% of the lap: ${A.nearFlag}, at 50%: ${A.midFlag}`);
  ok(A.stale === 0,
    'fix 8: every lap-gate flag dies with the race, on every car',
    `${A.stale}/${A.cars} cars still armed after resetRace()`);

  // R9 — leave the next gate behind, and after the grace the route brings
  // you back, still owing it. (resetRace above ended the race; re-enter.)
  const B = await p.evaluate(async () => {
    const g = window.__game, t = g.track, N = t.center.length;
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g._frameBody(); }
    const pl = g.player;
    let returns = 0, lastReturn = null;
    const realLog = g.telemetry.log.bind(g.telemetry);
    g.telemetry.log = (kind, data) => {
      if (kind === 'return') { returns++; lastReturn = data; }
      return realLog(kind, data);
    };
    const owedId = pl._nextGate ?? 0;
    const gate = g.route?.gates?.[owedId];
    if (!gate) return { noRoute: true };
    // teleport PAST the owed gate — the overshoot the grace exists for
    pl.placeAt((gate.si + 40) % N, 0, true);
    pl.vel.set(0, 0, 0);
    g.input.analog.throttle = 0; g.input.analog.brake = 0; g.input.analog.steer = 0;
    let earlyReturns = 0;
    for (let f = 0; f < 120; f++) g._frameBody();     // 2 s: inside the grace
    earlyReturns = returns;
    // measure AT the return, not later: the car re-enters at 40 km/h and
    // honestly re-crosses the gate within a second or two — waiting and then
    // measuring "still owed" would fail the fix for finishing its job
    let atReturn = null;
    for (let f = 0; f < 240 && !atReturn; f++) {      // ...to 6 s total
      g._frameBody();
      if (returns > 0) {
        atReturn = { behind: (gate.si - pl.trackIndex + N) % N,
          stillOwed: pl._nextGate === owedId };
      }
      if (f % 120 === 0) await new Promise((rs) => setTimeout(rs, 0));
    }
    // ...and let it drive on: the owed gate should now be honestly passed
    for (let f = 0; f < 180; f++) g._frameBody();
    const passedAfter = pl._nextGate !== owedId;
    return { owedId, returns, earlyReturns, lastReturn,
      behind: atReturn?.behind ?? -1, stillOwed: !!atReturn?.stillOwed, passedAfter };
  });

  if (B.noRoute) ok(false, 'R9: the race has a route to miss a gate on');
  else {
    ok(B.earlyReturns === 0, 'R9: the 4 s grace is real — no yank inside it',
      `${B.earlyReturns} returns in the first 2 s past the gate`);
    ok(B.returns >= 1 && B.lastReturn?.reason === 'missed' && B.lastReturn?.gateId === B.owedId,
      'R9: past the grace, the route returns the car to the missed gate',
      `${B.returns} return(s), telemetry ${JSON.stringify(B.lastReturn)}`);
    ok(B.stillOwed && B.behind >= 0 && B.behind < 60,
      'R9: the car re-enters just BEHIND the gate it still owes',
      `${B.behind} samples short of gate ${B.owedId} at the return, still owed: ${B.stillOwed}`);
    ok(B.passedAfter,
      'R9: the re-entry then crosses the gate honestly — the debt clears by driving',
      `next gate advanced past ${B.owedId}: ${B.passedAfter}`);
  }
  ok(errors.length === 0, 'Maple Mile: no page errors', errors.slice(0, 3).join(' | '));
  await p.close();
}

// ============================== PINE VALLEY ==============================
// The half of fix 15 that needs actual traffic: shuttles keep 60 m off the
// grid — including from a junction planted ON the grid.
{
  const { p, errors } = await raceOn(1);
  const T = await p.evaluate(async () => {
    const g = window.__game, t = g.track, c0 = t.center[0];
    const dist = (e) => Math.hypot(e.x - c0.x, e.z - c0.z);
    const S = g.__traffic;
    if (!S || !S.ents.length) return { none: true };
    const natural = Math.min(...S.ents.map(dist));
    // plant a junction right on the grid and force the rebuild tick —
    // the exclusion, not the map's luck, is what keeps the grid clear
    const donor = (t.crossroads ?? [])[0];
    if (!donor) return { natural, noDonor: true };
    t.crossroads.unshift({ ...donor, x: c0.x + 10, z: c0.z, index: 0 });
    S.track = null;                        // "the world changed" — rebuild
    await new Promise((rs) => setTimeout(rs, 120));
    for (let f = 0; f < 10; f++) g._frameBody();
    await new Promise((rs) => setTimeout(rs, 120));
    const crossD = S.ents.filter((e) => e.cross).map((e) => +dist(e).toFixed(0));
    const rebuilt = S.ents.length;
    t.crossroads.shift();
    return { natural: +natural.toFixed(0), crossD, rebuilt };
  });
  if (T.none) ok(false, 'fix 15: the traffic stage has traffic to test');
  else {
    ok(T.natural >= 60, 'fix 15: no traffic spawns within 60 m of the start gate',
      `closest vehicle at ${T.natural} u`);
    ok(!T.noDonor && T.rebuilt > 0 && T.crossD.every((d) => d >= 55),
      'fix 15: a junction planted ON the grid gets no shuttle — the exclusion holds',
      `${T.rebuilt} vehicles rebuilt, crossing rigs at [${T.crossD?.join(', ')}] u`);
  }
  ok(errors.length === 0, 'Pine Valley: no page errors', errors.slice(0, 3).join(' | '));
  await p.close();
}

// =============================== EMBER PASS ==============================
// fix 17 on a stage that is dusk BY THEME (volcanic ember light): the
// density pass must have run its dark-lift.
{
  const { p, errors } = await raceOn(5);
  const D = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    return { dusk: !!t.T?.dusk, lift: !!t._darkLift, rep: !!t._densityReport };
  });
  ok(D.dusk, 'fix 17 setup: EMBER PASS really is a dusk palette', JSON.stringify(D));
  ok(D.rep && D.lift, 'fix 17: the dark stage got its 15% obstacle lift',
    `density pass ran: ${D.rep}, dark-lift applied: ${D.lift}`);
  ok(errors.length === 0, 'Ember Pass: no page errors', errors.slice(0, 3).join(' | '));
  await p.close();
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
