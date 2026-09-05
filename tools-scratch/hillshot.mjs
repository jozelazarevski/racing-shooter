/* Same camera, two builds: park the view on a named world spot and render.
 *   node tools-scratch/hillshot.mjs <level> <x> <z> <ex> <ez>
 * BASE picks the build; OUT names the file. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const OUT = process.env.OUT ?? '/tmp/hill.png';
const [id, tx, tz, ex, ez] = process.argv.slice(2).map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 900, height: 560 } });
page.setDefaultTimeout(600000);
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message)));
await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
const info = await page.evaluate(({ tx, tz, ex, ez }) => {
  const g = window.__game, t = g.track;
  const ty = t.terrainHeight(tx, tz);
  g.camera.position.set(ex, t.terrainHeight(ex, ez) + 14, ez);
  g.camera.lookAt(tx, ty + 2, tz);
  // GRAB THE PIXELS IN THE SAME TICK. `page.screenshot` captures the canvas a
  // few frames later, by which time the game's own camera has re-rendered over
  // this one — which is how two "different" builds produced identical views.
  g.renderer.render(g.scene, g.camera);
  return { name: t.level?.name, ty: +ty.toFixed(2), png: g.renderer.domElement.toDataURL('image/png') };
}, { tx, tz, ex, ez });
await (await import('node:fs')).promises.writeFile(OUT, Buffer.from(info.png.split(',')[1], 'base64'));
delete info.png;
console.log(OUT, JSON.stringify(info), errs.length ? 'ERR ' + errs[0] : '');
await b.close();
