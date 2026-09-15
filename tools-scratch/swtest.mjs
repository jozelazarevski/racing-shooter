import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 120)));
await p.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
await p.waitForTimeout(6000);  // let bootOffline run (idle callback + register)
const sw = await p.evaluate(async () => {
  const reg = await navigator.serviceWorker?.getRegistration();
  return { registered: !!reg, active: !!reg?.active, scope: reg?.scope ?? null };
});
console.log(JSON.stringify({ errs, sw }));
await p.close(); await browser.close();
