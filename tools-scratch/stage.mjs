/* THE LIVE SHOP FLOOR. Three things matter and nothing else does:
 *   - it draws, and it MOVES
 *   - a part fitted shows up on the car without a reload
 *   - it stops the moment you are not looking at it, because it is a second
 *     WebGL context on a phone
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { const g = window.__game; g.garage.credits = 60000;
  g.showMenu(); document.getElementById('tab-btn-garage').click(); });
await new Promise(r => setTimeout(r, 2500));
const st = () => p.evaluate(() => {
  const s = window.__game.__stage;
  const c = document.querySelector('.bp-shop canvas');
  return { mounted: !!c && c.isConnected, running: !!s?.raf,
    spin: +(s?.spin ?? 0).toFixed(3),
    size: c ? `${c.width}x${c.height}` : 'none',
    kitParts: s?.car?.getObjectByName('upgradeKit')?.children.length ?? -1,
    contexts: document.querySelectorAll('canvas').length };
});
const a = await st(); console.log('on the garage tab  ' + JSON.stringify(a));
await new Promise(r => setTimeout(r, 2000));
const b2 = await st(); console.log('two seconds later  ' + JSON.stringify(b2));
console.log('  -> it is TURNING: ' + (b2.spin > a.spin));
// fit a V8 and watch the car change with no reload
await p.evaluate(() => { const g = window.__game;
  [...document.querySelectorAll('.part-card[data-slot="engine"]')][2].click(); });
await new Promise(r => setTimeout(r, 600));
const c = await st(); console.log('after fitting a V8 ' + JSON.stringify(c));
console.log('  -> the car GAINED hardware: ' + (c.kitParts > a.kitParts));
// leave the tab
await p.evaluate(() => document.getElementById('tab-btn-race').click());
await new Promise(r => setTimeout(r, 900));
console.log('on the TRACKS tab  ' + JSON.stringify(await st()));
// and mid-race
await p.evaluate(() => { document.getElementById('tab-btn-garage').click(); });
await new Promise(r => setTimeout(r, 600));
await p.evaluate(() => window.__game.startRace());
await new Promise(r => setTimeout(r, 900));
console.log('mid-race           ' + JSON.stringify(await st()));
if (errs.length) console.log('ERR ' + errs.slice(0,3).join(' | '));
await b.close();
