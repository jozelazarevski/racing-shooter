/* IS THE CAR EVER SUPPORTED ON TOP OF SOMETHING THAT IS NOT ROAD?
 *
 * "Wall needs to be removed. I can't be driving on it." No screenshot, so find
 * it by its signature instead of by guessing which wall: drive the world, and
 * flag any frame where the car is standing well ABOVE its own road while still
 * near it. A car on a hillside is far from the road; a car on top of a wall is
 * beside it and high.
 *
 * Then name the surface — raycast straight down from the car and report the
 * first mesh — so the answer is a builder, not "something".
 *
 * Driven with steering, not full-lock-straight, or the car leaves the course
 * in ten seconds and every reading afterwards is about a field.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '4').split(',').map(Number);
const SECS = Number(process.env.SECS ?? 70);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
for (const id of IDS) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`L${id}: never booted`); continue; }
  const r = await page.evaluate(async (secs) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track, p = g.player;
    g.clock.getDelta = () => 1 / 60;
    g._autoQuality = () => {};
    g.composer.render = () => {};
    const meshes = [];
    t.group.traverse((o) => { if (o.isMesh && o.visible && o.material) meshes.push(o); });
    const ray = new THREE.Raycaster(); ray.far = 60;
    const down = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
    const hits = [];
    for (let f = 0; f < secs * 60; f++) {
      // WANDER. Holding the racing line finds nothing, because a wall you can
      // drive on is not on the racing line — the report came from a driver who
      // went off it. Aim at a lateral offset that sweeps slowly across the
      // verge and back, so the car climbs whatever is beside the road.
      const want = Math.sin(f / 220) * 26;
      let d = t.headingAt(p.trackIndex) - p.heading;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      g.input.analog.throttle = 1;
      g.input.analog.steer = Math.max(-1, Math.min(1,
        d * 2.2 + (want - (p.lateral ?? 0)) * 0.05));
      g.frame();
      if (p.airborne) continue;
      const roadY = t.center[p.trackIndex].y;
      const over = p.pos.y - roadY;
      const lat = Math.abs(p.lateral ?? 0);
      if (over < 1.2 || lat > 60) continue;         // on the road, or off exploring
      from.set(p.pos.x, p.pos.y + 1.2, p.pos.z);
      ray.set(from, down);
      const x = ray.intersectObjects(meshes, false).find((h) => h.distance > 0.05);
      hits.push({ f, over: +over.toFixed(1), lat: +lat.toFixed(1), idx: p.trackIndex,
        on: x ? (x.object.name || x.object.geometry?.type || '?') : 'nothing',
        spd: +Math.hypot(p.vel.x, p.vel.z).toFixed(1) });
    }
    const by = {};
    for (const h of hits) by[h.on] = (by[h.on] ?? 0) + 1;
    return { name: g.level?.name, frames: secs * 60, hits: hits.length, by,
      worst: hits.sort((a, x) => x.over - a.over).slice(0, 3) };
  }, SECS);
  console.log(`L${String(id).padStart(2)} ${String(r.name).padEnd(22)} ${String(r.hits).padStart(5)}/${r.frames} frames standing >2.2 u over the road  ${JSON.stringify(r.by)}`);
  for (const w of r.worst) console.log(`      ${JSON.stringify(w)}`);
}
await b.close();
