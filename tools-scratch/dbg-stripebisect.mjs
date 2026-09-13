/* NAME THE STRIPES. A stripe metric plus a hide-one-class sweep.
 * Metric: sum |I(y) - I(y+3)| over the frame. Long thin bright lines respond
 * strongly to a small vertical shift; smooth gradients and большие flat areas
 * do not. Lower after hiding X => X drew the stripes. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 21), DRIVE = Number(process.env.DRIVE ?? 400);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 560, height: 340 } });
p.setDefaultTimeout(900000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,
  { waitUntil: 'load', timeout: 900000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 900000 });
const r = await p.evaluate(({ D9 }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  const realRender = g.composer?.render?.bind(g.composer);
  if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 500 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const c = g.player;
  const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
  for (let k = 0; k < D9; k++) {
    const sp = Math.hypot(c.vel.x, c.vel.z);
    const aim = t.center[(c.trackIndex + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
    let a = Math.atan2(aim.x - c.pos.x, aim.z - c.pos.z) - c.heading;
    while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
    g.input.analog.steer = Math.max(-1, Math.min(1, a * 2.2));
    g.input.analog.throttle = 1; g.frame();
  }
  const W = 560, H = 340;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d');
  const metric = () => {
    g.renderer.render(g.scene, g.camera);
    cx.drawImage(g.renderer.domElement, 0, 0, W, H);
    const d = cx.getImageData(0, 0, W, H).data;
    let s = 0;
    for (let y = 0; y + 3 < H; y++) {
      for (let x = 0; x < W; x += 2) {
        const a = d[(y * W + x) * 4], b = d[((y + 3) * W + x) * 4];
        s += Math.abs(a - b);
      }
    }
    return s;
  };
  const base = metric();
  const named = new Map();
  g.scene.traverse((o) => {
    if (!o.visible || !o.geometry) return;
    let q = o, nm = '';
    while (q && !nm) { if (q.name) nm = q.name; q = q.parent; }
    nm = nm || `(${o.type})`;
    if (!named.has(nm)) named.set(nm, []);
    named.get(nm).push(o);
  });
  const rows = [];
  for (const [nm, objs] of named) {
    for (const o of objs) o.visible = false;
    const m = metric();
    for (const o of objs) o.visible = true;
    rows.push({ name: nm, n: objs.length, drop: +(100 * (base - m) / base).toFixed(1) });
  }
  rows.sort((a, b) => b.drop - a.drop);
  if (g.composer && realRender) g.composer.render = realRender;
  return { world: g.level?.name, base, classes: named.size, top: rows.slice(0, 14) };
}, { D9: DRIVE });
console.log(JSON.stringify(r, null, 1));
await browser.close();
