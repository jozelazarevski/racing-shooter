/* JS update cost per frame (render stubbed), tree vs base: if the game LOOP
 * got heavier, a phone that was at 25 fps drops under the 20 fps slow-mo line. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const [name, base] of [['r307-tree', 'http://localhost:8901'], ['r294-base', 'http://localhost:8902']]) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  await p.goto(`${base}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
    undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game;
    if (g.composer) g.composer.render = () => {};
    let elapsed = g.clock.elapsedTime;
    g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
    g.input.analog.throttle = 0.8;
    for (let f = 0; f < 120; f++) g._frameBody();       // warm
    const t0 = performance.now();
    for (let f = 0; f < 600; f++) g._frameBody();       // 10 sim-seconds
    const ms = (performance.now() - t0) / 600;
    g.input.analog.throttle = 0;
    return { msPerFrame: +ms.toFixed(2) };
  });
  console.log(name, JSON.stringify(r));
  await p.close();
}
await browser.close();
