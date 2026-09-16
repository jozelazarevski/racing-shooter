import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.goto('http://localhost:8901/?level=29&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const bad = [];
  for (const tr of t.trees ?? []) {
    const sink = t.terrainHeight(tr.x, tr.z) - (tr.y ?? 0);
    if (sink > 1.5) bad.push({ kind: tr.kind, sink: +sink.toFixed(1),
      hasParts: !!tr.parts?.length, id: tr.id ?? null,
      keys: Object.keys(tr).join(','), s: tr.s, r: tr.r });
  }
  bad.sort((a, b) => b.sink - a.sink);
  return { conformed: t._treesConformed, n: bad.length, top: bad.slice(0, 5) };
});
console.log(JSON.stringify(r, null, 1));
console.log('errors:', JSON.stringify(errs));
await browser.close();
