/* Render real frames around a lap: place the player at each index, let the
 * camera settle a few frames, screenshot. Finds the scene in an owner
 * photo without guessing at data. */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVEL = process.env.LEVEL ?? 32;
const STEP = Number(process.env.STEP ?? 30);
const DIR = process.env.DIR ?? '/tmp/shots';
mkdirSync(DIR, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 780 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 120000 });
await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
});
const N = await p.evaluate(() => window.__game.track.center.length);
for (let i = 0; i < N; i += STEP) {
  await p.evaluate((idx) => {
    const g = window.__game;
    g.player.placeAt(idx, 0);
    const v = 30 / 3.6;
    g.player.vel.set(Math.sin(g.player.heading) * v, 0, Math.cos(g.player.heading) * v);
    for (let f = 0; f < 30; f++) g.frame();
  }, i);
  await p.screenshot({ path: `${DIR}/i${String(i).padStart(3, '0')}.png`, timeout: 120000 });
}
console.log(`saved ${Math.ceil(N / STEP)} shots to ${DIR}`);
await browser.close();
