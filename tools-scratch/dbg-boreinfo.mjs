import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(240000);
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(() => {
  const t = window.__game.track;
  return { tunnels: (t._tunnels ?? []).map((T) => ({ s: T.s, e: T.e,
    sy: +t.center[T.s].y.toFixed(1), ey: +t.center[T.e].y.toFixed(1) })),
    y142: +t.center[142].y.toFixed(1), y112: +t.center[112].y.toFixed(1),
    ridge142: +t.terrainHeight(t.center[142].x, t.center[142].z).toFixed(1),
    segLen: +t.segLen.toFixed(2) };
});
console.log(JSON.stringify(r));
await browser.close();
