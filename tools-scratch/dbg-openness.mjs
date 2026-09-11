/* E-10 pilot groundwork: WHAT DOES "OPEN" MEAN IN THIS CODEBASE'S OWN UNITS?
 *
 * CLAUDE.md §8 gives the open template in METRES (halfWidth 8, corner radius
 * 60, designSpeed 200) but the game is in `u` and ROAD_HALF is already 9, so
 * applying the spec numbers literally would NARROW the roads. The template is
 * a shape, not a set of constants to paste. So measure the roster in its own
 * terms and let "open" be defined relative to what exists.
 *
 * Per world: median and min drivable half-width, the corner-radius
 * distribution (the same circumcircle metric the HRD gate and the edge-rail
 * builder read), and how much of the lap is genuinely straight.
 *
 *   node tools-scratch/dbg-openness.mjs 26 12 30 47 66
 */
import { chromium } from 'playwright-core';
const A = process.argv.slice(2).map(Number).filter(Number.isFinite);
const USE = A.length ? A : [26];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);

for (const lv of USE) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`,
    { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center?.length, undefined, { timeout: 600000 });
  console.log(JSON.stringify(await p.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    const K = Math.max(3, Math.round(30 / t.segLen));
    const radAt = (i) => {
      const a = t.center[(i - K + N) % N], c0 = t.center[i], c = t.center[(i + K) % N];
      const abx = c0.x - a.x, abz = c0.z - a.z, bcx = c.x - c0.x, bcz = c.z - c0.z;
      const cross = abx * bcz - abz * bcx;
      if (Math.abs(cross) < 1e-6) return 1e9;
      const ab = Math.hypot(abx, abz), bc = Math.hypot(bcx, bcz),
        ac = Math.hypot(c.x - a.x, c.z - a.z);
      return (ab * bc * ac) / (2 * Math.abs(cross));
    };
    const w = [], r = [];
    for (let i = 0; i < N; i++) { w.push(t.widthAt(i)); r.push(Math.min(radAt(i), 1e5)); }
    const q = (arr, f) => { const s = [...arr].sort((a, c) => a - c);
      return +s[Math.floor(f * (s.length - 1))].toFixed(1); };
    // lap length in u
    let len = 0;
    for (let i = 0; i < N; i++) {
      const a = t.center[i], c = t.center[(i + 1) % N];
      len += Math.hypot(c.x - a.x, c.z - a.z);
    }
    return { id: t.level?.id, world: t.level?.name, theme: t.level?.theme,
      lapU: Math.round(len), stations: N,
      halfWidth: { min: q(w, 0), p50: q(w, 0.5), max: q(w, 1) },
      cornerR: { p05: q(r, 0.05), p25: q(r, 0.25), p50: q(r, 0.5) },
      tightPct: +(100 * r.filter((x) => x < 45).length / N).toFixed(1),
      straightPct: +(100 * r.filter((x) => x > 200).length / N).toFixed(1) };
  }, undefined)));
}
await b.close();
