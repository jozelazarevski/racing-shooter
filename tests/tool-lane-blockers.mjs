/* WHAT is standing in the carriageway — grouped by collider kind and material,
 * using Car.step's own predicates (copied from tool-corridor-blockers). */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(900000);
await page.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player);

const R = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const tally = new Map();          // key -> {n, worlds:Set, worst}
  const perWorld = [];
  for (const L of LEVELS) {
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch { continue; }
    const t = g.track, N = t.N;
    const solids = (t.solids ?? []).filter((s) => s.x < 9e5);
    const bars = t.barriers ?? [];
    const seen = new Set();
    const local = new Map();
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
            if (f > 0) rr = s.r * s.prof[Math.min(s.prof.length - 1, Math.max(0, Math.floor(f * s.prof.length)))] + 1.8;
          }
          const dx = px - s.x, dz = pz - s.z;
          if (dx * dx + dz * dz >= rr * rr) continue;
          if (s.y !== undefined) {
            if (s.h !== undefined) { if (py < s.y - Math.max(3, Math.min(30, s.h * 0.35)) || py > s.y + s.h) continue; } // scaled lower pad, mirrors the vehicles.js solids gate
            else if (Math.abs(py - s.y) > 6) continue;
          }
          const key = `solid:${s.mat ?? s.kind ?? '?'}`;
          const id = `${key}@${s.x.toFixed(0)},${s.z.toFixed(0)}`;
          if (seen.has(id)) continue; seen.add(id);
          local.set(key, (local.get(key) || 0) + 1);
          const rec = tally.get(key) || { n: 0, worlds: new Set(), worst: null };
          rec.n++; rec.worlds.add(L.name);
          if (!rec.worst) rec.worst = `${L.name} (${s.x.toFixed(0)},${s.z.toFixed(0)}) r=${s.r.toFixed(1)}`;
          tally.set(key, rec);
        }
        for (const q of bars) {
          if (q.over && py < q.y - 1.2) continue;
          if (py > q.y + q.h + 1.0 || py < q.y - 1.2) continue;
          const ax = q.x1 ?? q.x, az = q.z1 ?? q.z, bx = q.x2 ?? q.x, bz = q.z2 ?? q.z;
          const vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz;
          const tt = L2 > 1e-6 ? Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / L2)) : 0;
          const cx = ax + vx * tt, cz = az + vz * tt;
          const rr = (q.hw ?? 0.6) + 1.7;
          const dx = px - cx, dz = pz - cz;
          if (dx * dx + dz * dz >= rr * rr) continue;
          const key = `barrier:${q.mat ?? '?'}`;
          const id = `${key}@${cx.toFixed(0)},${cz.toFixed(0)}`;
          if (seen.has(id)) continue; seen.add(id);
          local.set(key, (local.get(key) || 0) + 1);
          const rec = tally.get(key) || { n: 0, worlds: new Set(), worst: null };
          rec.n++; rec.worlds.add(L.name);
          if (!rec.worst) rec.worst = `${L.name} (${cx.toFixed(0)},${cz.toFixed(0)})`;
          tally.set(key, rec);
        }
      }
    }
    if (local.size) perWorld.push({ name: L.name, id: L.id, parts: [...local.entries()].sort((a,c)=>c[1]-a[1]) });
  }
  return { tally: [...tally.entries()].map(([k, v]) => [k, v.n, v.worlds.size, v.worst]).sort((a, c) => c[1] - a[1]),
    perWorld: perWorld.sort((a, c) => c.parts.reduce((s,[,n])=>s+n,0) - a.parts.reduce((s,[,n])=>s+n,0)).slice(0, 14) };
});
console.log('=== BY KIND (distinct blockers inside the drivable corridor) ===');
for (const [k, n, w, worst] of R.tally) console.log(`${k.padEnd(22)} ${String(n).padStart(5)} blockers, ${String(w).padStart(3)} worlds   e.g. ${worst}`);
console.log('\n=== WORST WORLDS ===');
for (const w of R.perWorld) console.log(`${w.name.padEnd(22)} ${w.parts.map(([k,n])=>`${k}×${n}`).join('  ')}`);
await b.close();
