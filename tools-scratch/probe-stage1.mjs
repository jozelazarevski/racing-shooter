/* Phase-1 smoke: nitro ceiling + validator on Cliff Knot (59) and Il Budello (74). */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const lvl of [59, 74, 4]) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => window.__game?.player && window.__game.track?.center, undefined, { timeout: 300000 });
  const r = await p.evaluate(async () => {
    const g = window.__game;
    if (g.composer) g.composer.render = () => {};
    let elapsed = g.clock.elapsedTime;
    g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    g._frameBody();                                  // density + validator frame
    // nitro ceiling: boost at full throttle on the straightest spot, 6 s
    const pl = g.player, t = g.track, N = t.center.length;
    pl.placeAt(Math.floor(N * 0.5), 0, true);
    const v0 = 30; pl.speedAlong = v0;
    pl.vel.set(Math.sin(pl.heading) * v0, 0, Math.cos(pl.heading) * v0);
    g.input.analog.throttle = 1;
    let maxKmh = 0;
    for (let f = 0; f < 360; f++) {
      pl.nitro = 1; pl.boostTimer = 1;               // held boost
      g._frameBody();
      maxKmh = Math.max(maxKmh, Math.hypot(pl.vel.x, pl.vel.z) * 3.1);
    }
    g.input.analog.throttle = 0;
    return { world: g.level?.name, ceilKmh: +(g._nitroCeilU * 3.1).toFixed(0),
      maxKmh: +maxKmh.toFixed(0),
      nitros: g.pickups.filter((x) => x.type === 'nitro').length,
      violations: (g._stageReport ?? []).map((v) => v.rule + (v.fix === 'generator' ? '(gen)' : '')) };
  });
  console.log(lvl, JSON.stringify(r), errs.slice(0, 2).join('|') || '');
  await p.close();
}
await browser.close();
