/* PYRAMID HUNT — census every cone-ish/tetra-ish mesh in a live world.
 * For each mesh or instanced mesh whose geometry is small and pointy
 * (cone/tetra/low-poly spike), report: name-chain, geometry type, vertex
 * count, material color, instance count, height range, and 3 sample world
 * positions. Then screenshot the densest cluster from a car-height camera.
 *   node tools-scratch/pyramids.mjs [level]
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

const rows = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const out = [];
  const chain = (o) => { const n = []; for (let q = o; q && n.length < 4; q = q.parent) if (q.name) n.push(q.name); return n.join('<') || '(anon)'; };
  const M4c = t.group.matrixWorld.constructor, V3c = g.player.pos.constructor, Qc = t.group.quaternion.constructor;
  const M = new M4c(), P = new V3c(), Q = new Qc(), S = new V3c();
  t.group.updateMatrixWorld(true);
  t.group.traverse(o => {
    if (!o.isMesh) return;
    const geo = o.geometry; if (!geo) return;
    const pos = geo.attributes?.position; if (!pos) return;
    const isCone = geo.type === 'ConeGeometry' || geo.type === 'TetrahedronGeometry' ||
      (geo.type === 'CylinderGeometry' && geo.parameters?.radiusTop === 0);
    // also catch custom pointy geos: few verts, apex much narrower than base
    if (!isCone && pos.count > 200) return;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox, gh = bb.max.y - bb.min.y, gw = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
    if (!isCone && gh < 2) return;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    const col = mat?.color ? '#' + mat.color.getHexString() : '?';
    const rec = { chain: chain(o), geo: geo.type, verts: pos.count, col, gh: +gh.toFixed(1), gw: +gw.toFixed(1),
      inst: o.isInstancedMesh ? o.count : 1, samples: [] };
    if (o.isInstancedMesh) {
      const n = Math.min(o.count, 400);
      for (let i = 0; i < n; i++) {
        o.getMatrixAt(i, M); M.premultiply(o.matrixWorld); M.decompose(P, Q, S);
        if (rec.samples.length < 3 || i % 37 === 0 && rec.samples.length < 6)
          rec.samples.push([Math.round(P.x), Math.round(P.y), Math.round(P.z), +S.y.toFixed(1)]);
      }
    } else {
      o.getWorldPosition(P);
      rec.samples.push([Math.round(P.x), Math.round(P.y), Math.round(P.z), 1]);
    }
    out.push(rec);
  });
  return out;
});
for (const r of rows.sort((a, b) => b.inst - a.inst))
  console.log(`${r.inst}x  ${r.chain}  ${r.geo}(${r.verts}v)  ${r.col}  h${r.gh} w${r.gw}  @${JSON.stringify(r.samples.slice(0, 4))}`);
await p.close(); await browser.close();
