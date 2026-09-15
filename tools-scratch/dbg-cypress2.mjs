import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=61&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const lum = (tr, ti) => {
    const part = tr.parts?.[ti];
    if (!part?.instanceColor) return null;
    const ic = part.instanceColor, m = part.material.color;
    return +(0.2126 * ic.getX(tr.id) * m.r + 0.7152 * ic.getY(tr.id) * m.g
      + 0.0722 * ic.getZ(tr.id) * m.b).toFixed(3);
  };
  const by = {};
  for (const tr of t.trees ?? []) {
    if (!by[tr.kind] && tr.parts?.length > 1) {
      const part = tr.parts[1];
      by[tr.kind] = { foliageLum: lum(tr, 1),
        mat: part.material.color.getHexString() };
    }
  }
  return by;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
