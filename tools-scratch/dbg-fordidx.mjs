import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 300, height: 200 } });
await p.goto(`${BASE}/?level=68&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
console.log(await p.evaluate(() => JSON.stringify({
  fords: window.__game.track._river?.fords ?? null,
  width0: window.__game.track.widthAt?.(0),
})));
await browser.close();
