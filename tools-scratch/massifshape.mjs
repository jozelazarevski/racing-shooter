/* THE SHAPE OF EVERY MASSIF CONE — width, height, aspect, and how close its
 * flank comes to the carriageway. The walker shrinks `w` to make room and
 * leaves `h` alone, so a cone that had to squeeze past the lap comes out as a
 * needle; this is the table that shows it. Massif cones are the tall `prof`
 * solids inside r 800 (the skyline rings sit at 900 and 1120).
 *
 *   LEVELS=65,66,67 node massifshape.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 700 } });
p.setDefaultTimeout(600000);
for (const lv of (process.env.LEVELS ?? '65,66,67').split(',')) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  const r = await p.evaluate(() => {
    const t = window.__game.track;
    const cones = (t.solids || []).filter((s) => s.prof && s.h > 60
      && Math.hypot(s.x, s.z) < 800);
    const rows = cones.map((s) => {
      let d = 1e9;
      for (let i = 0; i < t.N; i++) {
        const c = t.center[i];
        d = Math.min(d, Math.hypot(c.x - s.x, c.z - s.z));
      }
      const w = s.r / 0.48;
      return { w: +w.toFixed(0), h: +s.h.toFixed(0), asp: +(s.h / w).toFixed(2),
        flank: +(d - s.r).toFixed(0), deg: +(Math.atan2(s.h, Math.max(1, d - s.r)) * 180 / Math.PI).toFixed(0) };
    }).sort((a, c) => c.asp - a.asp);
    return { n: cones.length, rows };
  });
  console.log(`L${lv}: ${r.n} massif cones`);
  for (const o of r.rows) console.log(`   w${String(o.w).padStart(4)} h${String(o.h).padStart(4)} aspect ${o.asp}  flank ${String(o.flank).padStart(5)}u  ${o.deg}deg`);
}
await b.close();
