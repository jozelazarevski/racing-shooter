/* Detail for one world's corridor blockers: what each distinct collider is,
 * how much road it covers, and whether a drawn mesh stands where it bites.
 * Usage: WORLD="FURKA RIDGE" node tests/tool-blocker-detail.mjs */
import { chromium } from 'playwright-core';

const WORLD = process.env.WORLD ?? 'FURKA RIDGE';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(900000);
await page.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player);

const res = await page.evaluate(async (WORLD) => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const L = LEVELS.find((x) => x.name === WORLD);
  g.state = 'title'; g.editScene = null;
  g.swapLevel(L, true, null);
  const t = g.track, N = t.N;
  const THREE = await import('three');
  const solids = (t.solids ?? []).filter((s) => s.x < 9e5);
  const obs = t.obstacles ?? [];
  const bars = t.barriers ?? [];
  const tally = new Map();
  const bump = (key, rec, i, off) => {
    let e = tally.get(key);
    if (!e) { e = { ...rec, pts: 0, stations: new Set(), offs: [] }; tally.set(key, e); }
    e.pts++; e.stations.add(i); e.offs.push(off);
  };
  for (let i = 0; i < N; i++) {
    const c = t.center[i], nrm = t.nrm[i];
    const half = (t.widthAt?.(i) ?? 7);
    for (let k = -2; k <= 2; k++) {
      const off = (k / 2) * half * 0.8;
      const px = c.x + nrm.x * off, pz = c.z + nrm.z * off, py = c.y;
      for (const s of solids) {
        let rr = s.r + 1.8;
        if (s.prof && s.h) {
          const f = (py - s.y) / s.h;
          if (f > 0) rr = s.r * s.prof[Math.min(s.prof.length - 1,
            Math.max(0, Math.floor(f * s.prof.length)))] + 1.8;
        }
        if ((px - s.x) ** 2 + (pz - s.z) ** 2 >= rr * rr) continue;
        if (s.y !== undefined) {
          if (s.h !== undefined) { if (py > s.y + s.h) continue; } // matches the no-underside solids gate
          else if (Math.abs(py - s.y) > 6) continue;
        }
        bump(`solid ${s.x.toFixed(0)},${s.z.toFixed(0)}`,
          { kind: 'solid', mat: s.mat, r: +s.r.toFixed(2), y: s.y, h: s.h,
            x: s.x, z: s.z }, i, +off.toFixed(1));
      }
      for (const o of obs) {
        const rr = o.r + 2.5;
        if ((px - o.x) ** 2 + (pz - o.z) ** 2 >= rr * rr) continue;
        bump(`obst ${o.x.toFixed(0)},${o.z.toFixed(0)}`,
          { kind: 'obstacle', r: +o.r.toFixed(2), y: o.y, x: o.x, z: o.z }, i, +off.toFixed(1));
      }
      for (const q of bars) {
        if (py > q.y + q.h + 1.0 || py < q.y - 1.2) continue;
        const vx = q.x2 - q.x1, vz = q.z2 - q.z1, L2 = vx * vx + vz * vz;
        const tt = L2 > 1e-6 ? Math.max(0, Math.min(1, ((px - q.x1) * vx + (pz - q.z1) * vz) / L2)) : 0;
        const cx = q.x1 + vx * tt, cz = q.z1 + vz * tt, rr = q.hw + 1.7;
        if ((px - cx) ** 2 + (pz - cz) ** 2 >= rr * rr) continue;
        bump(`bar ${q.x1.toFixed(0)},${q.z1.toFixed(0)}`,
          { kind: 'barrier', mat: q.mat, y: q.y, h: q.h, over: !!q.over,
            x: (q.x1 + q.x2) / 2, z: (q.z1 + q.z2) / 2 }, i, +off.toFixed(1));
      }
    }
  }
  // is anything DRAWN near the blocker, at the road's height?
  const boxes = [];
  const bx = new THREE.Box3();
  t.group.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    if (o.name === 'road' || o.name === 'ground' || o.name === 'terrain') return;
    if (o.isInstancedMesh) {
      const m = new THREE.Matrix4(), v = new THREE.Vector3();
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m); v.setFromMatrixPosition(m); o.localToWorld(v);
        boxes.push({ name: o.name || 'inst', x: v.x, y: v.y, z: v.z, rad: 2 });
      }
    } else {
      bx.setFromObject(o);
      if (!isFinite(bx.min.x)) return;
      boxes.push({ name: o.name || o.geometry?.type || 'mesh',
        x: (bx.min.x + bx.max.x) / 2, y: (bx.min.y + bx.max.y) / 2, z: (bx.min.z + bx.max.z) / 2,
        rad: Math.max(bx.max.x - bx.min.x, bx.max.z - bx.min.z) / 2,
        top: bx.max.y, bot: bx.min.y });
    }
  });
  const out = [];
  for (const [key, e] of tally) {
    const st = [...e.stations].sort((a, c) => a - c);
    const roadY = t.center[st[0]].y;
    const near = boxes.filter((m) => (m.x - e.x) ** 2 + (m.z - e.z) ** 2 < ((m.rad ?? 2) + (e.r ?? 3) + 3) ** 2);
    const visibleHere = near.filter((m) => m.top === undefined
      || (m.top > roadY - 1 && m.bot < roadY + 4));
    out.push({ key, kind: e.kind, mat: e.mat, r: e.r, y: e.y === undefined ? null : +e.y.toFixed(1),
      h: e.h === undefined ? null : +e.h.toFixed(1), roadY: +roadY.toFixed(1),
      pts: e.pts, stations: st.length, span: st[st.length - 1] - st[0],
      i0: st[0], minOff: Math.min(...e.offs), maxOff: Math.max(...e.offs),
      meshesNear: near.length, meshesAtRoadHeight: visibleHere.length,
      names: [...new Set(visibleHere.map((m) => m.name))].slice(0, 3) });
  }
  out.sort((a, c) => c.pts - a.pts);
  return { name: L.name, N, solids: solids.length, obs: obs.length, bars: bars.length,
    segLen: t.segLen, blockers: out };
}, WORLD);

console.log(`${res.name}: N=${res.N} solids=${res.solids} obstacles=${res.obs} barriers=${res.bars} segLen=${res.segLen}`);
console.log('pts  stn span  kind      mat     r     y      h    roadY  off-range   meshes(near/atRoadY)  names');
for (const r of res.blockers) {
  console.log(`${String(r.pts).padStart(4)} ${String(r.stations).padStart(3)} ${String(r.span).padStart(4)}  `
    + `${String(r.kind).padEnd(9)} ${String(r.mat ?? '-').padEnd(7)} ${String(r.r ?? '-').padStart(5)} `
    + `${String(r.y ?? '-').padStart(6)} ${String(r.h ?? '-').padStart(6)} ${String(r.roadY).padStart(6)}  `
    + `${String(r.minOff).padStart(5)}..${String(r.maxOff).padEnd(5)}  ${String(r.meshesNear).padStart(3)}/${String(r.meshesAtRoadHeight).padEnd(3)}  ${r.names.join(',')}`);
}
await b.close();
