// Owner photo: a tower in the driving corridor on RED CENTRE RUN. Census of
// every solid/building/barrier within widthAt+6 of the course line.
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVEL = process.env.LEVEL ?? 32;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 120)));
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const out = [];
  const scan = (list, kind) => {
    for (const s of list ?? []) {
      const d = t._distToTrack(s.x, s.z);
      const i = t.nearestIndex ? t.nearestIndex({ x: s.x, y: 0, z: s.z }) : 0;
      const w = t.widthAt ? t.widthAt(i) : 9.5;
      if (d < w + (s.r ?? 1) + 6) {
        out.push({ kind, d: +d.toFixed(1), w: +w.toFixed(1), r: +(s.r ?? 0).toFixed(1),
          x: Math.round(s.x), z: Math.round(s.z), mat: s.mat, idx: i });
      }
    }
  };
  scan(t.solids, 'solid');
  scan(t.buildings, 'building');
  out.sort((a, b) => (a.d - a.w) - (b.d - b.w));
  return { n: out.length, worst: out.slice(0, 14), width0: t.widthAt?.(0) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
