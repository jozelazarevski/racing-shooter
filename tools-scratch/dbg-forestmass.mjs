/* THE FOREST AS A MASS (owner, three times: "Car should not drive between the
 * trees" / "Rule: I can't drive through a tree" / "Should not be able to drive
 * in the trees").
 *
 * Measures, per world:
 *   - how many carpet trees carry colliders (camTrees) and how far out they go
 *   - whether a car driven straight off the road into the wood is STOPPED, and
 *     at what depth, at three distances out: the verge belt (0-38 u), the mid
 *     belt (38-160 u) and beyond
 *   - whether any registered tree is invisible (culled mesh, live collider)
 *
 * Run against HEAD before and after registering the mid ring. */
import { chromium } from 'playwright-core';
const LEVELS = process.env.LEVELS ? process.env.LEVELS.split(',').map(Number) : [0, 21, 41];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);
for (const L of LEVELS) {
  await p.goto(`http://localhost:8901/?level=${L}&go=1&unlockall=1`,
    { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  const r = await p.evaluate(async () => {
    const g = window.__game, t = g.track, pl = g.player;
    if (g.composer) g.composer.render = () => {};
    let el = g.clock.elapsedTime;
    g.clock = { getDelta: () => { el += 1 / 60; return 1 / 60; }, get elapsedTime() { return el; } };
    for (let f = 0; f < 120 && g.state !== 'race'; f++) { g.countdown = 0.01; g._frameBody(); }

    // ---- registry census
    const cam = t.camTrees ?? [];
    const lat = [];
    for (const c of cam) {
      const s = t._nearestSample(c.x, c.z);
      lat.push(s.d - t.widthAt(s.i));
    }
    lat.sort((a, b) => a - b);
    const pct = (q) => (lat.length ? +lat[Math.min(lat.length - 1, (lat.length * q) | 0)].toFixed(1) : null);

    // ---- invisible colliders: a registered tree whose instance is culled
    // THREE is a module import, not a global, so read the instance matrix's
    // raw array instead of borrowing a Matrix4: element 0 of each 16-float
    // block is the x scale, and the cull idiom scales to 0.0001.
    let ghosts = 0;
    for (const c of cam) {
      const mesh = c.meshes && c.meshes[0];
      if (!mesh || c.idx == null || !mesh.instanceMatrix) continue;
      if (mesh.instanceMatrix.array[c.idx * 16] < 0.01) ghosts++;
    }

    // ---- drive off the road into the wood, from a station with trees out there
    const runs = [];
    for (const target of [20, 70, 140]) {
      // find a station whose side carries a registered tree near `target` out
      let best = null;
      for (let k = 0; k < 400 && !best; k++) {
        const i = ((Math.random() * t.center.length) | 0);
        const c = t.center[i], n = t.nrm[i];
        for (const side of [1, -1]) {
          const px = c.x + n.x * (t.widthAt(i) + target) * side;
          const pz = c.z + n.z * (t.widthAt(i) + target) * side;
          const near = t.camTreesNear ? t.camTreesNear(px, pz) : [];
          let close = 0;
          for (const q of near) {
            const dx = q.x - px, dz = q.z - pz;
            if (dx * dx + dz * dz < 400) close++;
          }
          if (close >= 3) { best = { i, side }; break; }
        }
      }
      if (!best) { runs.push({ target, found: false }); continue; }
      const { i, side } = best;
      const c = t.center[i], n = t.nrm[i];
      pl.placeAt(i, 0);
      // point the car straight off the road on that side and drive
      pl.heading = Math.atan2(n.x * side, n.z * side);
      const x0 = pl.pos.x, z0 = pl.pos.z;
      let maxDepth = 0, stoppedAt = null;
      for (let f = 0; f < 600; f++) {
        g.input = { throttle: 1, brake: 0, steer: 0, drift: false, hold: false };
        pl.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
        const d = Math.hypot(pl.pos.x - x0, pl.pos.z - z0);
        if (d > maxDepth) maxDepth = d;
        const kmh = Math.hypot(pl.vel.x, pl.vel.z) * 3.6;
        if (f > 120 && kmh < 6 && stoppedAt === null) { stoppedAt = +d.toFixed(1); break; }
      }
      runs.push({ target, found: true, depthM: +maxDepth.toFixed(1), stoppedAt });
    }
    return { world: g.level?.name, camTrees: cam.length, ghosts,
      lateralP50: pct(0.5), lateralP95: pct(0.95), lateralMax: pct(0.999), runs };
  });
  console.log(`${(r.world ?? '?').padEnd(20)} camTrees ${String(r.camTrees).padStart(6)}  ghosts ${r.ghosts}  lateral p50/p95/max ${r.lateralP50}/${r.lateralP95}/${r.lateralMax} u`);
  for (const q of r.runs) {
    console.log(`   drive-in at ${String(q.target).padStart(3)} u out: `
      + (q.found ? `travelled ${q.depthM} m, ${q.stoppedAt !== null ? 'STOPPED at ' + q.stoppedAt + ' m' : 'never stopped'}`
        : 'no registered stand found there'));
  }
}
await browser.close();
