/* WHAT IS SOLID INSIDE THE DRIVABLE CORRIDOR?
 *
 * A diagnostic, not a gate. Two "there is an invisible wall here" reports came
 * in on r153c — one at a start grid under an overpass, one at a road edge by a
 * fence — and this sweeps every world for colliders that reach inside the
 * carriageway.
 *
 * READ THE OUTPUT WITH CARE: it cannot tell an invisible wall from a visible
 * hazard. Most of what it lists is legitimate — roadside boulders at d ~ 11
 * (just clipping the corridor once the car's own 1.8 u radius is counted),
 * rockfall, and quay cannon, all of which push a mesh into the scene next to
 * the solid. Two things it DID establish:
 *
 *   - the r153b horizon-ring solids are NOT the cause. None of them appear
 *     here; they sit >= 360 u from every road, as measured when they landed.
 *   - the r153c kink relaxation is NOT the cause. It moves `center[]`, and
 *     `this.curve` is read only during construction and for `length`, so no
 *     collider is placed off the un-relaxed path.
 *
 * THE STANDING HYPOTHESIS, untested when this was written: the lateral clamp
 * reads `widthAt(trackIndex)`, and `nearestIndex` is hint-windowed +-30
 * samples specifically so a car keeps its own leg through an overpass stack.
 * Where two legs of a lap share XZ — which is exactly the geometry under the
 * first screenshot's overpass, and exactly where the field-stall pile forms
 * (see test-field-stalls.mjs) — an index that snaps to the WRONG leg would
 * clamp the car against a road edge belonging to somewhere else. That is an
 * invisible wall, and it would explain both reports and the stalls with one
 * mechanism. Worth testing before anything is changed.
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
    const hits = [];
    for (const s of (t.solids ?? [])) {
      if (s.x > 9e5) continue;                       // parked traffic proxy
      // nearest centreline station to this solid
      let bi = -1, bd = Infinity;
      for (let i = 0; i < N; i += 1) {
        const dx = s.x - t.center[i].x, dz = s.z - t.center[i].z;
        const d = dx * dx + dz * dz;
        if (d < bd) { bd = d; bi = i; }
      }
      const d = Math.sqrt(bd);
      const half = (t.widthAt?.(bi) ?? 7) + 0.55;
      // overlap: the solid's disc reaches inside the drivable half-width
      const intrude = (half + 1.8) - (d - s.r);
      if (intrude <= 0.5) continue;
      // THE HEIGHT GATE DECIDES WHETHER IT IS THERE AT ALL. `Car.step` skips a
      // solid whose y is more than 6 u from the car unless it declares `h`
      // (then it is solid over its whole span). Without this filter the sweep
      // is mostly noise: proxies parked at y = -9999 and cellar-level colliders
      // read as blocking the road when nothing can ever touch them.
      const roadY = t.center[bi].y;
      const reachable = s.y === undefined ? true
        : s.h !== undefined ? (roadY >= s.y - 3 && roadY <= s.y + s.h)
          : Math.abs(roadY - s.y) <= 6;
      if (!reachable) continue;
      hits.push({ r: +s.r.toFixed(1), mat: s.mat, h: s.h,
        d: +d.toFixed(1), half: +half.toFixed(1), intrude: +intrude.toFixed(1),
        y: s.y === undefined ? 'any' : +(+s.y).toFixed(1), roadY: +roadY.toFixed(1),
        frac: +(bi / N).toFixed(3), x: +s.x.toFixed(0), z: +s.z.toFixed(0) });
    }
    hits.sort((a, c) => c.intrude - a.intrude);
    if (hits.length) out.push({ id: L.id, name: L.name, n: hits.length, worst: hits.slice(0, 3) });
  }
  return out;
});
console.log(`${rows.length} worlds with solids intruding into the drivable corridor:`);
for (const r of rows) console.log(` ${String(r.id).padStart(3)} ${r.name.padEnd(20)} ${r.n} — ${JSON.stringify(r.worst)}`);
await b.close();
