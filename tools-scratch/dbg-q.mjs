import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track;
  const out = [];
  for (let i = 288; i <= 308; i++) out.push({ i, s: t._mtnSide?.[i], a: +(t._mtnAmt?.[i] ?? -1).toFixed(2) });
  return out;
});
console.log(JSON.stringify(r));
await browser.close();
