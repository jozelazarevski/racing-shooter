import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 68), ST = Number(process.env.ST ?? 24);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate((st) => {
  const t = window.__game.track, c = t.center[st];
  const counts = {};
  for (const tr of t.trees ?? []) {
    const d = Math.hypot(tr.x - c.x, tr.z - c.z);
    if (d < 45) counts[tr.kind] = (counts[tr.kind] ?? 0) + 1;
  }
  return { world: window.__game.level?.name, counts,
    total: (t.trees ?? []).length };
}, ST);
console.log(JSON.stringify(r));
await browser.close();
