import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 16);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 390, height: 780 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 240000 });
const info = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player, THREE9 = t.group?.children?.[0]?.constructor ? null : null;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 150; k++) g.frame();
  const cam = g.camera;
  // project car position
  const v = c.pos.clone ? c.pos.clone() : null;
  let sx = null, sy = null;
  if (v && v.project) { v.project(cam); sx = +((v.x + 1) / 2).toFixed(2); sy = +((1 - v.y) / 2).toFixed(2); }
  // what stands between camera and car?
  const meshInfo = [];
  const m = c.mesh ?? c.group ?? null;
  return {
    world: g.level?.name, camPos: { x: +cam.position.x.toFixed(1), y: +cam.position.y.toFixed(1), z: +cam.position.z.toFixed(1) },
    carPos: { x: +c.pos.x.toFixed(1), y: +c.pos.y.toFixed(1), z: +c.pos.z.toFixed(1) },
    carScreen: { sx, sy },
    meshVisible: m ? m.visible : 'no-mesh-prop',
    meshY: m ? +m.position.y.toFixed(1) : null,
    camMode: g.camMode ?? g.cameraMode ?? null,
    terrainAtCar: +t.terrainHeight(c.pos.x, c.pos.z).toFixed(1),
    drawnAtCar: t._drawnGroundY ? +t._drawnGroundY(c.pos.x, c.pos.z).toFixed(1) : null,
  };
});
console.log(JSON.stringify(info));
await browser.close();
