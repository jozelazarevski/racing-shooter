/* THE OVERHEAD VIEWS MUST NOT SPIN WHEN YOU STEER.
 *
 * Reported as "fix the top down camera" alongside "improve the steering", and
 * the two were the same complaint. TOP-DOWN and TOP FAR sat behind the car's
 * RAW heading — the one thing an overhead view must not do, because from
 * directly above there is no horizon to steady the picture. Every flick of
 * the wheel span the whole world around a car that appeared not to move, so
 * steering felt worse the more of it you did. The chase family had already
 * been given a damped yaw for exactly this; these two were left behind.
 *
 * They now take the CENTRELINE's heading (`roadYaw`), damped. The road runs
 * up the screen and stays there; the car yaws against it, which is the thing
 * you actually need to read. The world turns when the ROAD turns, not when
 * your thumb does.
 *
 * What is asserted:
 *   - holding full lock on a straight barely moves the overhead view, where
 *     before it swung with the car;
 *   - the chase views still track the car (this must not have leaked into
 *     them — they are supposed to follow where you are going);
 *   - every mode still frames the car and shows road AHEAD of it, which is
 *     the other half of the fix: `look` was 7 on TOP-DOWN and 1 on TOP FAR,
 *     from 56 and 87 u away, so half the screen was road already driven.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 420 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const viewYaw = () => Math.atan2(g.camPos.x - g.camLook.x, g.camPos.z - g.camLook.z);
  const step = async (n, steer) => {
    for (let i = 0; i < n; i++) {
      g.input.analog.steer = steer;
      g.input.analog.throttle = 0.55;
      await new Promise((r) => requestAnimationFrame(r));
    }
  };
  const out = [];
  // NAMES COME FROM THE GAME, NOT FROM HERE. This list used to be hardcoded and
  // indexed 0..4, so moving DRIVER up the cycle (it now sits after CHASE) would
  // have had this testing the SEAT while printing "CHASE FAR" — a gate quietly
  // measuring the wrong thing under the right label. The seat is a different
  // animal with its own laws in test-goat/cockpit probes, so it is skipped here
  // BY ITS FLAG rather than by position.
  const names = g.constructor.CAM_NAMES;
  const DRIVER = g.constructor.DRIVER_MODE;
  for (let m = 0; m < names.length; m++) {
    if (m === DRIVER) continue;
    g.camMode = m;
    await step(50, 0);                       // settle
    const carA = g.player.heading;
    const yawA = viewYaw();
    // MEASURED AGAINST THE ROAD, not the car. The car carries its attitude
    // over from the previous mode's full lock, so "ahead of the car" can be
    // behind it while the view is framed perfectly — a fact about the test.
    // Every mode exists to show you the road coming, so the road is the
    // thing the look-point should be out in front along.
    // EACH FAMILY IS JUDGED AGAINST WHAT IT FOLLOWS. An overhead view is
    // aligned to the ROAD, so its look-point should be out along the lap; a
    // chase view is aligned to the CAR, so its look-point should be out in
    // front of the car. Measuring both against one of them fails whichever
    // family it is not — the car carries its attitude over from the previous
    // mode's full lock, and can be sliding sideways to the road entirely
    // legitimately.
    const rh = g.track.headingAt(g.player.trackIndex);
    const lx = g.camLook.x - g.player.pos.x, lz = g.camLook.z - g.player.pos.z;
    const aheadRoad = lx * Math.sin(rh) + lz * Math.cos(rh);
    const f0 = g.player.forward;
    const aheadCar = lx * f0.x + lz * f0.z;
    await step(40, 1);                       // hold full lock
    const swungView = Math.abs(wrap(viewYaw() - yawA)) * 180 / Math.PI;
    const swungCar = Math.abs(wrap(g.player.heading - carA)) * 180 / Math.PI;
    await step(30, 0);
    out.push({ name: names[m], swungView: +swungView.toFixed(1), swungCar: +swungCar.toFixed(1),
      aheadRoad: +aheadRoad.toFixed(1), aheadCar: +aheadCar.toFixed(1),
      dist: +Math.hypot(g.camPos.x - g.player.pos.x, g.camPos.z - g.player.pos.z).toFixed(1) });
  }
  g.input.analog.steer = 0; g.input.analog.throttle = 0;
  return out;
});

for (const r of R) {
  console.log(`  ${r.name.padEnd(10)} car turned ${String(r.swungCar).padStart(6)}°, view swung ${String(r.swungView).padStart(6)}°, looks ${r.aheadRoad} u up the road / ${r.aheadCar} u ahead of the car`);
}
const top = R.filter((r) => r.name.startsWith('TOP'));
const chase = R.filter((r) => !r.name.startsWith('TOP'));

ok(top.every((r) => r.swungCar > 8),
  'setup: the car really did turn under full lock in the overhead views',
  JSON.stringify(top.map((r) => [r.name, r.swungCar])));
ok(top.every((r) => r.swungView < r.swungCar * 0.5),
  'an overhead view stays put while the car turns under it',
  JSON.stringify(top.map((r) => [r.name, r.swungView, r.swungCar])));
ok(chase.some((r) => r.swungView > 4),
  'the chase views still follow where the car is going — the road view did not leak into them',
  JSON.stringify(chase.map((r) => [r.name, r.swungView])));
ok(top.every((r) => r.aheadRoad > 8),
  'the overhead views frame road AHEAD along the lap, not the tarmac behind it',
  JSON.stringify(top.map((r) => [r.name, r.aheadRoad])));
ok(chase.every((r) => r.aheadCar > 8),
  'and the chase views frame road ahead of the CAR, which is what they follow',
  JSON.stringify(chase.map((r) => [r.name, r.aheadCar])));
ok(R.every((r) => r.dist > 5 && r.dist < 140),
  'and every mode keeps the car at a sane distance', JSON.stringify(R.map((r) => [r.name, r.dist])));
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join('\n'));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
