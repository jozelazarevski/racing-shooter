/* THE WHITE SLIVERS — static audit (owner: "white horizontal lines" on
 * SERPENT PASS, "remove the white triangle" on HIGHCROWN PEAK; the enlarged
 * crops show one defect at two angles).
 *
 * A long pointed sliver that sweeps the frame is what you get when an
 * indexed triangle reaches from real geometry to a vertex that was never
 * written. A Float32Array allocated bigger than the data put in it leaves
 * trailing (0,0,0) in LOCAL space, so every such triangle converges on the
 * mesh's own origin — which is exactly how the streaks converge.
 *
 * This needs no render: walk every geometry in every world and report any
 * that (a) carries vertices at exact local (0,0,0) while its extent is
 * large, or (b) carries a non-finite vertex, or (c) has an index that
 * points past the vertices actually written. Also lists curtain-class
 * bodies (big, fog:false, BackSide) for the fog-curtain audit. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(1800000);
await p.goto('http://localhost:8901/?level=1&go=1&unlockall=1',
  { waitUntil: 'load', timeout: 1800000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 1800000 });
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const r = await p.evaluate(async (only) => {
  const g = window.__game; const { LEVELS } = await import('./src/track.js');
  const out = [], curtains = [];
  const chain = (o) => { const a = []; let q = o; while (q) { if (q.name) a.push(q.name); q = q.parent; } return a.join('<'); };
  for (const L of LEVELS) {
    if (only && !only.includes(L.name)) continue;
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch (e) { continue; }
    const hits = [];
    g.scene.traverse((o) => {
      const geo = o.geometry; const pos = geo?.attributes?.position;
      if (!pos || !o.visible) return;
      let zeros = 0, nonFinite = 0;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity,
        minZ = Infinity, maxZ = -Infinity;
      for (let k = 0; k < pos.count; k++) {
        const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) { nonFinite++; continue; }
        if (x === 0 && y === 0 && z === 0) zeros++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      }
      const ext = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
      // an index pointing past what was written is the same bug, stated directly
      let idxMax = -1;
      if (geo.index) { const a = geo.index.array; for (let k = 0; k < a.length; k++) if (a[k] > idxMax) idxMax = a[k]; }
      const overIndex = idxMax >= pos.count;
      // a legitimately origin-centred small part is fine; a BIG geometry with
      // origin vertices is the sliver signature
      if (nonFinite || overIndex || (zeros > 0 && ext > 12)) {
        hits.push({ name: chain(o) || `(${o.type})`, verts: pos.count, zeros, nonFinite,
          overIndex, ext: +ext.toFixed(1),
          mat: o.material?.type, inst: o.isInstancedMesh ? o.count : undefined });
      }
      // curtain class: large, fog-exempt, inward-facing
      const m = o.material;
      if (m && m.fog === false && ext > 400 && (m.side === 1 || m.side === 2)) {
        curtains.push({ world: L.name, name: chain(o) || `(${o.type})`, ext: +ext.toFixed(0),
          opacity: m.opacity, transparent: !!m.transparent });
      }
    });
    if (hits.length) out.push({ world: L.name, theme: L.theme, hits: hits.slice(0, 8),
      total: hits.length });
  }
  return { offenders: out, curtains };
}, only);
console.log(JSON.stringify(r, null, 1));
await browser.close();
