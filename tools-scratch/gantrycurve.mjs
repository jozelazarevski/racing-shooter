/* THE MARGIN CURVE ALONG THE START LINE'S NORMAL.
 * "First offset that clears" is 122 u, which would put the scaffold two and a
 * half road-widths away and stretch its banner across 244 u. Before accepting
 * that, look at the whole curve: how negative is it in between, and WHICH
 * stretch of road is responsible at each point. A near-miss at 50 u is a
 * different problem from a 20 u deficit. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 57);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=${ID}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game, t = g.track, N = t.center.length;
  const v = new THREE.Vector3();
  const c = t.center[0], n = t.nrm[0];
  const out = [];
  for (const side of [1, -1]) {
    for (let off = 12; off <= 130; off += 6) {
      const x = c.x + n.x * off * side, z = c.z + n.z * off * side;
      const i = t.nearestIndex(v.set(x, 0, z));
      const half = t.widthAt(i);
      const d = t._distToTrack(x, z);
      out.push({ side, off, blame: i, half: +half.toFixed(1),
        dist: +d.toFixed(1), margin: +(d - 1.8 - half).toFixed(1) });
    }
  }
  return { name: g.level?.name, N, out };
});
console.log(r.name);
console.log('  side  off   nearest-road-sample  its half   dist   margin');
for (const q of r.out) {
  console.log(`  ${String(q.side).padStart(4)} ${String(q.off).padStart(4)}   `
    + `${String(q.blame).padStart(17)}   ${String(q.half).padStart(7)} ${String(q.dist).padStart(6)} `
    + `${String(q.margin).padStart(7)}`);
}
await b.close();
