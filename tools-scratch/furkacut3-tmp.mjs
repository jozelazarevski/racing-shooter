import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
await p.goto('http://localhost:8901/?level=21&go=1&unlockall=1', { waitUntil:'load', timeout:120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:120000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const globalDist = (x, z) => {
    let m = 1e9;
    for (const c of t.center) { const d = Math.hypot(x - c.x, z - c.z); if (d < m) m = d; }
    return m;
  };
  // the test's current far spot
  const far = t.pointAt(200, 140);
  const farTrue = +globalDist(far.x, far.z).toFixed(1);
  // find sample where lat-140 is genuinely remote
  let bestFar = null;
  for (let i = 60; i < t.center.length - 60; i += 17) {
    const q = t.pointAt(i, 140);
    const d = globalDist(q.x, q.z);
    if (!bestFar || d > bestFar.d) bestFar = { i, d: +d.toFixed(1) };
  }
  return { farTrue, bestFar };
});
console.log(JSON.stringify(r));
await b.close();
