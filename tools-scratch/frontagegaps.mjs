/* IS THE TERRACE CONTINUOUS? The reference's street is one unbroken run of
 * party-wall houses; a Ligurian terrace with verge showing between blocks
 * reads as suburb. Every frontage block is an instance in `oldtown-frontage`,
 * so this projects each onto the centreline, sorts by station along the lap,
 * and measures the along-street gap between neighbours ON THE SAME SIDE.
 * A gap is anything wider than a quarter of the block that precedes it. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '54';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 500, height: 320 } })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const V = g.camera.position.constructor;
  const front = [];
  g.scene.traverse((o) => { if (o.isInstancedMesh && o.name === 'oldtown-frontage') front.push(o); });
  const m = new (g.camera.matrixWorld.constructor)();
  const step = Math.max(1, Math.floor(t.N / 300));
  const items = [];
  for (const o of front) for (let k = 0; k < o.count; k++) {
    o.getMatrixAt(k, m);
    const x = m.elements[12], z = m.elements[14];
    if (!x && !z) continue;                       // unused instance slot
    // COLUMN 0 IS THE ALONG-STREET AXIS. The block is a unit box scaled to
    // (wAlong, h, dAcross) and then yawed to the road heading, so the column
    // norms recover the scales whatever the rotation — and `max(sx, sz)` picks
    // the 8.5 u DEPTH about half the time, which is how a terrace that abuts
    // came out reading as a gap.
    const sx = Math.hypot(m.elements[0], m.elements[1], m.elements[2]);
    let best = -1, bd = 1e9;
    for (let i = 0; i < t.N; i += step) { const c = t.center[i];
      const d = (c.x-x)**2 + (c.z-z)**2; if (d < bd) { bd = d; best = i; } }
    if (bd > 3600) continue;
    const c = t.center[best], c2 = t.center[(best + 1) % t.N];
    const fx = c2.x - c.x, fz = c2.z - c.z, L = Math.hypot(fx, fz) || 1;
    // side = which flank of the road, from the cross product sign
    const cross = (x - c.x) * (fz / L) - (z - c.z) * (fx / L);
    const side = cross > 0 ? 'L' : 'R';
    // ...AND ONLY THE STREETWALL. `oldtown-frontage` also carries the five
    // ranks stacked BEHIND the terrace, which are deliberately sparse. Mixed
    // in with the frontage they manufacture gaps that are not in the street
    // at all — the first cut of this probe reported 53-71% open on that basis.
    items.push({ i: best, side, x, z, w: sx, lat: Math.abs(cross) });
  }
  // the frontage rank is the nearest cluster of laterals; everything beyond
  // it by more than half a block depth is a back rank
  const lats = items.map((v) => v.lat).sort((a, b2) => a - b2);
  const latFloor = lats[Math.floor(lats.length * 0.05)] ?? 0;
  const front1 = items.filter((v) => v.lat < latFloor + 5);
  const gaps = { L: [], R: [] };
  for (const side of ['L', 'R']) {
    const row = front1.filter((v) => v.side === side).sort((a, b2) => a.i - b2.i);
    for (let k = 1; k < row.length; k++) {
      const a = row[k - 1], c = row[k];
      const d = Math.hypot(c.x - a.x, c.z - a.z);
      const span = (a.w + c.w) / 2;
      // neighbours only: a jump of many stations is the end of a run
      if (c.i - a.i > 24) continue;
      gaps[side].push(+(d - span).toFixed(2));
    }
  }
  const all = [...gaps.L, ...gaps.R].filter((v) => v > -50);
  all.sort((a, b2) => a - b2);
  const open = all.filter((v) => v > 1.5);
  const q = (f) => all.length ? +all[Math.floor(all.length * f)].toFixed(2) : null;
  return { world: g.level.name, blocks: items.length, streetwall: front1.length, latFloor: +latFloor.toFixed(1), neighbourPairs: all.length,
    gapP25: q(0.25), gapMedian: q(0.5), gapP75: q(0.75), gapMax: all.length ? +all[all.length-1].toFixed(2) : null,
    pairsWithOpenGap: open.length,
    pctOpen: all.length ? +(100 * open.length / all.length).toFixed(1) : 0,
    meanOpenGap: open.length ? +(open.reduce((s, v) => s + v, 0) / open.length).toFixed(2) : 0 };
}), null, 0));
await b.close();
