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
      const seaY = T.seaLevel ?? T.waterY ?? tk.seaLevel ?? null;
      const half = (i) => Number(tk.widthAt ? tk.widthAt(i) : 9);
      // walk outward from each station on both sides until the ground drops
      // to/below sea level — that lateral distance IS the road-to-waterline gap
      const dists = [];
      if (seaY !== null && tk.groundHeightAtFrac) {
        for (let i = 0; i < N; i += 2) {
          let best = Infinity;
          for (const sgn of [1, -1]) {
            for (let lat = half(i); lat <= 260; lat += 4) {
              const h = tk.groundHeightAtFrac(i, sgn * lat);
              if (h !== undefined && h <= seaY + 0.4) {
                best = Math.min(best, lat - half(i)); break;
              }
            }
          }
          if (best < Infinity) dists.push(best);
        }
      }
      dists.sort((a, b) => a - b);
      const med = dists.length ? dists[dists.length >> 1] : null;
      const sampled = Math.ceil(N / 2);
      return { name: g.level?.name, theme: g.level?.theme, seaY,
        quay: !!T.quay, coast: !!T.coast,
        near40: dists.filter((d) => d <= 40).length,
        near80: dists.filter((d) => d <= 80).length,
        sampled, withWater: dists.length,
        min: dists.length ? +dists[0].toFixed(1) : null,
        med: med === null ? null : +med.toFixed(1) };
    });
    out.push({ id, ...r, err: errs[0] ?? null });
  } catch (e) { out.push({ id, name: '(load failed)', err: String(e.message).slice(0, 90) }); }
  await p.close();
}
await browser.close();
console.log('world                 theme        marina  sea?   min   med   %lap<=40u  %lap<=80u');
for (const w of out) {
  if (!w.name || w.name === '(load failed)') { console.log(`${String(w.id).padStart(3)} LOAD FAILED  ${w.err}`); continue; }
  const pct = (n) => w.sampled ? String(Math.round(100 * n / w.sampled)).padStart(3) + '%' : '  --';
  console.log(`${w.name.padEnd(20)} ${String(w.theme).padEnd(12)} ${(w.quay ? 'YES' : ' no').padEnd(6)} ${(w.seaY === null ? 'none' : 'yes').padEnd(5)} ${String(w.min ?? '--').padStart(5)} ${String(w.med ?? '--').padStart(5)}  ${pct(w.near40)}       ${pct(w.near80)}`);
}
