/* HOW FAR BEHIND THE CAR THE CAMERA TURNS, in degrees, on a driven slalom.
 *
 * Reported: "I can turn and the camera still shows the side. Delayed response
 * in the turns." The number for that is the angle between the camera's
 * forward (XZ) and the car's heading, sampled every frame while the car is
 * actually swinging. Reports mean and p90 of that error over a hard slalom,
 * plus the settle time after the last flick.
 *
 * The dt-clamp fault this measures is FRAME-RATE dependent: at 60 fps the old
 * code was fine and at 12 fps it panned at 60% speed. swiftshader runs ~2 fps,
 * far below either, so the ABSOLUTE numbers here are worst-case, not
 * phone-representative — what matters is the A/B against the same harness.
 *
 *   PORT=8901 LEVEL=1 CAM=3 node camlag.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 700 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=${process.env.LEVEL ?? 1}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const r = await p.evaluate(async (cam) => {
  const THREE = await import('three');
  const g = window.__game, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
  if (g.state !== 'race') throw new Error('race never started');
  for (let i = 0; i < 12 && g.camMode !== cam; i++) g.cycleCamera();
  if (g.camMode !== cam) throw new Error('camera mode never reached');
  // up to speed first
  for (let i = 0; i < 40; i++) { if (g.input?.analog) g.input.analog.throttle = 1; await f(); }
  const fwdCam = new THREE.Vector3();
  const err = () => {
    g.camera.getWorldDirection(fwdCam);
    const camYaw = Math.atan2(fwdCam.x, fwdCam.z);
    let d = (pl.heading - camYaw) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d) * 180 / Math.PI;
  };
  const errs = [];
  // hard slalom: full lock alternating every 12 frames
  for (let i = 0; i < 96; i++) {
    if (g.input?.analog) {
      g.input.analog.throttle = 1;
      g.input.analog.steer = (Math.floor(i / 12) % 2) ? 1 : -1;
    }
    await f();
    errs.push(err());
  }
  // settle: straighten and count frames to <8 degrees
  let settle = -1;
  for (let i = 0; i < 40; i++) {
    if (g.input?.analog) { g.input.analog.steer = 0; g.input.analog.throttle = 0.6; }
    await f();
    if (settle < 0 && err() < 8) settle = i;
  }
  errs.sort((a, c) => a - c);
  const pick = (q) => +errs[Math.min(errs.length - 1, Math.floor(q * errs.length))].toFixed(1);
  return { mean: +(errs.reduce((s, v) => s + v, 0) / errs.length).toFixed(1),
    p50: pick(0.5), p90: pick(0.9), max: pick(1), settleFrames: settle };
}, +(process.env.CAM ?? 3));
console.log(`cam ${process.env.CAM ?? 3}  yaw error: mean ${r.mean}  p50 ${r.p50}  p90 ${r.p90}  max ${r.max}  settle ${r.settleFrames}f`);
await b.close();
