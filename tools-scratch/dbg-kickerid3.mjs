/* #55 — the residue records, every field they carry. "unculled" in the
 * report means cullSolid found no im/inst handle, so these are BARE records
 * (or non-instanced meshes); their own fields must name the emitter. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const WORLDS = process.env.W ? process.env.W.split(',').map(Number) : [29, 49, 51, 54, 59, 66];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const id of WORLDS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
    undefined, { timeout: 300000 });
  const r = await p.evaluate(async () => {
    const g = window.__game, t = g.track, N = t.center.length;
    const { propClassOf } = await import('./src/route.js');
    const sampleLen = Math.max(1, Math.hypot(
      t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
    const half = (i) => t.widthAt?.(i) ?? 9;
    const reachS = Math.round(((g._nitroCeilU ?? 48) * 1.9) / sampleLen);
    const inFan = (pt, from, span) => {
      const gi = t.nearestIndex ? t.nearestIndex(pt, null) : 0;
      const rel = (gi - from + N) % N;
      if (rel > span) return false;
      const c = t.center[gi];
      if (Math.hypot(pt.x - c.x, pt.z - c.z) > half(gi) + 6) return false;
      if (pt.y !== undefined && pt.h === undefined && Math.abs(pt.y - c.y) > 6) return false;
      return true;
    };
    const out = [];
    const seen = new Set();
    for (const cr of t.crests ?? []) {
      const from = (cr.index + Math.round(cr.len * 0.5)) % N;
      const span = Math.round(cr.len * 0.5) + reachS;
      for (const ob of t.solids ?? []) {
        if (ob.culled || !(ob.r > 0) || seen.has(ob)) continue;
        if (ob.mat !== 'stone' || ob.r > 8 || propClassOf(ob) !== 'obstacle') continue;
        if (ob.src === 'culvertParapet' || ob.src === 'culvertHeadwall') continue;
        if (!inFan(ob, from, span)) continue;
        const cullable = !!(ob.im && ob.inst !== undefined && ob.im.setMatrixAt);
        if (cullable) continue;                 // those get auto-culled
        seen.add(ob);
        const gi = t.nearestIndex(ob, null);
        const c = t.center[gi];
        const fields = {};
        for (const [k, v] of Object.entries(ob)) {
          if (v == null || ['number', 'string', 'boolean'].includes(typeof v)) fields[k] = v;
          else fields[k] = `<${v.constructor?.name ?? typeof v}${v.name ? ':' + v.name : ''}>`;
        }
        out.push({ gi, crest: cr.index, lat: +Math.hypot(ob.x - c.x, ob.z - c.z).toFixed(1),
          dy: ob.y !== undefined ? +(ob.y - c.y).toFixed(1) : null, fields });
      }
    }
    return { name: g.level?.name, crests: (t.crests ?? []).length, out };
  });
  console.log(`\n== ${id} ${r.name} (${r.crests} kickers): ${r.out.length} residue`);
  for (const h of r.out) console.log('  ', JSON.stringify(h));
  await p.close();
}
await browser.close();
