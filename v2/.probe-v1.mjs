/* v1: which way does a RIGHTWARD joystick drag actually take the car? */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 900, height: 560 }, isMobile: false });
page.on('pageerror', e => console.log('PAGEERROR', String(e)));
await page.goto('http://localhost:8902/', { waitUntil: 'load' });
await page.waitForFunction(() => window.__game, undefined, { timeout: 120_000 });
// Start a race however the menu wants it.
const started = await page.evaluate(async () => {
  const g = window.__game;
  // Try the documented entry points in order.
  if (typeof g.startWorld === 'function') { g.startWorld(0); return 'startWorld'; }
  if (typeof g.start === 'function') { g.start(); return 'start'; }
  return 'none';
});
console.log('start:', started);
await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));
console.log(await page.evaluate(() => {
  const g = window.__game;
  const p = g.player;
  if (!p) return 'NO PLAYER';
  // What a rightward drag produces, straight from the input class.
  const inp = g.input;
  const before = { x: p.pos.x, z: p.pos.z, heading: p.heading };
  // right = forward x up  =>  for forward (sin h, cos h): right = (-cos h, sin h)... measure it.
  const rx = -Math.cos(p.heading), rz = Math.sin(p.heading);
  // Simulate the pad: a rightward drag of R pixels.
  const R = 62;
  const dx = R;
  // Replicate bindJoystick's move(): analog.steer = -shapeSteer(dx / R)
  inp.analog.steer = -1 * (0.42 * 1 + 0.58 * 1);   // shapeSteer(1) = 1, negated
  for (let i = 0; i < 240; i++) {
    p.step ? p.step(1/60, { throttle: 1, brake: 0, steer: inp.steer, drift: false })
           : g.update?.(1/60);
  }
  const after = { x: p.pos.x, z: p.pos.z, heading: p.heading };
  const mx = after.x - before.x, mz = after.z - before.z;
  return JSON.stringify({
    analogSteer: inp.analog.steer, inputSteer: inp.steer,
    headingDelta: +(after.heading - before.heading).toFixed(3),
    alongRight: +(mx * rx + mz * rz).toFixed(2),
  });
}));
await b.close();
