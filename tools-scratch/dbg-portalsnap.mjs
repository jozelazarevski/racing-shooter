/* E-22 remainder: WHY is the chase target far above the eye at the portal?
 *
 * r427 fixed the in-bore fight (146-155 deg/s -> 9-10). The single-frame snap
 * at station 113 survived: height 3.9 -> 9.3, and the writer probe attributes
 * it to the LERP taking a +4.46 u step. At the nominal rate
 * k = 1-exp(-5.5/60) = 0.088, a 4.46 u step needs a ~50 u gap — or a much
 * larger _camDt. Measure both rather than assume either.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8921';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
const errors = [];
p.on('pageerror', (e) => errors.push(String(e.message)));
await p.goto(`${BASE}/?level=19&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });

const R = await p.evaluate(async () => {
  const g = window.__game;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
              get elapsedTime() { return elapsed; } };
  const pl = g.player;
  g.input.autoThrottle = false; g.input.bothSteer = false;
  g.input.analog.throttle = 1; g.input.analog.brake = 0; g.input.analog.steer = 0;

  // wrap the lerp to capture the gap and the rate at the moment of the step
  const rows = [];
  const origLerp = g.camPos.lerp.bind(g.camPos);
  g.camPos.lerp = function (target, k) {
    if (pl.trackIndex >= 108 && pl.trackIndex <= 116) {
      rows.push({ st: pl.trackIndex,
        camY: +this.y.toFixed(2), tgtY: +target.y.toFixed(2),
        gap: +(target.y - this.y).toFixed(2), k: +k.toFixed(4),
        camDt: +(g._camDt ?? -1).toFixed(4),
        band: g._coverBand ? `${g._coverBand.lo.toFixed(1)}..${g._coverBand.hi.toFixed(1)}` : 'none',
        // recompute the bore ceiling HERE, at the portal, instead of reading a
        // snapshot after the run — r426 read the latter and concluded the
        // ceiling never binds, which justified a revert on unsound grounds
        // even though the revert itself was right for other reasons.
        ceil: (() => {
          const tk = g.track;
          if (!tk?._tunnels?.length) return null;
          const fi = tk.fracIndexAt ? tk.fracIndexAt(pl.pos, pl.trackIndex) : pl.trackIndex;
          for (const T of tk._tunnels) {
            const dIn = (fi >= T.s - 80 && fi < T.s) ? T.s - fi
              : (fi > T.e && fi <= T.e + 80) ? fi - T.e : null;
            if (dIn === null) continue;
            const portal = fi < T.s ? T.s : T.e;
            const info = tk.tunnelAt(tk.center[portal], portal, 0);
            if (!info) continue;
            const eng = Math.max(0, Math.min(tk.center.length - 1,
              fi < T.s ? T.s - 6 : T.e + 6));
            return +(tk.center[Math.round(eng)].y + info.apex - 1.3
              + Math.max(0, dIn - 6) * (tk.segLen ?? 6) * 0.18).toFixed(2);
          }
          return null;
        })(),
        step: +((target.y - this.y) * k).toFixed(2) });
    }
    return origLerp(target, k);
  };
  let reached = false;
  for (let f = 0; f < 4200; f++) {
    if (pl.trackIndex >= 108 && pl.trackIndex <= 116) reached = true;
    g._frameBody();
  }
  if (!reached) return { FAIL: 'never reached stations 108-116', max: pl.trackIndex };
  return { rows: rows.slice(0, 400), n: rows.length };
});
await browser.close();
if (R.FAIL) { console.log('HARNESS FAILURE:', R.FAIL, R.max); process.exit(1); }
console.log(`${R.n} lerp calls in stations 108-116; the biggest steps:`);
for (const r of R.rows.sort((a, b) => Math.abs(b.step) - Math.abs(a.step)).slice(0, 14)) {
  console.log(`  @${String(r.st).padStart(3)}  cam ${String(r.camY).padStart(7)} -> target ${String(r.tgtY).padStart(7)}  gap ${String(r.gap).padStart(7)}  k ${r.k}  camDt ${r.camDt}  step ${String(r.step).padStart(6)}  ceil ${r.ceil === null ? '   none' : String(r.ceil).padStart(7)}  band ${r.band}`);
}
if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 3));
