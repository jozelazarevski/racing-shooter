// Drive straight up a massif in roam and measure both sinks each step:
//   physSink = terrainHeight(pos) - car.y      (buried per the heightfield)
//   visSink  = raycast ground - car.y          (buried per the drawn world)
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LV = process.env.LV ?? '6';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
await p.goto(`${BASE}/?level=${LV}&mode=roam&go=1&unlockall=1`, { waitUntil:'load', timeout:120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:120000 });
const r = await p.evaluate(async () => {
  const g = window.__game, t = g.track, pl = g.player;
  const THREE = await import('three');
  g.clock.getDelta = () => 1 / 60;
  if (g.composer) g.composer.render = () => {};
  // find the tallest terrain within the roamable ring
  let peak = null;
  for (let a = 0; a < 96; a++) {
    for (let rr = 240; rr <= 1000; rr += 40) {
      const x = Math.cos(a / 96 * 2 * Math.PI) * rr, z = Math.sin(a / 96 * 2 * Math.PI) * rr;
      const h = t.terrainHeight(x, z);
      if (!peak || h > peak.h) peak = { x, z, h: +h.toFixed(1) };
    }
  }
  // start 180 u downhill of the peak, aim at it, climb
  const dx = peak.x, dz = peak.z, L = Math.hypot(dx, dz);
  const sx = peak.x - dx / L * 180, sz = peak.z - dz / L * 180;
  pl.pos.set(sx, t.terrainHeight(sx, sz) + 0.5, sz); pl.y = pl.pos.y;
  pl.trackIndex = t.nearestIndex(pl.pos);   // stale index reads as on-road at the wrong height
  pl.heading = Math.atan2(peak.x - sx, peak.z - sz);
  pl.vel.set(0, 0, 0); pl.vy = 0; pl.airborne = false; pl.alive = true;
  const ray = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  const isMine = (o) => { for (let q = o; q; q = q.parent) if (q === pl.mesh) return true; return false; };
  // meshes only — sprites/points in the scene blow up Raycaster
  const targets = [];
  g.scene.traverse((o) => { if (o.isMesh && !isMine(o) && o.visible) targets.push(o); });
  const trace = [];
  let worstPhys = 0, worstVis = 0;
  for (let k = 0; k < 900; k++) {          // 15 s of climb
    g.input.analog.throttle = 1; g.input.analog.steer = 0;
    // keep aiming at the peak
    const err = Math.atan2(peak.x - pl.pos.x, peak.z - pl.pos.z) - pl.heading;
    g.input.analog.steer = Math.max(-1, Math.min(1, ((err + Math.PI) % (2 * Math.PI) - Math.PI) * 1.5));
    g.frame();
    if (k % 30 === 0) {
      const gy = t.terrainHeight(pl.pos.x, pl.pos.z);
      const physSink = +(gy - pl.y).toFixed(2);
      ray.set(new THREE.Vector3(pl.pos.x, pl.y + 60, pl.pos.z), down);
      let hits = [];
      try { hits = ray.intersectObjects(targets, false); } catch { hits = []; }
      const vis = hits.length ? hits[0].point.y : null;
      const visSink = vis === null ? null : +(vis - pl.y).toFixed(2);
      const hitName = hits.length ? (hits[0].object.name || hits[0].object.parent?.name || hits[0].object.type) : null;
      // the three nearest solids, with the radius that bites at the car's height
      const solidsNear = (t.solids ?? []).map((s) => ({
        d: Math.hypot(s.x - pl.pos.x, s.z - pl.pos.z), s
      })).sort((a, z2) => a.d - z2.d).slice(0, 2).map((q) => {
        const ob = q.s;
        const f = ob.prof && ob.h ? (pl.y - ob.y) / ob.h : null;
        const kk = f === null ? null : Math.min(ob.prof.length - 1, Math.max(0, Math.floor(f * ob.prof.length)));
        const rAt = ob.prof && ob.h ? (f <= 0 ? ob.r : ob.r * ob.prof[kk]) : ob.r;
        return { d: +q.d.toFixed(0), r: +(ob.r ?? 0).toFixed(0), rAt: +(+rAt).toFixed(0), y: +(+ob.y).toFixed(0), h: ob.h ?? null, mat: ob.mat };
      });
      const d2 = 3;
      const hx2 = Math.sin(pl.heading), hz2 = Math.cos(pl.heading);
      const grade = +((t.terrainHeight(pl.pos.x + hx2 * d2, pl.pos.z + hz2 * d2) - t.terrainHeight(pl.pos.x - hx2 * d2, pl.pos.z - hz2 * d2)) / (2 * d2)).toFixed(2);
      trace.push({ s: k / 60, v: +pl.vel.length().toFixed(1), grade, physSink, visSink,
        y: +pl.y.toFixed(1), air: !!pl.airborne, hitName, solidsNear });
      if (physSink > worstPhys) worstPhys = physSink;
      if (visSink !== null && visSink > worstVis) worstVis = visSink;
    }
    if (Math.hypot(peak.x - pl.pos.x, peak.z - pl.pos.z) < 12) break;
  }
  return { world: g.level?.name, peak, worstPhys: +worstPhys.toFixed(2), worstVis: +worstVis.toFixed(2), trace };
});
console.log(r.world, 'peak', JSON.stringify(r.peak), ' worstPhysSink', r.worstPhys, ' worstVisSink', r.worstVis);
for (const q of r.trace) console.log('  ', JSON.stringify(q));
await b.close();
