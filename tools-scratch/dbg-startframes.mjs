/* R5 of the x10 — EVERY WORLD'S OPENING FRAME. The RIVIERA sweep found
 * five missing towns by just LOOKING at the starts; this does the same
 * roster-wide: one chase frame ~10 samples past the grid per world,
 * saved for contact-sheet review. */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const DIR = process.env.DIR ?? '/tmp/starts';
mkdirSync(DIR, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 360, height: 700 } });
p.on('pageerror', () => {});
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const ids = await p.evaluate(() =>
  window.__game.chapters().flatMap((c) => c.levels).map((l) => l.id));
for (const id of ids) {
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
    await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
      undefined, { timeout: 300000 });
    await p.evaluate(() => {
      const g = window.__game;
      g.clock.getDelta = () => 1 / 60;
      for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
      g.camMode = 1;
      g.player.placeAt(10, 0);
      const v = 34 / 3.6;
      g.player.vel.set(Math.sin(g.player.heading) * v, 0, Math.cos(g.player.heading) * v);
      for (let f = 0; f < 35; f++) g.frame();
    });
    await p.screenshot({ path: `${DIR}/w${String(id).padStart(2, '0')}.png`, timeout: 120000 });
    process.stdout.write('.');
  } catch { process.stdout.write('x'); }
}
console.log('\nframes in ' + DIR);
await browser.close();
