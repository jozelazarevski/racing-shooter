/* Stacking: what happens when the SAME stretch is hauled again and again,
 * and where do stored warp centres actually land on the pristine spline? */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor } = await import('./src/editor.js');
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();
  // keep a pristine copy of the shipped centreline
  const pristine = g.track.center.map((c) => ({ x: c.x, z: c.z }));
  const PN = pristine.length;
  const nearPristine = (x, z) => {
    let bi = 0, bd = 1e9;
    for (let i = 0; i < PN; i++) {
      const d = Math.hypot(x - pristine[i].x, z - pristine[i].z);
      if (d < bd) { bd = d; bi = i; }
    }
    return { i: bi, d: +bd.toFixed(1) };
  };

  const measure = () => {
    const t = g.track, N = t.center.length;
    const circ = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
    let worst = 0, o13 = 0, o45 = 0, o90 = 0;
    for (let i = 0; i < N; i++) {
      const p0 = t.center[(i - 1 + N) % N], p1 = t.center[i], p2 = t.center[(i + 1) % N];
      let d = Math.atan2(p2.x - p1.x, p2.z - p1.z) - Math.atan2(p1.x - p0.x, p1.z - p0.z);
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const deg = Math.abs(d) * 180 / Math.PI;
      worst = Math.max(worst, deg);
      if (deg > 13) o13++; if (deg > 45) o45++; if (deg > 90) o90++;
    }
    const CS = 20, cells = new Map();
    for (let i = 0; i < N; i++) {
      const k = `${Math.floor(t.center[i].x / CS)},${Math.floor(t.center[i].z / CS)}`;
      let a = cells.get(k); if (!a) cells.set(k, a = []); a.push(i);
    }
    let pairs = 0; const seen = new Set();
    for (let i = 0; i < N; i++) {
      const cx = Math.floor(t.center[i].x / CS), cz = Math.floor(t.center[i].z / CS);
      for (let ax = cx - 1; ax <= cx + 1; ax++) for (let az = cz - 1; az <= cz + 1; az++) {
        const a = cells.get(`${ax},${az}`); if (!a) continue;
        for (const j of a) {
          if (j <= i || circ(i, j) <= 60) continue;
          if (Math.hypot(t.center[i].x - t.center[j].x, t.center[i].z - t.center[j].z) >= 20) continue;
          if (seen.has(`${i},${j}`)) continue; seen.add(`${i},${j}`); pairs++;
        }
      }
    }
    let minSp = 1e9, minW = 1e9, len = 0;
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(t.center[(i + 1) % N].x - t.center[i].x,
        t.center[(i + 1) % N].z - t.center[i].z);
      minSp = Math.min(minSp, d); len += d; minW = Math.min(minW, t.widthAt(i));
    }
    return { worst: +worst.toFixed(1), o13, o45, o90, cross: pairs,
      minSp: +minSp.toFixed(2), minW: +minW.toFixed(2), lap: Math.round(len) };
  };

  const out = { stackSide: [], stackAlong: [], drift: [] };

  // ---- A: haul the SAME stretch sideways, n times, applying between -------
  for (const n of [1, 2, 3, 4, 6, 8, 10, 12]) {
    ed.warp = [];
    ed.dirty = true;
    await new Promise((res) => ed.apply(res));      // back to pristine
    for (let k = 0; k < n; k++) {
      const t = g.track;
      const i = t.nearestIndex({ x: pristine[300].x, y: 0, z: pristine[300].z });
      // ...no: drag the handle that is on the CURRENT road nearest the last
      // grab point, exactly as a user re-grabs the bit they just moved
      const j = ed._lastGrab != null ? ed._lastGrab : 300;
      const c = t.center[j % t.center.length];
      const nn = t.nrm[j % t.center.length];
      const mag = 150;
      const dx = nn.x * mag, dz = nn.z * mag;
      ed.warp.push({ x: c.x, z: c.z, r: Math.max(70, mag * 3.2), dx, dz });
      ed.dirty = true;
      await new Promise((res) => ed.apply(res));
      ed._lastGrab = g.track.nearestIndex({ x: c.x + dx, y: 0, z: c.z + dz });
      void i;
    }
    ed._lastGrab = null;
    out.stackSide.push({ n, ...measure() });
  }

  // ---- B: haul the same stretch ALONG the lap (backwards), n times --------
  for (const n of [1, 2, 3, 4, 6, 8]) {
    ed.warp = [];
    ed.dirty = true;
    await new Promise((res) => ed.apply(res));
    const c0 = { ...pristine[300] };
    const t0 = g.track.tan[300];
    for (let k = 0; k < n; k++) {
      const mag = 150;
      ed.warp.push({ x: c0.x, z: c0.z, r: Math.max(70, mag * 3.2),
        dx: -t0.x * mag, dz: -t0.z * mag });
    }
    ed.dirty = true;
    await new Promise((res) => ed.apply(res));
    out.stackAlong.push({ n, ...measure() });
  }

  // ---- C: where do stored warp centres land on the PRISTINE spline? -------
  // 10 drags, each re-grabbing the road where the previous one left it
  ed.warp = [];
  ed.dirty = true;
  await new Promise((res) => ed.apply(res));
  let grab = 300;
  for (let k = 0; k < 10; k++) {
    const t = g.track;
    const c = t.center[grab % t.center.length];
    const nn = t.nrm[grab % t.center.length];
    const mag = 120;
    const dx = nn.x * mag, dz = nn.z * mag;
    const np = nearPristine(c.x, c.z);
    out.drift.push({ k, grabbedStation: grab, intendedPristine: np.i,
      offPristine: np.d, warpX: Math.round(c.x), warpZ: Math.round(c.z) });
    ed.warp.push({ x: c.x, z: c.z, r: Math.max(70, mag * 3.2), dx, dz });
    ed.dirty = true;
    await new Promise((res) => ed.apply(res));
    grab = g.track.nearestIndex({ x: c.x + dx, y: 0, z: c.z + dz });
  }
  out.driftFinal = measure();
  out.driftWarps = ed.warp.length;
  return out;
});

console.log('--- A: same stretch hauled sideways n times (re-grabbing each time) ---');
for (const o of R.stackSide) console.log(JSON.stringify(o));
console.log('\n--- B: n identical ALONG-lap pulls stacked on one point ---');
for (const o of R.stackAlong) console.log(JSON.stringify(o));
console.log('\n--- C: warp centre drift off the pristine spline ---');
for (const o of R.drift) console.log(JSON.stringify(o));
console.log('final:', JSON.stringify(R.driftFinal), 'warps', R.driftWarps);
console.log('errors', errors.length, errors.slice(0, 3));
await browser.close();
