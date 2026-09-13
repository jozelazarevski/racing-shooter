import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center, undefined, { timeout: 180000 });
const r = await p.evaluate(() => {
  const g = window.__game, pl = g.player, t = g.track, N = t.center.length;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.camMode = 0;
  pl.placeAt(110, 0, true);
  pl.invuln = 99; pl.health = 100; pl.alive = true;
  const log = [];
  for (let f = 0; f < 90; f++) {
    g.frame();
    if (f % 15 === 0) {
      log.push({ f, y: +pl.y.toFixed(1), hp: Math.round(pl.health), alive: pl.alive,
        camY: +g.camera.position.y.toFixed(1), idx: pl.trackIndex });
    }
  }
  let rim = -Infinity;
  for (let q = -12; q <= 12; q += 3) rim = Math.max(rim, t.center[(pl.trackIndex + q + N) % N].y);
  return { log, rim: +rim.toFixed(1), deck: +t.groundHeightAt(110, 0).toFixed(1) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
