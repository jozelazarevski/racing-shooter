import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=10&go=1&unlockall=1', { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  let farEnough = 0, straight = 0, curvs = [];
  for (let i = 0; i < N; i += 2) {
    if (t._circDist(i, 0) < 90) continue;
    farEnough++;
    let mc = 0;
    for (let w = -16; w <= 16; w++) mc = Math.max(mc, t.curvature[(i + w + N) % N]);
    curvs.push(mc);
    if (mc <= 0.009) straight++;
  }
  curvs.sort((a,b)=>a-b);
  return { N, farEnough, straight, minMc: +curvs[0]?.toFixed(4),
    p10: +curvs[Math.floor(curvs.length*0.1)]?.toFixed(4),
    p25: +curvs[Math.floor(curvs.length*0.25)]?.toFixed(4),
    gorges: t._jumpGorges?.length ?? -1, crests: t.crests?.length ?? -1 };
});
console.log(JSON.stringify(r));
await b.close();
