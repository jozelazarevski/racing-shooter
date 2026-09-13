/* THE LIVE SITE, not the local tree — including the service worker, exactly as
 * a phone gets it. Walks the menu the way a player arrives: default URL, no
 * unlock flags, nothing primed. */
import { chromium } from 'playwright-core';
const URL0 = process.env.URL0 ?? 'https://jozelazarevski.github.io/racing-shooter/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto(URL0, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log('build served: ' + await p.evaluate(() => document.getElementById('build-tag')?.textContent));

const look = () => p.evaluate(() => {
  const el = document.getElementById('topbar-back');
  const bar = document.getElementById('topbar');
  if (!el || !bar || bar.classList.contains('hidden')) return '(no back button)';
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(bar);
  return `"${el.textContent.trim()}" @${Math.round(r.left)},${Math.round(r.top)} `
    + `pos:${cs.position} z:${cs.zIndex} vis:${cs.visibility} op:${cs.opacity}`;
});
const row = async (t) => console.log(`${t.padEnd(26)} ${await look()}`);

await row('ON ARRIVAL (front screen)');
// the very first thing a player taps
await p.evaluate(() => document.querySelector('.chapter-card')?.click());
await row('after tapping chapter 1');
await p.evaluate(() => document.getElementById('tab-btn-garage').click());
await row('GARAGE tab');
if (errs.length) console.log('ERR ' + errs.slice(0,2).join(' | '));
await b.close();
