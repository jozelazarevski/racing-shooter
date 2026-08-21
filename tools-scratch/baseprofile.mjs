/* IS THE CAP SMOOTH ALONG THE LAP, OR DOES IT STEP?
 *
 * The ribbon is a strip between consecutive stations. If the cap engages
 * abruptly — station 818 held at its natural 37 u, station 819 pulled to 11.3 —
 * then the quad joining them spans 26 u sideways and tens of units vertically
 * in one segment, and that stretched triangle sweeps across whatever lies
 * between. Which is the road.
 *
 * So print the built base and height, station by station, through the stretch
 * the occlusion sweep flagged, and look for the step.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 4);
const FROM = Number(process.env.FROM ?? 806), TO = Number(process.env.TO ?? 832);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=${ID}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(([from, to]) => {
  const g = window.__game, t = g.track;
  const rows = [];
  for (let j = from; j <= to; j++) {
    const L = t._cliffProfile(j, 1), R = t._cliffProfile(j, -1);
    rows.push({ j, lBase: +L.base.toFixed(1), lH: +L.h.toFixed(1),
      rBase: +R.base.toFixed(1), rH: +R.h.toFixed(1) });
  }
  let maxStep = 0, at = -1, which = '';
  for (let k = 1; k < rows.length; k++) {
    for (const s of ['lBase', 'rBase']) {
      const d = Math.abs(rows[k][s] - rows[k - 1][s]);
      if (d > maxStep) { maxStep = d; at = rows[k].j; which = s; }
    }
  }
  return { name: g.level?.name, rows, maxStep: +maxStep.toFixed(1), at, which };
}, [FROM, TO]);
console.log(`${r.name}  biggest one-station jump in setback: ${r.maxStep} u at station ${r.at} (${r.which})\n`);
console.log('    j    left base / height     right base / height');
for (const q of r.rows) {
  console.log(`  ${String(q.j).padStart(4)}   ${String(q.lBase).padStart(6)} / ${String(q.lH).padStart(5)}   `
    + `      ${String(q.rBase).padStart(6)} / ${String(q.rH).padStart(5)}`);
}
await b.close();
