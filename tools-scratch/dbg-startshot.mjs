/* Start-frame check: boot a level, advance to the countdown, screenshot in
 * portrait, and report car/camera/road numbers for diagnosis. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 16);
const OUT = process.env.OUT ?? `/tmp/start-${LVL}.png`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 390, height: 780 } });
p.setDefaultTimeout(240000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 240000 });
const info = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 150; k++) g.frame();   // let the countdown run a beat
  const cam = g.camera;
  const s = t._nearestSample ? t._nearestSample(c.pos.x, c.pos.z) : { d: -1, i: -1 };
  const roadY = t.center[s.i]?.y;
  return { world: g.level?.name, state: g.state, countdown: +(g.countdown ?? -1).toFixed(2),
    car: { x: +c.pos.x.toFixed(1), y: +c.pos.y.toFixed(1), z: +c.pos.z.toFixed(1) },
    camY: +cam.position.y.toFixed(1),
    camDist: +cam.position.distanceTo(c.pos).toFixed(1),
    latOff: +s.d?.toFixed(1), station: s.i, roadY: +(roadY ?? 0).toFixed(1),
    carAboveRoad: +(c.pos.y - (roadY ?? 0)).toFixed(1),
    fog: g.scene?.fog ? { near: g.scene.fog.near, far: g.scene.fog.far,
      density: g.scene.fog.density } : null };
});
await p.screenshot({ path: OUT, timeout: 120000 });
console.log(JSON.stringify(info), OUT, errs.slice(0, 2).join('|'));
await browser.close();
