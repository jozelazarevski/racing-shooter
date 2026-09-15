/* E-35: "This wall drives make no sense and I asked to be redesigned."
 *
 * The owner did ask: HRD-6 ("No road floats or is on a ridge") has been written
 * since r395. So measure, per station, what the ground actually does on each
 * side -- and give the WALL its own signature rather than reusing the
 * both-sides-falling test, because a road on a shelf cut into a hill has rising
 * ground one side and still presents a sheer face on the other.
 *
 *   drop(side)  = road edge height minus ground at +10 u out
 *   face(side)  = the steepest 2 u slope within the first 12 u beyond the edge
 *
 * RIDGE   = falling on BOTH sides            (HRD-6, literal)
 * WALL    = a face steeper than 45 deg starting within 2 u of the carriageway
 * Neither is inferred from the other; both are counted.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const IDS = (process.env.IDS ?? '45').split(',');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
console.log('world                  N   ridge%  wall%  bothWall%  maxFaceDeg  meanDrop10u');
for (const id of IDS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  p.setDefaultTimeout(300000);
  const errs = []; p.on('pageerror', (e) => errs.push(String(e.message)));
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
    await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
    const R = await p.evaluate(() => {
      const g = window.__game, tk = g.track, C = tk.center, N = C.length;
      const th = (x, z) => tk.terrainHeight(x, z);
      let ridge = 0, wallAny = 0, wallBoth = 0, maxFace = 0, dropSum = 0, dropN = 0;
      const worst = [];
      for (let i = 0; i < N; i++) {
        const c = C[i], n = C[(i + 1) % N];
        let tx = n.x - c.x, tz = n.z - c.z;
        const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const half = Number(tk.widthAt ? tk.widthAt(i) : 9);
        const sides = [];
        for (const s of [1, -1]) {
          const nx = -tz * s, nz = tx * s;
          const edgeY = c.y;
          const at = (d) => th(c.x + nx * (half + d), c.z + nz * (half + d));
          const d10 = edgeY - at(10);
          // steepest 2 u slope in the first 12 u beyond the edge
          let face = 0;
          for (let d = 0; d <= 10; d += 2) {
            const a = at(d), b = at(d + 2);
            const deg = Math.atan2(Math.abs(a - b), 2) * 180 / Math.PI;
            if ((a - b) > 0 && deg > face && d <= 2) face = deg;   // starts at the edge
            else if ((a - b) > 0 && deg > face) face = Math.max(face, deg * 0.999);
          }
          sides.push({ drop10: d10, face });
          dropSum += d10; dropN++;
          if (face > maxFace) maxFace = face;
        }
        const fall = sides.filter((q) => q.drop10 > 1.5).length;
        if (fall === 2) ridge++;
        const walls = sides.filter((q) => q.face >= 45).length;
        if (walls >= 1) wallAny++;
        if (walls === 2) wallBoth++;
        if (walls >= 1) worst.push({ i, f: Math.max(sides[0].face, sides[1].face) });
      }
      worst.sort((a, b) => b.f - a.f);
      return { name: g.level?.name, N, ridge, wallAny, wallBoth, maxFace,
        meanDrop: dropSum / Math.max(1, dropN), worst: worst.slice(0, 5).map((w) => [w.i, +w.f.toFixed(0)]) };
    });
    console.log(`${String(R.name).padEnd(20)} ${String(R.N).padStart(4)} `
      + `${(100 * R.ridge / R.N).toFixed(1).padStart(7)} ${(100 * R.wallAny / R.N).toFixed(1).padStart(6)} `
      + `${(100 * R.wallBoth / R.N).toFixed(1).padStart(10)} ${R.maxFace.toFixed(0).padStart(11)} `
      + `${R.meanDrop.toFixed(1).padStart(12)}   worst ${JSON.stringify(R.worst)}`);
  } catch (e) { console.log(`level ${id}: ERROR ${String(e.message).slice(0, 100)}`); }
  if (errs.length) console.log('  PAGE ERRORS:', errs.slice(0, 2));
  await p.close();
}
await browser.close();
