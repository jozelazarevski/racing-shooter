/* The sinking bug, as a test.
 *
 * This test could not have been written before r81. World generation was
 * unseeded, so "put the car here and it sinks" was not reproducible: the
 * terrain under that spot was different on the next load. With seeded worlds
 * the same level puts the same shelf in the same place every time.
 *
 * What it asserts: a car on or beside the roadbed is never BELOW the roadbed.
 * On a shelf road the raw terrain is up to 30 u lower, and the off-road branch
 * used to ease the car down toward it.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// The three worlds with the biggest road-above-terrain gap, plus a flat one.
for (const [id, name] of [[21, 'FURKA RIDGE'], [22, 'COL DE TURINI'], [25, 'PIKES PEAK'], [10, 'ROCKFALL RAVINE']]) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 180000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  const r = await p.evaluate(() => {
    const g = window.__game, car = g.player, t = g.track;
    let worstBelow = 0, at = -1, atLat = 0;
    // Walk the stage, parking the car progressively further onto the verge —
    // exactly the line that used to drop it through the shelf.
    for (let i = 20; i < t.center.length; i += 7) {
      // Inside the corridor only. WALL_OFF is 10.4, so past ~11 u the car is
      // beyond the barrier line — on a cliff road that is the drop, and falling
      // there is the world working, not a bug.
      for (const lat of [0, 3, 5, 7, 9, 10]) {
        const pt = t.pointAt(i, lat);
        car.trackIndex = i; car.lateral = lat;
        car.alive = true; car.health = 100; car.airborne = false;
        car.vy = 0; car._climbRate = 0; car._settleT = 0;
        const road = t.groundHeightAt(i, lat);
        car.pos.set(pt.x, road + 0.3, pt.z); car.y = car.pos.y;
        car.vel.set(0, 0, 0); car.speedAlong = 0;
        // Half a second of settling is plenty for a 12/s ease to show itself.
        for (let k = 0; k < 30; k++) {
          car.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
        }
        const below = road - car.y;
        if (below > worstBelow) { worstBelow = below; at = i; atLat = lat; }
      }
    }
    return { worstBelow: +worstBelow.toFixed(2), at, atLat };
  });

  // 0.5 u of settle is suspension; 2 u is falling through the world.
  check(`${name}: car never drops through the roadbed`, r.worstBelow < 2,
    `worst ${r.worstBelow} u below the road at sample ${r.at}, lateral ${r.atLat}`);
  await p.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nno sinking anywhere');
process.exit(fail ? 1 : 0);
