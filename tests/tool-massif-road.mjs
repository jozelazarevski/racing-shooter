/* THE MASSIF COLLIDER IS A CYLINDER; THE MASSIF IS A MOUNTAIN.
 *
 * `_buildMassif` registers {x, z, r: w*0.48, y, h} and `Car.step` treats a
 * solid that declares `h` as solid over its WHOLE span — correct for r148's
 * problem (a car driving into the flank of a 300 u peak), and a cylinder of
 * the BASE radius everywhere up the mountain.
 *
 * So this asks, for every world with a massif: where the road passes inside
 * that cylinder, how far is the road from the axis, and how wide is the
 * mountain ACTUALLY drawn at the road's own height? The gap between those two
 * numbers is invisible wall — collider with no rock in it.
 *
 * The drawn width is read off the instanced geometry itself (max |xz| among
 * vertices in the height band), not from a formula, because the crag geometry
 * is a heightfield with spurs and gullies and no closed form.
 */
import { chromium } from 'playwright-core';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(900000);
await page.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player);

const rows = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  for (const L of LEVELS) {
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch { continue; }
    const t = g.track, N = t.N;
    // the massif instances, with their drawn profile
    let prof = null;
    t.group.traverse((o) => {
      if (!o.isInstancedMesh || o.name !== 'massif' || prof) return;
      // unit-cone profile: for 20 height bands over the geometry's own y span,
      // the largest horizontal radius any vertex reaches
      const p = o.geometry.attributes.position;
      const B = 20, mx = new Array(B).fill(0);
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < lo) lo = y; if (y > hi) hi = y; }
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        const k = Math.min(B - 1, Math.max(0, Math.floor(((y - lo) / (hi - lo)) * B)));
        const rr = Math.hypot(p.getX(i), p.getZ(i));
        if (rr > mx[k]) mx[k] = rr;
      }
      // widest band = the base; report every band as a fraction of it
      const base = Math.max(...mx);
      prof = mx.map((v) => +(v / base).toFixed(3));
    });
    const big = (t.solids ?? []).filter((s) => s.mat === 'stone' && s.h !== undefined && s.r > 40);
    if (!big.length) continue;

    const worst = [];
    for (const s of big) {
      let stations = 0, minD = Infinity, atY = 0, drawn = 0;
      for (let i = 0; i < N; i++) {
        const c = t.center[i];
        const d = Math.hypot(c.x - s.x, c.z - s.z);
        const rr = s.r + 1.8 + (t.widthAt?.(i) ?? 7) * 0.8;
        if (d >= rr) continue;
        if (c.y > s.y + s.h) continue; // no lower gate: a mountain has no underside (vehicles.js solids gate)
        stations++;
        if (d < minD) { minD = d; atY = c.y; }
      }
      if (!stations) continue;
      // drawn radius at the closest station's height
      const f = (atY - s.y) / s.h;                    // 0 at base, 1 at crest
      const k = Math.min(19, Math.max(0, Math.floor(f * 20)));
      drawn = prof ? s.r * prof[k] : s.r;
      worst.push({ r: +s.r.toFixed(0), y: +s.y.toFixed(0), h: +s.h.toFixed(0),
        stations, minD: +minD.toFixed(0), atY: +atY.toFixed(0),
        f: +f.toFixed(2), drawn: +drawn.toFixed(0),
        // road is inside the cylinder but outside the rock => invisible
        invisible: +(Math.min(s.r, s.r) - Math.max(minD, drawn)).toFixed(0),
        insideRock: minD < drawn });
    }
    if (worst.length) {
      worst.sort((a, c) => c.stations - a.stations);
      out.push({ id: L.id, name: L.name, prof: prof ? prof.slice(0, 20) : null, worst });
    }
  }
  return out;
});

for (const r of rows) {
  console.log(`\n${String(r.id).padStart(3)} ${r.name}`);
  if (r.prof) console.log(`     drawn profile (base=1, 20 bands up): ${r.prof.join(' ')}`);
  for (const w of r.worst) {
    console.log(`     r=${w.r} y=${w.y} h=${w.h} | ${w.stations} stations inside | `
      + `nearest ${w.minD} u from axis at y=${w.atY} (f=${w.f}) | rock is ${w.drawn} u wide there | `
      + (w.insideRock ? 'ROAD IS INSIDE THE ROCK' : `INVISIBLE BAND ${w.r - w.drawn} u`));
  }
}
console.log(`\n${rows.length} worlds have road inside a massif collider`);
await b.close();
