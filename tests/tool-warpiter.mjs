/* The REAL workflow: drag a handle, APPLY, drag the moved road again.
 * Each warp is recorded against the CURRENT centreline but replayed against
 * the PRISTINE one — so does the lap stay coherent? */
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

const rows = await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor } = await import('./src/editor.js');
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();

  const measure = () => {
    const t = g.track, N = t.center.length;
    const circ = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
    let worst = 0, o13 = 0, o45 = 0;
    for (let i = 0; i < N; i++) {
      const p0 = t.center[(i - 1 + N) % N], p1 = t.center[i], p2 = t.center[(i + 1) % N];
      let d = Math.atan2(p2.x - p1.x, p2.z - p1.z) - Math.atan2(p1.x - p0.x, p1.z - p0.z);
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const deg = Math.abs(d) * 180 / Math.PI;
      worst = Math.max(worst, deg); if (deg > 13) o13++; if (deg > 45) o45++;
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
    let minSp = 1e9, maxSp = 0, minW = 1e9, len = 0;
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(t.center[(i + 1) % N].x - t.center[i].x,
        t.center[(i + 1) % N].z - t.center[i].z);
      minSp = Math.min(minSp, d); maxSp = Math.max(maxSp, d); len += d;
      minW = Math.min(minW, t.widthAt(i));
    }
    return { worst: +worst.toFixed(1), o13, o45, pairs, minSp: +minSp.toFixed(2),
      maxSp: +maxSp.toFixed(2), minW: +minW.toFixed(2), lapLen: Math.round(len) };
  };

  const out = [];
  out.push({ step: 0, warps: 0, ...measure() });
  // 14 drags. Each reads the LIVE road, exactly as _endRouteDrag does.
  for (let k = 0; k < 14; k++) {
    const t = g.track, N = t.center.length;
    const STEP = Math.max(1, Math.round(N / 24));
    const handles = []; for (let i = 0; i < N; i += STEP) handles.push(i);
    const i = handles[(k * 5) % handles.length];       // wander round the lap
    const c = t.center[i], n = t.nrm[i];
    const mag = 60 + (k % 4) * 30;
    const sgn = k % 2 ? -1 : 1;
    const dx = n.x * mag * sgn, dz = n.z * mag * sgn;
    ed.warp.push({ x: c.x, z: c.z, r: Math.max(70, Math.hypot(dx, dz) * 3.2), dx, dz });
    ed.dirty = true;
    await new Promise((res) => ed.apply(res));
    out.push({ step: k + 1, warps: ed.warp.length, station: i, mag: mag * sgn, ...measure() });
  }
  window.__knotWarp = JSON.parse(JSON.stringify(ed.warp));
  return out;
});

for (const o of rows) {
  console.log(`step ${String(o.step).padStart(2)} warps=${String(o.warps).padStart(2)}`,
    `st=${String(o.station ?? '-').padStart(4)} mag=${String(o.mag ?? '-').padStart(5)}`,
    `| worstTurn=${String(o.worst).padStart(6)} >13=${String(o.o13).padStart(3)}`,
    `>45=${String(o.o45).padStart(3)} cross=${String(o.pairs).padStart(4)}`,
    `minSp=${String(o.minSp).padStart(5)} maxSp=${String(o.maxSp).padStart(5)}`,
    `minW=${String(o.minW).padStart(5)} lap=${String(o.lapLen).padStart(5)}`);
}
console.log('errors', errors.length, errors.slice(0, 3));
await browser.close();
