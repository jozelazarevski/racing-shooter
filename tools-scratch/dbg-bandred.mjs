import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
await p.evaluate(() => {
  const g = window.__game;
  g.camMode = g.constructor.CAM_MODES.findIndex(m => m.driver);
  // paint every glass-colored part on the player pure red, unlit-bright
  g.player.mesh.traverse(o => {
    if (o.isMesh && o.material?.color?.getHexString?.() === '121a22') {
      o.material = o.material.clone();
      o.material.color.set(0xff0000);
      o.material.emissive?.set?.(0xff0000);
      o.material.emissiveIntensity = 1;
    }
  });
});
await p.waitForTimeout(2500);
await p.screenshot({ path: '/tmp/f4-drv-red.png' });
console.log('saved');
await browser.close();
