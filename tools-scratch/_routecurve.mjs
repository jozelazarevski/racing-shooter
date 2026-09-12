/* E-13/E-10 — WHAT SHAPE IS THIS LAP, IN CURVATURE BANDS?
 * Reads the built track's own centreline out of the page (so it includes
 * every post-curve modifier), and reports the radius distribution the way
 * r412 did for SAFARI PLAINS: dead ground is what an open-field track must
 * not be made of.
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
for (const lv of process.argv.slice(2)) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 60000 });
  const ok = await p.waitForFunction(() => window.__game?.track?.center?.length, undefined, { timeout: 60000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(JSON.stringify({ lv, built: false, errs: errs.splice(0, 2) })); continue; }
  console.log(JSON.stringify(await p.evaluate(() => {
    const g = window.__game, c = g.track.center, N = c.length;
    let len = 0; const R = [];
    for (let i = 0; i < N; i++) {
      const a = c[(i - 3 + N) % N], m = c[i], z = c[(i + 3) % N];
      const d1 = Math.hypot(m.x - a.x, m.z - a.z), d2 = Math.hypot(z.x - m.x, z.z - m.z);
      const d3 = Math.hypot(z.x - a.x, z.z - a.z);
      const s = (d1 + d2 + d3) / 2;
      const ar = Math.sqrt(Math.max(0, s * (s - d1) * (s - d2) * (s - d3)));
      R.push(ar < 1e-6 ? 1e6 : (d1 * d2 * d3) / (4 * ar));
      len += Math.hypot(c[(i + 1) % N].x - m.x, c[(i + 1) % N].z - m.z);
    }
    const pct = (f) => +(100 * R.filter(f).length / N).toFixed(1);
    const srt = [...R].sort((x, y) => x - y);
    return { name: g.level?.name, lapU: Math.round(len), N,
      p05: Math.round(srt[(N * 0.05) | 0]), p50: Math.round(srt[(N * 0.5) | 0]),
      dead_over800: pct((r) => r > 800), sweep60_200: pct((r) => r >= 60 && r <= 200),
      open200_800: pct((r) => r > 200 && r <= 800), tight_under60: pct((r) => r < 60) };
  })));
}
await b.close();
