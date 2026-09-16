/* E-34 acceptance instrument, written BEFORE the elevation change.
 *
 * The owner's sentence has two halves and they pull in opposite directions:
 * "I still miss nice iconic hills drives" wants MORE crests, "it's going sharp
 * up and downs" forbids buying them with altitude -- and 7.17(a) binds the
 * road's height RANGE to stay modest. So the metric has to separate the two:
 *
 *   crests   : local maxima with at least MIN_SWING of rise before and fall
 *              after, counted per km of lap. This is "hills".
 *   range    : max road y minus min road y. This must NOT grow. This is the
 *              "sharp up and downs" guard.
 *   maxGrade : steepest station grade, and the 95th percentile. WR-2.1 wants
 *              4-12%; a crest bought by steepening is the wrong crest.
 *
 * Counted at TWO swing thresholds because the E-30 pass used 1.5 m only and
 * would not have seen a 0.6 m ripple -- the small one is the ripple a driver
 * feels through the seat, the large one is a hill they see coming.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const IDS = (process.env.IDS ?? '19,21,10,2,5,45,23,64').split(',');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
console.log('world                 lapKm  range  crests/km(0.6) (2.0)  maxGrade%  p95Grade%  ascent');
for (const id of IDS) {
  const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
  p.setDefaultTimeout(300000);
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
    await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
    const R = await p.evaluate(() => {
      const g = window.__game, tk = g.track, C = tk.center, N = C.length;
      let lap = 0; const seg = [];
      for (let i = 0; i < N; i++) { const a = C[i], b = C[(i+1)%N];
        const d = Math.hypot(b.x-a.x, b.z-a.z); seg.push(d); lap += d; }
      let ymin = Infinity, ymax = -Infinity;
      for (let i = 0; i < N; i++) { ymin = Math.min(ymin, C[i].y); ymax = Math.max(ymax, C[i].y); }
      // grades per station, as a percentage of run
      const gr = [];
      for (let i = 0; i < N; i++) gr.push(Math.abs(C[(i+1)%N].y - C[i].y) / Math.max(0.1, seg[i]) * 100);
      const gs = [...gr].sort((a,b)=>a-b);
      // crest count at a swing threshold: walk the ring, count completed
      // up-then-down cycles whose rise AND fall both clear the threshold
      const crests = (T) => {
        let n = 0, up = true, peak = C[0].y, trough = C[0].y;
        for (let i = 1; i <= N; i++) {
          const y = C[i % N].y;
          if (up) { if (y > peak) peak = y;
            else if (peak - y >= T) { n++; up = false; trough = y; } }
          else { if (y < trough) trough = y;
            else if (y - trough >= T) { up = true; peak = y; } }
        }
        return n;
      };
      return { name: g.level?.name, lap, range: ymax - ymin,
        c06: crests(0.6), c20: crests(2.0),
        maxG: gs[gs.length-1], p95: gs[(gs.length*0.95)|0],
        ascent: tk.T?.elev?.profile === 'ascent', amp: tk.T?.elev?.amp ?? null };
    });
    console.log(`${String(R.name).padEnd(20)} ${(R.lap/1000).toFixed(2).padStart(6)} `
      + `${R.range.toFixed(0).padStart(6)} ${(R.c06/(R.lap/1000)).toFixed(1).padStart(14)} `
      + `${(R.c20/(R.lap/1000)).toFixed(1).padStart(5)} ${R.maxG.toFixed(1).padStart(10)} `
      + `${R.p95.toFixed(1).padStart(10)}  ${R.ascent ? 'ASCENT' : 'octave amp ' + R.amp}`);
  } catch (e) { console.log(`level ${id}: ERROR ${String(e.message).slice(0,90)}`); }
  await p.close();
}
await browser.close();
