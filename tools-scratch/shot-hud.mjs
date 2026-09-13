import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
// desktop
const d = await browser.newPage({ viewport: { width: 960, height: 540 } });
await d.goto(`${BASE}/?level=69&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await d.waitForFunction(() => window.__game?.player && window.__game.track?.center, undefined, { timeout: 180000 });
await d.evaluate(async () => {
  const g = window.__game;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.input.analog.throttle = 1;
});
await new Promise((r) => setTimeout(r, 6000));
await d.screenshot({ timeout: 120000, path: '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad/hud-desktop.png' });
await d.close();
// phone two-thumb portrait
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const m = await ctx.newPage();
await m.goto(`${BASE}/?level=69&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await m.waitForFunction(() => window.__game?.player && window.__game.track?.center, undefined, { timeout: 180000 });
await m.evaluate(async () => {
  document.body.classList.add('two-thumb');
  const g = window.__game;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.input.analog.throttle = 1;
});
await new Promise((r) => setTimeout(r, 6000));
await m.screenshot({ timeout: 120000, path: '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad/hud-phone.png' });
await browser.close();
console.log('shots done');
