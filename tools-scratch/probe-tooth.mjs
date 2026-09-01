import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=21&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const rows = [];
  for (const s of t.solids) {
    if (s.h === undefined || s.mat !== 'stone') continue;
    const ground = t.terrainHeight(s.x, s.z);
    const base = s.y - 2;
    const visible = (base + s.h) - ground;
    if (visible < s.h * 0.5) {
      rows.push({ x: Math.round(s.x), z: Math.round(s.z), h: +s.h.toFixed(1), r: +(s.r ?? 0).toFixed(1),
        ground: +ground.toFixed(1), base: +base.toFixed(1), visible: +visible.toFixed(1),
        goat: t._goat ? +t._goatH(s.x, s.z).toFixed(1) : 0,
        groundNoGoat: t._goat ? +(ground - t._goatH(s.x, s.z)).toFixed(1) : null });
    }
  }
  return rows;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
