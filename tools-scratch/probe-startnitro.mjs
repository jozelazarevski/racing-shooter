import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true });
await p.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const trace = [];
  const run = async (label) => {
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    // sample the first second after GO with zero input
    const rows = [];
    for (let k = 0; k < 60; k++) {
      g.frame();
      if (k % 10 === 0) rows.push({ k, v: +(g.player.speedAlong ?? 0).toFixed(1),
        boost: +(g.player.boostTimer ?? 0).toFixed(2), nitro: +(g.player.nitro ?? 0).toFixed(2) });
    }
    trace.push({ label, rows });
  };
  // 1) first race, stock flow
  document.getElementById('start-btn')?.click();
  await run('first start');
  // 2) back to garage, select another car, start again
  g.state = 'title';
  g.showMenu?.('garage');
  g.cars.owned = ['brawler', 'sleek'];
  g.cars.selected = 'sleek';
  const { CAR_CATALOG } = await import('./src/vehicles.js');
  g.swapPlayerCar(CAR_CATALOG.find((c) => c.key === 'sleek'));
  g.renderGarage();
  document.getElementById('start-btn')?.click();
  await run('after selecting sleek');
  return trace;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
