/* EVERY EXCEPTION THE FRAME LOOP IS EATING, across levels and states.
 *
 * `Game.frame()` catches, reports and carries on, which is right — a bug
 * becomes a glitch you can walk away from rather than a frozen session. The
 * cost is that a fault can run for rounds without anyone noticing: r266's
 * `_syncLights` threw on the first line of the player's update on EVERY level
 * and nothing surfaced it. `boot.mjs` was green throughout, because it only
 * checks that a level builds.
 *
 * So drive each state for a few seconds and collect what the catch printed.
 * Anything here is a real bug the game is hiding from you.
 *
 *   LEVELS=1,6,12,17,18,19 node swallowed.mjs
 */
import { chromium } from 'playwright-core';
const LEVELS = (process.env.LEVELS ?? '1,6,12,17,18').split(',');
const MODES = (process.env.MODES ?? 'race,roam,missions').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const found = new Map();
for (const lvl of LEVELS) for (const mode of MODES) {
  const p = await b.newPage({ viewport: { width: 430, height: 800 } });
  p.setDefaultTimeout(600000);
  const hits = [];
  p.on('console', (m) => {
    const t = m.text();
    if (/recovered from|\[watchdog\]/.test(t)) hits.push(t.split('\n').slice(0, 2).join(' | ').slice(0, 200));
  });
  p.on('pageerror', (e) => hits.push('PAGEERROR ' + String(e.message).slice(0, 160)));
  const q = mode === 'race' ? '' : mode === 'roam' ? '&roam=1' : '&missions=1';
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1${q}`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
  await p.evaluate(async () => {
    const g = window.__game, w = g.weapons;
    // NO OPTIONAL CHAINING ON THE THINGS BEING TESTED. The first cut called
    // `g.fireCannon?.()`, `g.dropMine?.()` and three more names that do not
    // exist — the real API is `game.weapons.fireBullet/fireMissile/dropMine/
    // fireShockwave(car)` — and `?.` turned every one into a silent no-op. The
    // sweep reported CLEAN having exercised nothing but driving in a straight
    // line. Same shape as `input.throttle` being a getter with no setter: a
    // probe that cannot find its subject must SAY SO, not pass.
    for (const n of ['fireBullet', 'fireMissile', 'dropMine', 'fireShockwave'])
      if (typeof w?.[n] !== 'function') throw new Error(`weapons.${n} is missing — probe is out of date`);
    if (typeof g.cycleCamera !== 'function') throw new Error('cycleCamera is missing');
    g.startRace?.();
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 600 && g.state !== 'race' && g.state !== 'roam'; i++) await f();
    const t0 = performance.now();
    // drive, steer, and fire everything — a fault in a weapon or a pickup path
    // never shows up in a car that only goes forwards
    while (performance.now() - t0 < 7000) {
      const k = (performance.now() - t0) / 1000;
      if (g.input?.analog) {
        g.input.analog.throttle = 1;
        g.input.analog.steer = Math.sin(k * 1.7) * 0.6;
      }
      if (k > 1) {
        w.fireBullet(g.player, 3.5, 0.02);
        if (k % 2 < 0.05) w.fireMissile(g.player);
        if (k % 3 < 0.05) w.dropMine(g.player);
        if (k % 4 < 0.05) w.fireShockwave(g.player);
      }
      await f();
    }
    for (let i = 0; i < 3; i++) { g.cycleCamera(); await f(); }
  });
  for (const h of hits) {
    const k = h.replace(/\d+/g, '#');
    if (!found.has(k)) found.set(k, { text: h, where: [] });
    found.get(k).where.push(`L${lvl}/${mode}`);
  }
  console.log(`  L${lvl}/${mode}: ${hits.length ? hits.length + ' swallowed' : 'clean'}`);
  await p.close();
}
console.log('\n=== distinct faults the frame loop hid ===');
for (const [, v] of found) console.log(`[${v.where.join(' ')}]\n  ${v.text}\n`);
console.log(found.size ? `FAIL: ${found.size} distinct` : 'PASS: nothing swallowed');
await b.close();
process.exit(found.size ? 1 : 0);
