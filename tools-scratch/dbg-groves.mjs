/* E-24: "The olive and wine grows needs to be more dense where applies."
 *
 * The three numbers r413 used, so a denser grove cannot silently re-grow the
 * near-road wall the owner had removed:
 *   - instances registered in camTrees (the verge + mid rings)
 *   - the nearest one to the road edge
 *   - how many sit inside 20 u
 * plus the split across the two rings the code actually has
 * (verge trackSpot(1,38), mid trackSpot(38,160)) and the vine-row system,
 * which is separate geometry and not in camTrees at all.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8931';
const IDS = (process.env.IDS ?? '29,39,45,62,63,64,56,61,46,55,73,75,76,77').split(',');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const out = [];
for (const id of IDS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  p.setDefaultTimeout(300000);
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
    await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
    out.push({ id, ...await p.evaluate(() => {
      const g = window.__game, tk = g.track, T = tk.T ?? {};
      const th = g.level?.theme;
      const ct = tk.camTrees ?? [];
      let near = Infinity, in20 = 0, verge = 0, mid = 0, far = 0;
      for (const t of ct) {
        const d = tk._distToTrack(t.x, t.z);
        if (d < near) near = d;
        if (d <= 20) in20++;
        if (d <= 38) verge++; else if (d <= 160) mid++; else far++;
      }
      const solids = tk.trees ?? [];
      let sNear = Infinity, sIn20 = 0;
      for (const t of solids) {
        const d = tk._distToTrack(t.x, t.z);
        if (d < sNear) sNear = d;
        if (d <= 20) sIn20++;
      }
      let vineInst = 0;
      tk.group?.traverse?.((o) => {
        if (o.isInstancedMesh && /vine|row|crop/i.test(o.name || '')) vineInst += o.count || 0;
      });
      return { theme: th, belt: T.treeBelt ? `${T.treeBelt[0]}-${T.treeBelt[1]}` : '--',
        olives: th === 'medterrace' || th === 'olivecountry',
        vineRows: T.vineRows ? (T.vineRows.count ?? '?') : null, vineInst, vs: tk._vineStats ?? null,
        solidRej: tk._carpetSolidRejects ?? null, solids: solids.length, sNear: Number.isFinite(sNear) ? +sNear.toFixed(1) : null, sIn20,
        total: ct.length, near: Number.isFinite(near) ? +near.toFixed(1) : null,
        in20, verge, mid, far, name: g.level?.name };
    }) });
  } catch (e) { out.push({ id, name: '(load failed)', err: String(e.message).slice(0, 80) }); }
  await p.close();
}
await browser.close();
console.log('world                theme        olive  carpet  verge<38  mid38-160  in20u  near   solidTrees  sIn20  sNear  vineRows');
for (const w of out) {
  if (!w.total && w.total !== 0) { console.log(`${String(w.name).padEnd(20)} ${w.err ?? 'no data'}`); continue; }
  console.log(`${w.name.padEnd(20)} ${String(w.theme).padEnd(12)} ${(w.olives ? 'YES' : ' no').padEnd(6)} ${String(w.total).padStart(7)} ${String(w.verge).padStart(9)} ${String(w.mid).padStart(10)} ${String(w.in20).padStart(6)} ${String(w.near ?? '--').padStart(5)} ${(String(w.solids)+'/rej'+String(w.solidRej)).padStart(14)} ${String(w.sIn20).padStart(6)} ${String(w.sNear ?? '--').padStart(6)}  ${w.vineRows == null ? '--' : w.vineRows + 'p/' + w.vineInst + (w.vs ? ` [planted ${w.vs.planted} steep ${w.vs.tooSteep} short ${w.vs.shortPath} seedNull ${w.vs.seedNull}]` : '')}`);
}
