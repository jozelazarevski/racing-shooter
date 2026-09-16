import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 } });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
p.on('pageerror', e => console.log('PAGEERR ' + e.message));
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(await p.evaluate(() => {
  const g = window.__game;
  const proto = Object.getPrototypeOf(g);
  return {
    buildTag: document.getElementById('build-tag')?.textContent,
    hasChapters: typeof g.chapters,
    hasFillTopbar: typeof g._fillTopbar,
    hasSyncBack: typeof g._syncBackBtn,
    ctor: proto?.constructor?.name,
    someMethods: Object.getOwnPropertyNames(proto).filter(n=>/chapter/i.test(n)),
  };
}));
await b.close();
