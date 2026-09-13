// Owner-view reproduction: drive forward in low chase for a few seconds,
// then screenshot. LEVEL, CAM, BASE, OUT env.
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVEL = process.env.LEVEL ?? 72;
const CAM = +(process.env.CAM ?? 1);
const OUT = process.env.OUT ?? '/tmp/chase.png';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 780 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 120)));
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
await p.evaluate(async ({ CAM2, IDX }) => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.camMode = CAM2;
  g.player.placeAt(IDX, 0);
  // drive properly so the camera settles into the mode: steer at the line
  const t = g.track, N = t.center.length;
  for (let f = 0; f < 420; f++) {
    const i = t.nearestIndex(g.player.pos, g.player.trackIndex);
    const a = t.center[(i + 8) % N];
    const want = Math.atan2(a.x - g.player.pos.x, a.z - g.player.pos.z);
    let d = want - g.player.heading;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    g.input.analog.steer = Math.max(-1, Math.min(1, d * 2));
    g.input.analog.throttle = 0.5;
    g.frame();
  }
}, { CAM2: CAM, IDX: +(process.env.IDX ?? 120) });
await p.screenshot({ path: OUT, timeout: 120000 });
console.log('saved', OUT);
await browser.close();
