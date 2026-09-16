/* Build an alpine world, find the chairlift, park the player on the meadow
 * beside a mid-line pylon, let the chase cam settle, shoot. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LVL = process.argv[2] ?? '19';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 620 } });
p.on('pageerror', e => console.log('pageerr:', e.message.slice(0, 160)));
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  const towers = t.group.children.find(o => o.name === 'chairlift-towers');
  const hangers = t.group.children.find(o => o.name === 'cablecar-hangers');
  if (!towers) return { built: false };
  // mid-line pylon position (columns are every other child: col, arm, col, arm...)
  const cols = towers.children.filter(m => m.geometry?.type === 'BoxGeometry' && m.scale.y > 5);
  const mid = cols[Math.min(3, cols.length - 1)];
  const mx = mid.position.x, mz = mid.position.z;
  g.state = 'race'; g.freeRoam = true; g.missionMode = false;
  g.clock.getDelta = () => 1 / 60;
  // park the car 16 u downhill-side of the pylon, facing along the line toward the valley
  const d = Math.hypot(mx, mz);
  const cx = mx - mx / d * 16 + 6, cz = mz - mz / d * 16 - 4;
  c.alive = true; c.health = 100; c.vy = 0; c.airborne = false;
  c.pos.set(cx, t.terrainHeight(cx, cz) + 0.4, cz); c.y = c.pos.y;
  c.heading = Math.atan2(-mx / d, -mz / d);     // face down the line, toward the valley
  c.vel.set(0, 0, 0); c.trackIndex = t.nearestIndex(c.pos);
  for (let k = 0; k < 80; k++) g.frame();
  return { built: true, cols: cols.length, hangerParts: hangers?.children.length ?? 0,
    at: [Math.round(mx), Math.round(mz)] };
});
console.log(JSON.stringify(r));
if (r.built) {
  await p.screenshot({ timeout: 120000, path: `tools-scratch/shot-lift-${LVL}.png` });
  console.log(`shot-lift-${LVL}.png`);
}
await p.close(); await browser.close();
