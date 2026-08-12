/* DOES THE GROUND YOU HIT MATCH THE GROUND YOU SEE?
 *
 * The terrain mesh and `terrainHeight()` are two descriptions of one surface,
 * clamped near the road by `_roadCeil`/`_roadFloor`. Where they disagree by
 * more than a wheel, the car climbs (or drops through) something that is not
 * drawn — an invisible step at the carriageway edge, which is one of the ways
 * "there is an invisible wall here" can be true with no collider involved.
 *
 * Findings at r158: three worlds carry a step over 1.5 u within 26 u of the
 * road — HEDGEROW DASH +1.6, OULTON PARK +1.6, SILVERSTONE +1.5, all at
 * d ~ 8.3, which is INSIDE the drivable half-width. Everywhere else agrees.
 *
 * Diagnostic, not a gate: the threshold below is a judgement about what a
 * driver would notice, not a spec.
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
    // the drawn terrain: find the big ground mesh and read its vertices
    let ground = null, best = 0;
    t.group.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh) return;
      const c = o.geometry?.attributes?.position?.count ?? 0;
      if (c > best) { best = c; ground = o; }
    });
    if (!ground) continue;
    const pos = ground.geometry.attributes.position;
    ground.updateWorldMatrix(true, false);
    const e = ground.matrixWorld.elements;
    let worst = 0, at = null, n = 0;
    for (let i = 0; i < pos.count; i += 3) {
      const lx = pos.getX(i), ly = pos.getY(i), lz = pos.getZ(i);
      // world position of this drawn vertex (affine, no rotation on terrain)
      const wx = e[0] * lx + e[4] * ly + e[8] * lz + e[12];
      const wy = e[1] * lx + e[5] * ly + e[9] * lz + e[13];
      const wz = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
      // only near the road, where a car can be
      const d = t._distToTrack ? t._distToTrack(wx, wz) : 999;
      if (d > 26) continue;
      const phys = t.terrainHeight(wx, wz);
      const diff = phys - wy;                  // >0 = physics ground ABOVE what you see
      n++;
      if (diff > worst) { worst = diff; at = { x: +wx.toFixed(0), z: +wz.toFixed(0), d: +d.toFixed(1),
        seen: +wy.toFixed(1), hit: +phys.toFixed(1) }; }
    }
    if (worst > 1.5) out.push({ id: L.id, name: L.name, worst: +worst.toFixed(1), n, at });
  }
  return out;
});
console.log(`${rows.length} worlds where the ground you HIT is >1.5u above the ground you SEE (within 26u of road):`);
for (const r of rows.sort((a, c) => c.worst - a.worst)) console.log(` ${String(r.id).padStart(3)} ${r.name.padEnd(20)} +${r.worst}u  ${JSON.stringify(r.at)}`);
await b.close();
