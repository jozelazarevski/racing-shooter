import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.goto(`${BASE}/?level=1&go=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  // race warmup
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const personas = g.enemies.map((e) => ({ p: e.persona, react: +e._launchReaction.toFixed(2),
    pace: e.paceOffset, cons: e.consistency, aggr: e.aggression }));
  // 1s in: who has moved? (stagger check)
  for (let k = 0; k < 60; k++) g.frame();
  const at1s = g.enemies.map((e) => +Math.hypot(e.vel.x, e.vel.z).toFixed(1));
  // run to 20s: pressure rival should exist after 15
  for (let k = 0; k < 19 * 60; k++) g.frame();
  const pressure = g._pressureRival?.persona ?? null;
  // run to 45s: spread + states
  for (let k = 0; k < 25 * 60; k++) g.frame();
  const prog = g.enemies.map((e) => ({ p: e.persona, prog: +e.progress.toFixed(3),
    st: e._ovState, mist: e._mistakes }));
  prog.sort((a, b) => b.prog - a.prog);
  const events = (g.telemetry?.events ?? []).filter((e) => ['aiState', 'overtake', 'mistake'].includes(e.t ?? e.type));
  return { personas, at1s, pressure, prog, raceTime: +g.raceTime.toFixed(1),
    evCount: events.length, evSample: events.slice(0, 8) };
});
console.log(JSON.stringify(r, null, 1));
console.log('pageerrors:', errs.length ? errs : 'none');
await browser.close();
