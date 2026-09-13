/* How far from the world centre the lap itself runs, per level. Needed to
 * choose an "ON the road" ring for the shrinkpath fixture, and to know what
 * "out of the world" means in numbers. FAILS LOUDLY if the track never built. */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8914;
const levels = (process.env.LEVELS ?? '66').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 480 } });
p.setDefaultTimeout(600000);
let n = 0;
for (const lv of levels) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  const r = await p.evaluate(() => {
    const t = window.__game.track;
    let lo = 1e9, hi = 0;
    for (let i = 0; i < t.N; i++) {
      const d = Math.hypot(t.center[i].x, t.center[i].z);
      if (d < lo) lo = d; if (d > hi) hi = d;
    }
    const M = t.T.massif;
    return { lo: Math.round(lo), hi: Math.round(hi), N: t.N,
      massif: M ? `${M.count} @ r${M.r0}-${M.r1} w${M.w0}-${M.w1} h${M.h0}-${M.h1}` : null };
  });
  console.log(`L${lv}`, JSON.stringify(r));
  n++;
}
await b.close();
if (!n) { console.log('FAIL: measured no levels'); process.exit(1); }
