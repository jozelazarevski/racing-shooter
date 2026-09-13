/* DOES THIS LEVEL ACTUALLY BUILD? Loads a level, races it, and reports every
 * page error, console error and WebGL warning, plus what is in the scene.
 * Written when NEO-KYOTO measured 77% black with the same numbers to the
 * decimal on two different runs — identical readings from different physics
 * mean nothing is being drawn, not that the world is dark. */
import { chromium } from 'playwright-core';
const LEVEL = process.env.LEVEL ?? '18';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
const errs = [], logs = [];
p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 240)));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.text().slice(0, 200)); });
await p.goto(`http://localhost:8901/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(async () => {
  const g = window.__game;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  for (let i = 0; i < 120; i++) await f();
});
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game;
  let meshes = 0, visible = 0;
  g.scene.traverse((o) => { if (o.isMesh || o.isInstancedMesh) { meshes++; if (o.visible) visible++; } });
  const cam = g.camera;
  return { state: g.state, meshes, visible,
    sceneChildren: g.scene.children.length,
    camPos: cam.position.toArray().map((n) => +n.toFixed(1)),
    carPos: g.player.pos.toArray?.().map((n) => +n.toFixed(1)) ?? null,
    speed: +(g.player.vel?.length() ?? 0).toFixed(1),
    fog: g.scene.fog ? { color: '#' + g.scene.fog.color.getHexString(),
      near: g.scene.fog.near, far: g.scene.fog.far } : null,
    lights: g.scene.children.filter((o) => o.isLight)
      .map((o) => `${o.type} i=${o.intensity} #${o.color.getHexString()}`),
    canvas: [g.renderer.domElement.width, g.renderer.domElement.height],
    autoClear: g.renderer.autoClear, exposure: g.renderer.toneMappingExposure };
}), null, 1));
console.log('pageerrors', JSON.stringify(errs.slice(0, 5), null, 1));
console.log('consoleerr', JSON.stringify(logs.slice(0, 6), null, 1));
await b.close();
