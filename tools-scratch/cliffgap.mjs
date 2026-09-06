/* HOW CLOSE DOES THE ROCK ACTUALLY COME, station by station, against the fixed
 * limit the camera is allowed out to.
 *
 * `_buildWalls` sets each cliff face at `WALL_OFF + 0.65 + cliffSetback`, but
 * then clamps it with `_cliffCap` — "never further out than the lap leaves
 * room for", because the circuit comes back past itself and two legs must not
 * be given overlapping rock. That cap can only pull the face IN.
 *
 * The camera's own guard (`clampCam`, main.js) is a CONSTANT: `lim = 8.4`.
 * It does not read the cap. So anywhere the cap pulls a face inside 8.4 plus
 * a camera's clearance, the eye is allowed to sit exactly where the rock is.
 *
 *   LEVELS=4,10,18 node cliffgap.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
for (const lvl of (process.env.LEVELS ?? '4,10,18').split(',')) {
  const p = await b.newPage({ viewport: { width: 430, height: 800 } });
  p.setDefaultTimeout(600000);
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  console.log(lvl, JSON.stringify(await p.evaluate(() => {
    const t = window.__game.track;
    if (!t.T.cliffWalls) return { cliffWalls: false };
    const cap = t._cliffCap;
    if (!cap) return { cliffWalls: true, cap: 'none — face is never pulled in' };
    let min = Infinity, minAt = -1, under = 0, under12 = 0;
    for (let i = 0; i < cap.length; i++) {
      const v = cap[i];
      if (!Number.isFinite(v)) continue;
      if (v < min) { min = v; minAt = i >> 1; }
      if (v < 8.4) under++;
      if (v < 12) under12++;
    }
    return { cliffWalls: true, setback: t.T.cliffSetback ?? 0,
      nominalFace: +(10.4 + 0.65 + (t.T.cliffSetback ?? 0)).toFixed(1),
      capMin: +min.toFixed(2), capMinAtStation: minAt, capEntries: cap.length,
      stationsInside8_4: under, stationsInside12: under12 };
  })));
  await p.close();
}
await b.close();
