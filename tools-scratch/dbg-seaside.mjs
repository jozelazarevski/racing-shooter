/* E-23: "I want to race NEXT TO it."
 *
 * Not visibility — PROXIMITY. Per coast world, how far is the road edge from
 * the waterline at every station? Reports min, median, and the fraction of
 * the lap within reach of water, plus whether the world builds a marina.
 *
 * A world whose road never comes near its own sea fails the owner's sentence
 * however clear the view is.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8931';
const IDS = (process.env.IDS ?? '29,50,51,52,53,54,57,58,59,60,62,73,75,76,77,49').split(',');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const out = [];
for (const id of IDS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  p.setDefaultTimeout(300000);
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
    await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
    const r = await p.evaluate(() => {
      const g = window.__game, tk = g.track, N = tk.center.length;
      const T = tk.T ?? {};
      // THE GAME'S OWN MODEL, asked rather than guessed: T.coast is a LINE
      // a->b with a sea `level`. My first census guessed T.seaLevel/T.waterY,
      // matched nothing, and printed "sea? none" for every coast world.
      const C = T.coast;
      if (!C || !C.a || !C.b) {
        return { name: g.level?.name, theme: g.level?.theme, quay: !!T.quay,
          hasCoast: false, sampled: 0 };
      }
      const [ax, az] = C.a, [bx, bz] = C.b;
      const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
      const half = (i) => Number(tk.widthAt ? tk.widthAt(i) : 9);
      const dists = [];
      for (let i = 0; i < N; i++) {
        const c = tk.center[i];
        // perpendicular distance from the station to the coast line, minus
        // the carriageway half-width: the gap from ROAD EDGE to waterline
        const t = L2 ? Math.max(0, Math.min(1, ((c.x - ax) * dx + (c.z - az) * dz) / L2)) : 0;
        const px = ax + t * dx, pz = az + t * dz;
        dists.push(Math.max(0, Math.hypot(c.x - px, c.z - pz) - half(i)));
      }
      const sorted = [...dists].sort((a, b2) => a - b2);
      return { name: g.level?.name, theme: g.level?.theme, quay: !!T.quay,
        hasCoast: true, seaLevel: C.level, sampled: N,
        near40: dists.filter((d) => d <= 40).length,
        near80: dists.filter((d) => d <= 80).length,
        min: +sorted[0].toFixed(1),
        med: +sorted[N >> 1].toFixed(1) };
    });
    out.push({ id, ...r, err: errs[0] ?? null });
  } catch (e) { out.push({ id, name: '(load failed)', err: String(e.message).slice(0, 90) }); }
  await p.close();
}
await browser.close();
console.log('world                 theme        marina  sea?     min     med   %lap<=40u  %lap<=80u');
for (const w of out) {
  if (!w.name || w.name === '(load failed)') { console.log(`${String(w.id).padStart(3)} LOAD FAILED  ${w.err}`); continue; }
  const pct = (n) => w.sampled ? String(Math.round(100 * n / w.sampled)).padStart(3) + '%' : '  --';
  console.log(`${w.name.padEnd(20)} ${String(w.theme).padEnd(12)} ${(w.quay ? 'YES' : ' no').padEnd(6)} ${(w.hasCoast ? 'yes' : 'NONE').padEnd(5)} ${String(w.min ?? '--').padStart(6)} ${String(w.med ?? '--').padStart(7)}  ${pct(w.near40)}       ${pct(w.near80)}`);
}
