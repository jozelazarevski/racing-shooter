/* Screenshot a distant-stand grove from the driver's view, horizontal.
 * Fixed spot (grove cell 780,300 on GOTTHARD) so before/after line up. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const TAG = process.argv[2] ?? 'after';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 620 } });
p.on('pageerror', e => console.log('pageerr:', e.message.slice(0, 140)));
await p.goto(`${BASE}/?level=19&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const X = 780, Z = 300;
for (const [dist, name] of [[45, 'near'], [250, 'far']]) {
  await p.evaluate(({ x, z, dist }) => {
    const g = window.__game, t = g.track, c = g.player;
    g.state = 'race'; g.freeRoam = true; g.missionMode = false;
    const d = Math.hypot(x, z) || 1;
    const cx = x - x / d * dist, cz = z - z / d * dist;
    c.alive = true; c.health = 100; c.vy = 0; c.airborne = false;
    c.pos.set(cx, t.terrainHeight(cx, cz) + 0.4, cz); c.y = c.pos.y;
    c.heading = Math.atan2(x - cx, z - cz);
    c.vel.set(0, 0, 0);
    c.trackIndex = t.nearestIndex(c.pos);
    g.clock.getDelta = () => 1 / 60;
    for (let k = 0; k < 12; k++) g.frame();
  }, { x: X, z: Z, dist });
  await p.screenshot({ timeout: 120000, path: `tools-scratch/shot-grove-${TAG}-${name}.png` });
  console.log(`shot-grove-${TAG}-${name}.png`);
}
await p.close(); await browser.close();
