/* r343 — name the last straggler records: match each unculled fan solid to
 * the nearest placedElements registry entry (and dedupe by identity). */
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
    const seen = new Set(), out = [];
    for (const cr of t.crests ?? []) {
      const from = (cr.index + Math.round(cr.len * 0.5)) % N;
      const span = Math.round(cr.len * 0.5) + reachS;
      for (const ob of t.solids ?? []) {
        if (ob.culled || !(ob.r > 0) || seen.has(ob)) continue;
        if (ob.mat !== 'stone' || ob.r > 8 || propClassOf(ob) !== 'obstacle') continue;
        if (ob.src === 'culvertParapet' || ob.src === 'culvertHeadwall') continue;
        if (ob.im && ob.inst !== undefined && ob.im.setMatrixAt) continue;
        const gi = t.nearestIndex ? t.nearestIndex(ob, null) : 0;
        const rel = (gi - from + N) % N;
        if (rel > span) continue;
        const c = t.center[gi];
        if (Math.hypot(ob.x - c.x, ob.z - c.z) > half(gi) + 6) continue;
        seen.add(ob);
        let best = null, bd = 1e9;
        for (const el of t.placedElements ?? []) {
          const d = Math.hypot(el.x - ob.x, el.z - ob.z);
          if (d < bd) { bd = d; best = el; }
        }
        out.push({ r: +(+ob.r).toFixed(1), src: ob.src, lat: +Math.hypot(ob.x - c.x, ob.z - c.z).toFixed(1),
          gi, elem: best ? `${best.type}@${bd.toFixed(1)}u` : 'none' });
      }
    }
    return { name: g.level?.name, hits: out };
  });
  console.log(`${id} ${r.name}: ${r.hits.length} unique — ${r.hits.map((h) => JSON.stringify(h)).join(' ')}`);
  await p.close();
}
await browser.close();
