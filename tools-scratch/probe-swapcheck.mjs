import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const errs = [];
async function sample(lvl) {
  const q = await browser.newPage({ viewport: { width: 300, height: 200 } });
  q.on('pageerror', (e) => errs.push(lvl + ':' + String(e).slice(0, 100)));
  await q.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await q.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const d = await q.evaluate(() => {
    const t = window.__game.track, pts = [];
    for (let i = 0; i < t.center.length; i += 37) pts.push([Math.round(t.center[i].x), Math.round(t.center[i].z)]);
    return { name: window.__game.level.name, pts };
  });
  await q.close(); return d;
}
for (const [a, b] of [[41, 66], [28, 69]]) {
  const A = await sample(a), B = await sample(b);
  console.log(A.name, 'vs', B.name, 'identical:', JSON.stringify(A.pts) === JSON.stringify(B.pts));
}
console.log('errors', errs.length);
await browser.close();
