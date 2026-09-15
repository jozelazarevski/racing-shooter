/* WHAT IS THE WHITE SLAB WITH APEX IN MIRROR WRITING?
 *
 * The driver's-view shot shows it across the bottom third. The obvious
 * assumption is "the player's own bodywork" — and that is WRONG: walking the
 * player's mesh finds only 99 verts in frame, all small dark parts (mirror
 * stalks, a hood stripe, two headlamp discs). So it belongs to something else.
 * This walks the ENTIRE scene graph, not one object, and reports every mesh
 * covering the lower half of the frame with enough identity to find it in the
 * source: its name, its ancestors' names, material side, texture, and size.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const r = await p.evaluate(async () => {
  const g = window.__game, pl = g.player;
  g.startRace?.();
  g.setDriverView(true);
  for (let k = 0; k < 40; k++) await new Promise((r2) => requestAnimationFrame(r2));
  const cam = g.camera, v = new (pl.pos.constructor)();
  const rows = [];
  const chain = (o) => { const a = []; let q = o; while (q) { if (q.name) a.push(q.name); q = q.parent; } return a.join('<'); };
  g.scene.updateWorldMatrix(true, true);
  g.scene.traverse((o) => {
    const pos = o.geometry?.attributes?.position; if (!pos || !o.visible) return;
    let hits = 0, top = 1, bot = 0, n = Math.min(pos.count, 600);
    for (let k = 0; k < n; k++) {
      v.fromBufferAttribute(pos, k); o.localToWorld(v); v.project(cam);
      if (v.x < -1.2 || v.x > 1.2 || v.z > 1) continue;
      const frac = 1 - (v.y * 0.5 + 0.5);
      if (frac < -0.2 || frac > 1.2) continue;
      hits++; if (frac < top) top = frac; if (frac > bot) bot = frac;
    }
    // only things that reach into the lower half of the frame
    if (!hits || bot < 0.55) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    const SIDE = { 0: 'Front', 1: 'Back', 2: 'Double' };
    rows.push({
      name: o.name || o.type, chain: chain(o.parent) || '-',
      isPlayer: !!(pl.mesh && (o === pl.mesh || pl.mesh.getObjectById(o.id))),
      hits, top: +(top * 100).toFixed(1), bot: +(bot * 100).toFixed(1),
      side: SIDE[m?.side] ?? '?', map: !!m?.map,
      colour: m?.color ? '#' + m.color.getHexString() : '-',
      type: o.geometry.type, inst: o.isInstancedMesh ? o.count : 0,
    });
  });
  rows.sort((a, b2) => a.top - b2.top);
  return { rows: rows.slice(0, 14), total: rows.length };
});
console.log(`meshes reaching the lower half of frame: ${r.total}\n`);
for (const q of r.rows) {
  console.log(`${String(q.top).padStart(6)}%-${String(q.bot).padStart(6)}%  `
    + `${q.isPlayer ? 'PLAYER ' : '       '}side=${q.side.padEnd(6)} map=${q.map ? 'Y' : 'n'} `
    + `${q.colour.padEnd(8)} ${q.type.padEnd(14)}${q.inst ? ' x' + q.inst : ''}  `
    + `${q.name}  [${q.chain}]`);
}
await p.screenshot({ path: '/tmp/claude-0/-home-user-racing-shooter/5dbf1129-99d6-5790-8c20-c8eb78d4cc72/scratchpad/frame-scan.png' });
await b.close();
