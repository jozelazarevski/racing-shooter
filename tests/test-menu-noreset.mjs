// Selection UX: car swap must be live (no reload); track pick must restore
// the menu's tab + scroll after the reload.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:8901/?unlockall=1', { waitUntil: 'load' });
await page.waitForFunction(() => window.__game, null, { timeout: 25000 });
await page.evaluate(() => { localStorage.setItem('ir-cars', JSON.stringify({ owned: ['brawler', 'sleek'], selected: 'brawler' })); });
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => window.__game, null, { timeout: 25000 });
// --- car swap: tap SLEEK, expect no navigation, stats change, garage tab persists
await page.tap('#tab-btn-garage');
await page.waitForTimeout(300);
const before = await page.evaluate(() => ({ url: location.href, max: window.__game.player.maxSpeed, key: window.__game.player.catalogKey }));
await page.evaluate(() => { [...document.querySelectorAll('.car-card')].find(c => c.textContent.includes('SLEEK')).click(); });
await page.waitForTimeout(600);
const after = await page.evaluate(() => ({
  url: location.href, key: window.__game.player.catalogKey,
  max: window.__game.player.maxSpeed,
  nitroPower: window.__game.player.nitroPower,
  garageTab: document.getElementById('tab-btn-garage').classList.contains('current'),
  driving: [...document.querySelectorAll('.car-card')].find(c => c.textContent.includes('SLEEK')).textContent.includes('DRIVING'),
  meshOk: !!window.__game.player.mesh.userData.wheels?.length,
}));
console.log('CAR SWAP:', JSON.stringify({ noReload: before.url === after.url, from: before.key, to: after.key, statChanged: before.max !== after.max, ...after }));
// --- track pick, THE LIVE CONTRACT (this half used to expect a page reload
// with ?level=2 and a restored tab+scroll; picks are in-page since the
// "a tap must FEEL like a tap" rework — _pickLevel moves the highlight and
// swapLevel builds under the menu, no navigation. And the default tracks
// view is the CHAPTER GRID: level chips exist only inside a chapter room,
// so the pick walks the real UX — chapter card, then chip).
await page.tap('#tab-btn-race');
await page.evaluate(() => {
  [...document.querySelectorAll('.chapter-card')]
    .find((c) => c.dataset.chn === '1')?.click();      // DUST CANYON lives in chapter 1
});
await page.waitForTimeout(300);
await page.evaluate(() => { document.getElementById('title-screen').scrollTo(0, 500); });
await page.waitForTimeout(200);
// a RELOAD wipes the window; replaceState (which the swap uses to keep the
// URL honest) does not — and Playwright's framenavigated fires for both,
// so the marker is the honest meter
await page.evaluate(() => { window.__noReloadMarker = 1; });
await page.evaluate(() => { [...document.querySelectorAll('.level-chip')].find(c => c.textContent.includes('DUST CANYON')).click(); });
// the swap is a full synchronous world build — give it room under software GL
await page.waitForFunction(() => window.__game?.level?.name === 'DUST CANYON'
  && !window.__game._pendingPick, null, { timeout: 60000 });
await page.waitForTimeout(400);
const rst = await page.evaluate(() => ({
  lvl: window.__game.level.name,
  scroll: document.getElementById('title-screen').scrollTop,
  raceTab: document.getElementById('tab-btn-race').classList.contains('current'),
  noReload: window.__noReloadMarker === 1,
}));
console.log('TRACK PICK:', JSON.stringify(rst), '(live swap: no reload, tab and scroll held)');
console.log('errors:', errors.slice(0, 3).join('|') || 'none');
const ok = before.url === after.url && after.key === 'sleek' && after.garageTab && after.driving
  && rst.lvl === 'DUST CANYON' && rst.noReload && rst.raceTab && rst.scroll > 300;
console.log(ok ? 'ALL OK' : 'SOMETHING FAILED');
await b.close();
process.exit(ok ? 0 : 1);
