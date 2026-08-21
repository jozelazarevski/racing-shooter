/* UNCOMMANDED LAUNCHES OFF FLAT GROUND.
 * A launch caused by the trackIndex handing over to another stretch is
 * identifiable: the index moves several samples in the very frame the car
 * leaves the ground, and the car has not actually climbed anything. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const TAG = process.env.TAG ?? '';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
let tot = 0, idx = 0;
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 }).then(()=>1).catch(()=>0);
  if (!ok) { console.log(`SKIP ${id}`); continue; }
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length;
    g.clock.getDelta = () => 1 / 60;
      // AUTO-QUALITY OFF: it resizes the composer when it drops a tier, a
      // resize EMPTIES the canvas until the next render, and the stub below
      // swallows that render. Cost 52 blank frames of 432 in one sweep and
      // looked exactly like a severe rendering bug — see tour.mjs's note and
      // tools-scratch/resizeblank.mjs. The fps it measures is a number about
      // the harness anyway: these files step a fixed clock.
      g._autoQuality = () => {};
    if (g.composer) g.composer.render = () => {};
    const cars = [g.player, ...(g.enemies ?? [])];
    const prevAir = cars.map((c) => !!c.airborne);
    const prevTI = cars.map((c) => c.trackIndex);
    let launches = 0, idxLaunches = 0, worst = null;
    const p = g.player;
    for (let k = 0; k < 2400; k++) {           // 40 s
      const aim = t.center[(p.trackIndex + 8) % N];
      let want = Math.atan2(aim.x - p.pos.x, aim.z - p.pos.z) - p.heading;
      while (want > Math.PI) want -= 2 * Math.PI;
      while (want < -Math.PI) want += 2 * Math.PI;
      g.input.analog.throttle = 1;
      g.input.analog.steer = Math.max(-1, Math.min(1, want * 1.6));
      g.frame();
      cars.forEach((c, i) => {
        const air = !!c.airborne;
        const d = t._circDist(c.trackIndex, prevTI[i]);
        if (air && !prevAir[i]) {
          launches++;
          if (d > 3) {
            idxLaunches++;
            if (!worst || d > worst.d) worst = { d, i, ti: c.trackIndex, from: prevTI[i],
              vy: +(c.vy ?? 0).toFixed(1) };
          }
        }
        prevAir[i] = air; prevTI[i] = c.trackIndex;
      });
    }
    return { name: t.level?.name ?? '?', launches, idxLaunches, worst };
  });
  tot += r.launches; idx += r.idxLaunches;
  console.log(`${TAG} ${String(id).padStart(2)} ${r.name.padEnd(20)} ${String(r.launches).padStart(4)} launches   `
    + `${String(r.idxLaunches).padStart(3)} FROM AN INDEX HAND-OFF`
    + (r.worst ? `   worst: index ${r.worst.from}->${r.worst.ti} (${r.worst.d} samples), vy ${r.worst.vy}` : ''));
}
console.log(`\n===== ${idx} of ${tot} launches came from a track-index hand-off =====`);
await b.close();
