/* Owner screenshot ("Fix", r359, RED CENTRE RUN): a scaffold tower stands
 * at the left carriageway edge and a striped object lies mid-road. Scan
 * every prop family on level 32 for records inside or hard against the
 * ribbon, with enough fields to fingerprint what each one is. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVEL = process.env.LEVEL ?? 32;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 800, height: 520 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 120000 });

const R = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const N = t.center.length;
  const near = (x, z) => {
    let bi = 0, bd = Infinity;
    for (let i = 0; i < N; i += 2) {
      const c = t.center[i];
      const d = (c.x - x) * (c.x - x) + (c.z - z) * (c.z - z);
      if (d < bd) { bd = d; bi = i; }
    }
    for (let i = Math.max(0, bi - 2); i < Math.min(N, bi + 3); i++) {
      const c = t.center[i];
      const d = (c.x - x) * (c.x - x) + (c.z - z) * (c.z - z);
      if (d < bd) { bd = d; bi = i; }
    }
    return { i: bi, d: Math.sqrt(bd) };
  };
  const hw = t.roadHalf ?? 5.5;
  const out = { world: g.level?.name, hw, families: {}, hits: [] };
  const scan = (name, arr, rOf, extra) => {
    out.families[name] = (arr ?? []).length;
    for (const o of arr ?? []) {
      const x = o.x ?? o.pos?.x, z = o.z ?? o.pos?.z;
      if (x === undefined) continue;
      const { i, d } = near(x, z);
      const r = rOf ? rOf(o) : (o.r ?? 0);
      if (d - r < hw + 1.5) {
        out.hits.push({ fam: name, i, dist: +d.toFixed(1), r: +(+r).toFixed(1),
          ...(extra ? extra(o) : {}),
          keys: Object.keys(o).slice(0, 12).join(',') });
      }
    }
  };
  scan('obstacles', t.obstacles);
  scan('solids', t.solids, (o) => o.r ?? 0, (o) => ({ mat: o.mat, h: o.h }));
  scan('barriers', t.barriers);
  scan('trees', t.trees, (o) => (o.s ?? 1) * 1.2, (o) => ({ kind: o.kind }));
  scan('props', t.props, (o) => o.r ?? 1, (o) => ({ kind: o.kind ?? o.type }));
  scan('decor', t.decor, (o) => o.r ?? 1, (o) => ({ kind: o.kind ?? o.type }));
  scan('structures', t.structures, (o) => o.r ?? 3, (o) => ({ kind: o.kind ?? o.b }));
  scan('buildings', t.buildings, (o) => o.r ?? 3, (o) => ({ kind: o.kind ?? o.b }));
  // anything else array-like on track with x/z records
  for (const k of Object.keys(t)) {
    if (out.families[k] !== undefined || ['center','tan','nrm','_preWarp','_shadows'].includes(k)) continue;
    const v = t[k];
    if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0]
        && (v[0].x !== undefined || v[0].pos) && v.length < 4000) {
      scan(k, v, (o) => o.r ?? 1, (o) => ({ kind: o.kind ?? o.type ?? o.mat }));
    }
  }
  return R2(out);
  function R2(o) { o.hits.sort((a, b) => a.dist - b.dist); o.hits = o.hits.slice(0, 40); return o; }
});
console.log(`world=${R.world} roadHalf=${R.hw}`);
console.log('families:', JSON.stringify(R.families));
for (const h of R.hits) console.log(JSON.stringify(h));
await browser.close();
