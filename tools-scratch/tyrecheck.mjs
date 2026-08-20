import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '17';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext()).newPage(); p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(await p.evaluate(() => {
  const t = window.__game.track;
  const m = t._tireMesh;
  if (!m) return 'no tyre mesh';
  const ic = m.instanceColor;
  if (!ic) return `tyres=${m.count} but no instanceColor`;
  let pale = 0;
  for (let i = 0; i < m.count; i++) if (ic.array[i * 3] > 0.5) pale++;
  return `night=${!!t.T.night} tyres=${m.count} pale=${pale} stacks=${t.tireStacks.length}`;
}));
await b.close();
