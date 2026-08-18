/* The same fixed stations as `stationlum.mjs`, kept as pictures. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '/tmp/stations';
const STATIONS = Number(process.env.STATIONS ?? 8);
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.setDefaultTimeout(600000);
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  await page.evaluate(() => {
    const g = window.__game;
    g.clock.getDelta = () => 1 / 60;
    g.__realRender = g.composer.render.bind(g.composer);
    g.composer.render = () => { if (g.__want) g.__realRender(); };
    g.__park = (i) => {
      const t = g.track, p = g.player, c = t.center[i % t.center.length];
      p.pos.set(c.x, c.y + 1.2, c.z); p.y = c.y;
      p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
      p.trackIndex = i % t.center.length; p.heading = t.headingAt(i % t.center.length);
      p.alive = true; p.health = p.maxHealth ?? 100;
      for (let f = 0; f < 150; f++) { g.input.analog.throttle = 0; g.input.analog.steer = 0; g.frame(); }
      g.__want = 1; g.frame(); g.__want = 0;
      return t.level?.name ?? '?';
    };
  });
  for (let k = 0; k < STATIONS; k++) {
    const info = await page.evaluate(([k, S]) => {
      const g = window.__game, N = g.track.center.length;
      const i = Math.round(N * k / S);
      return { name: g.__park(i), i };
    }, [k, STATIONS]);
    await page.screenshot({ path: `${OUT}/L${String(id).padStart(2, '0')}-i${String(info.i).padStart(4, '0')}.png` });
  }
  console.log(`${id} done`);
}
await b.close();
