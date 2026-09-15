/* r433: WHY do two grass runways on the same world read 67% and 25%?
 * F7 is a SURFACE law. The suite already DISQUALIFIES a runway for brush
 * (r403) but only SCORES trunks at 0.03 each (r391), so a line that has to
 * be threshed through trees can still win the sort. This asks whether that
 * is what happened, instead of assuming it. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 320 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=66&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  const sample = (i, lat, f) => {
    const h = t.headingAt(i), pt = t.pointAt(i, lat);
    const dx = Math.sin(h), dz = Math.cos(h);
    let n = 0;
    for (let s = 0; s <= 60; s += 5) n += f(pt.x + dx * s, pt.z + dz * s);
    return n;
  };
  const treesOn = (i, lat) => sample(i, lat, (x, z) => {
    let n = 0; for (const tr of t.camTreesNear(x, z)) if (Math.hypot(tr.x - x, tr.z - z) < 1.8) n++;
    return n;
  });
  const brushOn = (i, lat) => sample(i, lat, (x, z) => {
    let n = 0; for (const tr of t.camTreesNear(x, z)) if (Math.hypot(tr.x - x, tr.z - z) < 8) n++;
    return n >= 3 ? 1 : 0;
  });
  // the whole candidate field, so "no brush-free corridor" can be checked
  let clean = 0, total = 0, cleanBoth = 0;
  for (let i = 0; i < N; i += 5) {
    const wHere = t.widthAt?.(i) ?? 5;
    for (const lat of [9, 12, 16, 20, -9, -12, -16, -20]) {
      if (Math.abs(lat) < wHere + 3) continue;
      total++;
      const br = brushOn(i, lat), tr = treesOn(i, lat);
      if (br === 0) clean++;
      if (br === 0 && tr === 0) cleanBoth++;
    }
  }
  // WRONG THEORY #1 was trunks (both runways have zero). Look at the
  // ground itself: grade along the run, and the surface the wheels read.
  const profile = (i, lat) => {
    const h = t.headingAt(i), pt = t.pointAt(i, lat);
    const dx = Math.sin(h), dz = Math.cos(h);
    const ys = [], surf = {};
    for (let s = 0; s <= 60; s += 5) {
      const x = pt.x + dx * s, z = pt.z + dz * s;
      ys.push(+t.terrainHeight(x, z).toFixed(1));
      const sid = t.surfaceAt ? t.surfaceAt(x, z) : (t.surfaceIdAt ? t.surfaceIdAt(x, z) : '?');
      const k = typeof sid === 'object' ? (sid?.id ?? JSON.stringify(sid)) : String(sid);
      surf[k] = (surf[k] ?? 0) + 1;
    }
    let rise = 0;
    for (let k = 1; k < ys.length; k++) rise += Math.abs(ys[k] - ys[k - 1]);
    // WRONG THEORY #2 was the ground (both runs are flat, ~1 u of rise over
    // 60 u). treesOn and brushOn both read camTrees ONLY. `this.solids` —
    // rocks, barriers, posts, stacks — is a different registry entirely, and
    // nothing in the runway search looks at it.
    let hits = 0; const what = {};
    for (let s = 0; s <= 60; s += 2) {
      const x = pt.x + dx * s, z = pt.z + dz * s;
      for (const so of (t.solids ?? [])) {
        const rr = (so.r ?? 1) + 1.6;
        if ((x - so.x) ** 2 + (z - so.z) ** 2 < rr * rr) {
          hits++; what[so.mat ?? '?'] = (what[so.mat ?? '?'] ?? 0) + 1; break;
        }
      }
    }
    return { ys, totalRise: +rise.toFixed(1), drop: +(ys[ys.length-1]-ys[0]).toFixed(1), solidHits: hits, solidMats: what };
  };
  // THEORY #4, and this one is the suite's OWN filter rather than my guess:
  // runOne only records vTop on frames where the ground 4 u AHEAD is within
  // 3% grade. The car is re-seated at the same station every 90 frames, so
  // it replays roughly the first 20 u over and over. If that stretch is
  // undulating, the only frames that COUNT are the early, slow ones.
  const flatFrac = (i, lat) => {
    const h = t.headingAt(i), pt = t.pointAt(i, lat);
    const dx = Math.sin(h), dz = Math.cos(h);
    let flat = 0, n = 0;
    for (let s = 0; s <= 24; s += 0.5) {          // the stretch a 1.5 s leg covers
      const x = pt.x + dx * s, z = pt.z + dz * s;
      const h0 = t.terrainHeight(x, z);
      const g = Math.abs((t.terrainHeight(x + dx * 4, z + dz * 4) - h0) / 4);
      n++; if (g < 0.03) flat++;
    }
    return { flatPct: Math.round(100 * flat / n), n };
  };
  return { candidates: total, brushFree: clean, brushAndTrunkFree: cleanBoth,
    flat5_12: flatFrac(5, 12), flat885_m12: flatFrac(885, -12),
    prof5_12: profile(5, 12), prof885_m12: profile(885, -12),
    at5_12:   { trees: treesOn(5, 12),    brush: brushOn(5, 12) },
    at885_m12:{ trees: treesOn(885, -12), brush: brushOn(885, -12) } };
})));
await b.close();
