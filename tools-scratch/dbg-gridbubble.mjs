import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=2&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 30; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.frame();
  const bubbles = (tag) => ({ tag,
    shown: [g.player, ...g.enemies].filter(c => c._shield?.visible).length,
    inv: g.enemies[0]?.invuln?.toFixed(1) });
  const atGreen = bubbles('green');
  // now kill a rival and let it respawn: ITS bubble must show
  const victim = g.enemies[0];
  victim.destroy();
  let respBubble = null;
  for (let k = 0; k < 10 * 30; k++) {
    g.frame();
    if (victim.alive && respBubble === null) { g.frame(); respBubble = !!victim._shield?.visible; }
  }
  return { atGreen, respBubble };
});
console.log(JSON.stringify(r));
await browser.close();
