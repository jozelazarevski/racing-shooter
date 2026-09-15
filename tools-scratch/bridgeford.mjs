/* IS A STONE BRIDGE SITED ON A RIVER FORD?  ("River in the bridge??")
 *
 * A `stone-bridge` HAS NO DECK MESH. It is two parapet walls, two pairs of
 * arch faces, and a 1.5 u hump baked into `center[].y` — the ROAD is the deck.
 * That is why raycasting for deck geometry under the water found nothing: there
 * is nothing there to hit.
 *
 * Meanwhile `_buildRiver` PASS 2 lifts the water surface TO the road deck at a
 * ford, so the road works as a weir. Put the two together and the river is
 * poured along the carriageway between two masonry parapets — a river on a
 * bridge.
 *
 * `_buildStoneBridges` picks its sites by "ground 4.5+ u below the deck on both
 * sides", which is a description of a river valley, and spaces picks only from
 * EACH OTHER (`_circDist < 120`) — never from a ford. So the picker actively
 * prefers the one place a bridge must not go.
 *
 * This measures the collision directly: sample distance from each stone bridge
 * to the nearest planned ford, plus the water's own height over the road there.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 320 } });
p.setDefaultTimeout(600000);
console.log('world                  bridges fords | nearest bridge->ford | water over road');
for (const id of (process.env.WORLDS ?? '31,35,43,62,63').split(',')) {
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 })
    .then(() => 1).catch(() => 0);
  if (!ok) { console.log(`level ${id}: did not build`); continue; }
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const t = window.__game.track;
    // stone bridges: the group is named; its centre is the mean of its children
    const bridges = [];
    t.group.traverse((o) => {
      if (o.name !== 'stone-bridge') return;
      const bb = new THREE.Box3().setFromObject(o);
      const c = bb.getCenter(new THREE.Vector3());
      bridges.push({ x: c.x, z: c.z });
    });
    const fords = (t._river?.fords ?? []).map((fd) => t.center[fd.i]).filter(Boolean)
      .map((c) => ({ x: c.x, z: c.z, y: c.y }));
    // for each bridge, nearest ford, and how high the water stands over the road
    const water = [];
    t.group.traverse((o) => { if (/river-water/i.test(o.name || '') && o.geometry) water.push(o); });
    const V = new THREE.Vector3();
    const rows = [];
    for (const br of bridges) {
      let best = Infinity, bf = null;
      for (const f of fords) { const d = Math.hypot(br.x - f.x, br.z - f.z); if (d < best) { best = d; bf = f; } }
      // highest water vertex within 24 u of the bridge centre, vs the road there
      let wy = -Infinity;
      for (const w of water) {
        const pos = w.geometry.attributes.position; w.updateWorldMatrix(true, false);
        for (let i = 0; i < pos.count; i++) {
          V.fromBufferAttribute(pos, i); w.localToWorld(V);
          if (Math.hypot(V.x - br.x, V.z - br.z) < 24 && V.y > wy) wy = V.y;
        }
      }
      const road = t.center[t.nearestIndex(new THREE.Vector3(br.x, 0, br.z))].y;
      rows.push({ d: +best.toFixed(1), over: wy > -Infinity ? +(wy - road).toFixed(2) : null,
        x: Math.round(br.x), z: Math.round(br.z) });
    }
    return { nb: bridges.length, nf: fords.length, rows, hasRiver: !!t._river };
  });
  const nm = await p.evaluate(() => window.__game.level?.name ?? '?');
  const worst = r.rows.filter((q) => q.over !== null).sort((a, c) => c.over - a.over)[0];
  const near = r.rows.slice().sort((a, c) => a.d - c.d)[0];
  console.log(`${String(nm).padEnd(22)} ${String(r.nb).padStart(3)} ${String(r.nf).padStart(5)} `
    + `| ${near ? near.d + ' u' : '—'} | `
    + (worst ? `${worst.over} u at ${worst.x},${worst.z}` : 'no water near a bridge'));
}
await b.close();
