/* THE WHOLE GARAGE SCREEN, and which parts of it are black. The build bay's
 * own canvas measures well lit, so "light up all background in the garage" is
 * about something else on this tab — the car shelf pictures, the part icons,
 * or the panel behind them. Shoots the tab full length and reports the dark
 * fraction of every 3D canvas on it by name. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(3000);
console.log(JSON.stringify(await p.evaluate(() => {
  const rows = [];
  for (const el of document.querySelectorAll('canvas, img')) {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    const o = document.createElement('canvas');
    o.width = Math.min(240, el.naturalWidth || el.width);
    o.height = Math.min(240, el.naturalHeight || el.height);
    if (!o.width || !o.height) continue;
    try { o.getContext('2d').drawImage(el, 0, 0, o.width, o.height); } catch { continue; }
    const d = o.getContext('2d').getImageData(0, 0, o.width, o.height).data;
    let n = 0, dark = 0, clear = 0, sum = 0;
    for (let k = 0; k < d.length; k += 4) {
      n++;
      const l = 0.2126*d[k] + 0.7152*d[k+1] + 0.0722*d[k+2];
      sum += l;
      if (d[k + 3] < 24) { clear++; continue; }
      if (l < 34) dark++;
    }
    rows.push({ tag: el.tagName.toLowerCase(), cls: el.className?.toString?.().slice(0, 30) || '',
      alt: el.alt || '', box: [Math.round(r.width), Math.round(r.height)],
      meanLum: Math.round(sum / n), darkPct: +(100 * dark / n).toFixed(1),
      transparentPct: +(100 * clear / n).toFixed(1) });
  }
  const pane = document.querySelector('#tab-garage') || document.querySelector('.tab-body');
  const cs = pane ? getComputedStyle(pane) : null;
  return { surfaces: rows.slice(0, 24), paneBg: cs?.backgroundColor, paneColor: cs?.color };
}), null, 1));
await p.screenshot({ path: 'tools-scratch/shot-garage-top.png' });
// THE PANEL SCROLLS, NOT THE PAGE. Find whatever element actually has
// overflow and drive that — scrolling `body` shot the same frame twice.
console.log('scrolled ' + await p.evaluate(() => {
  let best = null;
  for (const e of document.querySelectorAll('*'))
    if (e.scrollHeight > e.clientHeight + 40 && e.clientHeight > 200
        && (!best || e.scrollHeight > best.scrollHeight)) best = e;
  if (!best) return 'nothing scrollable';
  best.scrollTop = best.scrollHeight;
  return `${best.id || best.className} ${best.scrollTop}/${best.scrollHeight}`;
}));
await p.waitForTimeout(900);
await p.screenshot({ path: 'tools-scratch/shot-garage-bot.png' });
if (errs.length) console.log('ERR ' + errs.slice(0, 3).join(' | '));
await b.close();
