/* IS THE WORLD EDITOR OFF THE MAIN GAME, AND STILL REACHABLE BY ADMIN? */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const look = async (q, label) => {
  const ctx = await b.newContext({ viewport: { width: 430, height: 830 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(600000);
  await p.goto(`${BASE}/${q}`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await p.evaluate(() => ({
    admin: !!window.__game.adminMode,
    panel: !!document.getElementById('admin-panel'),
    btn: !!document.getElementById('editor-btn'),
    // a control that is merely hidden is still a tab stop; this is the check
    // that "removed" really means removed
    focusable: [...document.querySelectorAll('button')].some((e) => e.id === 'editor-btn'),
    stored: localStorage.getItem('ir-admin'),
    // and the editor must not be reachable from the tracks tab any more
    onTracks: !!document.querySelector('#tab-race #editor-btn'),
  }));
  console.log(`${label.padEnd(26)} ${JSON.stringify(r)}`);
  await ctx.close();
  return r;
};
await look('?level=1', 'plain visit');
await look('?level=1&admin=1', 'admin=1');
// ...and it is REMEMBERED, which is the whole point of the switch
const ctx = await b.newContext({ viewport: { width: 430, height: 830 } });
const p = await ctx.newPage();
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&admin=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
await p.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
console.log('after admin=1, plain reload  '
  + JSON.stringify(await p.evaluate(() => ({ admin: !!window.__game.adminMode,
    panel: !!document.getElementById('admin-panel') }))));
await p.goto(`${BASE}/?level=1&admin=0`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
await p.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
console.log('after admin=0, plain reload  '
  + JSON.stringify(await p.evaluate(() => ({ admin: !!window.__game.adminMode,
    panel: !!document.getElementById('admin-panel') }))));
await b.close();
