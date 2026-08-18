/* SHOW ME THE SPOT. A probe that reports a defect at (x,z) has not shown it to
 * anyone; this parks the camera off that point and renders it, so a number can
 * be confirmed by eye before anything is changed on the strength of it.
 *   node lookat.mjs <level> <x> <z> [y] [dist] [height]
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '/tmp/lookat';
const [id, x, z, y = 0, dist = 60, hgt = 22] = process.argv.slice(2).map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 900, height: 540 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const info = await page.evaluate(([x, z, y, dist, hgt]) => {
  const g = window.__game;
  // STOP THE LOOP FIRST. `setAnimationLoop` is still running: the first cut
  // set the camera, rendered, and the very next rAF put `_updateCamera` back
  // in charge — every screenshot came out of the start gantry no matter what
  // coordinates were asked for.
  g.renderer.setAnimationLoop(null);
  document.getElementById('hud')?.classList.remove('on');
  // ABOVE THE GROUND, ALWAYS. A camera parked under the terrain sees the
  // hillside's back faces — which are culled — so everything standing on that
  // hill reads as floating in mid-air. The first run of this tool produced a
  // picture of OLIVE PASS with houses and boulders hanging in the sky, and the
  // world was fine: the lens was buried. Seat the eye on the terrain under it.
  const ex = x + dist * 0.7, ez = z + dist * 0.7;
  const eyeY = Math.max(y + hgt, (g.track.terrainHeight?.(ex, ez) ?? 0) + 4);
  g.camera.position.set(ex, eyeY, ez);
  g.camera.lookAt(x, y, z);
  g.camera.updateMatrixWorld(true);
  g.composer.render();
  return { name: g.track.level?.name, ground: g.track.terrainHeight?.(x, z) };
}, [x, z, y, dist, hgt]);
await page.screenshot({ path: `${OUT}-${id}-${x}_${z}.png` });
console.log(id, info.name, 'terrainHeight', info.ground?.toFixed?.(2), '->', `${OUT}-${id}-${x}_${z}.png`);
await b.close();
