/* E-23, THE HONEST INSTRUMENT.
 *
 * Two earlier instruments measured a PROXY for "how far is the water" and
 * both were wrong, in opposite directions:
 *
 *   dbg-seaside measured the distance to the SEGMENT T.coast.a->b. The
 *     authored segments are ~2.5 km long and the laps run off their ends, so
 *     the clamp charged a station the distance to the segment's ENDPOINT.
 *     It reported HILLTOWN STACK at 1% of the lap within 40 u where the
 *     game's own half-plane says 39.9%.
 *   the half-plane (the game's `_coastSide`) is the right model for the LINE
 *     but the line is not the waterline: the sea is a flat plane at
 *     `C.level` and you only SEE water where the ground is below it. Inside
 *     15 u of the road `_blendHeight` holds the ground at road datum, so the
 *     real shore stands off the line by however far the ground takes to fall.
 *
 * This one asks the question the owner asked: march out from the road edge
 * and find the first point that is actually WATER (`_underwater`, which is
 * `terrainHeight < level + 0.6` — what gets drawn blue and what drowns a
 * car). No model, no proxy. Run with NOPULL=1 for the authored baseline.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8931';
const IDS = (process.env.IDS ?? '29,50,51,52,53,54,57,58,59,60,62,73,75,76,77,49').split(',');
const NOPULL = process.env.NOPULL === '1';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const out = [];
for (const id of IDS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  p.setDefaultTimeout(300000);
  if (NOPULL) await p.addInitScript(() => { window.__NOCOASTPULL = true; });
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
    await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
    const r = await p.evaluate(() => {
      const g = window.__game, tk = g.track, N = tk.center.length;
      if (!tk.T?.coast) return { name: g.level?.name, hasCoast: false };
      const STEP = 3, REACH = 600;
      const d = [];
      for (let i = 0; i < N; i++) {
        const c = tk.center[i], n = tk.center[(i + 1) % N];
        let tx = n.x - c.x, tz = n.z - c.z;
        const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const half = Number(tk.widthAt ? tk.widthAt(i) : 9);
        let bestD = Infinity;
        for (const s of [1, -1]) {
          const nx = -tz * s, nz = tx * s;
          for (let r2 = half; r2 <= REACH; r2 += STEP) {
            if (tk._underwater(c.x + nx * r2, c.z + nz * r2)) { bestD = Math.min(bestD, r2 - half); break; }
          }
        }
        d.push(bestD);
      }
      const fin = d.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
      return { name: g.level?.name, hasCoast: true, N,
        near40: d.filter((v) => v <= 40).length,
        near80: d.filter((v) => v <= 80).length,
        reach: fin.length,
        min: fin.length ? +fin[0].toFixed(1) : null,
        med: fin.length ? +fin[fin.length >> 1].toFixed(1) : null };
    });
    out.push({ id, ...r });
  } catch (e) { out.push({ id, name: '(load failed)', err: String(e.message).slice(0, 90) }); }
  await p.close();
}
await browser.close();
console.log(`REAL WATER, road edge to first underwater ground  (${NOPULL ? 'AUTHORED baseline' : 'with the coast fitted'})`);
console.log('world                  min     med   %lap<=40u  %lap<=80u  %lap with water in 600u');
for (const w of out) {
  if (!w.hasCoast) { console.log(`${String(w.name).padEnd(20)}  no coast`); continue; }
  const pc = (n) => String(Math.round(100 * n / w.N)).padStart(3) + '%';
  console.log(`${w.name.padEnd(20)} ${String(w.min ?? '--').padStart(6)} ${String(w.med ?? '--').padStart(7)}  ${pc(w.near40)}       ${pc(w.near80)}      ${pc(w.reach)}`);
}
