/* COUNT THE JUNCTION FENCE POSTS AND CHECK NONE STANDS IN A CARRIAGEWAY.
 *
 * SUPERSEDED for general "what is standing in the road" work by
 * `tests/tool-road-census.mjs`, which now walks the whole scene graph with
 * real footprints, a height band and per-class suppression counts. Keep this
 * one only for the narrow question it names: did `_buildJunctionFences` put a
 * post on the road.
 *
 * IT USED TO LIE, and the lie cost a session. The filter was
 *
 *     if (!q || Math.abs(q.width - 0.18) > 0.005 || Math.abs(q.height - 1.05) > 0.005) return;
 *
 * and a geometry with no `width`/`height` parameters — a Sphere, a Cone, a
 * Cylinder, a Circle — gives `Math.abs(undefined - 0.18)` = NaN, and
 * `NaN > 0.005` is FALSE. So every such geometry PASSED the post filter. On
 * FROST PEAK that turned 10 real posts into "116 fence posts, 43 ON THE ROAD";
 * the 43 were the sky dome, the 9000 u world skirt, the haze bands, the road
 * ribbon, the start gantry's traffic-light spheres and the baked contact
 * shadows. The numbers it produced for PINE VALLEY (3) and HEDGEROW DASH (12)
 * were quoted into HANDOVER.md as ~15 posts in rural carriageways. Measured
 * with the filter fixed: PINE VALLEY 15 posts / 0 on the road, HEDGEROW DASH
 * 18 / 0 — matching r195's own "+15 and +18, and ZERO of them in a
 * carriageway".
 *
 * A test for a value must first test that the value EXISTS.
 *
 *   node tools-scratch/fence.mjs 1 31
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
let tot = 0, bad = 0;
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 }).then(()=>1).catch(()=>0);
  if (!ok) { console.log(`SKIP ${id}`); continue; }
  const r = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    let posts = 0; const pts = [];
    t.group.traverse((m) => {
      if (!m.isMesh) return;
      const g = m.geometry, q = g?.parameters;
      // a POST is a BOX and has both dimensions. Checking the numbers without
      // checking they are numbers is what broke this tool.
      if (g?.type !== 'BoxGeometry' || !q) return;
      if (!Number.isFinite(q.width) || !Number.isFinite(q.height)) return;
      if (Math.abs(q.width - 0.18) > 0.005 || Math.abs(q.height - 1.05) > 0.005) return;
      const w = new (m.position.constructor)(); m.getWorldPosition(w);
      posts++; pts.push({ x: w.x, z: w.z });
    });
    // none may stand in the carriageway
    const near = (x, z) => { let best = Infinity, at = 0;
      for (let i = 0; i < N; i++) { const c = t.center[i];
        const d = (x-c.x)**2 + (z-c.z)**2; if (d < best) { best = d; at = i; } }
      return { d: Math.sqrt(best), i: at }; };
    let onRoad = 0, worst = 0;
    for (const p of pts) { const { d, i } = near(p.x, p.z);
      const bite = t.widthAt(i) - (d - 0.09);   // the post's OWN half-width
      if (bite > 0.3) { onRoad++; worst = Math.max(worst, bite); } }
    return { name: t.level?.name ?? '?', cross: (t.crossroads ?? []).length, posts, onRoad, worst: +worst.toFixed(2) };
  });
  tot += r.posts; bad += r.onRoad;
  console.log(`  ${String(id).padStart(2)} ${r.name.padEnd(20)} ${r.cross} joints -> ${String(r.posts).padStart(3)} fence posts   `
    + (r.onRoad ? `${r.onRoad} ON THE ROAD, worst ${r.worst} u` : 'none on the road'));
}
console.log(`\n===== ${tot} posts, ${bad} standing in a carriageway =====`);
await b.close();
