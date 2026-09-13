import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 620 } });
await p.goto(`${BASE}/?level=19&go=1&unlockall=1`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const M4c = t.group.matrixWorld.constructor, V3c = g.player.pos.constructor, Qc = t.group.quaternion.constructor;
  const M = new M4c(), P = new V3c(), Q = new Qc(), S = new V3c();
  t.group.updateMatrixWorld(true);
  const o = t.group.children.find(c => c.name === 'distant-stand');
  const meshes = [];
  o.traverse(m => { if (m.isMesh) meshes.push(m); });
  const out = [];
  for (const m of meshes) {
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    const rec = { geo: m.geometry.type, col: '#' + mat.color.getHexString(),
      inst: m.isInstancedMesh ? m.count : 1, near: [] };
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox;
    rec.gh = +(bb.max.y - bb.min.y).toFixed(1); rec.gw = +(bb.max.x - bb.min.x).toFixed(1);
    if (m.isInstancedMesh) {
      const rows = [];
      for (let i = 0; i < m.count; i++) {
        m.getMatrixAt(i, M); M.premultiply(m.matrixWorld); M.decompose(P, Q, S);
        rows.push({ x: Math.round(P.x), y: +P.y.toFixed(0), z: Math.round(P.z),
          rad: Math.round(Math.hypot(P.x, P.z)), sy: +S.y.toFixed(1) });
      }
      rows.sort((a, b) => a.rad - b.rad);
      rec.near = rows.slice(0, 4); rec.minRad = rows[0].rad; rec.maxRad = rows[rows.length - 1].rad;
    }
    out.push(rec);
  }
  return out;
});
for (const rec of r) console.log(JSON.stringify(rec));
await p.close(); await browser.close();
