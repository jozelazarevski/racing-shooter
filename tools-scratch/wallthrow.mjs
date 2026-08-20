/* WHERE DOES THE CAR GET THROWN, AND BY WHAT?
 *
 * The report is "I ended in the walls" on UNDERCITY SLIPSTREAM. The known
 * mechanism (documented at `_buildCliffCaps`) is a lap that folds back inside
 * its own verge: `trackIndex` is the NEAREST sample, so near a fold it can
 * flip to the other leg, `lateral` flips with it, and the clamp at
 * `widthAt + 0.55` yanks the car across the map in one frame.
 *
 * So drive it and watch three things per frame: how far the car MOVED, how far
 * its track index JUMPED, and what its speed did. A teleport is a position
 * step far larger than speed * dt — that is the signature, and it does not
 * need a screenshot to see.
 *
 * POSITIVE CONTROL: the same run on a cliff-walled world whose lap does NOT
 * fold back. If that one also shows jumps, the detector is measuring driving,
 * not a defect.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '18').split(',').map(Number);
const SECS = Number(process.env.SECS ?? 60);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 280 } });
page.setDefaultTimeout(600000);
for (const id of IDS) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  const r = await page.evaluate((secs) => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    g.clock.getDelta = () => 1 / 60;
    g.composer.render = () => {};                  // swiftshader is the cost
    g._autoQuality = () => {};
    const circ = (a, c) => Math.min(((a - c) % N + N) % N, ((c - a) % N + N) % N);
    let px = p.pos.x, pz = p.pos.z, pi = p.trackIndex, plat = p.lateral;
    const jumps = [];
    for (let f = 0; f < secs * 60; f++) {
      g.input.analog.throttle = 1;
      // steer at the wall on purpose: a clamp you never touch cannot throw you
      g.input.analog.steer = Math.sin(f / 41) * 0.9;
      g.frame();
      const step = Math.hypot(p.pos.x - px, p.pos.z - pz);
      const expect = (p.speed ?? 0) / 60 + 0.6;    // room for the physics step
      if (step > Math.max(expect, 3)) {
        jumps.push({ f, step: +step.toFixed(2),
          idxJump: circ(p.trackIndex, pi), lat: +plat.toFixed(2),
          latAfter: +p.lateral.toFixed(2), spd: +(p.speed ?? 0).toFixed(1) });
      }
      px = p.pos.x; pz = p.pos.z; pi = p.trackIndex; plat = p.lateral;
    }
    // and how badly the wall cap is floored here
    return { name: g.level?.name, cap: t._cliffCapped ?? null,
      halfMean: +(t.center.reduce((s, _, i) => s + t.widthAt(i), 0) / N).toFixed(2),
      jumps: jumps.slice(0, 12), nJumps: jumps.length,
      worst: jumps.length ? Math.max(...jumps.map((j) => j.step)).toFixed(2) : 0 };
  }, SECS);
  console.log(`L${id} ${r.name}: ${r.nJumps} teleports in ${SECS}s, worst ${r.worst} u`);
  console.log(`     cliff cap: ${JSON.stringify(r.cap)}`);
  for (const j of r.jumps) console.log(`     f${j.f} moved ${j.step} u, index jumped ${j.idxJump}, lat ${j.lat} -> ${j.latAfter}, ${j.spd} km/h`);
}
await b.close();
