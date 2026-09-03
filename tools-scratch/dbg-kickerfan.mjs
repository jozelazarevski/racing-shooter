/* r343 debug — what ARE the handle-less obstacle records inside kicker
 * landing fans? Sample offender worlds across templates, re-run the fan
 * geometry from stagecheck's own rule, and classify every unculled hit:
 * tree-without-parts vs solid-without-handle, mat/r/kind, and which
 * distance from the crest they sit at. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const WORLDS = process.env.W ? process.env.W.split(',').map(Number) : [1, 15, 25, 52, 65, 66];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const id of WORLDS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 120)));
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
    const out = { name: g.level?.name, crests: (t.crests ?? []).length, reachS, hits: [] };
    const inFan = (pnt, from, span) => {
      const gi = t.nearestIndex ? t.nearestIndex(pnt, null) : 0;
      const rel = (gi - from + N) % N;
      if (rel > span) return null;
      const c = t.center[gi];
      if (Math.hypot(pnt.x - c.x, pnt.z - c.z) > half(gi) + 6) return null;
      return { rel, lat: +Math.hypot(pnt.x - c.x, pnt.z - c.z).toFixed(1) };
    };
    for (const cr of t.crests ?? []) {
      const from = (cr.index + Math.round(cr.len * 0.5)) % N;
      const span = Math.round(cr.len * 0.5) + reachS;
      for (const tr of t.trees ?? []) {
        if (tr.dead || tr.culled || propClassOf(tr) !== 'obstacle') continue;
        const f = inFan(tr, from, span);
        if (!f) continue;
        if (!tr.parts?.length) out.hits.push({ t: 'tree-noparts', kind: tr.kind, s: tr.s, solid: tr.solid, ...f });
      }
      for (const ob of t.solids ?? []) {
        if (ob.culled || !(ob.r > 0)) continue;
        if (ob.mat !== 'stone' || ob.r > 8 || propClassOf(ob) !== 'obstacle') continue;
        const f = inFan(ob, from, span);
        if (!f) continue;
        if (!(ob.im && ob.inst !== undefined && ob.im.setMatrixAt)) {
          out.hits.push({ t: 'solid-nohandle', mat: ob.mat, r: +(+ob.r).toFixed(1),
            src: ob.src ?? ob.from ?? (ob.prof ? 'prof' : undefined),
            y: +(+ob.y).toFixed(1), h: ob.h, ...f });
        }
      }
    }
    return out;
  });
  const byType = {};
  for (const h of r.hits) byType[h.t + ':' + (h.kind ?? h.src ?? '?')] = (byType[h.t + ':' + (h.kind ?? h.src ?? '?')] ?? 0) + 1;
  console.log(`${id} ${r.name}: crests ${r.crests}, reachS ${r.reachS}, unculled ${r.hits.length}`,
    JSON.stringify(byType), r.hits.slice(0, 4).map((h) => JSON.stringify(h)).join(' '));
  await p.close();
}
await browser.close();
