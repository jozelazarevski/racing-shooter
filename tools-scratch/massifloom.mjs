/* HOW BIG IS THE MOUNTAIN FROM THE ROAD?
 *
 * The massif walker guarantees a crag stands `w/2 + width + 24` clear of the
 * nearest road SAMPLE. That is a footprint rule, and it says nothing about
 * what the thing looks like from the driver's seat: a 300 u cone standing the
 * legal 208 u away still fills 55 degrees of sky. This measures the ANGLE, per
 * station, so "a mountain is looming over the car" is a number and not a
 * screenshot.
 *
 * Reads `track.solids` (the massif pushes one entry per cone, carrying x/z/r/h)
 * rather than the instance matrices, so it also sees the shrink-to-fit cases.
 *
 *   LEVELS=65,66,67 node massifloom.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 700 } });
p.setDefaultTimeout(600000);
let bad = 0;
for (const lv of (process.env.LEVELS ?? '65,66,67').split(',')) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  const r = await p.evaluate(() => {
    const t = window.__game.track;
    // the massif cones are the tall stone solids; nothing else on the roster
    // pushes a `prof`, which is the massif's own cross-section table
    const cones = (t.solids || []).filter((s) => s.prof && s.h > 60);
    const out = [];
    for (let i = 0; i < t.N; i += 2) {
      const c = t.center[i];
      let worst = null;
      for (const s of cones) {
        const d = Math.hypot(c.x - s.x, c.z - s.z) - s.r;   // to the drawn flank
        if (d <= 0) { worst = { d, deg: 90, s }; break; }
        // top of the cone above the driver's eye, seen from the flank
        const deg = Math.atan2((s.y + s.h) - (c.y + 1.6), d) * 180 / Math.PI;
        if (!worst || deg > worst.deg) worst = { d, deg, s };
      }
      if (worst) out.push({ i, d: +worst.d.toFixed(1), deg: +worst.deg.toFixed(1),
        w: +(worst.s.r * 2).toFixed(0), h: +worst.s.h.toFixed(0) });
    }
    out.sort((a, c) => c.deg - a.deg);
    const N = out.length || 1;
    return { name: t.T?.name ?? '', cones: cones.length, N: t.N,
      over40: out.filter((o) => o.deg > 40).length / N,
      over25: out.filter((o) => o.deg > 25).length / N,
      worst: out.slice(0, 5) };
  });
  const pct = (v) => (100 * v).toFixed(1) + '%';
  console.log(`L${lv} cones=${r.cones} stations>40deg=${pct(r.over40)} >25deg=${pct(r.over25)}`);
  for (const o of r.worst) console.log(`   st ${o.i}: ${o.deg} deg, flank ${o.d} u away, cone ${o.w}x${o.h}`);
  if (r.over40 > 0) bad++;
}
console.log(bad ? `FAIL: ${bad} level(s) have a mountain over 40 deg from the road` : 'PASS');
await b.close();
process.exit(bad ? 1 : 0);
