/* #116 (owner, r408): "camera shakes AFTER the tunnel", exit side.
 *
 * This is the owner's SECOND shake report (r398 was "car still shaking"), so
 * working rule 3 applies: a fix that failed twice has a second code path.
 * r398 was about the CAR. This is the CAMERA, at one place on the track.
 *
 * Why the gate never saw it: test-camstable drives ONE world (level 2) and
 * thresholds SUSTAINED angular velocity — a short burst at a tunnel mouth
 * passes both filters.
 *
 * So: drive a tunnel world, log camera angular velocity per frame against
 * track position, then report what happens INSIDE the bore versus in the
 * stations right AFTER the exit portal. No claim before the numbers.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8921';
const LEVEL = process.env.LEVEL ?? '19';          // KARVEN CLIMB, two tunnels
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
const errors = [];
p.on('pageerror', (e) => errors.push(String(e.message)));
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });

const R = await p.evaluate(async () => {
  const g = window.__game;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
              get elapsedTime() { return elapsed; } };
  const pl = g.player, cam = g.camera, N = g.track.center.length;
  g.input.autoThrottle = false; g.input.bothSteer = false;
  g.input.analog.throttle = 1; g.input.analog.brake = 0; g.input.analog.steer = 0;

  const q = cam.quaternion.clone();
  const samples = [];
  let shakeMax = 0;
  for (let f = 0; f < 4200; f++) {                 // 70 s of driving
    g._frameBody();
    const dot = Math.min(1, Math.abs(q.dot(cam.quaternion)));
    const degPerFrame = 2 * Math.acos(dot) * 180 / Math.PI;
    q.copy(cam.quaternion);
    shakeMax = Math.max(shakeMax, g.shake ?? 0);
    samples.push({ i: pl.trackIndex, w: +(degPerFrame * 60).toFixed(1),
      shake: +(g.shake ?? 0).toFixed(3),
      camY: +cam.position.y.toFixed(2),
      inBore: !!pl._inTunnel || !!g._inTunnel });
  }
  // find the bores from the world's own tunnel record if it exposes one
  const bores = (g.track?.tunnels ?? g.track?._tunnels ?? []).map((t) => ({
    a: t.si ?? t.startIndex ?? t.i0, b: t.ei ?? t.endIndex ?? t.i1 }));
  return { world: g.level?.name, N, samples, bores, shakeMax,
    boreKeys: Object.keys(g.track ?? {}).filter((k) => /tunnel|bore/i.test(k)) };
});
await browser.close();

const S = R.samples;
console.log(`${R.world}  N=${R.N}  frames=${S.length}  peak g.shake=${R.shakeMax}`);
console.log(`track tunnel keys: ${JSON.stringify(R.boreKeys)}  bores: ${JSON.stringify(R.bores)}`);
const w = S.map((s) => s.w);
const sorted = [...w].sort((a, b) => a - b);
const pct = (x) => sorted[Math.floor(sorted.length * x)];
console.log(`camera angular velocity deg/s — p50 ${pct(0.5).toFixed(0)}  p95 ${pct(0.95).toFixed(0)}  p99 ${pct(0.99).toFixed(0)}  max ${Math.max(...w).toFixed(0)}`);
// the worst 12 frames and where they happened
const worst = S.map((s, k) => ({ ...s, k })).sort((a, b) => b.w - a.w).slice(0, 12);
console.log('worst frames (deg/s @ station, camY, g.shake):');
for (const x of worst) console.log(`   ${String(x.w).padStart(7)} @${String(x.i).padStart(4)}  camY ${x.camY}  shake ${x.shake}`);
if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 3));
