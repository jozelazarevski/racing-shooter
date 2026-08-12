/* Which MOVE ROAD gesture actually knots a lap? Parametric sweep. */
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

const out = await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor } = await import('./src/editor.js');
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();
  const base = g.track;
  const N = base.center.length;
  // handle stations, exactly as _routeHandles picks them
  const STEP = Math.max(1, Math.round(N / 24));
  const handles = []; for (let i = 0; i < N; i += STEP) handles.push(i);

  const measure = () => {
    const t = g.track, N2 = t.center.length;
    const circ = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N2 - d); };
    let worst = 0, o13 = 0, o45 = 0;
    for (let i = 0; i < N2; i++) {
      const p0 = t.center[(i - 1 + N2) % N2], p1 = t.center[i], p2 = t.center[(i + 1) % N2];
      let d = Math.atan2(p2.x - p1.x, p2.z - p1.z) - Math.atan2(p1.x - p0.x, p1.z - p0.z);
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const deg = Math.abs(d) * 180 / Math.PI;
      worst = Math.max(worst, deg); if (deg > 13) o13++; if (deg > 45) o45++;
    }
    const CS = 20, cells = new Map();
    for (let i = 0; i < N2; i++) {
      const k = `${Math.floor(t.center[i].x / CS)},${Math.floor(t.center[i].z / CS)}`;
      let a = cells.get(k); if (!a) cells.set(k, a = []); a.push(i);
    }
    let pairs = 0; const seen = new Set();
    for (let i = 0; i < N2; i++) {
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
    let minSp = 1e9, minW = 1e9;
    for (let i = 0; i < N2; i++) {
      minSp = Math.min(minSp, Math.hypot(t.center[(i + 1) % N2].x - t.center[i].x,
        t.center[(i + 1) % N2].z - t.center[i].z));
      minW = Math.min(minW, t.widthAt(i));
    }
    // reversal: the tangent flipping against the original lap direction
    let rev = 0;
    for (let i = 0; i < N2; i++) {
      const a = base.tan[i], b = t.tan[i];
      if (a.x * b.x + a.z * b.z < 0) rev++;
    }
    return { worst: +worst.toFixed(1), o13, o45, pairs,
      minSp: +minSp.toFixed(2), minW: +minW.toFixed(2), rev };
  };

  const run = async (name, mk) => {
    ed.warp = mk();
    ed.dirty = true;
    await new Promise((res) => ed.apply(res));
    const m = measure();
    ed.warp = [];
    return { name, n: mk().length, ...m };
  };

  const nrmAt = (i) => base.nrm[i % N];
  const cAt = (i) => base.center[i % N];
  // the editor's own drag formula
  const pull = (i, dx, dz) => ({ x: cAt(i).x, z: cAt(i).z,
    r: Math.max(70, Math.hypot(dx, dz) * 3.2), dx, dz });
  const sideways = (i, mag) => pull(i, nrmAt(i).x * mag, nrmAt(i).z * mag);
  const along = (i, mag) => pull(i, base.tan[i % N].x * mag, base.tan[i % N].z * mag);

  const res = [];
  res.push(await run('none', () => []));
  res.push(await run('12 alternating sideways 60-150', () => {
    const w = [];
    for (let k = 0; k < 12; k++) {
      const i = handles[Math.round(k * handles.length / 12)];
      w.push(sideways(i, (60 + (k % 4) * 30) * (k % 2 ? -1 : 1)));
    }
    return w;
  }));
  res.push(await run('12 all-outward sideways 120', () => {
    const w = []; for (let k = 0; k < 12; k++) w.push(sideways(handles[k * 2], 120)); return w;
  }));
  res.push(await run('12 adjacent handles, zigzag 150', () => {
    const w = []; for (let k = 0; k < 12; k++) w.push(sideways(handles[k], 150 * (k % 2 ? -1 : 1)));
    return w;
  }));
  res.push(await run('8 clustered same spot, rotating 150', () => {
    const w = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      w.push(pull(handles[6], Math.sin(a) * 150, Math.cos(a) * 150));
    }
    return w;
  }));
  res.push(await run('15 along-lap pulls 150 (drag backwards)', () => {
    const w = []; for (let k = 0; k < 15; k++) w.push(along(handles[k], 150 * (k % 2 ? -1 : 1)));
    return w;
  }));
  res.push(await run('12 handles pulled to lap centroid', () => {
    let cx = 0, cz = 0;
    for (let i = 0; i < N; i++) { cx += base.center[i].x; cz += base.center[i].z; }
    cx /= N; cz /= N;
    const w = [];
    for (let k = 0; k < 12; k++) {
      const i = handles[k * 2], c = cAt(i);
      const dx = (cx - c.x) * 0.75, dz = (cz - c.z) * 0.75;
      const m = Math.hypot(dx, dz), s = Math.min(1, 150 / m);
      w.push(pull(i, dx * s, dz * s));
    }
    return w;
  }));
  res.push(await run('24 handles, every one hauled 150 zigzag', () => {
    const w = [];
    for (let k = 0; k < handles.length; k++) w.push(sideways(handles[k], 150 * (k % 2 ? -1 : 1)));
    return w;
  }));
  res.push(await run('12 x 150 stacked on 3 spots (4 each, rotating)', () => {
    const w = [];
    for (let s = 0; s < 3; s++) for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      w.push(pull(handles[s * 8], Math.sin(a) * 150, Math.cos(a) * 150));
    }
    return w;
  }));
  return res;
});

const row = (o) => console.log(
  String(o.name).padEnd(44), `n=${String(o.n).padStart(2)}`,
  `worstTurn=${String(o.worst).padStart(6)}`, `>13=${String(o.o13).padStart(3)}`,
  `>45=${String(o.o45).padStart(3)}`, `cross=${String(o.pairs).padStart(4)}`,
  `minSp=${String(o.minSp).padStart(5)}`, `minW=${String(o.minW).padStart(5)}`,
  `rev=${String(o.rev).padStart(3)}`);
for (const o of out) row(o);
console.log('errors', errors.length, errors.slice(0, 3));
await browser.close();
