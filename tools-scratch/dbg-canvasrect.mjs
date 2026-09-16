import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
const out = await p.evaluate(() => {
  const g = window.__game;
  const c = g.renderer.domElement.getBoundingClientRect();
  const cam = g.camera;
  const modes = g.constructor.CAM_MODES.map(m => m.name);
  return { canvas: { x: c.x, y: c.y, w: c.width, h: c.height },
    dpr: window.devicePixelRatio, fov: cam.fov, aspect: +cam.aspect.toFixed(3),
    innerH: innerHeight, innerW: innerWidth,
    camMode: g.camMode, modeName: modes[g.camMode] };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
