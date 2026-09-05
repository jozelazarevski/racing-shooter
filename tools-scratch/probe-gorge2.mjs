import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 460, height: 780 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center, undefined, { timeout: 180000 });
const r = await p.evaluate(() => {
  const g = window.__game, pl = g.player, t = g.track;
  if (!g._realRender) g._realRender = g.composer.render.bind(g.composer);
  g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.camMode = 0;
  let returns = 0, lastR = null;
  const rl = g.telemetry.log.bind(g.telemetry);
  g.telemetry.log = (k, d) => { if (k === 'return') { returns++; lastR = d; } return rl(k, d); };
  // A: kill volume — drop into the gorge slowly (the failed jump)
  pl.placeAt(100, 0, true);
  pl.vel.set(Math.sin(pl.heading) * 6, 0, Math.cos(pl.heading) * 6);
  const hull0 = g.deaths;
  for (let f = 0; f < 300; f++) g.frame();
  const A = { returns, reason: lastR?.reason, deaths: g.deaths - hull0,
    alive: pl.alive, hp: Math.round(pl.health), idx: pl.trackIndex };
  // B: camera floor — hold a LIVE car on the gorge floor (drown stubbed)
  const realDrown = pl.drown.bind(pl);
  pl.drown = () => {};
  pl.placeAt(110, 0, true); pl.vel.set(0, 0, 0);
  for (let f = 0; f < 60; f++) g.frame();
  const B = { carY: +pl.y.toFixed(1), camY: +g.camera.position.y.toFixed(1), alive: pl.alive };
  g._realRender();
  pl.drown = realDrown;
  return { A, B };
});
console.log(JSON.stringify(r, null, 1));
await p.screenshot({ timeout: 120000, path: '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad/gorge-live.png' });
await browser.close();
