/* HOW MANY WORLDS HAVE NOWHERE TO PUT A START TOWER?
 *
 * MOUNTAIN TO SEA has none: its start line runs alongside another leg of its
 * own lap and both roads are 90 u wide, leaving a 21 u corridor where 46.8 u
 * is needed. The towers get built in the carriageway anyway, with their
 * colliders dropped so they do not dead-stop anyone — four bare poles standing
 * on the tarmac, which is the one standing failure in test-roadclear.
 *
 * Skipping a tower that cannot stand anywhere is the fix, but the threshold
 * decides the blast radius, so measure it: replay the builder's own scoring
 * walk on every world and report the best margin it can reach.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const rows = await p.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const v = new THREE.Vector3();
  const out = [];
  for (const lv of LEVELS) {
    g.state = 'title'; g.editScene = null;
    g.swapLevel(lv, true, null);
    await new Promise((r) => requestAnimationFrame(r));
    const t = g.track;
    const c = t.center[0], n = t.nrm[0];
    const worst = [];
    for (const side of [1, -1]) {
      let best = -Infinity;
      for (let k = 0; k < 18; k++) {                 // the builder's own walk
        const off = 12.5 + k;
        const px = c.x + n.x * off * side, pz = c.z + n.z * off * side;
        const near = t.nearestIndex(v.set(px, 0, pz));
        const half = t.widthAt ? t.widthAt(near) : 9;
        const m = t._distToTrack(px, pz) - 1.8 - half;
        if (m > best) best = m;
        if (m >= 0.6) break;
      }
      worst.push(+best.toFixed(2));
    }
    out.push({ id: lv.id, name: lv.name, left: worst[0], right: worst[1],
      worst: Math.min(worst[0], worst[1]) });
  }
  return out;
});
rows.sort((a, b2) => a.worst - b2.worst);
console.log('  worlds whose start tower cannot clear, worst side first:');
let n3 = 0, n0 = 0;
for (const r of rows) {
  if (r.worst < -3) n3++;
  if (r.worst < 0) n0++;
  if (r.worst < 0) {
    console.log(`  L${String(r.id).padStart(2)} ${String(r.name).padEnd(22)} left ${String(r.left).padStart(7)}  right ${String(r.right).padStart(7)}`);
  }
}
console.log(`\n  ${n0} of ${rows.length} worlds have a tower side that does not clear at all`);
console.log(`  ${n3} of ${rows.length} have one deeper than 3 u into a lane (test-roadclear's own law)`);
await b.close();
