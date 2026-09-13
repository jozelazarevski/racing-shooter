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
  const out = {};
  for (const name of ['horizon-hills', 'horizon-peaks', 'massif', 'distant-stand']) {
    const o = t.group.children.find(c => c.name === name);
    if (!o) continue;
    const rows = [];
    const walk = (m) => {
      if (m.isInstancedMesh) {
        for (let i = 0; i < m.count; i++) {
          m.getMatrixAt(i, M); M.premultiply(m.matrixWorld); M.decompose(P, Q, S);
          rows.push({ x: Math.round(P.x), y: +P.y.toFixed(0), z: Math.round(P.z),
            rad: Math.round(Math.hypot(P.x, P.z)), sy: +S.y.toFixed(1), sx: +S.x.toFixed(1),
            geo: m.geometry.type, col: '#' + (Array.isArray(m.material)?m.material[0]:m.material).color.getHexString() });
        }
      } else if (m.isMesh) {
        m.getWorldPosition(P);
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        const bb = m.geometry.boundingBox;
        rows.push({ x: Math.round(P.x), y: +P.y.toFixed(0), z: Math.round(P.z),
          rad: Math.round(Math.hypot(P.x, P.z)), h: +((bb.max.y-bb.min.y)*m.scale.y).toFixed(0),
          w: +((bb.max.x-bb.min.x)*m.scale.x).toFixed(0),
          col: '#' + (Array.isArray(m.material)?m.material[0]:m.material).color?.getHexString() });
      }
      for (const c of m.children) walk(c);
    };
    walk(o);
    rows.sort((a, b) => a.rad - b.rad);
    out[name] = { n: rows.length, nearest: rows.slice(0, 8), farthest: rows.slice(-2) };
  }
  return out;
});
console.log(JSON.stringify(r, null, 1).slice(0, 4000));
await p.close(); await browser.close();
