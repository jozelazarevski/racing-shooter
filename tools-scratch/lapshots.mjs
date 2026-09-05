/* THE LAP, PHOTOGRAPHED. When a report is a picture and nothing measured has
 * matched it, look at the world the way the player did: chase camera, a
 * handful of stations round the lap, one contact sheet.
 *
 *   LEVEL=66 STOPS=8 node lapshots.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 760 } });
p.setDefaultTimeout(600000);
const LEVEL = process.env.LEVEL ?? '66';
await p.goto(`http://localhost:8901/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(async () => {
  const g = window.__game;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  while (g.camMode !== 3) g.cycleCamera();          // CHASE, as reported
});
const STOPS = +(process.env.STOPS ?? 8);
for (let s = 0; s < STOPS; s++) {
  await p.evaluate(async ([k, n]) => {
    const g = window.__game, t = g.track, pl = g.player;
    const idx = Math.floor((k / n) * t.N);
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 14; i++) {
      const c = t.pointAt(idx, 0);
      pl.heading = t.headingAt(idx); pl.pos.x = c.x; pl.pos.z = c.z;
      if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
      pl.trackIndex = idx; pl.vel.copy(pl.forward).multiplyScalar(18); pl.vy = 0; pl.airborne = false;
      await f();
    }
  }, [s, STOPS]);
  await p.screenshot({ path: `tools-scratch/shot-lap${LEVEL}-${s}.png` });
}
console.log(`wrote ${STOPS} shots for level ${LEVEL}`);
await b.close();
