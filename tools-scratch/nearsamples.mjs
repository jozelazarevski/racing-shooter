/* WHAT STANDS NEAR SAMPLE S — the One-Defect interrogation, on demand.
 *
 * whokilled.mjs said the agent driver loses hull at the same samples every
 * lap; this answers "to WHAT". For each sample asked about it prints the
 * road's half-width and every obstacle, barrier segment and track solid
 * within 16 u, with signed lateral offset — so "a stone thing at lat 10.8 on
 * a 9 u road" (an edge rail doing its job) reads differently from "a stone
 * thing at lat 4" (the defect this repo keeps shipping).
 *
 * PINE VALLEY's answer, for the record (r271): the driver's big stone hits at
 * samples ~93 and ~294 are the EDGE RAILS at |lat| 10.8 on a half-width-9
 * road — pure-pursuit corner overshoot into a wall that is where it should
 * be, charged by onSolidCrash's stone rules. Driver error, not placement.
 *
 *   node tools-scratch/nearsamples.mjs <level> <sample> [sample...]
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const [lvl, ...samples] = process.argv.slice(2).map(Number);
if (!lvl || !samples.length) { console.log('usage: nearsamples.mjs <level> <sample...>'); process.exit(1); }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 400, height: 300 } });
await page.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 90000 });
const r = await page.evaluate((SS) => {
  const t = window.__game.track;
  const out = [];
  for (const S of SS) {
    const c = t.center[S], h = t.headingAt(S);
    const lat = (x, z) => (x - c.x) * Math.cos(h) - (z - c.z) * Math.sin(h);
    const row = { S, w: t.widthAt ? +t.widthAt(S).toFixed(1) : null, near: [] };
    for (const ob of t.obstacles ?? []) {
      const d = Math.hypot(ob.x - c.x, ob.z - c.z);
      if (d < 16) row.near.push({ what: 'obstacle', d: +d.toFixed(1), lat: +lat(ob.x, ob.z).toFixed(1), r: +(ob.r ?? 0).toFixed(1), mat: ob.mat ?? '?' });
    }
    for (const q of t.barriers ?? []) {
      const mx = (q.x1 + q.x2) / 2, mz = (q.z1 + q.z2) / 2;
      const d = Math.hypot(mx - c.x, mz - c.z);
      if (d < 16) row.near.push({ what: 'barrier', d: +d.toFixed(1), lat: +lat(mx, mz).toFixed(1), hw: q.hw, mat: q.mat ?? '?', y: +q.y.toFixed(1), over: !!q.over });
    }
    for (const s of t.solids ?? []) {
      const d = Math.hypot(s.x - c.x, s.z - c.z);
      if (d < 16) row.near.push({ what: 'solid', d: +d.toFixed(1), lat: +lat(s.x, s.z).toFixed(1), r: +(s.r ?? 0).toFixed(1), mat: s.mat ?? '?' });
    }
    row.near.sort((a, z) => Math.abs(a.lat) - Math.abs(z.lat));
    out.push(row);
  }
  return { name: window.__game.level?.name, rows: out };
}, samples);
console.log(r.name);
for (const row of r.rows) {
  console.log(` sample ${row.S}  half-width ${row.w}`);
  for (const n of row.near.slice(0, 10)) console.log('   ', JSON.stringify(n));
}
await b.close();
