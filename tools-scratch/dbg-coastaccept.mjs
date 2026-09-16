/* E-31 / E-32 acceptance, r437. The numbers were written into RALLY_RULES
 * BEFORE the code, and this is the instrument that reads them:
 *
 *   A1  share of lap within 60 u of REAL water            target >= 35%
 *   A2  longest CONTIGUOUS run within 60 u of water       target >= 600 u
 *   A4  boats within 200 u of the lap, on quay worlds     target >= 1
 *
 * A2 is the clause r429 had no equivalent of, and the whole point of this
 * build: "next to the sea" is a property of the LAP, not of its nearest point,
 * and r429 scored 34 u minimum on every world while the median stayed 390-1198.
 *
 * THE RULER IS `_underwater`, not the coast model. Two earlier instruments
 * measured proxies and both were wrong in opposite directions (see
 * dbg-seawater.mjs); this marches out from the road edge until it finds a
 * point that actually gets drawn blue and actually drowns a car.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const IDS = (process.env.IDS ?? '57,58,59,60,50,51,52,53,54,62,73,75,76,77,49').split(',');
const NOPULL = process.env.NOPULL === '1';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

console.log(`world                 %lap<=60u  longestRun   min   median  boats<=200u  quay  ${NOPULL ? '(BASELINE, no pull)' : ''}`);
let a1 = 0, a2 = 0, a4 = 0, tot = 0, quayTot = 0;
for (const id of IDS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  p.setDefaultTimeout(300000);
  if (NOPULL) await p.addInitScript(() => { window.__NOCOASTPULL = true; });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
    await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
    const r = await p.evaluate(() => {
      const g = window.__game, tk = g.track, C = tk.center, N = C.length;
      if (!tk.T?.coast) return { name: g.level?.name, hasCoast: false };
      const STEP = 3, REACH = 600;
      const d = [], seg = [];
      for (let i = 0; i < N; i++) {
        const c = C[i], n = C[(i + 1) % N];
        let tx = n.x - c.x, tz = n.z - c.z;
        const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        seg.push(tl);
        const half = Number(tk.widthAt ? tk.widthAt(i) : 9);
        let best = Infinity;
        for (const sgn of [1, -1]) {
          const nx = -tz * sgn, nz = tx * sgn;
          for (let r2 = half; r2 <= REACH; r2 += STEP) {
            if (tk._underwater(c.x + nx * r2, c.z + nz * r2)) { best = Math.min(best, r2 - half); break; }
          }
        }
        d.push(best);
      }
      const lap = seg.reduce((a, b) => a + b, 0);
      let near = 0;
      for (let i = 0; i < N; i++) if (d[i] <= 60) near += seg[i];
      // A2: the longest CONTIGUOUS run. The lap is a LOOP, so a run that
      // straddles the start/finish line is one run, not two -- walk 2N.
      let run = 0, bestRun = 0;
      for (let i = 0; i < 2 * N; i++) {
        if (d[i % N] <= 60) { run += seg[i % N]; if (run > bestRun) bestRun = run; }
        else run = 0;
      }
      bestRun = Math.min(bestRun, lap);
      const fin = d.filter(Number.isFinite).sort((a, b) => a - b);
      // A4: boats, measured the same way the E-32 census measured them
      const xf = (e, x, y, z) => ({ x: e[0]*x + e[4]*y + e[8]*z + e[12], z: e[2]*x + e[6]*y + e[10]*z + e[14] });
      const dLap = (x, z) => { let b = Infinity;
        for (let i = 0; i < N; i++) { const dx = x - C[i].x, dz = z - C[i].z; const q = dx*dx + dz*dz; if (q < b) b = q; }
        return Math.sqrt(b); };
      let boats200 = 0;
      g.scene.traverse((o) => {
        if (!/fleet|boat|sail/i.test((o.name || '') + ' ' + (o.geometry?.name || ''))) return;
        if (o.isInstancedMesh) {
          const A = o.instanceMatrix.array, W = o.matrixWorld.elements;
          for (let i = 0; i < o.count; i++) {
            const b = i * 16, w = xf(W, A[b+12], A[b+13], A[b+14]);
            if (dLap(w.x, w.z) <= 200) boats200++;
          }
        }
      });
      return { name: g.level?.name, hasCoast: true, quay: !!tk.T.quay, lap,
        pct: 100 * near / lap, bestRun, boats200,
        min: fin.length ? fin[0] : null, med: fin.length ? fin[fin.length >> 1] : null,
        reach: fin.length, N };
    });
    if (!r.hasCoast) { console.log(`${String(r.name).padEnd(20)}  (no coast)`); }
    else {
      tot++;
      if (r.pct >= 35) a1++;
      if (r.bestRun >= 600) a2++;
      if (r.quay) { quayTot++; if (r.boats200 >= 1) a4++; }
      console.log(`${String(r.name).padEnd(20)} ${r.pct.toFixed(1).padStart(8)} `
        + `${String(Math.round(r.bestRun)).padStart(11)} ${String(r.min === null ? '--' : r.min.toFixed(0)).padStart(6)} `
        + `${String(r.med === null ? '--' : r.med.toFixed(0)).padStart(7)} ${String(r.boats200).padStart(11)}  ${r.quay ? 'yes' : ' no'}`);
    }
  } catch (e) { console.log(`level ${id}: ERROR ${String(e.message).slice(0, 120)}`); }
  if (errs.length) console.log('   PAGE ERRORS:', errs.slice(0, 2));
  await p.close();
}
console.log(`\nA1 (>=35% within 60 u): ${a1}/${tot}   A2 (run >=600 u): ${a2}/${tot}   A4 (boats<=200u): ${a4}/${quayTot} quay worlds`);
await browser.close();
