/* The start line, from behind the grid — what the removal of the spectator
 * stand left there. One world per argument. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const OUT = process.env.OUT ?? '/tmp/start';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 900, height: 520 } });
page.setDefaultTimeout(600000);
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message)));
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const info = await page.evaluate(() => {
    const g = window.__game, t = g.track;
    // park the camera behind the grid looking down the start straight
    const c = t.center[0], n = t.nrm[0], tan = t.tan[0];
    g.camera.position.set(c.x - tan.x * 34 + n.x * 8, c.y + 11, c.z - tan.z * 34 + n.z * 8);
    g.camera.lookAt(c.x + tan.x * 26, c.y + 2, c.z + tan.z * 26);
    g.renderer.render(g.scene, g.camera);
    return { name: t.level?.name,
      solidsMetal: (t.solids ?? []).filter((s) => s.mat === 'metal').length,
      solids: (t.solids ?? []).length, buildings: (t.buildings ?? []).length };
  });
  await page.screenshot({ path: `${OUT}-${id}.png` });
  console.log(id, JSON.stringify(info));
}
if (errs.length) console.log('PAGE ERRORS', errs.slice(0, 5));
await b.close();
