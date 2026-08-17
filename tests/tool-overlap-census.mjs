/* CENSUS: which worlds run two legs of their lap on shared tarmac at grade.
 * A diagnostic tool, not a gate — the gate is LAW 4 in test-roadclear.mjs.
 *
 * Findings as of r153b: MOUNTAIN TO SEA (5 stretches, legs down to 1.3 u
 * apart) and SEA CLIFF RUN (2). Those are real authoring facts, and note they
 * did NOT turn out to be the field-stall cause; see test-field-stalls.mjs.
 *
 * r199 SHARPENED IT THREE WAYS, each earned by a wrong answer:
 *
 *   THE THRESHOLD IS 18 u, NOT 14. Two carriageways need 2 x ROAD_HALF between
 *   centrelines not to share tarmac. At 14 the census under-reported the
 *   shoulders of every overlap.
 *
 *   BOTH TESTS ON THE SAME SAMPLE. Marking a sample merely "close in XZ" and
 *   then reporting a run's smallest distance beside its smallest height gap
 *   takes the two numbers from DIFFERENT places. A rewrite of this that did so
 *   read "MOUNTAIN TO SEA: 141 u of lap 0.6 u apart and 0.05 u vertically",
 *   when the 0.6 u belonged to a stretch with 11 u of clearance over it and
 *   the 0.05 u to another 30 u away. A clash is ONE sample close in XZ AND
 *   level in Y.
 *
 *   A RUN BREAKS WHEN THE PARTNER JUMPS. Consecutive samples pairing with
 *   opposite sides of the lap are two encounters, not one, and merging them
 *   invents a monster that is not there.
 *
 * AND IT NOW SAYS WHETHER AN OVERPASS COVERS THE CLASH, which is the column
 * that turns a fact into a diagnosis. MOUNTAIN TO SEA's stretches are 100%
 * inside REGISTERED overpasses whose crossing clearances are healthy
 * (tools-scratch/gaps.mjs: 10.48-15.04 u, none under 6) — so the deck rises
 * correctly at the intersection and the legs come back together at the RAMP
 * ENDS, still inside a road width of each other. SEA CLIFF RUN's is barely
 * covered at all: a near-parallel pass registers no crossing, because
 * `_planOverpasses` only fires on a true XZ segment INTERSECTION. Same defect,
 * two different ways of arriving at it. See HANDOVER item 1. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 320 } });
const BASE = process.env.BASE ?? 'http://localhost:8901';
// A world filter, like the other tools have. This rebuilds every level and
// runs an O(N^2) sweep on each, so a full roster pass is minutes; a spot
// check should not be.
const only = process.argv.slice(2).map(Number).filter(Boolean);
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player);
const rows = await page.evaluate(async ({ only }) => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  for (const L of LEVELS) {
    if (only.length && !only.includes(L.id)) continue;
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch { continue; }
    const t = g.track, N = t.N;
    const covered = (i) => (t._overpasses ?? []).some((o) =>
      Math.min((i - o.up + N) % N, (o.up - i + N) % N) <= o.half + 6
      || Math.min((i - o.down + N) % N, (o.down - i + N) % N) <= o.half + 6);
    const runs = [];
    let cur = null;
    for (let i = 0; i < N; i += 2) {
      const a = t.center[i];
      let best = Infinity, bj = -1;
      for (let j = 0; j < N; j += 2) {
        const lapD = Math.min(Math.abs(j - i), N - Math.abs(j - i));
        if (lapD < 60) continue;
        const dx = a.x - t.center[j].x, dz = a.z - t.center[j].z;
        const d = dx * dx + dz * dz;
        if (d < best) { best = d; bj = j; }
      }
      const d = Math.sqrt(best);
      const gap = bj >= 0 ? Math.abs(a.y - t.center[bj].y) : 99;
      // SHARED TARMAC *AND* LEVEL, on this one sample. 18 u is 2 x ROAD_HALF.
      if (d >= 18 || gap >= 6) { cur = null; continue; }
      const jumped = cur && Math.min((bj - cur.j + N) % N, (cur.j - bj + N) % N) > 25;
      if (cur && i - cur.end <= 6 && !jumped) {
        cur.end = i; cur.j = bj;
        cur.minD = Math.min(cur.minD, d); cur.minGap = Math.min(cur.minGap, gap);
        if (covered(i)) cur.cov++;
        cur.n++;
      } else {
        cur = { start: i, end: i, j: bj, minD: d, minGap: gap, n: 1, cov: covered(i) ? 1 : 0,
          x: +a.x.toFixed(0), z: +a.z.toFixed(0) };
        runs.push(cur);
      }
    }
    const sig = runs.filter((r) => r.end - r.start >= 4);   // sustained, not a touch
    if (sig.length) out.push({ id: L.id, name: L.name,
      runs: sig.length,
      detail: sig.slice(0, 3).map((r) => `${(r.end - r.start) * t.segLen | 0}u@(${r.x},${r.z})`
        + ` ${r.minD.toFixed(1)}u apart/${r.minGap.toFixed(2)}u dy`
        + ` ${Math.round((r.cov / r.n) * 100)}% bridged`) });
  }
  return out;
}, { only });
console.log(`${rows.length} worlds with sustained at-grade corridor overlaps:`);
for (const r of rows) console.log(` ${String(r.id).padStart(3)} ${r.name.padEnd(20)} ${r.runs} run(s): ${r.detail.join('  ')}`);
await b.close();
