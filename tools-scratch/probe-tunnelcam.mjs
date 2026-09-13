import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const OUT = '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const [lvl, name] of [[1, 'pine'], [18, 'undercity']]) {
  const p = await browser.newPage({ viewport: { width: 430, height: 932 } });
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game;
    g.clock.getDelta = () => 1 / 60;
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    // TUNNEL is the last of the seven modes: cycle to it via the real path
    g.camMode = 0;
    for (let k = 0; k < 6; k++) g.cycleCamera();
    const seen = [g.camMode];
    const ok = g.camMode === 6;
    // drive a couple of seconds so the camera settles at pace
    g.input.analog.throttle = 1;
    for (let k = 0; k < 150; k++) g.frame();
    g.input.analog.throttle = 0;
    return { ok, seen: seen.slice(-3), camY: +g.camera.position.y.toFixed(1),
      carY: +g.player.pos.y.toFixed(1) };
  });
  console.log(name, JSON.stringify(r));
  await p.screenshot({ path: `${OUT}/tunnelcam-${name}.png`, timeout: 90000 });
  await p.close();
}
await browser.close();
