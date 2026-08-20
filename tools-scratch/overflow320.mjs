import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 320, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(await p.evaluate(() => {
  const g = window.__game; g.garage.credits = 99999; g.showMenu();
  document.getElementById('tab-btn-garage').click(); g.renderGarage();
  const panel = document.getElementById('tab-garage');
  return [...panel.querySelectorAll('*')].filter((n) => {
    if (n.closest('.shelf-wrap')) return false;
    const r = n.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1);
  }).map((n) => `${n.className || n.tagName} right=${Math.round(n.getBoundingClientRect().right)} "${(n.textContent||'').trim().slice(0,40)}"`).join('\n') || 'none';
}));
await b.close();
