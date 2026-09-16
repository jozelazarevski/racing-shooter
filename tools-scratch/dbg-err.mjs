import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 300)));
p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 200)); });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
try {
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 90000 });
  console.log('BOOTED');
} catch { console.log('NO BOOT'); }
await browser.close();
