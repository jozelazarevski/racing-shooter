import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: +(process.env.W ?? 390), height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => window.__game.showMenu());
console.log(await p.evaluate(() => {
  const host = document.getElementById('world-filters');
  const out = [];
  for (const c of host.children) {
    const r = c.getBoundingClientRect();
    out.push(`${(c.id || c.className).padEnd(16)} h=${Math.round(r.height)} w=${Math.round(r.width)} "${(c.textContent||'').trim().slice(0,40)}"`);
  }
  const t = host.querySelector('.wf-top');
  for (const c of t.children) {
    const r = c.getBoundingClientRect();
    out.push(`   top>${(c.id||c.className).padEnd(11)} h=${Math.round(r.height)} w=${Math.round(r.width)} x=${Math.round(r.left)}`);
  }
  out.push(`collapsed=${host.classList.contains('wf-collapsed')} totalH=${Math.round(host.getBoundingClientRect().height)}`);
  return out.join('\n');
}));
await b.close();
