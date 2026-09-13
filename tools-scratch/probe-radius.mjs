import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  const rad = (i, k = 6) => {
    const a = t.center[(i - k + N) % N], b = t.center[i % N], c = t.center[(i + k) % N];
    const abx = b.x - a.x, abz = b.z - a.z, bcx = c.x - b.x, bcz = c.z - b.z;
    const cross = abx * bcz - abz * bcx;
    if (Math.abs(cross) < 1e-6) return 1e9;
    const ab = Math.hypot(abx, abz), bc = Math.hypot(bcx, bcz), ac = Math.hypot(c.x - a.x, c.z - a.z);
    return (ab * bc * ac) / (2 * Math.abs(cross));
  };
  const out = [];
  for (let i = -15; i <= 21; i += 3) out.push([i, Math.round(Math.min(rad((i + N) % N), 9999))]);
  return out;
});
console.log(JSON.stringify(r));
await browser.close();
