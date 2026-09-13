/* MASTER §4 route metrics: lap length, corner density, straights, radius
 * classes, direction alternation — measured off t.center curvature. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const su = Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z);
  const lapM = su * N;
  // signed curvature per sample from heading delta
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const curv = [];
  for (let i = 0; i < N; i++) {
    curv.push(wrap(t.headingAt((i + 1) % N) - t.headingAt(i)) / su);
  }
  // a CORNER = a maximal run where |R| < 200 m (|curv| > 1/200), min arc 15°
  const corners = [];
  let i = 0;
  while (i < N) {
    if (Math.abs(curv[i]) > 1 / 200) {
      const sgn = Math.sign(curv[i]);
      let j = i, arc = 0, worst = 0;
      while (j < N && Math.sign(curv[j % N]) === sgn && Math.abs(curv[j % N]) > 1 / 260) {
        arc += Math.abs(curv[j % N]) * su; worst = Math.max(worst, Math.abs(curv[j % N])); j++;
      }
      if (arc > 0.26) corners.push({ i, len: (j - i) * su,
        // effective radius = length/turn — the number §4 legislates; the
        // worst single sample spikes 3x tighter at spacing joins
        R: +(((j - i) * su) / arc).toFixed(0), dir: sgn, arcDeg: +(arc * 180 / Math.PI).toFixed(0) });
      i = j + 1;
    } else i++;
  }
  // straights: runs with |R| > 400
  let maxStraight = 0, run = 0;
  for (let k = 0; k < 2 * N; k++) {
    if (Math.abs(curv[k % N]) < 1 / 400) run += su; else { maxStraight = Math.max(maxStraight, run); run = 0; }
    if (k > N && run > lapM) break;
  }
  const cls = { hairpin: 0, medium: 0, sweeper: 0, open: 0 };
  for (const c of corners) {
    if (c.R <= 25) cls.hairpin++;
    else if (c.R <= 60) cls.medium++;
    else if (c.R <= 150) cls.sweeper++;
    else cls.open++;
  }
  // alternation: longest same-direction run
  let sameRun = 1, worstSame = 1;
  for (let k = 1; k < corners.length; k++) {
    sameRun = corners[k].dir === corners[k - 1].dir ? sameRun + 1 : 1;
    worstSame = Math.max(worstSame, sameRun);
  }
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k < N; k++) { const y = t.center[k].y; lo = Math.min(lo, y); hi = Math.max(hi, y); }
  const tight = [...corners].sort((a, b) => a.R - b.R).slice(0, 8);
  return { tight, name: g.level?.name, lapM: Math.round(lapM), corners: corners.length,
    perKm: +(corners.length / (lapM / 1000)).toFixed(1), cls,
    maxStraight: Math.round(maxStraight), worstSameDir: worstSame,
    elevRange: Math.round(hi - lo) };
});
console.log(JSON.stringify(r));
await browser.close();
