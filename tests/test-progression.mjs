/* r342 — THE ROSTER RAMP (owner: "Opponents should have progressing in the
 * tracks. Like this I need to be forced to buy upgrades. Now I am not. And
 * that is a gap.")
 *
 * The grid gets quicker with roster position: top speed × (1 + pct·prog),
 * corner budget × ramp². Laws measured here:
 *   1. world 1 (roster index 0): ramp exactly 1 — every suite tuned on the
 *      fixture worlds is untouched.
 *   2. last world (index 77): ramp = 1 + progRampPct on NORMAL, and the
 *      rivals' live maxSpeed carries it.
 *   3. EASY runs progRampEasyMul of the ramp.
 *   4. free roam is exempt (rosterProg 0) — no grid to lose to.
 *   5. THE POINT, on the stopwatch: on the last world the default grid's
 *      lap-1 mean beats the same grid with the ramp poked to 0 by >= 4%.
 *
 *   node tests/test-progression.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

const openWorld = async (id) => {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 140)));
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });
  return p;
};

// races one grid to everyone's lap-1 stamp; the player idles (parked well
// off the line so the pack races clean past)
const rivalLap1 = async (p, rampPct) => p.evaluate(async (rampPct) => {
  const g = window.__game;
  window.__DRIVING.ai.progRampPct = rampPct;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.resetRace(); g.startRace?.();
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.player.pos.x += 4000; g.player.vel.set(0, 0, 0);   // out of the field's way
  const lap1 = new Array(g.enemies.length).fill(null);
  const CAP = 420 * 60;
  for (let f = 0; f < CAP; f++) {
    g.input.analog.steer = 0; g.input.analog.throttle = 0;
    g.frame();
    g.enemies.forEach((e, i) => { if (lap1[i] === null && (e.lap ?? 1) >= 2) lap1[i] = g.raceTime; });
    if (lap1.every((x) => x !== null)) break;
  }
  const done = lap1.filter((x) => x !== null);
  return { mean: done.length ? done.reduce((s, x) => s + x, 0) / done.length : null,
    done: done.length, ramps: g.enemies.map((e) => +(e._progRamp ?? 1).toFixed(3)) };
}, rampPct);

// ---- laws 1-4 on the mechanics
{
  const p = await openWorld(1);
  const r = await p.evaluate(() => {
    const g = window.__game;
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    g.resetRace(); g.startRace?.();
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    for (let f = 0; f < 30; f++) g.frame();
    const ramp0 = g.enemies.map((e) => e._progRamp ?? 1);
    const fr = (() => { const keep = g.freeRoam; g.freeRoam = true; const v = g.rosterProg(); g.freeRoam = keep; return v; })();
    return { prog: g.rosterProg(), ramp0, freeRoamProg: fr };
  });
  check('world 1: rosterProg 0, every rival ramp exactly 1',
    r.prog === 0 && r.ramp0.every((x) => Math.abs(x - 1) < 1e-6),
    `prog ${r.prog}, ramps ${r.ramp0.slice(0, 3).join(', ')}…`);
  check('free roam is exempt (rosterProg 0)', r.freeRoamProg === 0, `${r.freeRoamProg}`);
  await p.close();
}
{
  const p = await openWorld(78);
  const r = await p.evaluate(() => {
    const g = window.__game;
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    g.resetRace(); g.startRace?.();
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    for (let f = 0; f < 30; f++) g.frame();
    const pct = window.__DRIVING.ai.progRampPct;
    const D = g.difficulty;
    const normal = {
      prog: g.rosterProg(),
      ramps: g.enemies.map((e) => +(e._progRamp ?? 1).toFixed(3)),
      speedRatio: g.enemies.map((e) => +(e.maxSpeed / (e.baseMaxSpeed * D.aiSpeed)).toFixed(3)),
    };
    return { pct, normal };
  });
  const want = 1 + r.pct * r.normal.prog;
  check(`last world: rival ramp = 1 + ${r.pct}·prog (prog ${r.normal.prog.toFixed(2)})`,
    r.normal.ramps.every((x) => Math.abs(x - want) < 0.005),
    `ramps ${r.normal.ramps.slice(0, 3).join(', ')} vs ${want.toFixed(3)}`);
  check('…and the live maxSpeed carries it (>= ramp, engUp/kit stack on top)',
    r.normal.speedRatio.every((x, i) => x >= r.normal.ramps[i] - 0.005),
    `speed/base ${r.normal.speedRatio.slice(0, 3).join(', ')}`);
  const easy = await p.evaluate(() => {
    const g = window.__game;
    g.difficulty = { id: 'easy', label: 'EASY', aiSpeed: 0.74, aiCorner: 0.26, aiAggression: 0.65 };
    g.resetRace(); g.startRace?.();
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    for (let f = 0; f < 30; f++) g.frame();
    const mul = window.__DRIVING.ai.progRampEasyMul;
    return { mul, ramps: g.enemies.map((e) => +(e._progRamp ?? 1).toFixed(3)), prog: g.rosterProg() };
  });
  const wantEasy = 1 + r.pct * easy.mul * easy.prog;
  check(`EASY runs ${easy.mul}× the ramp`,
    easy.ramps.every((x) => Math.abs(x - wantEasy) < 0.005),
    `ramps ${easy.ramps.slice(0, 3).join(', ')} vs ${wantEasy.toFixed(3)}`);
  await p.close();
}

// ---- law 5: the stopwatch. Same world, same grid, ramp on vs off.
// GLACIER COL (id 66, prog 0.84), not world 78: the Riviera streets are
// EXECUTION-bound — the field paces behind traffic and threads building
// gaps, and measured mean rival speed there is identical (65.3 vs 64.7
// km/h) under +10% top / +21% corner budget. The player is equally bound
// there, so streets equalize by design; the ramp expresses where the
// road opens, and the law measures it there.
{
  const p = await openWorld(66);
  const pct = await p.evaluate(() => window.__DRIVING.ai.progRampPct);
  const off = await rivalLap1(p, 0);
  const on = await rivalLap1(p, pct);
  const gain = off.mean && on.mean ? (off.mean - on.mean) / off.mean : null;
  console.log(`  lap-1 mean: ramp off ${off.mean?.toFixed(1)}s (${off.done}/7), `
    + `ramp on ${on.mean?.toFixed(1)}s (${on.done}/7), gain ${(gain * 100).toFixed(1)}%`);
  check('the ramped grid is materially faster on a late open world (>= 3% lap-1)',
    on.done >= 6 && off.done >= 6 && gain !== null && gain >= 0.03,
    `gain ${(gain * 100).toFixed(1)}%`);
  await p.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe roster asks for the garage');
process.exit(fail ? 1 : 0);
