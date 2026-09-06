/* DOES THE PLAYER'S CAR ACTUALLY DRIVE? A gate that exists because nothing
 * else caught this: `_syncLights` was defined on `EnemyCar` and called on the
 * first line of `PlayerCar.update`, so on EVERY level the player's update
 * threw and its whole body was skipped. The frame loop catches and recovers,
 * so there was no crash, no stack in `pageerr.mjs`, and `boot.mjs` stayed
 * green at 4/4 — the car simply never moved and the chase camera sat at the
 * world origin.
 *
 * So: hold the throttle down and assert the car GOES. Speed, distance
 * travelled, and the camera actually following it. Anything the frame loop
 * swallows shows up here as a car that does not move.
 *
 *   LEVELS=1,6,18 node playermoves.mjs
 */
import { chromium } from 'playwright-core';
const LEVELS = (process.env.LEVELS ?? '1,18').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
let bad = 0;
for (const lvl of LEVELS) {
  const p = await b.newPage({ viewport: { width: 430, height: 800 } });
  p.setDefaultTimeout(600000);
  const recovered = [];
  p.on('console', (m) => { if (/recovered from/.test(m.text())) recovered.push(m.text().split('\n')[0].slice(0, 120)); });
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
  const r = await p.evaluate(async () => {
    const g = window.__game, pl = g.player;
    g.startRace?.();
    const f = () => new Promise((r2) => requestAnimationFrame(r2));
    for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
    const p0 = pl.pos.clone();
    // RUN ON THE CLOCK, NOT ON A FRAME COUNT. Under swiftshader rAF runs at a
    // crawl and the rate varies with how many browsers are alive, so "180
    // frames" is a different amount of simulated time every run: the first cut
    // of this gate passed PINE VALLEY at 172 u travelled and then failed the
    // same level at 64 u ten minutes later, and called five worlds broken.
    // A wall-clock window is repeatable; distance under it still is not, so
    // distance is REPORTED and the PASS is on the two things that are
    // deterministic — the camera being behind the car, and nothing being
    // swallowed by the frame loop's catch.
    const t0 = performance.now();
    while (performance.now() - t0 < 6000) {
      // `input.throttle` is a GETTER with no setter (input.js:150), so
      // `g.input.throttle = 1` silently does nothing and every speed this
      // gate printed for its first three runs was the car free-rolling.
      // The virtual stick is the settable one.
      if (g.input?.analog) { g.input.analog.throttle = 1; g.input.analog.brake = 0; g.input.analog.steer = 0; }
      await f();
    }
    const cam = g.camera.position;
    return { speed: +pl.vel.length().toFixed(1),
      moved: +pl.pos.distanceTo(p0).toFixed(1),
      camToCar: +Math.hypot(cam.x - pl.pos.x, cam.z - pl.pos.z).toFixed(1),
      camAtOrigin: cam.length() < 1, lap: g.lap ?? null, name: g.level?.name };
  });
  // WHAT THIS GATE MAY AND MAY NOT ASSERT.
  //   - no exception swallowed by the frame loop's catch: hard fail, and the
  //     whole reason this file exists.
  //   - the chase camera not sitting at the WORLD ORIGIN: hard fail. That is
  //     precisely what the `_syncLights` bug produced — the player's update
  //     threw on its first line, so the camera was never moved from (0,0,0).
  //   - the car moving under held throttle: hard fail, now that the throttle
  //     is applied through `input.analog` and actually reaches the car.
  // camToCar is REPORTED, NOT ASSERTED. The camera lerps in from the origin
  // and under swiftshader there are few enough frames that a grid 264 u out
  // (NEO-KYOTO) is still catching up when the window closes, while one 179 u
  // out (PINE VALLEY) has arrived. That is this renderer, not the game.
  const ok = !r.camAtOrigin && r.speed > 3 && !recovered.length;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'} L${lvl} ${(r.name || '').slice(0, 22).padEnd(22)}`
    + ` speed ${String(r.speed).padStart(6)}  moved ${String(r.moved).padStart(7)}`
    + `  camToCar ${String(r.camToCar).padStart(6)}${r.camAtOrigin ? '  CAM AT ORIGIN' : ''}`);
  if (process.env.SHOT) await p.screenshot({ path: `tools-scratch/shot-moves-${lvl}.png`,
    clip: { x: 0, y: 0, width: 430, height: 800 } });
  if (recovered.length) console.log('   swallowed by the frame loop:', recovered[0]);
  await p.close();
}
console.log(bad ? `FAIL: ${bad}/${LEVELS.length} levels` : `PASS: ${LEVELS.length}/${LEVELS.length} drive`);
await b.close();
process.exit(bad ? 1 : 0);
