import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 460, height: 900 } });
await p.goto('http://localhost:8901/?level=23&go=1&unlockall=1', { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
await p.evaluate(() => { window.__game.camMode = 3; });
const r = await p.evaluate(async () => {
  const g = window.__game, t = g.track, c = g.player, N = t.center.length;
  g.startRace?.();
  const f = () => new Promise((r2) => requestAnimationFrame(r2));
  for (let k = 0; k < 45; k++) await f();      // mid-countdown, real camera
  const camToCar = {
    x: c.pos.x - g.camera.position.x, z: c.pos.z - g.camera.position.z };
  const fwd = { x: Math.sin(c.heading), z: Math.cos(c.heading) };
  const tan = t.headingAt(c.trackIndex);
  const dHead = Math.abs(((c.heading - tan + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  // does the camera sit BEHIND the car (dot(fwd, camToCar) > 0 = camera behind, looking forward)?
  const dot = (fwd.x * camToCar.x + fwd.z * camToCar.z) / (Math.hypot(camToCar.x, camToCar.z) || 1);
  return { state: g.state, idx: c.trackIndex, N,
    headingVsTangentDeg: +(dHead * 180 / Math.PI).toFixed(1),
    camBehindDot: +dot.toFixed(2),
    camMode: g.camMode,
    enemyIdx: g.enemies.slice(0, 3).map((e) => e.trackIndex) };
});
console.log(JSON.stringify(r));
await p.screenshot({ path: '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad/serpentgrid-chase.png' });
await b.close();
