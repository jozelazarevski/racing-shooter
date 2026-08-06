/* Headless smoke test for the built v2 bundle.
 *
 * The interesting assertions are the v1 bugs, written as tests:
 *   - the car does not sink through the ground
 *   - the car does not float above it
 *   - the car's attitude follows the slope it is standing on, AT ZERO SPEED
 *     (v1 derived pitch from climb rate, so a parked car stood bolt upright
 *      on a hillside)
 *   - the car does not launch itself off the start line
 *
 * The simulation is stepped DIRECTLY rather than through requestAnimationFrame.
 * This harness runs on SwiftShader, a software rasteriser, where the render
 * loop manages roughly a third of real time — any wall-clock assertion would be
 * measuring the rasteriser, not the game. A fixed timestep is what makes the
 * substitution honest: N steps here are the same N steps a player gets.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8902/play-v2/';
const STAGES = ['ouninpohja', 'col-de-turini', 'fafe', 'monte-carlo', 'safari', 'sweet-lamb'];
const SHOTS = process.env.SHOTS ?? '/tmp/v2-shots';

// Chromium does not read HTTPS_PROXY from the environment, so testing the
// deployed build (rather than a local server) needs it passed explicitly.
const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;
const useProxy = proxy && !BASE.includes('localhost');

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: [
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
    ...(useProxy ? [`--proxy-server=${proxy}`, '--ignore-certificate-errors'] : []),
  ],
});

/* Known open issues. Listed here so they stay VISIBLE in every run and cannot
 * be mistaken for passing, while still letting the suite gate against
 * regressions. Removing the assertion instead would be the dishonest fix.
 *
 * EMPTY as of Phase 3, and the reason is worth keeping. The one entry here was
 * Col de Turini, where the autopilot averaged ~9 m/s through the col; it was
 * recorded as a driver-quality problem. It was not. Steering was inverted at
 * the vehicle (see the note in physics/vehicle.ts), so the dummy steered away
 * from every corner and the col — all hairpins — punished it most. With the
 * sign fixed the same dummy finishes 0.2 m from the centreline. A known-issues
 * list that still named it would now be misinformation. */
const KNOWN = {};

