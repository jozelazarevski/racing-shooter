/* IS EVERY PLANNED FORD STILL WET?
 *
 * The culvert cap in `_planRiver` lowers the riverbed under the road away from
 * fords. A ford is exempt by name (FORD_KEEP), but a cap applied UPSTREAM
 * propagates downstream through the running minimum, so a ford could still
 * arrive at a level far under its deck and be gated off by `_buildRiver`'s
 * height gate. That would trade one defect for another.
 *
 * The absolute number cannot answer it — plenty of fords on this roster were
 * already dry before the change (the road bridges a ravine there; see the note
 * in `_buildFords`). So this measures the SAME metric on both trees and prints
 * them side by side: for every planned ford, the water height nearest the
 * crossing relative to the deck. A ford that was wet and is now dry is a
 * regression; one that was dry before and after is pre-existing.
 *
 *   BASE=<patched>  PRE=<pristine worktree>  node tools-scratch/fordwet.mjs
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const PRE = process.env.PRE ?? 'http://localhost:8956';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 400, height: 260 } });
page.setDefaultTimeout(900000);

const measure = async (root, id) => {
  await page.goto(`${root}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 })
    .then(() => 1).catch(() => 0);
  if (!ok) return null;
  return page.evaluate(async () => {
    const THREE = await import('three');
    const t = window.__game.track;
    const waters = [];
    t.group.traverse((o) => { if (/river-water/i.test(o.name || '') && o.geometry) waters.push(o); });
    const V = new THREE.Vector3();
    return {
      name: window.__game.level?.name,
      fords: (t.fords ?? []).map((f) => {
        // the water vertex closest to the crossing, and its height over the deck
        let best = Infinity, dy = null;
        for (const w of waters) {
          const pos = w.geometry.attributes.position; w.updateWorldMatrix(true, false);
          for (let i = 0; i < pos.count; i++) {
            V.fromBufferAttribute(pos, i); w.localToWorld(V);
            const d = Math.hypot(V.x - f.x, V.z - f.z);
            if (d < best) { best = d; dy = V.y - t.center[f.i].y; }
          }
        }
        return { i: f.i, d: +best.toFixed(1), dy: dy == null ? null : +dy.toFixed(2) };
      }),
    };
  });
};

console.log('world                  ford   BEFORE water-vs-deck   AFTER      verdict');
for (const id of (process.env.WORLDS ?? '1,8,12,13,25,29,31,36,37,38,50,52').split(',')) {
  const pre = await measure(PRE, id);
  const post = await measure(BASE, id);
  if (!pre || !post) { console.log(`level ${id}: did not build`); continue; }
  if (!pre.fords.length) { console.log(`${String(pre.name).padEnd(22)} (no fords)`); continue; }
  for (let k = 0; k < pre.fords.length; k++) {
    const a = pre.fords[k], c = post.fords[k];
    if (!c) { console.log(`${String(pre.name).padEnd(22)} ${k}  FORD DISAPPEARED`); continue; }
    // "wet" = the nearest water is close in plan AND within a car's height of the deck
    const wet = (q) => q.dy != null && q.d < 14 && Math.abs(q.dy) < 1.5;
    const v = wet(a) && !wet(c) ? 'REGRESSION — was wet, now dry'
      : !wet(a) && wet(c) ? 'now wet (was dry)'
        : wet(a) ? 'wet, still wet' : 'dry before and after';
    console.log(`${String(pre.name).padEnd(22)} ${k}   ${String(a.dy).padStart(7)} u @${String(a.d).padStart(5)}   `
      + `${String(c.dy).padStart(7)} u @${String(c.d).padStart(5)}   ${v}`);
  }
}
await b.close();
