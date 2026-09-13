/* WHAT IS THE DARK BAND ACROSS THE SEAT'S VIEW?
 * Shot on the reported world, in the driver's view, on the road at speed, at
 * the phone's real game-area aspect. Then every mesh whose projected box
 * covers the middle of the frame is listed with its name and ancestry, so the
 * band is IDENTIFIED rather than guessed at from a screenshot. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVEL = process.env.LEVEL ?? '12';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
const r = await p.evaluate(async () => {
  const g = window.__game, pl = g.player, t = g.track;
  g.startRace?.(); g.setDriverView(true);
  const frame = () => new Promise((r2) => requestAnimationFrame(r2));
  const HOME = Math.floor(t.N * 0.30);
  const pin = () => {
    const c = t.pointAt(HOME, 0);
    pl.heading = t.headingAt(HOME);
    pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.vy = 0; pl.airborne = false; pl.trackIndex = HOME;
    pl.vel.copy(pl.forward).multiplyScalar(34);
  };
  for (let k = 0; k < 26; k++) { pin(); await frame(); }
  // scan the rendered frame for full-width dark rows
  const src = g.renderer?.domElement ?? document.querySelector('canvas');
  const c2 = document.createElement('canvas');
  c2.width = 200; c2.height = Math.round(200 * (innerHeight / innerWidth));
  const cx = c2.getContext('2d');
  cx.drawImage(src, 0, 0, c2.width, c2.height);
  const d = cx.getImageData(0, 0, c2.width, c2.height).data;
  const bands = [];
  for (let y = 0; y < c2.height; y++) {
    let dark = 0;
    for (let x = 0; x < c2.width; x++) {
      const i = (y * c2.width + x) * 4;
      if (d[i] < 55 && d[i + 1] < 55 && d[i + 2] < 55) dark++;
    }
    bands.push(dark / c2.width);
  }
  // contiguous runs where >80% of the row is near-black
  const runs = [];
  let s0 = -1;
  for (let y = 0; y <= bands.length; y++) {
    const isDark = y < bands.length && bands[y] > 0.8;
    if (isDark && s0 < 0) s0 = y;
    if (!isDark && s0 >= 0) { runs.push([s0, y - 1]); s0 = -1; }
  }
  // what is drawn at the centre of each run
  const V = new (pl.pos.constructor)();
  const named = runs.map(([a, b2]) => {
    const yFrac = ((a + b2) / 2) / c2.height;
    const hits = [];
    g.scene.updateWorldMatrix(true, true);
    g.scene.traverse((o) => {
      const pos = o.geometry?.attributes?.position; if (!pos || !o.visible) return;
      let inRow = 0, n = Math.min(pos.count, 300);
      for (let k = 0; k < n; k++) {
        V.fromBufferAttribute(pos, k); o.localToWorld(V); V.project(g.camera);
        if (V.z > 1 || V.x < -1 || V.x > 1) continue;
        const f = 1 - (V.y * 0.5 + 0.5);
        if (Math.abs(f - yFrac) < 0.05) inRow++;
      }
      if (inRow > 2) {
        const ch = []; for (let q = o; q && ch.length < 3; q = q.parent) if (q.name) ch.push(q.name);
        hits.push(`${o.name || o.geometry.type}${ch.length ? '<' + ch.join('<') : ''} x${inRow}`);
      }
    });
    return { from: +(a / c2.height * 100).toFixed(0), to: +(b2 / c2.height * 100).toFixed(0),
      what: hits.slice(0, 4) };
  });
  return { rows: c2.height, runs: named, level: g.level?.name };
});
console.log(`${r.level}: full-width dark bands in the seat's frame`);
for (const q of r.runs) console.log(`  ${String(q.from).padStart(3)}%-${String(q.to).padStart(3)}%  ${q.what.join(' | ') || '(nothing projected — sky/fog?)'}`);
await p.screenshot({ path: '/tmp/claude-0/-home-user-racing-shooter/5dbf1129-99d6-5790-8c20-c8eb78d4cc72/scratchpad/seatband.png' });
await b.close();
