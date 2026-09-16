import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 180000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const at = (i) => {
    const c = t.center[i];
    return { i, cy: +c.y.toFixed(1),
      deck: +(t.groundHeightAt ? t.groundHeightAt(i, 0) : c.y).toFixed(1),
      terr: +t.terrainHeight(c.x, c.z).toFixed(1) };
  };
  const keys = Object.keys(t).filter((k) => /tunnel|bore|arch|mesa|butte/i.test(k));
  const tun = (t.tunnels ?? t._tunnels ?? []).map((u) => ({ ...u }));
  return { probes: [at(100), at(110), at(300), at(308)], keys, tun: tun.slice(0, 6) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
