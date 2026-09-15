/* r430 (E-24): a density change is a VISUAL change and counts are not eyes.
 * Parks the camera at a few stations and renders, so the grove and the
 * vine slopes can be looked at rather than inferred from an instance count. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8931';
const SHOTS = (process.env.SHOTS ?? '46:VINEYARD,73:ALBAROSA,29:OLIVECOAST').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const sh of SHOTS) {
  const [id, tag] = sh.split(':');
  const p = await b.newPage({ viewport: { width: 900, height: 560 } });
  p.setDefaultTimeout(600000);
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  // DON'T drive the camera by hand: the game's own rAF loop re-renders with
  // ITS camera straight after, so a manually posed frame is gone before the
  // screenshot lands (first cut produced six frames of blurred ground).
  // Park the player and let the chase camera frame it, which is the view the
  // owner actually has.
  for (const frac of [0.18, 0.55]) {
    await p.evaluate((f) => {
      const g = window.__game, tk = g.track, N = tk.center.length;
      const pl = g.cars?.[0] ?? g.player;
      // placeAt alone does NOT seat vertically: measured on VINEYARD VELOCE
      // it left the car at y 9.4 under terrain at 410, and the chase camera
      // then skimmed the ground — six frames of blurred dirt that read as
      // "the grove is missing". The rescue flag is what re-seats a car on the
      // road, so ask for it and give it time to land.
      if (pl?.placeAt) { pl.placeAt(Math.floor(N * f), 0, true); pl.invuln = 0; }
      pl._unstuckReq = true; pl.unstuckCool = 0;
    }, frac);
    await p.evaluate(() => new Promise((r) => {
      let n = 0; const f = () => (++n > 150 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f);
    }));
    const ok = await p.evaluate(() => {
      const g = window.__game, tk = g.track, pl = g.cars?.[0] ?? g.player;
      return Math.abs(pl.pos.y - tk.terrainHeight(pl.pos.x, pl.pos.z)) < 30;
    });
    if (!ok) { console.log('HARNESS FAILURE: car not seated, frame is worthless'); process.exit(1); }
    await p.screenshot({ path: `tools-scratch/shot-grove-${tag}-${Math.round(frac * 100)}.png` });
  }
  await p.close();
  console.log('shot ' + tag);
}
await b.close();
