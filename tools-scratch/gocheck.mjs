import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', e => console.log('pageerr:', e.message.slice(0, 120)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const g = window.__game;
  g.state = 'countdown'; g.countdown = 0.05; g._lastCount = 4;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 240; k++) g.frame();       // 4 s past the lights
  await new Promise(res => setTimeout(res, 2800)); // let the real-time clear fire
  const center = document.getElementById('center-msg');
  const lamps = Object.entries(g.track.lampMats ?? {}).map(([n, m]) =>
    [n, m.color.getHexString() === m.userData.lit.getHexString() ? 'LIT' : 'dim']);
  return { state: g.state, raceTime: +g.raceTime.toFixed(1),
    bannerText: center?.textContent ?? null, lamps };
});
console.log(JSON.stringify(r));
await p.close(); await browser.close();
