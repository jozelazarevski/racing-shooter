/* HOW FAR OUT DOES THE LAP ACTUALLY GO?
 *
 * `_buildGlacier` seats its tongue on a ring at r 560..880 around the WORLD
 * ORIGIN, at a fixed azimuth. Whether that ring is clear of the lap is
 * therefore a fact about the route, not about the glacier. This reports the
 * road's radius from the origin — overall, and restricted to the wedge the
 * tongue occupies — so "the glacier is nowhere near the road on this level"
 * is a number rather than an impression.
 *
 *   LEVELS=21,66 node roadreach.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? '8912';
const A0 = -2.25, HALF = 0.40;                 // the tongue's azimuth and spread
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 480 } });
p.setDefaultTimeout(900000);
for (const lv of (process.env.LEVELS ?? '21,66').split(',')) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:900000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:900000 });
  const r = await p.evaluate(({ A0, HALF }) => {
    const t = window.__game.track;
    let lo = 1e9, hi = -1e9, wedgeHi = -1e9, wedgeN = 0;
    for (let i = 0; i < t.N; i++) {
      const c = t.center[i];
      const rr = Math.hypot(c.x, c.z);
      if (rr < lo) lo = rr; if (rr > hi) hi = rr;
      let da = Math.atan2(c.z, c.x) - A0;
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      if (Math.abs(da) <= HALF) { wedgeN++; if (rr > wedgeHi) wedgeHi = rr; }
    }
    return { N: t.N, lo: +lo.toFixed(0), hi: +hi.toFixed(0),
      wedgeN, wedgeHi: wedgeN ? +wedgeHi.toFixed(0) : null };
  }, { A0, HALF });
  console.log(`L${lv}: road radius from origin ${r.lo}..${r.hi} u over ${r.N} stations;`
    + ` ${r.wedgeN} station(s) inside the tongue's wedge`
    + (r.wedgeN ? `, reaching r=${r.wedgeHi}` : ' — the lap never enters it'));
}
await b.close();
