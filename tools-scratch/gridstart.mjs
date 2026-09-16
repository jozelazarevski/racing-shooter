/* DO THE CARS LEAVE THE LINE — all of them, player and rivals, measured from
 * the grid. Reported on r281 as "cars are stuck ... all worlds, at the start".
 * Starts a race, lets the countdown run, injects full throttle for the player,
 * and reports every car's distance travelled and speed after a fixed number of
 * frames. Fails loudly if the race never starts or the enemy list is empty.
 *
 *   LEVELS=1,4 node gridstart.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 700 } });
p.setDefaultTimeout(600000);
let bad = 0;
for (const lv of (process.env.LEVELS ?? '1,4').split(',')) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
  const r = await p.evaluate(async () => {
    const g = window.__game, pl = g.player;
    g.startRace?.();
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
    if (g.state !== 'race') throw new Error('race never started, state=' + g.state);
    const es = g.enemies ?? [];
    if (!es.length) throw new Error('no enemies on the grid');
    const at0 = [pl, ...es].map((c) => ({ x: c.pos.x, z: c.pos.z }));
    for (let i = 0; i < 90; i++) {
      if (g.input?.analog) { g.input.analog.throttle = 1; g.input.analog.steer = 0; }
      await f();
    }
    const rows = [pl, ...es].map((c, i) => ({
      who: i === 0 ? 'player' : `ai${i}`,
      moved: +Math.hypot(c.pos.x - at0[i].x, c.pos.z - at0[i].z).toFixed(1),
      spd: +c.vel.length().toFixed(1) }));
    return { name: g.level?.name ?? '', rows };
  });
  const stuck = r.rows.filter((o) => o.moved < 3);
  console.log(`L${lv} ${r.name}: ` + r.rows.map((o) => `${o.who} ${o.moved}u/${o.spd}`).join('  '));
  if (stuck.length) { bad++; console.log(`   STUCK: ${stuck.map((o) => o.who).join(',')}`); }
}
console.log(bad ? 'FAIL: cars stuck at the start' : 'PASS: everyone leaves the line');
await b.close();
process.exit(bad ? 1 : 0);
