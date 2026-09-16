import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 300, height: 200 } });
await p.goto(`${BASE}/?level=68&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.trees?.length, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track;
  const kinds = {};
  for (const tr of t.trees) kinds[tr.kind] = (kinds[tr.kind] ?? 0) + 1;
  // simpler: read raw instanceColor buffer of a pine's crown part
  const pine = t.trees.find((x) => x.kind === 'pine');
  let crown = null, matCol = null;
  if (pine) {
    const part = pine.parts[1];
    const arr = part.instanceColor?.array;
    if (arr) crown = [arr[pine.id * 3], arr[pine.id * 3 + 1], arr[pine.id * 3 + 2]].map((v) => +v.toFixed(2));
    matCol = '#' + part.material.color.getHexString();
  }
  return { kinds, crown, matCol };
});
console.log(JSON.stringify(r));
await browser.close();
