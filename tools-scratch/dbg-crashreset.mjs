/* #119 "the resets after a crash need fixing" — WHERE does a wreck put you?
 *
 * Hypothesis from reading vehicles.js:4796 — respawn()'s last fallback is
 *   placeAt(this.trackIndex, clamp(this.lateral, -6, 6), true)
 * so a car wrecked off-road may come back off-road, in whatever killed it.
 * §3.4b says a reset should put the car ON THE ROAD.
 *
 * MEASURE IT. Kill the player at a range of lateral offsets and record where
 * the car lands: lateral, height above road, surface under the wheels, and
 * whether it is still alive 3 s later (i.e. did it just die again).
 *
 * Harness traps already paid for in r423, do not re-learn them:
 *   input axes are prototype GETTERS — drive `analog`, never assign throttle
 *   pl.speed is STALE — never measure motion with it
 *   a wrapper left on _frameBody or pl.step leaks into later cases
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8921';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
const errors = [];
p.on('pageerror', (e) => errors.push(String(e.message)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });

const R = await p.evaluate(async () => {
  const g = window.__game;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
              get elapsedTime() { return elapsed; } };
  const pl = g.player, N = g.track.center.length;
  const rows = [];
  for (const lat of [0, 4, 8, 14, 22, 30]) {
    g.state = 'race';
    // TWO HARNESS BUGS FROM THE FIRST RUN, both fixed here:
    //  - placeAt hands out a spawn shield, so `damage` bounced off and the
    //    lat 0 rows reported "alive, full hull, came back in 0 ms" for a car
    //    that had never died at all;
    //  - `deaths` accumulates across iterations, so by the fourth kill the
    //    player was out of hulls (HULL_LIVES = 3) and simply never respawned.
    //    That is the three-wreck rule working, not a lateral-dependent bug,
    //    and reading it as one would have been a fabricated finding.
    g.deaths = 0;
    pl.outOfHulls = false; pl.alive = true; pl.health = pl.maxHealth;
    pl.placeAt(300, lat, true);
    for (let f = 0; f < 20; f++) g._frameBody();
    pl.invuln = 0; pl._gridInvuln = false;
    const died = { lat: +(pl.lateral ?? 0).toFixed(1), idx: pl.trackIndex };
    pl.damage(99999, null, true);            // a crash, not a fall
    let cameBack = -1;
    for (let f = 0; f < 700; f++) {
      g._frameBody();
      if (pl.alive && cameBack < 0) cameBack = f;
    }
    const half = g.track.widthAt ? g.track.widthAt(pl.trackIndex) : 9;
    rows.push({
      diedAtLat: died.lat, diedAtIdx: died.idx,
      backLat: +(pl.lateral ?? 0).toFixed(1), backIdx: pl.trackIndex,
      halfWidth: +Number(half).toFixed(1),
      onRoad: Math.abs(pl.lateral ?? 0) <= Number(half),
      cameBackMs: cameBack < 0 ? null : Math.round(cameBack * 1000 / 60),
      aliveAfter: pl.alive, health: Math.round(pl.health),
    });
  }
  return rows;
});
await browser.close();
console.log('lat_died -> lat_back   idx        halfW  onRoad  back_in   alive  hull');
for (const r of R) {
  console.log(`${String(r.diedAtLat).padStart(6)} -> ${String(r.backLat).padStart(7)}   ${String(r.diedAtIdx).padStart(3)}->${String(r.backIdx).padEnd(4)} ${String(r.halfWidth).padStart(5)}  ${String(r.onRoad).padEnd(6)}  ${String(r.cameBackMs).padStart(6)}ms  ${String(r.aliveAfter).padEnd(5)}  ${r.health}`);
}
if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 3));
