/* Machine-gun reproduction: enter race, hold fire, report rounds/bullets/
 * heat/errors, then aim at the nearest rival and measure damage dealt. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 1);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 390, height: 780 } });
p.setDefaultTimeout(240000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 240000 });
const r = await p.evaluate(() => {
  const g = window.__game, c = g.player;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 300 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // GO+4s so grid lock is over
  for (let k = 0; k < 250; k++) g.frame();
  const rounds0 = c.rounds, heat0 = c.heat;
  // aim: park the player right behind a rival, facing it
  const cars9 = g.cars ?? g.racers ?? [];
  const rv = cars9.find ? cars9.find((x) => x !== c && !x.dead) : null;
  const hull0 = rv ? rv.hull : null;
  if (rv) {
    const hd = Math.atan2(rv.pos.x - c.pos.x, rv.pos.z - c.pos.z);
    c.heading = hd;
  }
  g.input.keys.add('Space');
  let bulletsSeen = 0;
  for (let k = 0; k < 120; k++) {
    g.frame();
    bulletsSeen = Math.max(bulletsSeen, g.weapons?.bullets?.length ?? 0);
  }
  g.input.keys.delete('Space');
  return { state: g.state, missionNoGuns: !!g.missionNoGuns,
    rounds0, rounds1: c.rounds, heat0: +heat0.toFixed(2), heat1: +c.heat.toFixed(2),
    overheated: c.overheated, bulletsSeen, cooldown: c.fireCooldown,
    rivalHull0: hull0, rivalHull1: rv ? rv.hull : null,
    controlsLiveHint: { grid: g.raceTime, shield: c.shieldT ?? null } };
});
console.log(JSON.stringify(r), 'ERRS:', errs.slice(0, 3).join(' | ') || 'none');
await browser.close();
