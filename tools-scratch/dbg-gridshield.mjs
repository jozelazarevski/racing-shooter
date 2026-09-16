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
  const snap = (tag) => ({ tag,
    rivals: g.enemies.map(e => ({ inv: +(e.invuln ?? 0).toFixed(1),
      bubble: !!(e._shieldMesh?.visible || (e._shieldOp ?? 0) > 0.05) })),
    player: { inv: +(g.player.invuln ?? 0).toFixed(1) } });
  const s0 = snap('green');
  for (let k = 0; k < 60; k++) g.frame();
  const s2 = snap('green+2s');
  return [s0, s2];
});
console.log(JSON.stringify(r));
await browser.close();
