import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=58&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  for (let k = 0; k < 30; k++) g.frame();
  const cam = g.camera?.position ?? g.camPos;
  const fog = g.scene?.fog;
  return {
    player: { x: +c.pos.x.toFixed(1), y: +c.pos.y.toFixed(1), z: +c.pos.z.toFixed(1),
      hull: Math.round(c.health) },
    cam: { x: +cam.x.toFixed(1), y: +cam.y.toFixed(1), z: +cam.z.toFixed(1) },
    camToCar: +Math.hypot(cam.x - c.pos.x, cam.y - c.pos.y, cam.z - c.pos.z).toFixed(1),
    terrAtCam: +t.terrainHeight(cam.x, cam.z).toFixed(1),
    fog: fog ? { type: fog.isFogExp2 ? 'exp2' : 'linear', d: fog.density ?? [fog.near, fog.far],
      col: fog.color?.getHexString?.() } : null,
    camMode: g.camMode,
    waterLevel: t.waterLevel ?? t.seaLevel ?? '?',
    dmgLog: (g.telemetry?.events ?? []).filter(e => e.k === 'damage').slice(0, 4),
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
