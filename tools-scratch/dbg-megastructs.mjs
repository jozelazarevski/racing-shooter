/* MASTER §7.3 sweep: any single mesh with bbox > 40 u in a dimension within
 * 60 u of the road (background ridges exempt by name where obvious), plus
 * any MeshBasicMaterial (unlit) mesh near the road. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 61);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const THREE = await import('/lib/three.module.min.js');
  const g = window.__game, t = g.track;
  const distToRoad = (x, z) => {
    let d = 1e9;
    for (let i = 0; i < t.center.length; i += 4) {
      const c = t.center[i];
      d = Math.min(d, Math.hypot(x - c.x, z - c.z));
    }
    return d;
  };
  const offenders = [], unlit = [];
  const box = new THREE.Box3();
  t.group.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    box.setFromObject(o);
    if (box.isEmpty()) return;
    const sx = box.max.x - box.min.x, sy = box.max.y - box.min.y, sz = box.max.z - box.min.z;
    const cx = (box.max.x + box.min.x) / 2, cz = (box.max.z + box.min.z) / 2;
    const dim = Math.max(sx, sy, sz);
    if (dim > 40 && dim < 4000) {
      const d = distToRoad(cx, cz);
      if (d < 60) offenders.push({ name: o.name || o.parent?.name || '?',
        dim: +dim.toFixed(0), sy: +sy.toFixed(0), d: +d.toFixed(0),
        mat: o.material?.type, col: o.material?.color?.getHexString?.() });
    }
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (m && m.type === 'MeshBasicMaterial' && !m.transparent) {
        const d = distToRoad(cx, cz);
        const lum = m.color ? (0.2126 * m.color.r + 0.7152 * m.color.g + 0.0722 * m.color.b) : 1;
        if (d < 40 && lum < 0.08 && Math.max(sx, sy, sz) > 3)
          unlit.push({ name: o.name || o.parent?.name || '?',
            dim: +Math.max(sx, sy, sz).toFixed(0), d: +d.toFixed(0),
            col: m.color?.getHexString?.() });
      }
    }
  });
  return { offenders: offenders.slice(0, 20), unlitDark: unlit.slice(0, 20) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
