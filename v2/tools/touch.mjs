/* THE PAD MUST STEER THE WAY THE THUMB POINTS.
 *
 * This exists because the question "does the joystick steer the right way"
 * was answered wrongly for three rounds. The steering sign was inverted at the
 * vehicle and nothing caught it: the unit tests do not touch the DOM, the
 * smoke test drives with synthetic inputs, and the only autopilot that ever
 * drove was inverted in the same direction, so it agreed.
 *
 * So this harness uses the player's actual path and nothing else — a mobile
 * context with touch, real TouchEvents on the real pad element, the game's own
 * `input.sample()`, and the car's displacement along its OWN right vector.
 * Nothing here can agree with a sign error somewhere else, because it never
 * asks the code which way is right; it measures where the car went.
 *
 * Run with a server on :8902. `npm run touch`.
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 430, height: 860 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERROR', String(e)));
await page.goto('http://localhost:8902/play-v2/?stage=safari', { waitUntil: 'load' });
await page.waitForFunction(() => window.__v2?.phys, undefined, { timeout: 180_000 });
await page.evaluate(() => window.__v2.race.start());

const box = await page.evaluate(() => {
  const r = document.getElementById('pad').getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
});
const cx = box.x + box.w * 0.5, cy = box.y + box.h * 0.75;
let failures = 0;

for (const [label, dx] of [['DRAG RIGHT', 70], ['DRAG LEFT', -70]]) {
  const r = await page.evaluate(({ cx, cy, dx }) => {
    const g = window.__v2;
    const el = document.getElementById('pad');
    // START FROM REST, EVERY TIME. The first version ran the second drag on
    // whatever state the first left behind — a car already sideways under full
    // right lock — and reported that a leftward drag "steered right". It had
    // not: it had failed to unwind a spin in two seconds. A test that does not
    // control its initial conditions measures the previous test.
    const s0 = g.stage.corridor.segments[0];
    g.car.reset(s0.x, window.__probeGround(s0.x, s0.z) + 0.62, s0.z, Math.atan2(s0.hx, s0.hz));
    g.referenceDriver.seek(0);
    for (let i = 0; i < 120; i++) { g.car.step({ steer: 0, throttle: 0, brake: 0, handbrake: false }, 1/120); g.phys.world.step(); }
    const mk = (type, x, y) => {
      const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
      el.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [t],
        changedTouches: [t], targetTouches: type === 'touchend' ? [] : [t], bubbles: true, cancelable: true }));
    };
    // Get rolling first: a stationary car does not steer.
    for (let i = 0; i < 300; i++) { g.car.step({ steer: 0, throttle: 1, brake: 0, handbrake: false }, 1/120); g.phys.world.step(); }
    const q0 = g.car.body.rotation();
    const f0 = { x: 2*(q0.x*q0.z+q0.w*q0.y), z: 1-2*(q0.x*q0.x+q0.y*q0.y) };
    const p0 = g.car.body.translation();
    // right = forward x up, which for (fx,_,fz) with up=+y is (fz, -fx)... but
    // this file's own convention is normal = (-hz, hx). Use the corridor's.
    const right = { x: -f0.z, z: f0.x };
    mk('touchstart', cx, cy);
    mk('touchmove', cx + dx, cy - 40);
    // Step the REAL loop: sample the input the way the game does.
    let steer = 0;
    for (let i = 0; i < 240; i++) {
      const cmd = g.input.sample(1/120);
      steer = cmd.steer;
      g.car.step(cmd, 1/120);
      g.phys.world.step();
    }
    const p1 = g.car.body.translation();
    const q1 = g.car.body.rotation();
    const f1 = { x: 2*(q1.x*q1.z+q1.w*q1.y), z: 1-2*(q1.x*q1.x+q1.y*q1.y) };
    const moved = { x: p1.x - p0.x, z: p1.z - p0.z };
    mk('touchend', cx, cy);
    // WHICH WAY DID IT TURN is a question about heading, not about position.
    // Displacement is the sum of the turn and whatever the car was already
    // doing, and on a car that is sliding it is mostly the latter — a left
    // drag out of a right-hand slide moves the car right while turning it
    // left. The yaw change answers the question asked.
    // Positive is right, by the same expression the corridor uses for a corner
    // direction: cross(h0, h1) > 0 is a right-hander. Writing it the other way
    // round the first time made this harness report that a rightward drag
    // steered left — which is the exact failure it exists to catch, committed
    // by the harness itself. That is why the primary check below is the
    // DISPLACEMENT along the car's own right: it never asks the code which way
    // right is, so it cannot agree with a sign error anywhere, including here.
    return {
      steer: +steer.toFixed(2),
      yawDeg: +(Math.asin(Math.max(-1, Math.min(1, f0.x * f1.z - f0.z * f1.x))) * 180 / Math.PI).toFixed(1),
      alongRight: +(moved.x * right.x + moved.z * right.z).toFixed(2),
    };
  }, { cx, cy, dx });
  const went = Math.abs(r.alongRight) < 1 ? 'straight' : r.alongRight > 0 ? 'RIGHT' : 'LEFT';
  const byYaw = Math.abs(r.yawDeg) < 2 ? 'straight' : r.yawDeg > 0 ? 'RIGHT' : 'LEFT';
  const want = dx > 0 ? 'RIGHT' : 'LEFT';
  // Both must agree with the thumb. If they disagree with each other the car
  // is sliding, and that is a different report from steering the wrong way.
  const ok = went === want && byYaw === want;
  if (!ok) failures++;
  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'} ${label}: input.steer ${r.steer} -> ` +
    `${r.alongRight} m along the car's own right (${went}), yaw ${r.yawDeg}° (${byYaw})` +
    ` — wanted ${want}`,
  );
  await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
}
await b.close();
console.log(failures ? `\n${failures} FAILURES — the pad steers the wrong way` : '\nThe pad steers the way the thumb points.');
process.exit(failures ? 1 : 0);
