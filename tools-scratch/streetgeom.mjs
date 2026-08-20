/* HOW CLOSE, AND HOW TALL, IS THE STREET ACTUALLY BUILT?
 *
 * The frontage table is a REQUEST, not the result. `put()` refuses any block
 * whose circumradius does not clear `widthAt(i) + 1.6`, then retries at extra
 * lateral offsets — so a world asking for `lateral: 13` may build nothing at
 * 13 and everything at 20. Reading the table therefore says nothing about
 * what the chase camera drives past, which is the whole complaint.
 *
 * So read the BUILT instances. Each frontage matrix carries
 * scale = (depth-across, height, width-along); the near face of a block is
 * `_distToTrack(x,z) - depth/2`. Report the closest face, the tallest block,
 * and the tallest block within 22 u — the one that fills the frame.
 *
 * POSITIVE CONTROL: a world that reports zero instances is UNMEASURED, not
 * clear. Every row prints its instance count, and a zero count is called out
 * rather than folded into the minimum.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 260 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const rows = await p.evaluate(async () => {
  const g = window.__game;
  const THREE = g.THREE ?? (await import('three'));
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  const m = new THREE.Matrix4(), pos = new THREE.Vector3(),
    q = new THREE.Quaternion(), sc = new THREE.Vector3();
  for (const lv of LEVELS) {
    g.state = 'title'; g.editScene = null;
    g.swapLevel(lv, true, null);
    await new Promise((r) => requestAnimationFrame(r));
    const t = g.track;
    if (!t.T.coast || !t.T.frontage) continue;
    let n = 0, minFace = Infinity, maxH = 0, nearTallH = 0, nearTallD = 0;
    t.group.traverse((o) => {
      if (o.name !== 'oldtown-frontage' || !o.isInstancedMesh) return;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m);
        m.decompose(pos, q, sc);
        if (sc.y < 0.01) continue;              // unused slot
        n++;
        const d = t._distToTrack(pos.x, pos.z);
        const face = d - sc.x / 2;
        if (face < minFace) minFace = face;
        if (sc.y > maxH) maxH = sc.y;
        if (face < 22 && sc.y > nearTallH) { nearTallH = sc.y; nearTallD = face; }
      }
    });
    out.push({ id: lv.id, name: lv.name, n,
      face: n ? +minFace.toFixed(1) : null,
      maxH: +maxH.toFixed(1), nearTallH: +nearTallH.toFixed(1),
      nearTallD: +nearTallD.toFixed(1),
      ask: t.T.frontage.lateral, askH: t.T.frontage.height });
  }
  return out;
});
console.log('  id  name                 built  ask-lat ask-h | nearest-face  tallest  tallest<22u (h @ face)');
for (const r of rows) {
  const flag = r.n === 0 ? '  ** NO INSTANCES — UNMEASURED **' : '';
  console.log(`  ${String(r.id).padStart(2)}  ${r.name.padEnd(20)} ${String(r.n).padStart(5)}  `
    + `${String(r.ask).padStart(7)} ${String(r.askH).padStart(5)} | `
    + `${String(r.face).padStart(12)}  ${String(r.maxH).padStart(7)}  `
    + `${String(r.nearTallH).padStart(5)} @ ${String(r.nearTallD).padStart(5)}${flag}`);
}
await b.close();
