/* E-33: "The fence is levitating" (SALINE SPRINT, r436).
 *
 * THE INSTRUMENT IS THE SUSPECT FIRST. test-nothing-floats passed on r436 --
 * the exact build in the owner's frame -- so before asking why the fence
 * floats, ask why the suite says it does not. K-21 is the precedent: LAW 4
 * measures a part's BASE and raycasts down, and my cruder origin-to-ground
 * probe disagreed with it in both directions.
 *
 * So measure the gap the way the EYE sees it: lowest WORLD-SPACE vertex of
 * each body against the terrain under that same point. Report per class, so
 * the answer says WHICH builder is wrong rather than "something floats".
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const IDS = (process.env.IDS ?? '64').split(',');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

for (const id of IDS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  p.setDefaultTimeout(300000);
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const R = await p.evaluate(() => {
    const g = window.__game, tk = g.track;
    const xf = (e, x, y, z) => ({
      x: e[0]*x + e[4]*y + e[8]*z + e[12],
      y: e[1]*x + e[5]*y + e[9]*z + e[13],
      z: e[2]*x + e[6]*y + e[10]*z + e[14] });
    const mul = (A, B) => { const o = new Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        let v = 0; for (let k = 0; k < 4; k++) v += A[k*4+r] * B[c*4+k];
        o[c*4+r] = v; } return o; };
    const byClass = {};
    const byAnalytic = {};
    const worst = [];
    g.scene.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh) return;
      const nm = (o.name || '') + ' ' + (o.geometry?.name || '');
      if (!/fence|rail|barrier|wall|post|kerb|block|bale|tyre|guard/i.test(nm)) return;
      const geo = o.geometry; const pos = geo?.attributes?.position;
      if (!pos) return;
      const mats = [];
      if (o.isInstancedMesh) {
        const A = o.instanceMatrix.array, W = o.matrixWorld.elements;
        for (let i = 0; i < o.count; i++) mats.push(mul(W, Array.from(A.slice(i*16, i*16+16))));
      } else mats.push(Array.from(o.matrixWorld.elements));
      for (const M of mats) {
        // lowest world vertex, and the XZ it sits over
        let lowY = Infinity, lx = 0, lz = 0;
        for (let v = 0; v < pos.count; v++) {
          const w = xf(M, pos.getX(v), pos.getY(v), pos.getZ(v));
          if (w.y < lowY) { lowY = w.y; lx = w.x; lz = w.z; }
        }
        if (!Number.isFinite(lowY)) continue;
        // TWO SURFACES, AND THEY ARE NOT THE SAME FUNCTION. `terrainHeight` is
        // the analytic field the physics uses; `_terrainMeshHeight` is the
        // ground actually DRAWN. HRD-8 is a rule about what the eye sees, so
        // the drawn mesh is the one that judges it -- and the r437 retaining
        // wall seats to the drawn mesh. Reporting both keeps the two rulers
        // from being confused for each other again.
        const gh = tk.terrainHeight ? tk.terrainHeight(lx, lz) : null;
        const gm = tk._terrainMeshHeight ? tk._terrainMeshHeight(lx, lz) : null;
        if (gh === null || !Number.isFinite(gh)) continue;
        const gap = lowY - (Number.isFinite(gm) ? gm : gh);
        const gapAnalytic = lowY - gh;
        {
          const kk = (o.name || o.geometry?.name || '?').replace(/\d+$/, '');
          const bb = (byAnalytic[kk] ??= { n: 0, float: 0, max: -Infinity });
          bb.n++; if (gapAnalytic > 0.15) bb.float++;
          if (gapAnalytic > bb.max) bb.max = gapAnalytic;
        }
        const key = (o.name || o.geometry?.name || '?').replace(/\d+$/, '');
        const b = (byClass[key] ??= { n: 0, float: 0, max: -Infinity, sum: 0 });
        b.n++; b.sum += gap;
        if (gap > 0.15) b.float++;
        if (gap > b.max) b.max = gap;
        worst.push({ key, gap, x: lx, z: lz });
      }
    });
    worst.sort((a, b) => b.gap - a.gap);
    return { world: g.level?.name, byClass, byAnalytic, worst: worst.slice(0, 8),
      hasTerrainFn: typeof tk.terrainHeight === 'function' };
  });
  console.log(`\n${R.world}   terrainHeight available: ${R.hasTerrainFn}`);
  console.log('class                         n   floating>0.15   maxGap   meanGap');
  for (const [k, b] of Object.entries(R.byClass).sort((a, b) => b[1].float - a[1].float)) {
    console.log(`  ${k.padEnd(26)} ${String(b.n).padStart(5)} ${String(b.float).padStart(13)} `
      + `${b.max.toFixed(2).padStart(8)} ${(b.sum / b.n).toFixed(2).padStart(9)}`);
  }
  console.log('  same classes judged against the ANALYTIC field instead:');
  for (const [k, b] of Object.entries(R.byAnalytic).sort((a, b) => b[1].float - a[1].float))
    console.log(`    ${k.padEnd(24)} ${String(b.n).padStart(5)} float ${String(b.float).padStart(5)}  max ${b.max.toFixed(2)}`);
  console.log('worst bodies:', JSON.stringify(R.worst.map((w) => [w.key, +w.gap.toFixed(2)])));
  if (errs.length) console.log('PAGE ERRORS:', errs.slice(0, 2));
  await p.close();
}
await browser.close();
