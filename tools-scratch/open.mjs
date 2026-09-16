/* WHERE are the open tight stations, and WHY is each one open?
 *
 * "8% open" is not a finding until you know whether those five corners are
 * inside a tunnel bore (walled by rock, and rails are deliberately skipped
 * there), beside a gorge parapet (walled by masonry), or genuinely bare.
 * The builder's own exclusion list is the vocabulary; this reports which
 * exclusion each open station falls under, so a real hole is not hidden by
 * four legitimate ones.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });
  const r = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length, TIGHT = 0.02;
    const segs = (t.barriers ?? []);
    const near = (px, pz, R2) => {
      for (const q of segs) {
        const dx = q.x2 - q.x1, dz = q.z2 - q.z1;
        const L = dx * dx + dz * dz || 1;
        let u = ((px - q.x1) * dx + (pz - q.z1) * dz) / L;
        u = u < 0 ? 0 : u > 1 ? 1 : u;
        const cx = q.x1 + dx * u, cz = q.z1 + dz * u;
        if ((px - cx) ** 2 + (pz - cz) ** 2 < R2) return true;
      }
      return false;
    };
    // the game's own colliders, not just the barrier list — a tunnel bore
    // guards with box solids that never enter `barriers`
    const solids = (t.solids ?? []).filter((s) => s && s.halfX !== undefined);
    const nearSolid = (px, pz) => solids.some((s) => {
      const hx = s.halfX + 3, hz = s.halfZ + 3;
      return Math.abs(px - s.x) < hx && Math.abs(pz - s.z) < hz;
    });
    const open = [];
    for (let i = 0; i < N; i++) {
      if (t.curvature[i] <= TIGHT) continue;
      const half = t.widthAt ? t.widthAt(i) : 9;
      let g = 0;
      for (const side of [1, -1]) {
        const p = t.pointAt(i, (half + 1.8) * side);
        if (near(p.x, p.z, 16)) g++;
      }
      if (g === 2) continue;
      const p1 = t.pointAt(i, (half + 1.8)), p2 = t.pointAt(i, -(half + 1.8));
      // why might the builder have skipped it?
      const inTunnel = (t._tunnels ?? []).some((u) => i >= u.s - 6 && i <= u.e + 6);
      const atStart = Math.min(i, N - i) < 30;
      const atGorge = t._nearGorge ? t._nearGorge(i, 40) : null;
      const atFord = (t.fords ?? []).some((f) => Math.min(Math.abs(i - f.i), N - Math.abs(i - f.i)) < 14);
      // and is the ground actually flat there, i.e. is there anywhere to go?
      const outA = t.pointAt(i, (half + 7));
      const dropA = t.center[i].y - t.terrainHeight(outA.x, outA.z);
      const outB = t.pointAt(i, -(half + 7));
      const dropB = t.center[i].y - t.terrainHeight(outB.x, outB.z);
      open.push({ i, g, inTunnel, atStart, atGorge, atFord,
        solid: nearSolid(p1.x, p1.z) && nearSolid(p2.x, p2.z),
        curv: +t.curvature[i].toFixed(3),
        drop: `${dropA.toFixed(1)}/${dropB.toFixed(1)}` });
    }
    return { name: t.level?.name, N, open, tun: (t._tunnels ?? []).map((u) => [u.s, u.e]) };
  });
  console.log(`\n${id} ${r.name}  ${r.N} samples  tunnels ${JSON.stringify(r.tun)}`);
  // collapse consecutive station indices into runs — five separate reports of
  // the same corner is one corner
  let run = null; const runs = [];
  for (const o of r.open) {
    if (run && o.i === run.b + 1) { run.b = o.i; run.n++; }
    else { run = { a: o.i, b: o.i, n: 1, ...o }; runs.push(run); }
  }
  for (const o of runs) {
    const why = [o.inTunnel && 'IN TUNNEL', o.atStart && 'at start', o.atGorge && 'gorge',
      o.atFord && 'ford', o.solid && 'solid collider both sides'].filter(Boolean);
    console.log(`  ${String(o.a).padStart(4)}-${String(o.b).padEnd(4)} guarded ${o.g}/2  `
      + `curv ${o.curv}  drop ${o.drop}   ${why.length ? why.join(', ') : 'BARE — nothing explains it'}`);
  }
  if (!runs.length) console.log('  every tight station guarded on both sides');
}
await b.close();
