/* WHICH WORLDS DRIVE WITH THEIR LAMPS ON. One line per level: the sky it was
 * judged by and what `worldIsDark` decided. A daylight world showing `on` is
 * the bug this exists to catch. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 300 } });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const N = +(process.env.N ?? 24);
for (let lv = 1; lv <= N; lv++) {
  try {
    await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
    await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
    const r = await p.evaluate(() => {
      const g = window.__game; const on = [];
      g.scene.traverse(o => { if (o.name === 'carLights') on.push(o.visible); });
      return { name: g.track.name ?? g.level?.name ?? '?', sky: g.track.T.skyTop,
        dusk: !!g.track.T.dusk, rigs: on.length, lit: on.filter(Boolean).length };
    });
    console.log(`${String(lv).padStart(2)} ${(r.name+'').padEnd(22)} sky ${r.sky}  dusk ${r.dusk?'Y':'n'}  ${r.lit}/${r.rigs} lit`);
  } catch (e) { console.log(`${String(lv).padStart(2)} FAIL ${String(e.message).slice(0,60)}`); }
}
await b.close();
