/* THE CANYON GORGE, CLEANED UP (r306, user screenshot: "Clean this up").
 *
 * What the photo actually showed: the overhead camera following a slow car
 * DOWN into a jump gorge (the deck legitimately dives ~26 u below the rim
 * for a few samples), then the DEATH CAMERA on the drowned/chasmed wreck —
 * wall interiors filling the frame. Two laws fix it:
 *
 *   1. CLAUDE.md §3.3 KILL VOLUMES: a racing player who falls in is
 *      RETURNED (free, no hull, full run-up from the previous gate) —
 *      never wrecked. Roam, missions and rivals keep the honest sinking.
 *   2. A TOP CAMERA NEVER DIVES INTO A GORGE: the overhead family floors
 *      its height anchor at the local road-datum rim, so the dip reads as
 *      a slot seen from above, not a wall interior.
 *
 *   node tests/test-gorge.mjs
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (c, m, e = '') => { if (c) { pass++; console.log('PASS ', m, e); } else { fail++; console.log('FAIL ', m, e); } };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
const errors = [];
p.on('pageerror', (e) => errors.push(String(e.message)));
await p.goto(`${BASE}/?level=4&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
  undefined, { timeout: 180000 });
const R = await p.evaluate(() => {
  const g = window.__game, pl = g.player, t = g.track, N = t.center.length;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.camMode = 0;
  let returns = 0;
  const rl = g.telemetry.log.bind(g.telemetry);
  g.telemetry.log = (k, d) => { if (k === 'return') returns++; return rl(k, d); };

  // 1. the failed jump: creep into the gorge at 6 m/s, wait out the grace
  pl.placeAt(100, 0, true);
  pl.vel.set(Math.sin(pl.heading) * 6, 0, Math.cos(pl.heading) * 6);
  const deaths0 = g.deaths;
  for (let f = 0; f < 360; f++) g.frame();
  const kill = { deaths: g.deaths - deaths0, alive: pl.alive, returns,
    y: +pl.y.toFixed(1), hp: Math.round(pl.health) };

  // 2. the camera floor: a live car held on the gorge floor (nets and the
  // drown stubbed for the staged frames) keeps an overhead camera at rim
  // height. The dead-cam that used to fill the frame with wall sat at ~27.
  const realDrown = pl.drown.bind(pl);
  const realChasm = pl.intoChasm.bind(pl);
  pl.drown = () => {}; pl.intoChasm = () => {};
  pl.placeAt(110, 0, true); pl.vel.set(0, 0, 0);
  let camY = 0, rim = -Infinity;
  for (let f = 0; f < 45; f++) {
    pl._wedgeT = 0; pl._lostT = 0; pl._cliffT = 0; g._gateMissT = 0;
    g.frame();
    camY = g.camera.position.y;
  }
  for (let q = -12; q <= 12; q += 3) rim = Math.max(rim, t.center[(pl.trackIndex + q + N) % N].y);
  const cam = { carY: +pl.y.toFixed(1), camY: +camY.toFixed(1), rim: +rim.toFixed(1) };
  pl.drown = realDrown; pl.intoChasm = realChasm;
  return { kill, cam };
});
ok(R.kill.deaths === 0 && R.kill.alive,
  '§3.3: falling into the gorge costs NO hull — the player is returned, alive',
  `deaths +${R.kill.deaths}, alive=${R.kill.alive}, hp ${R.kill.hp}`);
ok(R.kill.returns >= 1 && R.kill.y > -10,
  'the return actually happened and put the car back up on the road',
  `${R.kill.returns} return(s), resting at y=${R.kill.y}`);
ok(R.cam.carY < -10 && R.cam.camY > R.cam.rim + 30,
  'the overhead camera floors at the rim over a gorge — never inside the slot',
  `car at y=${R.cam.carY}, camera at y=${R.cam.camY} (rim ${R.cam.rim}; the dead-cam sat at ~27)`);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
