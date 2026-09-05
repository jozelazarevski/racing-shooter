import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 460, height: 780 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center, undefined, { timeout: 180000 });
await p.evaluate(() => {
  const g = window.__game;
  if (!g._realRender) g._realRender = g.composer.render.bind(g.composer);
  g.composer.render = () => {};                       // blind while driving
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.camMode = 0;
});
const drive = (secs) => p.evaluate(async (secs) => {
  const g = window.__game, pl = g.player, t = g.track, N = t.center.length;
  for (let f = 0; f < secs * 60; f++) {
    const li = (pl.trackIndex + 8) % N, c2 = t.center[li];
    let err = Math.atan2(c2.x - pl.pos.x, c2.z - pl.pos.z) - pl.heading;
    while (err > Math.PI) err -= 2 * Math.PI;
    while (err < -Math.PI) err += 2 * Math.PI;
    g.input.analog.steer = Math.max(-1, Math.min(1, err * 1.6));
    g.input.analog.throttle = 0.75;
    g.frame();
    if (f % 120 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  g._realRender();                                    // paint ONE real frame
  return { t: +g.raceTime.toFixed(1), idx: pl.trackIndex };
}, secs);
const first = await drive(48);
console.log('at48', JSON.stringify(first));
for (let s = 48; s <= 70; s += 2) {
  await p.screenshot({ timeout: 120000, path: `/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad/race-${s}.png` });
  const st = await drive(2);
  console.log(s + 2, JSON.stringify(st));
}
await browser.close();
console.log('done');
