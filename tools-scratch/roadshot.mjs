/* DRIVER'S-EYE VIEW OF A NAMED WORLD POINT, from the road.
 *   node tools-scratch/roadshot.mjs <level> <x> <z> [backSamples]
 * Puts the camera on the centreline `back` samples upstream of the sample
 * nearest (x,z), at 1.6 u, looking along the road. Pixels are grabbed in the
 * SAME TICK (hillshot.mjs's rule — `page.screenshot` lands frames later, after
 * the game's own camera has re-rendered over this one). OUT names the file. */
import { chromium } from 'playwright-core';
import { promises as fs } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const OUT = process.env.OUT ?? '/tmp/roadshot.png';
const [id, tx, tz, back = 24] = process.argv.slice(2).map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 760, height: 500 } });
page.setDefaultTimeout(900000);
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message)));
await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 900000 });
const info = await page.evaluate(async ({ tx, tz, back }) => {
  const THREE = await import('three');
  const g = window.__game, t = g.track, n = t.center.length;
  const i = t.nearestIndex(new THREE.Vector3(tx, 0, tz));
  const c = t.center[(i - back + n) % n], look = t.center[(i + 4) % n];
  g.camera.near = 0.2; g.camera.updateProjectionMatrix();
  g.camera.position.set(c.x, c.y + 1.6, c.z);
  g.camera.lookAt(look.x, look.y + 1.2, look.z);
  g.renderer.render(g.scene, g.camera);
  return { name: t.level?.name, i, eye: +c.y.toFixed(2), target: +t.center[i].y.toFixed(2),
    png: g.renderer.domElement.toDataURL('image/png') };
}, { tx, tz, back });
await fs.writeFile(OUT, Buffer.from(info.png.split(',')[1], 'base64'));
delete info.png;
console.log(OUT, JSON.stringify(info), errs.length ? 'ERR ' + errs[0] : '');
await b.close();
