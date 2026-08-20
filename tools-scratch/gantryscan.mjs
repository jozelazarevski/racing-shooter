/* IS THERE ANYWHERE FOR THIS GANTRY TO STAND?
 *
 * MOUNTAIN TO SEA carries roadWidth 5 — a 45 u half-width boulevard — and the
 * start gantry's scaffold towers walk outward from 12.5 u in 18 one-metre
 * steps, reaching 29.5: never out of their own road. Anchoring that walk to
 * the kerb was tried and made it WORSE (bite 22.34 -> 28.33 u) because the lap
 * doubles back and 48 u along sample 0's normal lands in another stretch.
 *
 * So before choosing a fix, ask whether a clear spot EXISTS. Sweep the whole
 * plausible space — both sides, 0 to 140 u out, and a spread of stations
 * either side of the start line — and report the best margin found and where.
 * If nothing clears, the answer is not a better search.
 */
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
  // the leg cluster spans +-0.8 about the base and each leg carries r 0.6
  const R = 1.8;
  const margin = (x, z) => {
    const i = t.nearestIndex(v.set(x, 0, z));
    const half = t.widthAt ? t.widthAt(i) : 9;
    return t._distToTrack(x, z) - R - half;
  };
  let best = null;
  const rows = [];
  for (const st of [0, 4, 8, 12, -4, -8, -12]) {
    const j = ((st % N) + N) % N;
    const c = t.center[j], n = t.nrm[j];
    for (const side of [1, -1]) {
      // the FIRST offset that clears, not the best — the gantry wants to stand
      // as close to its own start line as it can, and "best margin" just runs
      // to the end of the search and says nothing about whether 30 would do
      let bestHere = null, firstClear = null;
      for (let off = 8; off <= 140; off += 1) {
        const x = c.x + n.x * off * side, z = c.z + n.z * off * side;
        const m = margin(x, z);
        if (!bestHere || m > bestHere.m) bestHere = { m, off, side, st };
        if (firstClear === null && m >= 0.6) firstClear = { m: +m.toFixed(2), off };
      }
      bestHere.firstClear = firstClear;
      rows.push(bestHere);
      if (!best || bestHere.m > best.m) best = bestHere;
    }
  }
  return { name: g.level?.name, roadWidth: t.T.roadWidth ?? 1,
    halfAtStart: +t.widthAt(0).toFixed(1),
    best: { margin: +best.m.toFixed(2), off: best.off, side: best.side, station: best.st },
    rows: rows.map((q) => ({ st: q.st, side: q.side, bestOff: q.off, bestM: +q.m.toFixed(2),
      firstClear: q.firstClear })),
    anyClear: rows.some((q) => q.m >= 0.6) };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
