import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 1);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 390, height: 780 } });
p.setDefaultTimeout(300000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
await p.evaluate(() => { window.__game.clock.getDelta = () => 1 / 60; });
for (let c9 = 0; c9 < 8; c9++) {
  await p.evaluate(() => {
    const g = window.__game;
    for (let k = 0; k < 60 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  });
}
for (let w = 0; w < 3; w++) await p.evaluate(() => { for (let k = 0; k < 45; k++) window.__game.frame(); });
const r = await p.evaluate(() => {
  const g = window.__game, c = g.player;
  const rounds0 = c.rounds;
  g.input.keys.add('Space');
  let bulletsSeen = 0;
  for (let k = 0; k < 60; k++) {
    g.frame();
    bulletsSeen = Math.max(bulletsSeen, g.weapons?.bullets?.length ?? -1);
  }
  g.input.keys.delete('Space');
  return { state: g.state, t: +g.raceTime.toFixed(1), missionNoGuns: !!g.missionNoGuns,
    rounds0, rounds1: c.rounds, heat: +c.heat.toFixed(2), bulletsSeen,
    hasWeapons: !!g.weapons, fireGetter: g.input.fire };
});
console.log(JSON.stringify(r), 'ERRS:', errs.slice(0, 3).join(' | ') || 'none');
await browser.close();
