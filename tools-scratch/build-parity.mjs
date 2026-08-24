/* THE WORLD THE PAGE BOOTS IS THE WORLD A REBUILD PRODUCES.
 *
 * The cheap end-to-end check for the cold-cache determinism law (see
 * rng-parity.mjs for the instrument that locates a violation): count the
 * trees in one disc beside PINE VALLEY's road at boot, rebuild the world
 * clean, count again. boot === menuRebuild === menuRebuildLater, or a cache
 * somewhere is eating seeded draws on the first build only.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await page.evaluate(async () => {
  const g = window.__game;
  const c = g.track.center[30], h = g.track.headingAt(30);
  const px = c.x + Math.cos(h) * 120, pz = c.z - Math.sin(h) * 120;
  const countIn = () => (g.track.trees || []).filter((t) => Math.hypot(t.x - px, t.z - pz) < 70).length;
  const out = { state0: g.state, boot: countIn() };
  g.showMenu();                       // leave countdown so swapLevel is willing
  out.stateMenu = g.state;
  out.swapOk = g.rebuildWorld();      // clean rebuild, menu state
  out.menuRebuild = countIn();
  await new Promise((res) => setTimeout(res, 2000));   // let frames run
  out.menuRebuildLater = countIn();
  return out;
});
console.log(JSON.stringify(r));
await browser.close();
