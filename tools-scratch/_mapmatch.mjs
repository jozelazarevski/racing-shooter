/* r415 — DOES THE CARD'S MAP MATCH THE LAP?
 *
 * Builds a world, then compares two plan-view shapes, each normalised into a
 * unit box so only SHAPE is compared:
 *   NEW: the curve the card now draws (routePlanPoints -> centripetal
 *        CatmullRom), read out of the page itself;
 *   OLD: the quadratic-midpoint path over the UNTRANSFORMED control points,
 *        i.e. exactly what the card drew before — the negative control.
 * Both are scored against the built track's own `center`. If the new number
 * is not far better than the old one, the fix did nothing.
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
for (const lv of process.argv.slice(2)) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 60000 });
  const ok = await p.waitForFunction(() => window.__game?.track?.center?.length, undefined, { timeout: 60000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(JSON.stringify({ lv, built: false, errs: errs.splice(0, 2) })); continue; }
  const r = await p.evaluate(async () => {
    const T = await import('./src/track.js');
    const THREE = await import('three');
    const g = window.__game, lvl = g.level;
    const norm = (pts) => {              // unit box, aspect preserved
      let nx = 1e9, xx = -1e9, nz = 1e9, xz = -1e9;
      for (const [x, z] of pts) { nx = Math.min(nx, x); xx = Math.max(xx, x); nz = Math.min(nz, z); xz = Math.max(xz, z); }
      const s = 1 / Math.max(xx - nx, xz - nz);
      return pts.map(([x, z]) => [(x - nx) * s, (z - nz) * s]);
    };
    const track = norm(g.track.center.map((v) => [v.x, v.z]));
    // NEW: what the card draws now
    const plan = T.routePlanPoints(lvl);
    const cv = new THREE.CatmullRomCurve3(plan.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
    const neu = norm(cv.getPoints(Math.max(160, plan.length * 12)).map((v) => [v.x, v.z]));
    // OLD: raw control points, no transforms, quadratic midpoints
    const raw = T.circuitPoints ? T.circuitPoints(lvl.route || lvl.theme) : plan;
    const oldPts = [];
    for (let i = 0; i < raw.length; i++) {
      const a = raw[i], c = raw[(i + 1) % raw.length];
      for (let t = 0; t < 8; t++) {       // sample the quadratic segment
        const u = t / 8, m0 = [(raw[(i - 1 + raw.length) % raw.length][0] + a[0]) / 2, (raw[(i - 1 + raw.length) % raw.length][1] + a[1]) / 2];
        const m1 = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
        oldPts.push([(1 - u) * (1 - u) * m0[0] + 2 * (1 - u) * u * a[0] + u * u * m1[0],
          (1 - u) * (1 - u) * m0[1] + 2 * (1 - u) * u * a[1] + u * u * m1[1]]);
      }
    }
    const old = norm(oldPts);
    const meanNearest = (A, B) => {       // mean distance from A to the nearest point of B
      let sum = 0;
      for (const a of A) { let best = 1e9;
        for (const c of B) { const d = (a[0] - c[0]) ** 2 + (a[1] - c[1]) ** 2; if (d < best) best = d; }
        sum += Math.sqrt(best); }
      return sum / A.length;
    };
    return { name: lvl.name, flip: !!lvl.routeFlipX, rev: !!lvl.routeReverse,
      newErr: +meanNearest(neu, track).toFixed(4), oldErr: +meanNearest(old, track).toFixed(4) };
  });
  console.log(JSON.stringify({ lv, ...r, errs: errs.splice(0, 2) }));
}
await b.close();
