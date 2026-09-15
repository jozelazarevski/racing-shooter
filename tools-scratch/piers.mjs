/* ARE ANY BRIDGE PIERS STANDING IN A CARRIAGEWAY?
 * Piers are meshes with no collider, so the road census cannot see them —
 * walk the built scene instead and measure every pier against the road. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const TAG = process.env.TAG ?? '';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
let bad = 0, tot = 0;
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 }).then(()=>1).catch(()=>0);
  if (!ok) { console.log(`SKIP ${id}`); continue; }
  const r = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    const near = (x, z) => { let best = Infinity, at = 0;
      for (let i = 0; i < N; i++) { const c = t.center[i];
        const d = (x-c.x)**2 + (z-c.z)**2; if (d < best) { best = d; at = i; } }
      return { d: Math.sqrt(best), i: at }; };
    // a pier is a tall thin stone box under an overpass deck
    const piers = [];
    t.group.traverse((m) => {
      if (!m.isMesh || !m.geometry?.parameters) return;
      const p = m.geometry.parameters;
      if (p.width == null || p.height == null || p.depth == null) return;
      if (p.height < 3 || p.width > 3.2 || p.depth > 4) return;       // pier-shaped
      const w = new (m.position.constructor)();
      m.getWorldPosition(w);
      piers.push({ x: w.x, z: w.z, h: +p.height.toFixed(1) });
    });
    const hits = [];
    for (const q of piers) {
      const { d, i } = near(q.x, q.z);
      const bite = t.widthAt(i) - (d - 1.1);
      if (bite > 0.3) hits.push({ i, bite: +bite.toFixed(2), lat: +d.toFixed(2), h: q.h });
    }
    hits.sort((a, c) => c.bite - a.bite);
    return { name: t.level?.name ?? '?', piers: piers.length, hits: hits.slice(0, 4), n: hits.length };
  });
  tot += r.piers; bad += r.n;
  console.log(`${TAG} ${String(id).padStart(2)} ${r.name.padEnd(20)} ${String(r.piers).padStart(3)} pier-shaped meshes   `
    + (r.n ? `${r.n} IN THE ROAD, worst bite ${r.hits[0].bite} u at sample ${r.hits[0].i}` : 'none in the road'));
}
console.log(`\n===== ${bad} of ${tot} piers stand in a carriageway =====`);
await b.close();
