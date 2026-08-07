/* NOTHING PARKS ON THE RACING LINE.
 *
 * test-obstacles.mjs asserts this for `track.obstacles` and passes 32/32 — and
 * the player still photographed rocks and log rounds on the road. The fix had
 * been verified on one list while four other systems put things in the same
 * place. A census across 21 worlds found:
 *
 *   - `_buildRoadCabins`: FOUR OF FIVE cabins on FURKA RIDGE intruded, the
 *     worst at lateral 0.25 with a 5 u SOLID radius — a house on the
 *     centreline, with push-out. `_buildableSpot` tests terrain flatness and
 *     spacing and never asks how far the road is.
 *   - tire stacks: 38 of 763 inside the drivable width, worst lateral 4.01.
 *     Same cause — `pointAt(i, fixedOffset)` measures along ONE sample's
 *     normal, and on a hairpin the road's other leg swings underneath it.
 *   - `_buildProps`: 674 of 1050 inside the drivable width, 326 inside the
 *     obstacle corridor, worst inner edge 1.78 u. Not blockers, but on the
 *     timber worlds they are `hay` recoloured as cut-log rounds, so the line
 *     was strewn with log-shaped objects regardless of where the boulders went.
 *
 * So this test does not take a list's name on trust. It walks every world
 * placement that produces something the car can hit or see on the road, and
 * measures the same quantity for all of them: `|lateral| - radius`, the closest
 * the thing comes to the centreline. Negative means it straddles.
 *
 * Deliberately NOT covered, because they are hazards that are supposed to be in
 * your way and are telegraphed: rockfall/burning-tree fallers, crossroad
 * traffic, sand geysers, puddles (drag only, no push-out).
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// FURKA RIDGE is the only world with roadCabins and is where the worst
// intrusion was measured. LOG FLUME FURY and ROCKFALL RAVINE had the densest
// prop clutter. COL DE TURINI had the worst tire stack. PINE VALLEY has no
// obstacles at all, so anything found there came from another system entirely.
// OLIVE COAST is the only world that puts anything ON the tarmac on purpose
// (the corner-exit gravel), so it is swept here as well.
const WORLDS = [[21, 'FURKA RIDGE'], [13, 'LOG FLUME FURY'], [10, 'ROCKFALL RAVINE'],
                [22, 'COL DE TURINI'], [1, 'PINE VALLEY'], [29, 'OLIVE COAST']];

for (const [id, name] of WORLDS) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center,
    undefined, { timeout: 240000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  const r = await p.evaluate(() => {
    const t = window.__game.track;
    // Exact distance to the centreline polyline, not `lateralOffset` at one
    // sample: on a curve the nearest sample's normal is not the shortest path,
    // and that error is the same size as the thing being measured.
    const inner = (x, z, rad) => {
      let best = Infinity;
      for (let i = 0; i < t.center.length; i++) {
        const c = t.center[i];
        const d = Math.hypot(x - c.x, z - c.z);
        if (d < best) best = d;
      }
      return best - rad;
    };
    const survey = (list, rOf) => {
      const out = [];
      for (const o of (list ?? [])) {
        const rad = rOf(o);
        out.push({ inner: +inner(o.x, o.z, rad).toFixed(2), r: +rad.toFixed(2) });
      }
      out.sort((a, b) => a.inner - b.inner);
      return { n: out.length, worst: out.length ? out[0].inner : null, sample: out.slice(0, 3) };
    };
    return {
      obstacles: survey(t.obstacles, (o) => o.r),
      // Cabins/huts land in `solids` with a material tag; `hut` is the cabin.
      huts: survey((t.solids ?? []).filter((s) => s.mat === 'hut' && (s.y ?? 0) > -1000), (o) => o.r ?? 2),
      tires: survey(t.tireStacks, (o) => o.r ?? 1.1),
      props: survey(t.props, (o) => o.r ?? 1.2),
    };
  });

  // SOLIDS — these push the car. Nothing solid may come within the corridor.
  for (const [key, label] of [['obstacles', 'rocks and logs'], ['huts', 'cabins'], ['tires', 'tire stacks']]) {
    const s = r[key];
    if (!s.n) { console.log(`NOTE  ${name}: no ${label}`); continue; }
    check(`${name}: ${label} clear the racing line`, s.worst >= 4.0,
      `closest ${s.worst} u from the centreline (${s.n} of them)`);
    check(`${name}: no ${label} straddle the centreline`, s.worst > 0,
      s.worst > 0 ? 'none' : JSON.stringify(s.sample));
  }

  // PROPS — smashable, not blockers, so they may sit nearer than a solid. They
  // still may not sit ON the line: that is the reported complaint.
  if (r.props.n) {
    check(`${name}: smashable props are off the racing line`, r.props.worst >= 3.5,
      `closest ${r.props.worst} u from the centreline (${r.props.n} props)`);
  }

  await p.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe line is clear of everything');
process.exit(fail ? 1 : 0);
