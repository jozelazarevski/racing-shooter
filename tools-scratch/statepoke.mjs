import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
p.setDefaultTimeout(600000);
await p.goto('http://127.0.0.1:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, pl = g.player;
  g.clock.getDelta = () => 1 / 60;
  g._autoQuality = () => {};
  g.composer.render = () => {};
  const trace = [];
  for (let f = 0; f < 3000; f++) {
    g.input.analog.throttle = 1;
    g.frame();
    if (f % 300 === 0) trace.push({ f, state: g.state, idx: pl.trackIndex,
      spd: +(pl.speed ?? 0).toFixed(1), lat: +(pl.lateral ?? 0).toFixed(1) });
  }
  // now try a teleport and see if it sticks
  const t = g.track, tgt = 386, c = t.center[tgt];
  pl.pos.set(c.x, c.y + 0.8, c.z); pl.trackIndex = tgt; pl.speed = 0;
  g.frame(); g.frame();
  return { trace, afterTeleport: { idx: pl.trackIndex, x: +pl.pos.x.toFixed(1), z: +pl.pos.z.toFixed(1),
    wantX: +c.x.toFixed(1), wantZ: +c.z.toFixed(1) }, state: g.state };
}), null, 1));
await b.close();
