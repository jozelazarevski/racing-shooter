/* Every state the game can be in, and whether a back button is on screen —
 * including the ones _syncBackBtn deliberately suppresses. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const look = () => p.evaluate(() => {
  const el = document.getElementById('topbar-back'), bar = document.getElementById('topbar');
  const g = window.__game;
  const t = g.backTarget?.();
  const on = el && bar && !bar.classList.contains('hidden');
  return `state=${String(g.state).padEnd(9)} backTarget=${String(t?.at).padEnd(8)} `
    + `button=${on ? '"' + el.textContent.trim() + '" @' + Math.round(el.getBoundingClientRect().top) : 'NONE'}`;
});
const row = async (t) => console.log(`${t.padEnd(24)} ${await look()}`);
await p.evaluate(() => window.__game.showMenu());
await row('arrive (chapter index)');
await p.evaluate(() => document.querySelector('.chapter-card')?.click());
await row('inside chapter 1');
await p.evaluate(() => document.getElementById('tab-btn-garage').click());
await row('GARAGE tab');
// RESULTS — the post-race screen
await p.evaluate(() => { const g = window.__game; g.state = 'finished';
  document.getElementById('title-screen')?.classList.add('hidden');
  document.getElementById('results')?.classList.remove('hidden'); g._syncBackBtn(); });
await row('results screen');
await b.close();
