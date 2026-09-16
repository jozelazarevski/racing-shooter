import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
await p.goto('http://localhost:8901/?level=58&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
try {
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 60000 });
  const st = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    return { state: g.state, name: g.level?.name, theme: g.level?.theme,
      N: t.center?.length, trees: t.trees?.length ?? 0,
      playerY: +g.player.pos.y.toFixed(1),
      terrY: +t.terrainHeight(g.player.pos.x, g.player.pos.z).toFixed(1) };
  });
  console.log(JSON.stringify(st));
} catch (e) { console.log('WAIT FAILED: ' + String(e).slice(0, 200)); }
await p.waitForTimeout(2500);
await p.screenshot({ path: '/tmp/shot-citadel.png' });
console.log('errors:', JSON.stringify(errors.slice(0, 8)));
await browser.close();
