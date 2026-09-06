import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
p.on('pageerror', e => console.log('pageerr:', e.message.slice(0, 120)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game;
  document.body.classList.add('touch', 'two-thumb');
  g.state = 'race'; g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 10; k++) g.frame();
  const rects = {};
  for (const id of ['t-brake', 't-drift', 't-left', 't-right']) {
    const el = document.getElementById(id);
    const b = el?.getBoundingClientRect();
    rects[id] = b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width),
      vis: getComputedStyle(el).display !== 'none' } : null;
  }
  return rects;
});
console.log(JSON.stringify(r));
await p.screenshot({ timeout: 90000, path: 'tools-scratch/shot-buttons.png' });
console.log('shot-buttons.png');
await p.close(); await browser.close();
