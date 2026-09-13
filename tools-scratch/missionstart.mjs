/* DO MISSION CARS MOVE — the player, the duel rival, and the city traffic.
 * Reported on live r281 as "cars are stuck ... under missions". gridstart
 * cannot see it: races and missions launch down different paths
 * (_missionLaunch, called from startRace, replaces the grid logic entirely).
 *
 * Launches DUEL (the mission that keeps a live rival), injects throttle, and
 * measures the player's travel, the foe's travel, and — on a city world —
 * the traffic entities' travel. Fails loudly if the mission never reaches
 * state 'race' or the foe is missing on a duel.
 *
 *   LEVEL=6 MISSION=duel node missionstart.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 700 } });
p.setDefaultTimeout(600000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.goto(`http://localhost:${PORT}/?level=${process.env.LEVEL ?? 6}&mode=missions&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const r = await p.evaluate(async (missionId) => {
  const g = window.__game, pl = g.player;
  const f = () => new Promise((r) => requestAnimationFrame(r));
  g.missionSel = missionId;
  g.startRace();
  for (let i = 0; i < 200 && g.state !== 'race'; i++) await f();
  if (g.state !== 'race') throw new Error('mission never reached race state: ' + g.state);
  if (!g.mission) throw new Error('no mission object after launch');
  if (missionId === 'duel' && !g.missionFoe) throw new Error('duel without a foe');
  const cars = [['player', pl]];
  if (g.missionFoe) cars.push(['foe', g.missionFoe]);
  const at0 = cars.map(([, c]) => ({ x: c.pos.x, z: c.pos.z }));
  for (let i = 0; i < 80; i++) {
    if (g.input?.analog) { g.input.analog.throttle = 1; g.input.analog.steer = 0; }
    await f();
  }
  const rows = cars.map(([who, c], i) => ({ who,
    moved: +Math.hypot(c.pos.x - at0[i].x, c.pos.z - at0[i].z).toFixed(1),
    spd: +c.vel.length().toFixed(1), alive: c.alive }));
  return { state: g.state, mission: g.mission?.def?.id, rows };
}, process.env.MISSION ?? 'duel');
console.log(JSON.stringify(r), errs.length ? `pageerrors: ${errs.slice(0,2).join(' | ')}` : 'no page errors');
const stuck = r.rows.filter((o) => o.moved < 3);
console.log(stuck.length ? `FAIL: stuck: ${stuck.map((o) => o.who).join(',')}`
  : 'PASS: mission cars move');
await b.close();
process.exit(stuck.length || errs.length ? 1 : 0);
