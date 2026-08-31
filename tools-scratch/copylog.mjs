import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage();
await p.goto('http://localhost:8901/?level=2&go=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const g = window.__game;
  g.telemetry?.log('damage', { src: 'probe', amount: 1 });
  const btn = document.getElementById('pm-copylog');
  btn.click();
  await new Promise((res) => setTimeout(res, 300));
  let clip = '';
  try { clip = await navigator.clipboard.readText(); } catch { clip = '(unreadable)'; }
  return { label: btn.textContent, clipHasProbe: clip.includes('"src":"probe"'),
    count: window.__rally?.count?.() ?? -1 };
});
console.log(JSON.stringify(r));
await browser.close();
