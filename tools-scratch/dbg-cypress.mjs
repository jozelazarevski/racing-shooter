import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=61&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const cyp = (t.trees ?? []).filter(tr => tr.kind === 'cypress').slice(0, 8);
  const out = [];
  for (const tr of cyp) {
    const part = tr.parts?.[1]; // the column (foliage tier)
    if (!part?.instanceColor) { out.push({ id: tr.id, note: 'no instanceColor' }); continue; }
    const ic = part.instanceColor;
    const rr = ic.getX(tr.id), gg = ic.getY(tr.id), bb = ic.getZ(tr.id);
    const m = part.material.color;
    const lum = 0.2126 * rr * m.r + 0.7152 * gg * m.g + 0.0722 * bb * m.b;
    out.push({ id: tr.id, inst: [+rr.toFixed(2), +gg.toFixed(2), +bb.toFixed(2)],
      prodLum: +lum.toFixed(3) });
  }
  return { count: cyp.length, out };
});
console.log(JSON.stringify(r));
await browser.close();
