import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 620 } });
p.on('pageerror', e => console.log('pageerr:', e.message.slice(0, 140)));
await p.goto(`${BASE}/?level=19&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const band = t.group.children.find(c => c.name === 'distant-stand');
  const trunks = t.group.children.find(c => c.name === 'distant-stand-trunks');
  const pos = band.geometry.attributes.position;
  // crown min-y tells whether tiers are lifted (old: 0, new: >= 0.26)
  let minY = 1e9; for (let i = 0; i < pos.count; i++) minY = Math.min(minY, pos.getY(i));
  return { bandVerts: pos.count, bandMinY: +minY.toFixed(2),
    trunks: trunks ? { count: trunks.count, verts: trunks.geometry.attributes.position.count } : null };
});
console.log(JSON.stringify(r));
// settled horizontal view: car 60u out on the grove's downhill side, 90 frames
await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.freeRoam = true; g.missionMode = false;
  const x = 780, z = 300, d = Math.hypot(x, z);
  const cx = x - x / d * 60, cz = z - z / d * 60;
  c.alive = true; c.health = 100; c.vy = 0; c.airborne = false;
  c.pos.set(cx, t.terrainHeight(cx, cz) + 0.4, cz); c.y = c.pos.y;
  c.heading = Math.atan2(x - cx, z - cz);
  c.vel.set(0, 0, 0); c.trackIndex = t.nearestIndex(c.pos);
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 90; k++) g.frame();
});
await p.screenshot({ timeout: 120000, path: 'tools-scratch/shot-grove-check.png' });
console.log('shot-grove-check.png');
await p.close(); await browser.close();
