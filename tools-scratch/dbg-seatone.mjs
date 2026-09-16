/* E-27: the owner's frame measures the sea at the horizon as rgb(203,192,163)
 * — hue 43, CREAM, and BRIGHTER than the sky above it — with the whole body
 * at 4-18% saturation, less colour than the road. `cFar` is
 * `seaColor.lerp(skyHorizon, 0.8)`, so if a world's skyHorizon is a warm
 * cream the sea fades to cream. r387 replaced "fades to the land's fog cream"
 * with "fades to the sky horizon tone"; on a warm-sky world those are the
 * same colour. Check that arithmetic against every coast world. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const IDS = (process.env.IDS ?? '29,50,51,52,53,54,57,58,59,60,73,75,76,77,49').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const rows = [];
for (const id of IDS) {
  const p = await b.newPage({ viewport: { width: 400, height: 260 } });
  p.setDefaultTimeout(600000);
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
    await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
    rows.push(await p.evaluate(() => {
      const g = window.__game, tk = g.track, T = tk.T ?? {};
      if (!T.coast) return null;
      // READ THE BUILT GEOMETRY, not my own arithmetic. The last cut of this
      // probe recomputed cFar by hand; the pipeline also applies haze, a
      // shallow/deep lerp and a per-face jitter on top, so the only honest
      // answer is the colour attribute the GPU is handed.
      let sea = null;
      tk.group.traverse((o) => { if (!sea && /sea|water/i.test(o.name || '') && o.geometry?.getAttribute?.('color')) sea = o; });
      if (!sea) return { name: g.level?.name, noSeaMesh: true };
      const pos = sea.geometry.getAttribute('position'), col = sea.geometry.getAttribute('color');
      const hls = (r, gg, bl) => {
        const mx = Math.max(r, gg, bl), mn = Math.min(r, gg, bl), l = (mx + mn) / 2, d = mx - mn;
        let h = 0, sat = 0;
        if (d > 1e-6) {
          sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
          h = mx === r ? ((gg - bl) / d) % 6 : mx === gg ? (bl - r) / d + 2 : (r - gg) / d + 4;
          h = (h * 60 + 360) % 360;
        }
        return [h, sat, l];
      };
      const bucket = { near: [], mid: [], far: [] };
      for (let v = 0; v < pos.count; v += 7) {
        const d = tk._distToTrack(pos.getX(v), pos.getZ(v));
        const b = d < 250 ? 'near' : d < 900 ? 'mid' : 'far';
        bucket[b].push(hls(col.getX(v), col.getY(v), col.getZ(v)));
      }
      const avg = (a) => {
        if (!a.length) return null;
        // circular mean for hue, so 359 and 1 do not average to 180
        let sx = 0, sy = 0, ss = 0, sl = 0;
        for (const [h, s2, l2] of a) { const r = h * Math.PI / 180; sx += Math.cos(r); sy += Math.sin(r); ss += s2; sl += l2; }
        return [Math.round(((Math.atan2(sy, sx) * 180 / Math.PI) + 360) % 360),
          Math.round(100 * ss / a.length), Math.round(100 * sl / a.length), a.length];
      };
      return { name: g.level?.name, near: avg(bucket.near), mid: avg(bucket.mid), far: avg(bucket.far) };
    }));
  } catch (e) { rows.push({ name: '(load failed ' + id + ')' }); }
  await p.close();
}
await b.close();
console.log('world                 NEAR water            MID water             FAR water (horizon)');
for (const r of rows) {
  if (!r || !r.far) { console.log(r?.name ?? '(no coast)'); continue; }
  const f = (a) => a ? `hue ${String(a[0]).padStart(3)} sat ${String(a[1]).padStart(3)}% lum ${String(a[2]).padStart(3)}%` : '  --';
  const warn = r.far[1] < 30 ? '  <-- STILL WASHED' : '';
  console.log(`${r.name.padEnd(20)} ${f(r.near)}  ${f(r.mid)}  ${f(r.far)}${warn}`);
}
