/* BEFORE vs AFTER on every world that has an overpass.
 *
 * Three numbers per world, because a clearance fix that buys a bridge and
 * sells a driveable road is not a fix:
 *   CLEARANCE  the vertical gap at each crossing (the thing being fixed)
 *   GRADE      p90 and max of the finished profile (the thing at risk)
 *   INDEX      samples where nearestIndex, standing still on its own sample
 *              with its own hint, answers more than 8 away (the downstream
 *              symptom: coplanar legs it cannot separate)
 */
import { chromium } from 'playwright-core';

const WORLDS = [57, 59, 55, 32, 37, 54, 56, 60];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

const measure = async (page, base, id) => {
  await page.goto(`${base}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!ok) return null;
  return page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    const run = Math.max(0.5, t.segLen);
    const cd = (a, c) => Math.min((a - c + N) % N, (c - a + N) % N);
    const g = [];
    for (let i = 0; i < N; i++) g.push(Math.abs(t.center[(i + 1) % N].y - t.center[i].y) / run);
    const sorted = [...g].sort((a, c) => a - c);
    let badIdx = 0;
    for (let i = 0; i < N; i++) {
      const c = t.center[i];
      const pos = { x: c.x, y: c.y + 1.0, z: c.z };
      if (cd(t.nearestIndex(pos, i, true), i) > 8 || cd(t.nearestIndex(pos, null, true), i) > 8) badIdx++;
    }
    return {
      name: t.level?.name ?? '?',
      gaps: (t._overpasses ?? []).map((o) => +(t.center[o.up].y - t.center[o.down].y).toFixed(2)),
      p90: +sorted[Math.floor(0.9 * (N - 1))].toFixed(3),
      max: +Math.max(...g).toFixed(3),
      over24: g.filter((v) => v > 0.24).length,
      badIdx,
    };
  });
};

const pA = await b.newPage({ viewport: { width: 640, height: 400 } }); pA.setDefaultTimeout(600000);
const pB = await b.newPage({ viewport: { width: 640, height: 400 } }); pB.setDefaultTimeout(600000);

let lowBefore = 0, lowAfter = 0, badBefore = 0, badAfter = 0;
for (const id of WORLDS) {
  const before = await measure(pB, 'http://localhost:8922', id);
  const after = await measure(pA, 'http://localhost:8921', id);
  if (!before || !after) { console.log(`SKIP ${id}`); continue; }
  const lo = (gs) => gs.filter((v) => v < 6).length;
  lowBefore += lo(before.gaps); lowAfter += lo(after.gaps);
  badBefore += before.badIdx; badAfter += after.badIdx;
  console.log(`\n== ${id} ${before.name}  (${before.gaps.length} crossings)`);
  console.log(`   BEFORE clearance ${before.gaps.map((v) => String(v).padStart(6)).join(' ')}`);
  console.log(`   AFTER  clearance ${after.gaps.map((v) => String(v).padStart(6)).join(' ')}`);
  console.log(`   under 6 u: ${lo(before.gaps)} -> ${lo(after.gaps)}    `
    + `grade p90 ${(before.p90 * 100).toFixed(0)}%->${(after.p90 * 100).toFixed(0)}%  `
    + `max ${(before.max * 100).toFixed(0)}%->${(after.max * 100).toFixed(0)}%  `
    + `over24 ${before.over24}->${after.over24}    `
    + `bad index samples ${before.badIdx}->${after.badIdx}`);
}
console.log(`\n===== crossings under 6 u of clearance: ${lowBefore} -> ${lowAfter}`);
console.log(`===== samples where nearestIndex answers wrong standing still: ${badBefore} -> ${badAfter}`);
await b.close();
