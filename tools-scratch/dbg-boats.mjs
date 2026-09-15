/* E-32: "Add boats on the water".
 *
 * Boats are NOT a missing feature -- _buildMarina() and a moored sail flotilla
 * both exist. So do not count what the code contains; count what stands in the
 * world and how far it is from the racing line, which is the thing the owner
 * can actually see. track.js:10824 already records this exact class once:
 * HARBOR QUAY built its marina 63 u away at closest, median 314 -- "built
 * correctly, out where nobody drives".
 *
 * ASK THE SCENE, NOT THE SOURCE (K-22). Walk the object graph for anything
 * whose name or geometry says boat, count INSTANCES not meshes, and measure
 * every one against the lap.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVELS = (process.env.LEVELS ?? '58,57,61,16,59,60').split(',');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

for (const L of LEVELS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  p.setDefaultTimeout(300000);
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  await p.goto(`${BASE}/?level=${L}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => window.__game?.track?.center?.length, undefined, { timeout: 300000 });
  const R = await p.evaluate(() => {
    const g = window.__game, t = g.track, C = t.center, N = C.length;
    const distToLap = (x, z) => {
      let best = Infinity;
      for (let i = 0; i < N; i++) {
        const dx = x - C[i].x, dz = z - C[i].z;
        const d = dx * dx + dz * dz;
        if (d < best) best = d;
      }
      return Math.sqrt(best);
    };
    const hits = [];
    const seen = new Set();
    // THREE is NOT a global in this build -- the probe asked for it and got a
    // ReferenceError. Read the matrices directly instead: three stores them
    // column-major, so translation is elements 12/13/14, and a world transform
    // is that vector through the parent's matrixWorld.
    const xform = (e, x, y, z) => ({
      x: e[0]*x + e[4]*y + e[8]*z + e[12],
      y: e[1]*x + e[5]*y + e[9]*z + e[13],
      z: e[2]*x + e[6]*y + e[10]*z + e[14] });
    g.scene.traverse((o) => {
      const nm = (o.name || '') + ' ' + (o.geometry?.name || '') + ' ' + (o.material?.name || '');
      if (!/boat|sail|hull|mast|pontoon|marina|quay|jetty|dinghy|yacht/i.test(nm)) return;
      if (seen.has(o.uuid)) return;
      seen.add(o.uuid);
      if (o.isInstancedMesh) {
        const a = o.instanceMatrix.array, W = o.matrixWorld.elements;
        for (let i = 0; i < o.count; i++) {
          const b = i * 16;
          const w = xform(W, a[b + 12], a[b + 13], a[b + 14]);
          hits.push({ n: o.name || o.geometry?.name || '?', ...w, inst: true });
        }
      } else if (o.isMesh) {
        const W = o.matrixWorld.elements;
        hits.push({ n: o.name || o.geometry?.name || '?', x: W[12], y: W[13], z: W[14], inst: false });
      }
    });
    const rows = hits.map((h) => ({ ...h, d: distToLap(h.x, h.z) }));
    rows.sort((a, b) => a.d - b.d);
    // what the track itself thinks it has
    const flags = { quay: !!t.T?.quay, sea: !!(t.T?.sea || t.seaY !== undefined),
      seaY: t.seaY ?? t.T?.seaY ?? null,
      marinaFn: typeof t._buildMarina === 'function', boatHullFn: typeof t._boatHull === 'function' };
    const byName = {};
    for (const r of rows) byName[r.n] = (byName[r.n] ?? 0) + 1;
    return { world: g.level?.name, flags, total: rows.length, byName,
      nearest: rows.slice(0, 6).map((r) => [r.n, Math.round(r.d)]),
      within80: rows.filter((r) => r.d <= 80).length,
      within200: rows.filter((r) => r.d <= 200).length,
      median: rows.length ? Math.round(rows[rows.length >> 1].d) : null };
  });
  console.log(`\n${R.world}  boats/marina parts found: ${R.total}   flags ${JSON.stringify(R.flags)}`);
  console.log(`   by name: ${JSON.stringify(R.byName)}`);
  console.log(`   within 80 u of the lap: ${R.within80}    within 200 u: ${R.within200}    median dist ${R.median}`);
  console.log(`   nearest: ${JSON.stringify(R.nearest)}`);
  if (errs.length) console.log('   PAGE ERRORS:', errs.slice(0, 2));
  await p.close();
}
await browser.close();
