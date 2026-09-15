/* HRD-7 census (owner 2026-09-09, CLIFF KNOT: "Fix all trees that are in the
 * house"). Per world, every plant whose trunk stands inside a structure
 * footprint — the shootable `buildings` and the mat:'hut' solids that carry
 * the facades — across all three plant registries: the solid stand, the
 * instanced forest carpet, and the ground cover. */
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
  const THREE = await import('three');
  const out = [];
  for (const L of LEVELS) {
    if (only && !only.includes(L.name)) continue;
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch (e) { out.push({ world: L.name, err: String(e).slice(0, 90) }); continue; }
    const t = g.track;
    // every structure footprint, from both registries
    const S = [];
    for (const b of (t.buildings ?? [])) {
      S.push({ x: b.x, z: b.z, r: Math.max(b.r ?? 0, (b.w ?? 0) * 0.5), src: 'building' });
    }
    for (const so of (t.solids ?? [])) {
      if (so.mat === 'hut') S.push({ x: so.x, z: so.z, r: so.r ?? 2, src: 'hut' });
    }
    // 24 u cell hash so 80k instances do not walk 300 structures each
    const CELL = 24, grid = new Map();
    for (const s of S) {
      const rr = Math.ceil(s.r / CELL);
      const cx = Math.floor(s.x / CELL), cz = Math.floor(s.z / CELL);
      for (let a = -rr; a <= rr; a++) for (let b2 = -rr; b2 <= rr; b2++) {
        const k = (cx + a) + ':' + (cz + b2);
        let cell = grid.get(k); if (!cell) grid.set(k, cell = []); cell.push(s);
      }
    }
    const hit = (x, z, reach) => {
      const cell = grid.get(Math.floor(x / CELL) + ':' + Math.floor(z / CELL));
      if (!cell) return null;
      for (const s of cell) {
        const d = Math.hypot(x - s.x, z - s.z);
        if (d < s.r + reach) return { d: +d.toFixed(2), r: +s.r.toFixed(2), src: s.src };
      }
      return null;
    };
    let stand = 0, carpet = 0, cover = 0;
    const worst = [];
    for (const tr of (t.trees ?? [])) {
      if (tr.culled || !Number.isFinite(tr.x)) continue;
      const h = hit(tr.x, tr.z, 0.5);
      if (h) { stand++; if (worst.length < 6) worst.push({ reg: 'stand', ...h, kind: tr.kind }); }
    }
    const m4 = new THREE.Matrix4(), v9 = new THREE.Vector3();
    const q9 = new THREE.Quaternion(), s9 = new THREE.Vector3();
    const sweep = (t.group?.children ?? []).filter(
      (o) => o.isInstancedMesh && o.name === 'carpet-foliage');
    for (const im of sweep) {
      for (let k = 0; k < im.count; k++) {
        im.getMatrixAt(k, m4); m4.decompose(v9, q9, s9);
        if (s9.x < 0.01) continue;
        const h = hit(v9.x, v9.z, 0.5);
        if (h) { carpet++; if (worst.length < 12) worst.push({ reg: 'carpet', ...h }); }
      }
    }
    for (const im of (t._groundCover ?? [])) {
      for (let k = 0; k < im.count; k++) {
        im.getMatrixAt(k, m4); m4.decompose(v9, q9, s9);
        if (s9.x < 0.01) continue;
        if (hit(v9.x, v9.z, 0.2)) cover++;
      }
    }
    out.push({ world: L.name, theme: L.theme, structures: S.length,
      stand, carpet, cover, total: stand + carpet + cover, worst });
  }
  return out;
}, only);
const bad = r.filter((x) => (x.total ?? 0) > 0 || x.err);
console.log(JSON.stringify({ worlds: r.length, offenders: bad.length,
  totals: r.reduce((a, x) => a + (x.total ?? 0), 0),
  rows: bad.sort((a, b) => (b.total ?? 0) - (a.total ?? 0)) }, null, 1));
await browser.close();
