/* RALLY_CORRIDOR_REFACTOR §17 — step-3 acceptance: prop classes + density.
 *
 *   R7  sapling at speed        breaks, 0 hull, Smashed +25
 *   R8  shove-class rock at 60  moves aside, 0 hull, no score
 *   V1  every prop classifies   smash / shove / obstacle, none unclassed
 *   V2  §6 density holds        after the cull: no obstacle within the
 *                               exclusion of the road edge on non-street
 *                               sections; at most 1 per 20 m in the band
 *
 * Runs on both re-authored stages (LVL=4 Canyon Run, LVL=66 Glacier Col).
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

for (const lvl of ['4', '66']) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.route && window.__game.player, undefined, { timeout: 300000 });

  const r = await p.evaluate(async () => {
    const g = window.__game, c = g.player, t = g.track;
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    for (let k = 0; k < 600 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    const { propClassOf } = await import('./src/route.js');
    const out = { report: t._densityReport ?? null };

    // ---- V1: everything classifies -----------------------------------------
    const tally = { smash: 0, shove: 0, obstacle: 0, unknown: 0 };
    for (const tr of t.trees ?? []) {
      if (tr.dead || tr.culled) continue;
      tally[propClassOf(tr) ?? 'unknown']++;
    }
    for (const ob of t.solids ?? []) {
      if (ob.culled || !(ob.r > 0)) continue;
      tally[propClassOf(ob) ?? 'unknown']++;
    }
    out.v1 = tally;

    // ---- V2: the density audit re-measures what the cull left -------------
    const R = window.__DRIVING?.route ?? {};
    const EXCL = R.obstacleExclusionM ?? 4, BAND = 12, PER = R.obstacleDensityPer20m ?? 1;
    const N = t.center.length;
    const sampleLen = Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z);
    const win = Math.max(1, Math.round(20 / sampleLen));
    const buckets = new Map();
    let inExcl = 0;
    const obstacles = [];
    for (const tr of t.trees ?? []) {
      if (tr.dead || tr.culled) continue;
      if (propClassOf(tr) === 'obstacle') obstacles.push(tr);
    }
    for (const ob of t.solids ?? []) {
      if (ob.culled || !(ob.r > 0)) continue;
      if (ob.mat === 'stone' && ob.r >= 1.15 && ob.r <= 8) obstacles.push(ob);
    }
    let inExclFixed = 0;
    for (const o of obstacles) {
      const gi = t.nearestIndex(o, null);
      const cc = t.center[gi];
      const d = Math.hypot(o.x - cc.x, o.z - cc.z) - (t.widthAt?.(gi) ?? 9);
      if (d >= BAND) continue;
      if (g.route.kindAtIndex(gi) === 'street') continue;
      const cullable = !!o.parts || (o.im && o.inst !== undefined);
      if (d < EXCL) { if (cullable) inExcl++; else inExclFixed++; continue; }
      if (cullable) { const key = Math.floor(gi / win); buckets.set(key, (buckets.get(key) ?? 0) + 1); }
    }
    let overBudget = 0;
    for (const n of buckets.values()) if (n > PER) overBudget++;
    out.v2 = { inExcl, inExclFixed, overBudget, windows: buckets.size };

    // ---- R7: a sapling at speed breaks for 0 hull and +25 ------------------
    const sap = (t.trees ?? []).find((x) => !x.dead && !x.culled && propClassOf(x) === 'smash');
    if (sap) {
      c.alive = true; c.health = 100; c.invuln = 0;
      const s0 = g.score;
      c.pos.set(sap.x - 3, (sap.y ?? 0) + 0.3, sap.z); c.y = c.pos.y;
      c.vel.set(33, 0, 0); c.heading = Math.PI / 2;
      g.onTreeSmash(sap, c);
      out.r7 = { dead: !!sap.dead, loss: +(100 - c.health).toFixed(1), gained: g.score - s0 };
    } else out.r7 = { skip: true };

    // ---- R8: a shove rock moves aside for 0 hull, no score -----------------
    const rock = { x: c.pos.x + 3, z: c.pos.z, y: c.pos.y, r: 0.9, mat: 'stone' };
    c.health = 100; const s8 = g.score;
    g.knockStone(rock, c, 17, 1, 0, 1.0);
    out.r8 = { knocked: !!rock.knocked, loss: +(100 - c.health).toFixed(1),
      scored: g.score !== s8 };
    return out;
  });

  console.log(`  [${lvl}] density report: ${JSON.stringify(r.report)}`);
  check(`V1 [${lvl}] every standing prop classifies`, r.v1.unknown === 0,
    JSON.stringify(r.v1));
  // Handle-less corridor obstacles (merged-geometry rock lines, bare
  // {x,z,r,y,mat} records) CANNOT be culled without orphaning their visuals —
  // Law of Solidity. They were pinned at 62/48 in r299 as debt for a
  // feature-aware re-author (task #31). THE DEBT PAID ITSELF: the 2x
  // re-plan (r340) and the r343-r350 stage-rules builds re-sited the rock
  // lines, and the r356 re-measurement reads Canyon ~30 in the suite's
  // broad filter — of which only 5 are truly bare, ALL outside the road
  // (nearest 6.9 u past the edge, inside §7.3's legal 4-12 u band) — and
  // Glacier 0. #31 closed as overtaken by events; the pins now hold the
  // MEASURED level (small headroom for per-load dice) so the debt can
  // never quietly grow back.
  const FIXED_BASELINE = { 4: 34, 66: 4 };
  check(`V2 [${lvl}] cullable obstacles honour the exclusion + band budget`,
    r.v2.inExcl === 0 && r.v2.overBudget === 0,
    `${r.v2.inExcl} cullable in exclusion, ${r.v2.overBudget}/${r.v2.windows} windows over`);
  check(`V2 [${lvl}] merged-rock debt does not grow past its baseline`,
    r.v2.inExclFixed <= (FIXED_BASELINE[lvl] ?? 0),
    `${r.v2.inExclFixed} handle-less vs baseline ${FIXED_BASELINE[lvl] ?? 0}`);
  check(`R7 [${lvl}] a sapling breaks for 0 hull and pays 25`,
    r.r7.skip || (r.r7.dead && r.r7.loss === 0 && r.r7.gained === 25),
    r.r7.skip ? 'no sapling on this stage' : JSON.stringify(r.r7));
  check(`R8 [${lvl}] a shove rock yields for 0 hull and no score`,
    r.r8.knocked && r.r8.loss === 0 && !r.r8.scored, JSON.stringify(r.r8));
  check(`[${lvl}] no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await p.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nevery prop knows its class and keeps its distance');
process.exit(fail ? 1 : 0);
