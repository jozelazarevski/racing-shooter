/* Where is the glacier on this world, and do its slabs touch the ground?
 * Reports every named child of t.group with bbox size+centre, then details
 * the 'glacier' object: instance positions, scale, and the gap between each
 * slab's base and terrainHeight under it. Screenshots the slab field.
 *   node tools-scratch/glacierlook.mjs [level] [shotX shotZ]
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LVL = process.argv[2] ?? '19';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 900, height: 620 } });
p.on('pageerror', e => console.log('pageerr:', e.message.slice(0, 120)));
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const M4c = t.group.matrixWorld.constructor, V3c = g.player.pos.constructor, Qc = t.group.quaternion.constructor;
  const M = new M4c(), P = new V3c(), Q = new Qc(), S = new V3c();
  t.group.updateMatrixWorld(true);
  const named = [];
  const glaciers = [];
  t.group.traverse(o => {
    if (o.name === 'glacier' || /glacier|ice|serac/i.test(o.name)) glaciers.push(o);
    if (o.name && o.parent === t.group) named.push(o.name);
  });
  const out = { named: [...new Set(named)], glacier: [] };
  for (const o of glaciers) {
    const rec = { name: o.name, type: o.type, inst: o.isInstancedMesh ? o.count : 1, slabs: [] };
    if (o.isInstancedMesh) {
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, M); M.premultiply(o.matrixWorld); M.decompose(P, Q, S);
        const th = t.terrainHeight(P.x, P.z);
        rec.slabs.push({ x: Math.round(P.x), y: +P.y.toFixed(1), z: Math.round(P.z),
          sy: +S.y.toFixed(1), ground: +th.toFixed(1), gap: +(P.y - th).toFixed(1) });
      }
    } else { o.getWorldPosition(P); rec.slabs.push({ x: Math.round(P.x), y: +P.y.toFixed(1), z: Math.round(P.z) }); }
    out.glacier.push(rec);
  }
  return out;
});
console.log('top-level named:', r.named.join(', '));
for (const gl of r.glacier) {
  console.log(`\n${gl.name} (${gl.type}) x${gl.inst}`);
  for (const s of gl.slabs.slice(0, 40)) console.log('  ', JSON.stringify(s));
}
// screenshot: stand the camera near the first slab cluster, looking at it
const sx = process.argv[3], sz = process.argv[4];
const spot = sx !== undefined ? { x: +sx, z: +sz }
  : r.glacier[0]?.slabs[0] ? { x: r.glacier[0].slabs[0].x, z: r.glacier[0].slabs[0].z } : null;
if (spot) {
  await p.evaluate(({ x, z }) => {
    const g = window.__game, t = g.track;
    const d = Math.hypot(x, z) || 1;
    // stand 120 u closer to the origin than the cluster, look outward at it
    const cx = x - x / d * 120, cz = z - z / d * 120;
    const cy = t.terrainHeight(cx, cz) + 4;
    g.camera.position.set(cx, cy, cz);
    g.camera.lookAt(x, t.terrainHeight(x, z) + 6, z);
    g.camera.updateProjectionMatrix();
    g.renderer.render(g.scene, g.camera);
  }, spot);
  await p.screenshot({ path: 'tools-scratch/shot-glacier.png' });
  console.log('\nshot: tools-scratch/shot-glacier.png  at', JSON.stringify(spot));
}
await p.close(); await browser.close();
