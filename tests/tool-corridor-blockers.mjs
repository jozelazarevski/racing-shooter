/* WHAT BLOCKS THE CAR AT A POINT ON THE ROAD — asked the RIGHT way round.
 *
 * `tool-corridor-solids.mjs` walks the collider list and, for each collider,
 * finds its nearest centreline station and gates it against THAT station's
 * height. That question can never find the interesting bug, because a collider
 * sitting on the lower leg of an overpass is perfectly legitimate against its
 * own leg — and the car it blocks is on the deck 12 u above.
 *
 * So: walk the ROAD, not the colliders. At every station, at lateral offsets
 * across the drivable width, evaluate the vehicle's own collision predicates
 * at the road surface height and record what bites. Then ask of each hit
 * whether the thing that bit belongs to this piece of road at all.
 *
 * The predicates are copied verbatim from `Car.step` (src/vehicles.js), which
 * is the point — a paraphrase would measure a different game:
 *
 *   solids    rr = r + 1.8;  h defined -> [y-3, y+h];  y defined -> +-6;
 *                            y UNDEFINED -> every altitude
 *   obstacles rr = r + 2.5;  NO HEIGHT GATE AT ALL
 *   barriers  segment, R = 1.7, [y - 1.2, y + h + 1.0] unless `over`
 *
 * A diagnostic, not a gate.
 */
import { chromium } from 'playwright-core';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(900000);
await page.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player);

const rows = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  for (const L of LEVELS) {
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch { continue; }
    const t = g.track, N = t.N;
    const solids = (t.solids ?? []).filter((s) => s.x < 9e5);
    const obs = t.obstacles ?? [];
    const bars = t.barriers ?? [];
    const hits = [];

    for (let i = 0; i < N; i++) {
      const c = t.center[i], nrm = t.nrm[i];
      const half = (t.widthAt?.(i) ?? 7);
      for (let k = -2; k <= 2; k++) {
        const off = (k / 2) * half * 0.8;
        const px = c.x + nrm.x * off, pz = c.z + nrm.z * off, py = c.y;

        for (const s of solids) {
          // taper, matching Car.step: a cone is narrower at the top
          let rr = s.r + 1.8;
          if (s.prof && s.h) {
            const f = (py - s.y) / s.h;
            if (f > 0) rr = s.r * s.prof[Math.min(s.prof.length - 1,
              Math.max(0, Math.floor(f * s.prof.length)))] + 1.8;
          }
          const dx = px - s.x, dz = pz - s.z;
          if (dx * dx + dz * dz >= rr * rr) continue;
          if (s.y !== undefined) {
            if (s.h !== undefined) { if (py > s.y + s.h) continue; } // matches the no-underside solids gate
            else if (Math.abs(py - s.y) > 6) continue;
          }
          hits.push({ kind: 'solid', mat: s.mat, r: +s.r.toFixed(1),
            noY: s.y === undefined, h: s.h, sy: s.y, i, off: +off.toFixed(1),
            py: +py.toFixed(1), x: +s.x.toFixed(0), z: +s.z.toFixed(0) });
        }
        for (const o of obs) {
          const rr = o.r + 2.5;
          const dx = px - o.x, dz = pz - o.z;
          if (dx * dx + dz * dz >= rr * rr) continue;
          hits.push({ kind: 'obstacle', r: +o.r.toFixed(1), sy: o.y, i,
            off: +off.toFixed(1), py: +py.toFixed(1),
            dy: o.y === undefined ? null : +(py - o.y).toFixed(1),
            x: +o.x.toFixed(0), z: +o.z.toFixed(0) });
        }
        for (const q of bars) {
          if (q.over && py < q.y - 1.2) continue;
          if (py > q.y + q.h + 1.0 || py < q.y - 1.2) continue;
          const ax = q.x1 ?? q.x, az = q.z1 ?? q.z;
          const bx = q.x2 ?? q.x, bz = q.z2 ?? q.z;
          const vx = bx - ax, vz = bz - az;
          const L2 = vx * vx + vz * vz;
          const tt = L2 > 1e-6
            ? Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / L2)) : 0;
          const cx = ax + vx * tt, cz = az + vz * tt;
          const rr = (q.hw ?? 0.6) + 1.7;
          const dx = px - cx, dz = pz - cz;
          if (dx * dx + dz * dz >= rr * rr) continue;
          hits.push({ kind: 'barrier', i, off: +off.toFixed(1), py: +py.toFixed(1),
            sy: +q.y.toFixed(1), h: +q.h.toFixed(1),
            x: +cx.toFixed(0), z: +cz.toFixed(0) });
        }
      }
    }

    // Which stations does the blocker's own footprint sit nearest to? A hit
    // whose blocker belongs to a DIFFERENT part of the lap, vertically
    // separated from the road it is blocking, is the invisible-wall shape.
    const nearest = (x, z) => {
      let bi = -1, bd = Infinity;
      for (let j = 0; j < N; j++) {
        const dx = x - t.center[j].x, dz = z - t.center[j].z;
        const d = dx * dx + dz * dz;
        if (d < bd) { bd = d; bi = j; }
      }
      return bi;
    };
    const foreign = [];
    const seen = new Set();
    for (const h of hits) {
      const key = `${h.kind}:${h.x},${h.z}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const own = nearest(h.x, h.z);
      const lapD = Math.min(Math.abs(own - h.i), N - Math.abs(own - h.i));
      const vsep = +(h.py - t.center[own].y).toFixed(1);
      if (lapD > 25 && Math.abs(vsep) > 4) foreign.push({ ...h, own, lapD, vsep });
    }

    out.push({ id: L.id, name: L.name,
      stations: N, hits: hits.length, distinct: seen.size,
      noYsolids: solids.filter((s) => s.y === undefined).length,
      obsHits: hits.filter((h) => h.kind === 'obstacle').length,
      foreign: foreign.sort((a, c) => Math.abs(c.vsep) - Math.abs(a.vsep)).slice(0, 4) });
  }
  return out;
});

console.log('world                    N  hits  distinct  noY-solids  obs-hits  FOREIGN');
for (const r of rows) {
  console.log(` ${String(r.id).padStart(3)} ${r.name.padEnd(20)} ${String(r.stations).padStart(4)} `
    + `${String(r.hits).padStart(5)} ${String(r.distinct).padStart(8)} `
    + `${String(r.noYsolids).padStart(10)} ${String(r.obsHits).padStart(9)}  `
    + (r.foreign.length ? JSON.stringify(r.foreign) : '—'));
}
const withForeign = rows.filter((r) => r.foreign.length);
console.log(`\n${withForeign.length}/${rows.length} worlds have a blocker from a vertically separated part of the lap`);
console.log(`${rows.filter((r) => r.noYsolids).length} worlds carry solids with no y (solid at every altitude)`);
await b.close();
