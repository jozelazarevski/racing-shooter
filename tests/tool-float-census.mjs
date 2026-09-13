/* FLOATING-OBJECT CENSUS — the COLUMN metric.
 *
 * Per-part height is meaningless: a roof box legitimately sits 9 u up because
 * the walls under it reach the ground. What makes something read as FLOATING
 * is that there is nothing beneath it at all.
 *
 * So: bucket every drawn part's footprint into a 2 u ground grid, and for each
 * cell keep the LOWEST piece of geometry that covers it. A building's roof
 * shares cells with its own walls, so its column bottoms out at ground level.
 * A rock hanging in the air is the only thing in its column, so the column
 * bottom stays high — and that is exactly what the eye picks out.
 *
 * Reports by object name so the output points at a BUILDER, not a coordinate.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const ONLY = process.env.LEVELS ? process.env.LEVELS.split(',').map(Number) : null;
const MIN = +(process.env.MIN ?? 2.0);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 300 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));

await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });

const R = await page.evaluate(async ({ only, min }) => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const CELL = 2;

  // Legitimately airborne, by design — excluded with a reason so the list is
  // auditable rather than a silent filter.
  const SKIP = /^(sky|horizon|cloud|bird|sea|water|river|lake|contact-shadows|.*-lightpool|.*shadow|rain|snow|dust|spark|smoke|fog|particle|hud|arrow|marker|.*-veil|chopper|heli|banner|gantry|start-lights|edit-|preview)/i;

  const worlds = [];
  for (const lv of LEVELS) {
    if (only && !only.includes(lv.id)) continue;
    g.state = 'title'; g.editScene = null;
    g.swapLevel(lv, true, null);
    // LET THE WORLD SETTLE FIRST. Anything positioned in update() — cars,
    // pickups, choppers, birds, the wheels on a car — is still sitting at its
    // constructor default until a frame has run, and measuring before that
    // reports a pile of parts at the world origin that no player ever sees.
    for (let f = 0; f < 12; f++) await new Promise((res) => requestAnimationFrame(res));
    const t = g.track;
    g.scene.updateMatrixWorld(true);

    // pass 1: for every cell, the lowest geometry bottom over it, and which
    // named object owns that lowest piece
    const col = new Map();
    const parts = [];
    const tmp = new Float32Array(16);

    const consider = (name, e, bb) => {
      let minY = Infinity, maxY = -Infinity;
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (let i = 0; i < 8; i++) {
        const x = (i & 1) ? bb.max.x : bb.min.x;
        const y = (i & 2) ? bb.max.y : bb.min.y;
        const z = (i & 4) ? bb.max.z : bb.min.z;
        const X = e[0] * x + e[4] * y + e[8] * z + e[12];
        const Y = e[1] * x + e[5] * y + e[9] * z + e[13];
        const Z = e[2] * x + e[6] * y + e[10] * z + e[14];
        if (Y < minY) minY = Y; if (Y > maxY) maxY = Y;
        if (X < minX) minX = X; if (X > maxX) maxX = X;
        if (Z < minZ) minZ = Z; if (Z > maxZ) maxZ = Z;
      }
      if (!Number.isFinite(minY)) return;
      // A PARKED SLOT IS NOT A FLOATING OBJECT. Pools scale unused instances
      // to zero; that collapses their box to a point at the origin, which
      // reads as "one more thing hanging in the air" for every unused slot in
      // the game. Zero extent means zero pixels.
      if (maxY - minY < 1e-4 && maxX - minX < 1e-4 && maxZ - minZ < 1e-4) return;
      // ignore the far skyline: those sit on their own highland by design
      const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
      if (Math.hypot(cx, cz) > 420) return;
      const idx = parts.length;
      parts.push({ name, minY, cx, cz, h: maxY - minY });
      // stamp the footprint into the column grid (capped so a huge ground
      // plane doesn't cost a million cells)
      const i0 = Math.floor(minX / CELL), i1 = Math.floor(maxX / CELL);
      const j0 = Math.floor(minZ / CELL), j1 = Math.floor(maxZ / CELL);
      if ((i1 - i0 + 1) * (j1 - j0 + 1) > 4000) return;
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const k = i * 100000 + j;
          const cur = col.get(k);
          if (cur === undefined || minY < cur) col.set(k, minY);
        }
      }
    };

    g.scene.traverse((o) => {
      if ((!o.isMesh && !o.isInstancedMesh) || !o.geometry) return;
      // RECOMPUTE, never trust the cache: a geometry that was translated or
      // scaled after an earlier computeBoundingBox carries a stale box, and a
      // stale box reads as "this object is at the world origin" — which is
      // how a clean start line came back as 223 floating objects.
      o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      if (!bb) return;
      // TEMPLATES AND THE WORLD SHELL SIT AT THE ORIGIN WITH AN IDENTITY
      // TRANSFORM. The instancing templates (one trunk, one foliage cone per
      // species), the ground plane and the sky sphere are all plain meshes
      // parked at 0,0,0 whose real copies are drawn by InstancedMeshes
      // elsewhere — painting one magenta turns the whole world magenta, which
      // is how they were identified. Counting them reports the entire tree
      // population of a world as "floating at the origin".
      const e0 = o.matrixWorld.elements;
      if (!o.isInstancedMesh && !o.name
          && Math.abs(e0[12]) < 1e-6 && Math.abs(e0[13]) < 1e-6 && Math.abs(e0[14]) < 1e-6
          && e0[0] === 1 && e0[5] === 1 && e0[10] === 1) return;
      let name = o.name;
      if (!name) {
        const chain = [];
        for (let p = o.parent; p && chain.length < 4; p = p.parent) if (p.name) chain.push(p.name);
        const geo = o.geometry.type.replace('Geometry', '');
        name = chain.length ? `${chain[0]}/${geo}` : `${o.isInstancedMesh ? 'inst' : 'mesh'}:${geo}`;
      }
      if (SKIP.test(name)) return;
      for (let q = o; q; q = q.parent) if (!q.visible) return;
      if (o.isInstancedMesh) {
        const w = o.matrixWorld.elements;
        const a = o.instanceMatrix.array;
        const n = Math.min(o.count, 900);
        for (let i = 0; i < n; i++) {
          const b = i * 16;
          for (let c = 0; c < 4; c++) {
            for (let r = 0; r < 4; r++) {
              tmp[c * 4 + r] = w[r] * a[b + c * 4] + w[4 + r] * a[b + c * 4 + 1]
                + w[8 + r] * a[b + c * 4 + 2] + w[12 + r] * a[b + c * 4 + 3];
            }
          }
          consider(name, tmp, bb);
        }
      } else consider(name, o.matrixWorld.elements, bb);
    });

    // pass 2: a part FLOATS if the lowest thing in its own column is itself
    // (nothing under it) AND that bottom sits clear of the terrain
    const byName = new Map();
    for (const p of parts) {
      const k = Math.floor(p.cx / CELL) * 100000 + Math.floor(p.cz / CELL);
      const lowest = col.get(k);
      if (lowest === undefined) continue;
      if (p.minY > lowest + 0.05) continue;          // something is under it
      // WHAT COUNTS AS "THE GROUND" HERE.
      //
      // Comparing against terrainHeight alone is wrong wherever the ROAD is
      // carried above the natural ground — on an embankment, a shelf cut into
      // a hillside, a viaduct. There the kerbs, rails and retaining walls sit
      // at road level quite correctly, and measuring them against the valley
      // floor 36 u below reports the whole roadside as floating. So near the
      // carriageway the road surface IS the ground.
      const probe = { x: p.cx, y: 0, z: p.cz };
      const idx = t.nearestIndex(probe, null, false);
      const lat = Math.abs(t.lateralOffset(probe, idx));
      const half = (t.widthAt ? t.widthAt(idx) : 7) + 8;
      let gy = t.terrainHeight(p.cx, p.cz);
      if (lat < half && Number.isFinite(t.center[idx].y)) gy = Math.max(gy, t.center[idx].y);
      if (!Number.isFinite(gy)) continue;
      const gap = p.minY - gy;
      if (!byName.has(p.name)) byName.set(p.name, { n: 0, over: 0, worst: null });
      const rec = byName.get(p.name);
      rec.n++;
      if (gap > min) {
        rec.over++;
        if (!rec.worst || gap > rec.worst.gap) {
          rec.worst = { gap: +gap.toFixed(2), x: Math.round(p.cx), z: Math.round(p.cz), h: +p.h.toFixed(1) };
        }
      }
    }

    const rows = [];
    for (const [name, rec] of byName) {
      if (!rec.over) continue;
      rows.push({ name, over: rec.over, of: rec.n, worst: rec.worst });
    }
    rows.sort((a, b) => b.worst.gap - a.worst.gap);
    worlds.push({ id: lv.id, name: lv.name, rows });
  }
  return worlds;
}, { only: ONLY, min: MIN });

for (const w of R) {
  if (!w.rows.length) continue;
  console.log(`\n=== ${w.name} (${w.id}) ===`);
  for (const row of w.rows.slice(0, 12)) {
    console.log(`  ${row.name.padEnd(30)} ${String(row.over).padStart(5)}/${String(row.of).padEnd(6)}`
      + ` worst ${String(row.worst.gap).padStart(8)} at (${row.worst.x},${row.worst.z}) h=${row.worst.h}`);
  }
}

const tally = new Map();
for (const w of R) {
  for (const row of w.rows) {
    if (!tally.has(row.name)) tally.set(row.name, { worlds: [], n: 0, worst: 0, where: '' });
    const t = tally.get(row.name);
    t.worlds.push(w.name); t.n += row.over;
    if (row.worst.gap > t.worst) { t.worst = row.worst.gap; t.where = `${w.name} (${row.worst.x},${row.worst.z})`; }
  }
}
console.log(`\n\n===== ROSTER ROLL-UP (${R.length} worlds, column gap > ${MIN} u) =====`);
for (const [name, t] of [...tally.entries()].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`${name.padEnd(30)} ${String(t.worlds.length).padStart(3)}w ${String(t.n).padStart(6)} items  worst ${String(t.worst).padStart(8)} @ ${t.where}`);
}
if (errors.length) console.log('\nPAGE ERRORS:\n' + errors.slice(0, 5).join('\n'));

await browser.close();
