/* How long a world takes to build, with a short cap: a world that will not
 * finish is a different problem from a world that is slow, and the census
 * reports both as SKIP. */
import { chromium } from 'playwright-core';
// LV takes a list: `LV=30,34,73 node buildtime.mjs`
const LVS = (process.env.LV ?? '78').split(',').map((x) => x.trim()).filter(Boolean);
const CAP = +(process.env.CAP ?? 90000);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
let bad = 0;
for (const LV of LVS) {
  const p = await (await b.newContext({ viewport: { width: 640, height: 400 } })).newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  const t0 = Date.now();
  let built = 1;
  try {
    await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil: 'load', timeout: CAP });
    await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: CAP });
  } catch { built = 0; }
  if (!built) bad++;
  console.log(`${built ? 'ok  ' : 'FAIL'} ${String(LV).padStart(3)}  ${String(Date.now() - t0).padStart(6)} ms  ${errs.slice(0, 2).join(' | ')}`);
  await p.close();
}
console.log(bad ? `${bad} WORLD(S) DID NOT BUILD` : `all ${LVS.length} built`);
await b.close();
