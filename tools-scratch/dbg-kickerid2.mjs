/* #55 — identify residue records by NAMED MESHES nearby (builders name
 * their InstancedMeshes; proximity names the emitter). */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const WORLDS = process.env.W ? process.env.W.split(',').map(Number) : [29, 49, 51, 59];
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
    const seen = new Set(), out = [];
    // collect named object world positions once
    const named = [];
    t.group?.traverse?.((o) => {
      if (!o.name) return;
      const wp = new (Object.getPrototypeOf(o.position).constructor)();
      o.getWorldPosition?.(wp);
      named.push({ name: o.name, x: wp.x, z: wp.z });
    });
    for (const cr of t.crests ?? []) {
      const from = (cr.index + Math.round(cr.len * 0.5)) % N;
      const span = Math.round(cr.len * 0.5) + reachS;
      for (const ob of t.solids ?? []) {
        if (ob.culled || !(ob.r > 0) || seen.has(ob)) continue;
        if (ob.mat !== 'stone' || ob.r > 8 || propClassOf(ob) !== 'obstacle') continue;
        if (ob.src === 'culvertParapet' || ob.src === 'culvertHeadwall') continue;
        const gi = t.nearestIndex ? t.nearestIndex(ob, null) : 0;
        const rel = (gi - from + N) % N;
        if (rel > span) continue;
        const c = t.center[gi];
        if (Math.hypot(ob.x - c.x, ob.z - c.z) > half(gi) + 6) continue;
        if (ob.y !== undefined && ob.h === undefined && Math.abs(ob.y - c.y) > 6) continue;
        seen.add(ob);
        const near = named
          .map((m) => ({ n: m.name, d: Math.hypot(m.x - ob.x, m.z - ob.z) }))
          .sort((a, b) => a.d - b.d).slice(0, 3)
          .map((m) => `${m.n}@${m.d.toFixed(0)}`);
        out.push({ r: +(+ob.r).toFixed(2), lat: +Math.hypot(ob.x - c.x, ob.z - c.z).toFixed(1),
          gi, near });
      }
    }
    return { name: g.level?.name, out };
  });
  console.log(`${id} ${r.name}: ${r.out.length}`);
  for (const h of r.out) console.log('  ', JSON.stringify(h));
  await p.close();
}
await browser.close();
