/* PICTURES OF THE RIVER — framed from the river, not from a guess.
 *
 * Picks its own viewpoints out of the water mesh: a FALL (the biggest level
 * change in the ribbon, which is the thing the level-reach/vertical-drop work
 * was for), a CROSSING (where the reach meets the road — the culvert or the
 * ford, which is what r219 changed), and a REACH out in open country. The
 * camera stands off to the side of the water and slightly above it, because a
 * river photographed from directly overhead is a blue line.
 *
 * Pixels are grabbed in the SAME TICK (hillshot.mjs's rule).
 */
import { chromium } from 'playwright-core';
import { promises as fs } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const DIR = process.env.DIR ?? '/tmp';
const W = +(process.env.W ?? 900), H = +(process.env.H ?? 560);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
p.setDefaultTimeout(900000);
for (const spec of (process.env.SHOTS ?? '1:fall,12:cross,25:cross').split(',')) {
  const [id, kind] = spec.split(':');
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
  const ok = await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 })
    .then(() => 1).catch(() => 0);
  if (!ok) { console.log(`level ${id}: did not build`); continue; }
  const r = await p.evaluate(async (kind) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track, R = t._river;
    if (!R?.line) return { none: true, name: g.level?.name };
    // the water's own surface, station by station, from the built mesh
    let mesh = null;
    t.group.traverse((o) => { if (/river-water/i.test(o.name || '') && o.geometry) mesh = o; });
    if (!mesh) return { none: true, name: g.level?.name };
    const pos = mesh.geometry.attributes.position;
    const V = new THREE.Vector3();
    // centre-line height per row, and where the biggest drop is
    const rows = [];
    const C = 7;                                   // columns per station in the strip
    for (let i = 0; i < pos.count; i += C) {
      V.fromBufferAttribute(pos, i + Math.floor(C / 2)); mesh.localToWorld(V);
      if (Math.hypot(V.x, V.z) > 1400) continue;   // the tails run past the world
      rows.push({ x: V.x, y: V.y, z: V.z, d: t._distToTrackCoarse(V.x, V.z) });
    }
    if (rows.length < 4) return { none: true, name: g.level?.name };
    let pick = rows[Math.floor(rows.length / 2)];
    if (kind === 'fall') {
      let best = 0;
      for (let k = 1; k < rows.length; k++) {
        const drop = Math.abs(rows[k - 1].y - rows[k].y);
        if (drop > best) { best = drop; pick = rows[k]; }
      }
      pick.note = `fall of ${best.toFixed(1)} u`;
    } else if (kind === 'cross') {
      let best = Infinity;
      for (const q of rows) if (q.d < best) { best = q.d; pick = q; }
      pick.note = `crossing, ${best.toFixed(1)} u from the road`;
    } else {
      let best = 0;
      for (const q of rows) if (q.d > best && q.d < 300) { best = q.d; pick = q; }
      pick.note = `open reach, ${best.toFixed(1)} u from the road`;
    }
    // stand off to the side, above the water, looking down the valley
    const near = R.line.reduce((bst, q, k) => {
      const dd = Math.hypot(q.x - pick.x, q.z - pick.z);
      return dd < bst.dd ? { k, dd } : bst;
    }, { k: 0, dd: Infinity }).k;
    const a = R.line[Math.max(0, near - 2)], c2 = R.line[Math.min(R.line.length - 1, near + 2)];
    let tx = c2.x - a.x, tz = c2.z - a.z;
    const m = Math.hypot(tx, tz) || 1; tx /= m; tz /= m;
    const nx = tz, nz = -tx;                       // the water's own normal
    const OFF = 34, UP = 16, BACK = 26;
    const ex = pick.x + nx * OFF - tx * BACK;
    const ez = pick.z + nz * OFF - tz * BACK;
    const ey = Math.max(t.terrainHeight(ex, ez), pick.y) + UP;
    g.camera.near = 0.5; g.camera.fov = 55; g.camera.updateProjectionMatrix();
    g.camera.position.set(ex, ey, ez);
    g.camera.lookAt(pick.x, pick.y + 1.5, pick.z);
    g.renderer.render(g.scene, g.camera);
    return { name: g.level?.name, note: pick.note,
      at: `${Math.round(pick.x)},${Math.round(pick.z)}`,
      png: g.renderer.domElement.toDataURL('image/png') };
  }, kind);
  if (r.none) { console.log(`${r.name}: no river mesh`); continue; }
  const f = `${DIR}/river-${String(r.name).replace(/[^A-Z]/g, '')}-${kind}.png`;
  await fs.writeFile(f, Buffer.from(r.png.split(',')[1], 'base64'));
  console.log(`${String(r.name).padEnd(18)} ${kind.padEnd(6)} ${r.note.padEnd(34)} @${r.at}  -> ${f}`);
}
await b.close();
