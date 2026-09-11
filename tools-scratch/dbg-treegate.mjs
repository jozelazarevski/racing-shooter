/* "I can still drive in trees" (owner, 2026-09-11, after r399 and r410 both
 * claimed to fix it). Working rule 3: a fix that failed twice has a second
 * code path.
 *
 * CANDIDATE: the carpet-trunk collision in vehicles.js gates on height —
 *   if (this.pos.y > tr.top + 1 || this.pos.y < tr.top - 11) continue;
 * A car sitting on the ground next to a tree whose crown tops out more than
 * ~11.5 u above it fails the lower bound and the trunk is skipped entirely.
 * If registered trees are commonly taller than that, tall wood is
 * drive-through at ground level however solid the trunk law is.
 *
 * This measures the gate directly: for every registered tree near the road,
 * take the ground height at its base as the car's y and ask whether the gate
 * would admit or skip it.
 *
 *   node tools-scratch/dbg-treegate.mjs 0 12 30 47 66
 */
import { chromium } from 'playwright-core';
const LEVELS = process.argv.slice(2).map(Number).filter(Number.isFinite);
const USE = LEVELS.length ? LEVELS : [0, 12, 30, 47, 66];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);

for (const lv of USE) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`,
    { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center?.length, undefined, { timeout: 600000 });
  console.log(JSON.stringify(await p.evaluate(() => {
    const t = window.__game.track;
    const CARY = 0.55;                    // chassis origin above ground, near enough
    let near = 0, skipped = 0, admitted = 0;
    const hs = [];
    for (const tr of t.camTrees ?? []) {
      if (!(tr.r > 0)) continue;
      const d = t._distToTrack(tr.x, tr.z);
      if (d > 40) continue;               // the belt a car can actually reach
      near++;
      const ground = t.terrainHeight(tr.x, tr.z);
      const y = ground + CARY;            // car standing at the tree's base
      const h = tr.top - ground;          // how tall the tree reads to the gate
      hs.push(h);
      if (y > tr.top + 1 || y < tr.top - 11) skipped++; else admitted++;
    }
    hs.sort((a, c) => a - c);
    const pct = (q) => hs.length ? +hs[Math.floor(q * (hs.length - 1))].toFixed(2) : null;
    return { world: t.level?.name, nearRoad: near,
      SKIPPED_BY_HEIGHT_GATE: skipped, admitted,
      skippedPct: near ? +(100 * skipped / near).toFixed(1) : 0,
      treeHeight: { min: pct(0), p50: pct(0.5), p90: pct(0.9), max: pct(1) } };
  }, undefined)));
}
await b.close();