let failures = 0;
let known = 0;
let stageId = '';
const check = (name, ok, detail = '') => {
  if (!ok && KNOWN[stageId]?.[name]) {
    known++;
    console.log(`  KNOWN ${name}  ${KNOWN[stageId][name]}`);
    return;
  }
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `  ${detail}` : ''}`);
};

for (const stage of STAGES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    // A missing favicon is not a game defect.
    if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text());
  });

  stageId = stage;
  console.log(`\n${stage}`);
  await page.goto(`${BASE}?stage=${stage}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__v2?.phys && window.__stepFixed,
    undefined, { timeout: 180_000 });

  const info = await page.evaluate(() => ({
    length: window.__v2.stage.length,
    objects: window.__v2.stage.objects.length,
    corners: window.__v2.stage.corners.length,
    fingerprint: document.getElementById('build-info').innerHTML.match(/<b>([0-9a-f]{8})<\/b>/)?.[1],
    lintFail: document.getElementById('build-info').innerHTML.includes('bad">'),
  }));
  check('stage builds', info.objects > 1000 && info.length > 3500,
    `${(info.length / 1000).toFixed(2)} km, ${info.objects.toLocaleString()} objects, ${info.corners} corners, fp ${info.fingerprint}`);
  check('§15 lint passes in-browser', !info.lintFail);

  // --- settle: 3 s of simulation with no input --------------------------
  const settled = await page.evaluate(() => {
    window.__stepFixed(360);
    const g = window.__v2;
    const p = g.car.body.translation();
    const q = g.car.body.rotation();
    const v = g.car.body.linvel();
    const ground = window.__probeGround(p.x, p.z);
    const up = { y: 1 - 2 * (q.x * q.x + q.z * q.z) };
    const tel = g.car.telemetry;
    return {
      clearance: ground === null ? null : p.y - ground,
      upY: up.y,
      vy: v.y,
      grounded: tel.wheels.filter((w) => w.grounded).length,
      speed: tel.speedKmh,
      comp: tel.wheels.map((w) => +w.compression.toFixed(3)),
    };
  });

  check('does not sink into the ground', settled.clearance > 0.15,
    `body ${settled.clearance?.toFixed(2)} m above the surface`);
  check('does not float above the ground', settled.clearance < 1.2,
    `body ${settled.clearance?.toFixed(2)} m above the surface`);
  check('all four wheels find the ground', settled.grounded === 4,
    `${settled.grounded}/4, compressions ${JSON.stringify(settled.comp)}`);
  check('rests still — does not launch itself', Math.abs(settled.vy) < 0.5 && settled.speed < 2,
    `vy ${settled.vy.toFixed(3)} m/s, ${settled.speed.toFixed(2)} km/h`);
  check('suspension carries the car, not the hull',
    settled.comp.every((c) => c > 0.01 && c < 0.19), JSON.stringify(settled.comp));
  check('body attitude comes from the ground at zero speed',
    settled.upY > 0.85 && settled.upY <= 1.0000001, `up.y ${settled.upY.toFixed(4)}`);

  // --- drive: 12 s of simulation, following the road --------------------
  //
  // With no steering the car leaves the stage at the first real corner, which
  // is correct behaviour and a useless test. So the harness drives: aim at a
  // point down the centreline, and brake for the corner grade. If a simple
  // pure-pursuit controller can get down the stage, the car is drivable.
  const driven = await page.evaluate(() => {
    const g = window.__v2;
    const before = g.car.body.translation();
    const segs = g.stage.corridor.segments;

    let nearest = 0;
    let maxSpeed = 0;
    let maxGear = 1;
    for (let step = 0; step < 1440; step += 4) {
      const p = g.car.body.translation();
      const q = g.car.body.rotation();
      // Advance the centreline cursor rather than searching the whole stage.
      let best = Infinity;
      for (let i = nearest; i < Math.min(segs.length, nearest + 120); i++) {
        const d = (segs[i].x - p.x) ** 2 + (segs[i].z - p.z) ** 2;
        if (d < best) { best = d; nearest = i; }
      }
      const speed = g.car.telemetry.speedMs;
      if (speed * 3.6 > maxSpeed) maxSpeed = speed * 3.6;
      if (g.car.telemetry.gear > maxGear) maxGear = g.car.telemetry.gear;
      const look = segs[Math.min(segs.length - 1, nearest + Math.round(6 + speed * 1.1))];

      // Heading error, in the car's frame.
      const fx = 2 * (q.x * q.z + q.w * q.y), fz = 1 - 2 * (q.x * q.x + q.y * q.y);
      const dx = look.x - p.x, dz = look.z - p.z;
      const len = Math.hypot(dx, dz) || 1;
      const cross = (fx * dz - fz * dx) / len;
      const steer = Math.max(-1, Math.min(1, cross * 1.7));

      // Anticipate: take the TIGHTEST corner grade anywhere in the next ~90 m,
      // not the grade at one lookahead point. Reading a single point meant the
      // dummy arrived at a hairpin still seeing the straight before it.
      let worstGrade = 6;
      for (let i = nearest; i < Math.min(segs.length, nearest + 24); i++) {
        if (segs[i].cornerGrade < worstGrade) worstGrade = segs[i].cornerGrade;
      }
      // Deliberately cautious: this is a crash-test dummy, not a hot lap.
      const target = Math.min(34, 6 + worstGrade * 4.2);
      window.__stepFixed(4, {
        steer,
        throttle: speed < target ? 1 : 0,
        brake: speed > target * 1.25 ? 0.6 : 0,
      });
    }
    const p = g.car.body.translation();
    const t = g.car.telemetry;
    let best = { d: Infinity, s: null };
    for (const s of g.stage.corridor.segments) {
      const d = (s.x - p.x) ** 2 + (s.z - p.z) ** 2;
      if (d < best.d) best = { d, s };
    }
    const ground = window.__probeGround(p.x, p.z);
    return {
      speed: t.speedKmh,
      maxSpeed,
      maxGear,
      gear: t.gear,
      distance: best.s.distance,
      lateral: Math.sqrt(best.d),
      moved: Math.hypot(p.x - before.x, p.z - before.z),
      clearance: ground === null ? null : p.y - ground,
      onRoof: t.onRoof,
      roofTime: t.roofTime,
      damageJ: t.damageJ,
      grounded: t.wheels.filter((w) => w.grounded).length,
    };
  });

  // Peak, not final: a dummy braking correctly for a hairpin at the 12 s mark
  // finishes slowly, and that is right behaviour, not a failure to accelerate.
  check('accelerates under throttle', driven.maxSpeed > 45 && driven.maxSpeed < 260,
    `peak ${driven.maxSpeed.toFixed(0)} km/h, finished at ${driven.speed.toFixed(0)} in gear ${driven.gear}`);
  check('the gearbox shifts up', driven.maxGear > 1, `reached gear ${driven.maxGear}`);
  check('travels down the stage', driven.distance > 140,
    `${driven.distance.toFixed(0)} m along, ${driven.moved.toFixed(0)} m travelled`);
  // 25 m was the old tolerance, and it was wide enough to hide a car steering
  // the wrong way: Sweet Lamb passed it at 24.3 m. 14 m is what the same dummy
  // manages now on the worst stage, with room for a crest.
  check('an autopilot can keep it on the road', driven.lateral < 14,
    `${driven.lateral.toFixed(1)} m from the centreline`);
  // Airborne over a crest is correct rally behaviour, so the ceiling is
  // generous; what matters is that it is not in orbit and not underground.
  check('still in contact with the world after 12 s',
    driven.clearance > 0.1 && driven.clearance < 8,
    `${driven.clearance?.toFixed(2)} m above the surface`);
  // Rally cars roll. What matters is that the car RECOVERS: §7 resets after
  // 2.5 s inverted, so a run that ends with more than that on the roof means
  // recovery is broken, not that the driver had a bad corner. Asserting it
  // never rolls would be asserting the test autopilot is a good driver.
  check('recovers from a rollover rather than staying inverted',
    driven.roofTime <= 2.6, `${driven.roofTime.toFixed(1)} s inverted at the end`);
  check('survives the run', driven.damageJ < 120_000,
    `${(driven.damageJ / 1000).toFixed(1)} kJ`);
  check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

  await page.screenshot({ path: `${SHOTS}/v2-${stage}.png` });
  await page.close();
}

await browser.close();
console.log(
  failures
    ? `\n${failures} FAILURES${known ? ` (plus ${known} known issues)` : ''}`
    : `\nAll smoke checks passed${known ? `, with ${known} known issues still open` : ''}.`,
);
process.exit(failures ? 1 : 0);
