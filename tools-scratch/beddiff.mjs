/* WHERE DOES THE CAPPED BED FIRST DIVERGE, AND WHAT IS THERE?
 *
 * PIKES PEAK's ford 0 went from wet (-0.11 u) to dry (-15 u) under the culvert
 * cap, and survived being re-anchored to genuine crossings. Guessing has now
 * cost two rounds, so this dumps `R.bed` from both trees, finds the first
 * station that differs, and prints what the road is doing there — distance,
 * deck height, nearest ford — alongside the ford's own station.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const PRE = process.env.PRE ?? 'http://localhost:8956';
const ID = process.env.LEVEL ?? '25';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 400, height: 260 } });
page.setDefaultTimeout(900000);
const grab = async (root) => {
  await page.goto(`${root}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 });
  return page.evaluate(async () => {
    const THREE = await import('three');
    const t = window.__game.track, R = t._river;
    const V = new THREE.Vector3();
    return {
      name: window.__game.level?.name,
      bed: Array.from(R.bed ?? []),
      flow: R.flow,
      line: R.line.map((p) => ({ x: +p.x.toFixed(1), z: +p.z.toFixed(1),
        d: +t._distToTrackCoarse(p.x, p.z).toFixed(1),
        deck: +t.center[t.nearestIndex(V.set(p.x, 0, p.z))].y.toFixed(2),
        side: (() => { const i = t.nearestIndex(V.set(p.x, 0, p.z));
          const c = t.center[i], n = t.nrm[i];
          return +((p.x - c.x) * n.x + (p.z - c.z) * n.z).toFixed(1); })() })),
      fords: (t.fords ?? []).map((f) => ({ i: f.i, x: +f.x.toFixed(1), z: +f.z.toFixed(1),
        y: +t.center[f.i].y.toFixed(2),
        k: R.line.reduce((best, p, k) => {
          const dd = Math.hypot(p.x - f.x, p.z - f.z);
          return dd < best.dd ? { k, dd } : best;
        }, { k: -1, dd: Infinity }).k })),
    };
  });
};
const A = await grab(PRE), B = await grab(BASE);
console.log(`${A.name}  flow ${A.flow}  ${A.bed.length} bed stations`);
console.log('fords at line stations: ' + A.fords.map((f) => `k=${f.k} deck=${f.y}`).join(', '));
// Walk ALONG THE FLOW: for flow -1 the reach runs from the last station to the
// first, so a running minimum carries a cap DOWNSTREAM toward k=0. Diffing in
// array order therefore reports the far tail, which is the consequence, not the
// cause. The cause is the first divergence in flow order.
const order = A.flow > 0 ? A.bed.map((_, k) => k) : A.bed.map((_, k) => A.bed.length - 1 - k);
let cause = -1;
for (const k of order) { if (Math.abs(A.bed[k] - B.bed[k]) > 0.01) { cause = k; break; } }
console.log(`first divergence ALONG THE FLOW: k=${cause}` + (cause < 0 ? ' (identical)' : ''));
const marks = new Map(A.fords.map((f) => [f.k, f]));
console.log('\n   k    roadDist  deck    side   bed BEFORE   bed AFTER   delta');
for (const k of order) {
  const dl = B.bed[k] - A.bed[k];
  if (!(A.line[k].d < 30 || marks.has(k) || k === cause)) continue;
  console.log(`${String(k).padStart(4)} ${String(A.line[k].d).padStart(9)} ${String(A.line[k].deck).padStart(7)} `
    + `${String(A.line[k].side).padStart(7)} `
    + `${A.bed[k].toFixed(2).padStart(11)} ${B.bed[k].toFixed(2).padStart(11)} ${dl.toFixed(2).padStart(7)}`
    + (marks.has(k) ? '   <== FORD' : '') + (k === cause ? '   <== FIRST DIVERGENCE' : ''));
}
await b.close();
