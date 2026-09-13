import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 430, height: 830 } });
const p = await ctx.newPage(); p.setDefaultTimeout(120000);
const errs = [];
p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0,200)); });
await p.goto('http://localhost:8901/?level=74&unlockall=1', { waitUntil:'load', timeout:120000 });
let built = false;
try {
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 150000 });
  built = true;
} catch { /* report below rather than throwing */ }
console.log('built=' + built);
console.log(await p.evaluate(() => {
  const g = window.__game;
  return JSON.stringify({ hasGame: !!g, level: g?.level?.name, theme: g?.level?.theme,
    route: g?.level?.route, N: g?.track?.N ?? null, boot: document.getElementById('boot-msg')?.textContent });
}));
console.log(errs.length ? errs.slice(0,4).join('\n') : 'no errors');
await b.close();
