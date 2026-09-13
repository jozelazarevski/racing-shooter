import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const h = t.headingAt(0), pt = t.pointAt(0, 14);
  const dx = Math.sin(h), dz = Math.cos(h);
  let trees = 0, near = [];
  for (let s = 0; s <= 100; s += 4) {
    const x = pt.x + dx * s, z = pt.z + dz * s;
    const list = t.camTreesNear ? t.camTreesNear(x, z) : [];
    for (const tr of list) {
      const d = Math.hypot(tr.x - x, tr.z - z);
      if (d < 4) { trees++; near.push(+d.toFixed(1)); }
    }
  }
  // also surface template + row the vehicle would pick
  return { trees, near: near.slice(0, 10),
    theme: g.level?.theme,
    tmpl: (window.DRIVING ?? g.DRIVING)?.templateOf?.[g.level?.theme] };
});
console.log(JSON.stringify(r));
await browser.close();
