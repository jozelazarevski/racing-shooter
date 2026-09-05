/* The rework is presentational — the mission must still SELECT and LAUNCH. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1&mode=missions', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-mode').click(); });
console.log('default selection: ' + await p.evaluate(() => window.__game.missionSel));
// pick the 5th mission by tapping its row, as a player would
await p.evaluate(() => [...document.querySelectorAll('.mission-chip')][4].click());
console.log('after tapping row 5: ' + await p.evaluate(() => window.__game.missionSel));
console.log('exactly one card open: ' + await p.evaluate(() =>
  document.querySelectorAll('.mission-chip.current').length));
console.log('start label: ' + await p.evaluate(() => document.getElementById('start-btn').textContent));
await p.evaluate(() => document.getElementById('start-btn').click());
await p.waitForFunction(() => window.__game.state === 'race', undefined, { timeout: 600000 });
const m = await p.evaluate(() => ({ id: window.__game.mission?.def?.id, state: window.__game.state }));
console.log('launched: ' + JSON.stringify(m));
if (errs.length) console.log('ERR ' + errs.slice(0,3).join(' | '));
await b.close();
