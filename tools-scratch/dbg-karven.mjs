/* E-30: "Gothard pass is gone - that one was fun".
 *
 * World 19 was RENAMED to KARVEN CLIMB at r334, not deleted. The open question
 * is whether it still DRIVES like the flagship pass, because the rename is a
 * hundred builds old and the complaint is new.
 *
 * The old numbers are on the record (src/track.js:59): GOTTHARD measured
 * 22.9% of lap under a 40 u corner radius and 11.8% under 25 u, against
 * ROCKFALL RAVINE's 25.8 / 14.3 and TREMOLA's 21.3 / 10.8. Those three were
 * measured together, so measuring all three today makes the comparison
 * self-checking: if ROCKFALL and TREMOLA still read near their recorded
 * figures, the ruler is the same one and any drift on KARVEN is real.
 *
 * NO CLAIM BEFORE THE NUMBERS. This prints the distribution, the climb, and
 * the hairpin count; it does not decide what they mean.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVELS = (process.env.LEVELS ?? '19,10,20,21').split(',');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

console.log('world                 lapLen   medR   %<40u  %<25u   hairpins  climb  descent  roadYrange  segLen');
for (const L of LEVELS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  p.setDefaultTimeout(300000);
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  await p.goto(`${BASE}/?level=${L}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => window.__game?.track?.center?.length, undefined, { timeout: 300000 });
  const R = await p.evaluate(() => {
    const g = window.__game, t = g.track, C = t.center, N = C.length;
    // SAME three-point circumradius the roster was measured with (probe-radius),
    // same k = 6 stations of arm. Changing the arm would change every number.
    // THE ARM MUST BE IN WORLD UNITS, NOT STATIONS. probe-radius used k = 6
    // stations, and r340 doubled every lap: segLen is now 8.4-9.6 u, so a
    // 6-station arm spans ~57 u each side and its three points straddle 113 u
    // of road. A rally hairpin of radius 18 u is INVISIBLE to that ruler --
    // it reports the gentle sweep the hairpin sits inside. Any figure recorded
    // before r340 and any figure taken with a station arm after it are not the
    // same measurement. Fixed arc-length arm, walked along the polyline.
    // AND 14 u IS STILL TOO LONG. track.js's own r394 note records GLACIER COL
    // with a true minimum radius of 7 u and 52 hairpin stations; a 7 u hairpin
    // turns through ~22 u of arc, so a 14 u arm each side reaches past both
    // ends of it and returns the sweep it sits in. Two rulers now, and they
    // have to agree or neither is trusted:
    //   (1) a SHORT arm, 4 u each side, which resolves a 7 u turn;
    //   (2) the game's OWN this.curvature array -- the one r394 fixed to walk
    //       the real arc, and the one the AI's corner-speed table reads. If my
    //       geometry disagrees with the array the game actually drives on, the
    //       array wins.
    const ARM = 4;                                    // u each side
    const stepTo = (i, dir) => {
      let d = 0, j = i;
      while (d < ARM) {
        const a = C[(j + N) % N], b = C[(j + dir + N) % N];
        d += Math.hypot(b.x - a.x, b.z - a.z);
        j += dir;
        if (Math.abs(j - i) > N) break;
      }
      return C[((j % N) + N) % N];
    };
    const rad = (i) => {
      const a = stepTo(i, -1), b = C[i % N], c = stepTo(i, 1);
      const abx = b.x - a.x, abz = b.z - a.z, bcx = c.x - b.x, bcz = c.z - b.z;
      const cross = abx * bcz - abz * bcx;
      if (Math.abs(cross) < 1e-6) return 1e9;
      const ab = Math.hypot(abx, abz), bc = Math.hypot(bcx, bcz), ac = Math.hypot(c.x - a.x, c.z - a.z);
      return (ab * bc * ac) / (2 * Math.abs(cross));
    };
    // WEIGHT BY ARC LENGTH, not by station count: "% of lap" is a distance
    // share, and station spacing is not guaranteed uniform.
    let lap = 0, u40 = 0, u25 = 0;
    const radii = [];
    for (let i = 0; i < N; i++) {
      const a = C[i], b = C[(i + 1) % N];
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      const r = rad(i);
      lap += d; radii.push(r);
      if (r < 40) u40 += d;
      if (r < 25) u25 += d;
    }
    // a HAIRPIN is a contiguous run of stations under 25 u, counted once
    let hairpins = 0, inRun = false;
    for (let i = 0; i < N; i++) {
      if (radii[i] < 25) { if (!inRun) { hairpins++; inRun = true; } }
      else inRun = false;
    }
    // total climb and descent along the ROAD itself (7.17a is about the road,
    // not the mountains around it)
    let climb = 0, desc = 0, ymin = Infinity, ymax = -Infinity;
    for (let i = 0; i < N; i++) {
      const dy = C[(i + 1) % N].y - C[i].y;
      if (dy > 0) climb += dy; else desc -= dy;
      ymin = Math.min(ymin, C[i].y); ymax = Math.max(ymax, C[i].y);
    }
    // climb == range would mean a STRICTLY MONOTONE profile: one ramp up, one
    // ramp down, no undulation anywhere -- which is what 7.17(b) and T-04
    // prohibit by name. That is a strong claim, so count the reversals
    // directly instead of inferring them from two totals that happen to match.
    // A reversal only counts if it is worth driving over: 1.5 m of give-back.
    let flips = 0, biggestDip = 0, dir = 0, runLow = C[0].y, runHigh = C[0].y;
    for (let i = 0; i < N; i++) {
      const y0 = C[i].y, y1 = C[(i + 1) % N].y, d = y1 - y0;
      const nd = d > 0.001 ? 1 : d < -0.001 ? -1 : dir;
      if (dir !== 0 && nd !== 0 && nd !== dir) {
        const swing = dir > 0 ? runHigh - y0 : y0 - runLow;
        if (Math.abs(swing) >= 0) { /* extent of the run just ended */ }
        runLow = runHigh = y0;
      }
      if (dir > 0 && nd < 0) { runHigh = Math.max(runHigh, y0); }
      dir = nd;
      runLow = Math.min(runLow, y1); runHigh = Math.max(runHigh, y1);
    }
    // simpler and honest: walk the profile and measure every give-back
    { let peak = C[0].y, trough = C[0].y, up = true; flips = 0; biggestDip = 0;
      for (let i = 1; i <= N; i++) {
        const y = C[i % N].y;
        if (up) {
          if (y > peak) peak = y;
          else if (peak - y >= 1.5) { flips++; biggestDip = Math.max(biggestDip, peak - y); up = false; trough = y; }
        } else {
          if (y < trough) trough = y;
          else if (y - trough >= 1.5) { flips++; up = true; peak = y; }
        }
      }
    }
    // ruler 2: the game's own curvature (radians per world unit) -> radius
    const gcur = t.curvature;
    let g40 = 0, g25 = 0, gmin = Infinity;
    const grad = [];
    if (gcur) {
      for (let i = 0; i < N; i++) {
        const a = C[i], b = C[(i + 1) % N];
        const d = Math.hypot(b.x - a.x, b.z - a.z);
        const r = gcur[i] > 1e-9 ? 1 / gcur[i] : 1e9;
        grad.push(r);
        if (r < 40) g40 += d;
        if (r < 25) g25 += d;
        gmin = Math.min(gmin, r);
      }
    }
    const gs = [...grad].sort((a, b) => a - b);
    const sorted = [...radii].sort((a, b) => a - b);
    return { name: g.level?.name, N, lap, u40, u25, hairpins, climb, desc,
      yrange: ymax - ymin, medR: sorted[sorted.length >> 1], segLen: t.segLen ?? null,
      minR: sorted[0], p01: sorted[(sorted.length*0.01)|0], p05: sorted[(sorted.length*0.05)|0],
      p25: sorted[(sorted.length*0.25)|0],
      gmin, g40pct: 100*g40/lap, g25pct: 100*g25/lap,
      gp01: gs.length ? gs[(gs.length*0.01)|0] : null, gp05: gs.length ? gs[(gs.length*0.05)|0] : null,
      hasCur: !!gcur,
      flips, biggestDip,
      halfW: t.widthAt ? t.widthAt(0) : null };
  });
  console.log(`${String(R.name).padEnd(20)} ${String(Math.round(R.lap)).padStart(6)} `
    + `${String(Math.round(Math.min(R.medR, 9999))).padStart(6)} `
    + `${(100 * R.u40 / R.lap).toFixed(1).padStart(6)} ${(100 * R.u25 / R.lap).toFixed(1).padStart(6)}   `
    + `${String(R.hairpins).padStart(6)}  ${String(Math.round(R.climb)).padStart(5)} `
    + `${String(Math.round(R.desc)).padStart(7)}  ${String(Math.round(R.yrange)).padStart(9)} `
    + `${String(R.segLen).padStart(6)}   halfW ${R.halfW}`);
  console.log(`   elevation      reversals >=1.5 m: ${R.flips}   biggest give-back ${R.biggestDip.toFixed(1)} m`);
  console.log(`   GAME curvature array (hasCur ${R.hasCur})  min ${R.gmin.toFixed(1)}  `
    + `%<40u ${R.g40pct.toFixed(1)}  %<25u ${R.g25pct.toFixed(1)}  p01 ${R.gp01?.toFixed(0)}  p05 ${R.gp05?.toFixed(0)}`);
  console.log(`   my 4u-arm      min ${R.minR.toFixed(1)}  p01 ${R.p01.toFixed(0)}  p05 ${R.p05.toFixed(0)}  p25 ${R.p25.toFixed(0)}`);
  if (errs.length) console.log('   PAGE ERRORS:', errs.slice(0, 2));
  await p.close();
}
await browser.close();
