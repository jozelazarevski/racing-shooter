/* THE WORDMARK AND THE BALANCE, always visible. Checked at every scroll depth
 * and on every tab, plus that the balance is live rather than stale. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
for (const W of [320, 390]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 830 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); p.setDefaultTimeout(600000);
  await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  const look = (label) => p.evaluate((label) => {
    const bar = document.getElementById('topbar');
    const on = (el) => { if (!el || el.classList.contains('hidden')) return null;
      const r = el.getBoundingClientRect(); return r.width ? Math.round(r.top) : null; };
    const cred = document.getElementById('topbar-cred');
    const wide = [...bar.querySelectorAll('*')].filter((n) => {
      const r = n.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); });
    return `${label.padEnd(22)} bar@${on(bar)} back@${on(document.getElementById('topbar-back'))} `
      + `mid="${document.getElementById('topbar-where').textContent.trim().slice(0,22)}" `
      + `cred="${cred.textContent.trim()}"@${on(cred)} overflow=${wide.length}`;
  }, label);
  const row = async (l) => console.log(`${String(W).padStart(4)}px ${await look(l)}`);
  await p.evaluate(() => window.__game.showMenu());
  await row('front door');
  await p.evaluate(() => { const g=window.__game; g.garage.credits = 12345; g.renderGarage(); });
  await row('after a payout');
  await p.evaluate(() => { const g=window.__game; g._chapterIn=g.chapters()[1].n; g._renderLevelCards(); g._syncBackBtn(); });
  await row('inside a chapter');
  await p.evaluate(() => { const s=document.getElementById('title-screen'); s.scrollTop = s.scrollHeight; });
  await row('...scrolled to bottom');
  await p.evaluate(() => document.getElementById('tab-btn-garage').click());
  await row('GARAGE tab');
  await ctx.close();
}
await b.close();
