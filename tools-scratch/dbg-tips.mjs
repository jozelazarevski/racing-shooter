/* Green-shard hypothesis: downslope tree TIPS piercing the road plane.
 * For every carpet instance and grove tree whose XZ lies inside the road
 * footprint (or within 1 u of its edge), does the trunk BASE sit below the
 * road while the TIP rises above it? */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const THREE = await import('/lib/three.module.min.js');
  const g = window.__game, t = g.track;
  const out = { carpet: 0, grove: 0, samples: [] };
  const roadAt = (x, z) => {
    const s = t._nearestSample(x, z);
    return { d: s.d, w: t.widthAt(s.i), y: t.center[s.i].y, i: s.i };
  };
  const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), s9 = new THREE.Vector3();
  t.group.traverse((o) => {
    if (!o.isInstancedMesh || o.name !== 'carpet-foliage') return;
    const bb = o.geometry.boundingBox ?? (o.geometry.computeBoundingBox(), o.geometry.boundingBox);
    for (let k = 0; k < o.count; k++) {
      o.getMatrixAt(k, m4);
      m4.decompose(v, q, s9);
      const rd = roadAt(v.x, v.z);
      if (rd.d > rd.w + 1.5) continue;
      const baseY = v.y + bb.min.y * s9.y, tipY = v.y + bb.max.y * s9.y;
      if (baseY < rd.y - 0.5 && tipY > rd.y + 0.2) {
        out.carpet++;
        if (out.samples.length < 8) out.samples.push({ cls: 'carpet',
          i: rd.i, d: +rd.d.toFixed(1), below: +(rd.y - baseY).toFixed(1),
          above: +(tipY - rd.y).toFixed(1) });
      }
    }
  });
  for (const tr of t.trees ?? []) {
    if (tr.culled) continue;
    const rd = roadAt(tr.x, tr.z);
    if (rd.d > rd.w + 1.5) continue;
    const tipY = tr.y + 7 * (tr.s ?? 1);
    if (tr.y < rd.y - 0.5 && tipY > rd.y + 0.2) out.grove++;
  }
  return { name: g.level?.name, ...out };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
