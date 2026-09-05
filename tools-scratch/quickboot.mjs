import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 260 } });
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e.message) + '\n' + String(e.stack || '').split('\n').slice(0,6).join('\n')));
p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
const lvl = process.argv[2] ?? '1';
await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
const ok = await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 90000 })
  .then(() => 1).catch(() => 0);
console.log(`level ${lvl}: built=${ok}`);
for (const e of errs.slice(0, 6)) console.log(' ', e);
await b.close();
