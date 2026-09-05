/* GUARD RAILS ON THE FALLING EDGE.
 *
 * A rail that is drawn but not solid is worse than no rail: it promises the
 * car will be held and then lets it through. The r131 guard fence is exactly
 * that — it registers in `banners` (breakable scenery), not `barriers` — so
 * every check here asks the CAR, not the geometry.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const WORLDS = [[1, 'PINE VALLEY'], [6, 'SUMMIT CLIMB'], [3, 'FROST PEAK'], [12, 'REDWOOD RAMPAGE']];

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

for (const [lv, name] of WORLDS) {
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  page.setDefaultTimeout(600000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  await page.goto(`${BASE}/?level=${lv}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });

  const R = await page.evaluate(async () => {
    const g = window.__game, t = g.track;
    const out = { rails: t._edgeRailCount || 0 };

    // the mesh is there and it is one draw call
    let meshes = 0, tris = 0;
    t.group.traverse((o) => {
      if (o.name === 'edge-rail') {
        meshes++;
        const idx = o.geometry.index;
        tris += ((idx ? idx.count : o.geometry.attributes.position.count) / 3) * o.count;
      }
    });
    out.meshes = meshes;
    out.tris = Math.round(tris);

    // ---- CLEARANCE: no rail may stand on the carriageway ------------------
    // Builders that run AFTER _buildEdgeRails push barriers of their own, so
    // the tail of the list is not the rails — filter on the tag instead.
    const rails = t.barriers.filter((b) => b.kind === 'edgeRail');
    out.tagged = rails.length;
    let worstIn = 0;
    for (const b of rails) {
      for (const [x, z] of [[b.x1, b.z1], [b.x2, b.z2],
        [(b.x1 + b.x2) / 2, (b.z1 + b.z2) / 2]]) {
        const v = new (window.THREE_V3 || Object)();
        const i = t.nearestIndex({ x, y: 0, z, isVector3: true });
        const half = t.widthAt ? t.widthAt(i) : 9;
        const lat = Math.abs(t.lateralOffset({ x, y: 0, z }, i));
        if (half - lat > worstIn) worstIn = half - lat;
      }
    }
    out.worstIntrusion = +worstIn.toFixed(2);

    // ---- SOLIDITY: drive at a rail and see if the car gets past it --------
    // Aim the car straight off the road at a rail bay and floor it.
    const p = g.player;
    let held = 0, tried = 0, through = 0;
    for (let k = 0; k < rails.length && tried < 8; k += Math.max(1, rails.length >> 3)) {
      const b = rails[k];
      const mx = (b.x1 + b.x2) / 2, mz = (b.z1 + b.z2) / 2;
      const i = t.nearestIndex({ x: mx, y: 0, z: mz, isVector3: true });
      const lat0 = t.lateralOffset({ x: mx, y: 0, z: mz }, i);
      const side = Math.sign(lat0) || 1;
      // start on the road, pointed at the rail
      const start = t.pointAt(i, (Math.abs(lat0) - 6) * side);
      tried++;
      p.pos.set(start.x, t.groundHeightAtPos(start, i, (Math.abs(lat0) - 6) * side), start.z);
      p.y = p.pos.y;
      p.trackIndex = i;
      const nx = (mx - start.x), nz = (mz - start.z);
      const nl = Math.hypot(nx, nz) || 1;
      p.vel.set((nx / nl) * 26, 0, (nz / nl) * 26);
      p.heading = Math.atan2(nx / nl, nz / nl);
      p.speed = 26;
      for (let f = 0; f < 90; f++) p.update(1 / 60, { throttle: 1, brake: 0, steer: 0 }, g);
      const endLat = Math.abs(t.lateralOffset(p.pos, t.nearestIndex(p.pos)));
      // past the rail line means it went through
      if (endLat > Math.abs(lat0) + 1.6) through++; else held++;
    }
    out.tried = tried; out.held = held; out.through = through;
    return out;
  });

  console.log(`\n--- ${name}: ${R.rails} rail bays, ${R.tris} tris ---`);
  ok(R.rails > 0, `${name}: the falling edge gets a rail`, R.rails);
  ok(R.meshes === 1, `${name}: one mesh, one draw call`, R.meshes);
  ok(R.tris < 26000, `${name}: within the triangle budget`, R.tris);
  ok(R.worstIntrusion <= 0.05,
    `${name}: no rail stands on the carriageway`, `${R.worstIntrusion} u inside`);
  ok(R.tried > 0 && R.through === 0,
    `${name}: the car is HELD by the rail, not passed through it`,
    `${R.held} held / ${R.through} through of ${R.tried}`);
  ok(errors.length === 0, `${name}: no page errors`, errors.slice(0, 2).join(' | '));
  await page.close();
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
