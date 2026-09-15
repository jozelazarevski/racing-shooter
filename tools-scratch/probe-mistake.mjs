import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const e = g.enemies.find((x) => x.persona === 'back1');
  const stats = { frames: 0, slowGate: 0, curvHereOk: 0, curvNearOk: 0, allOk: 0,
    armed: 0, vMean: 0, msMean: 0 };
  for (let k = 0; k < 60 * 60; k++) {
    g.frame();
    if (k % 10 !== 0) continue;
    stats.frames++;
    const v = Math.abs(e.speedAlong);
    stats.vMean += v; stats.msMean += e.maxSpeed;
    let curvNear = 0;
    for (let j = 10; j <= 40; j += 6) curvNear = Math.max(curvNear, t.curvature[(e.trackIndex + j) % t.N]);
    const slowOk = v > e.maxSpeed * 0.5;
    const hereOk = t.curvature[e.trackIndex] < 0.012;
    const nearOk = curvNear > 0.022;
    if (slowOk) stats.slowGate++;
    if (hereOk) stats.curvHereOk++;
    if (nearOk) stats.curvNearOk++;
    if (slowOk && hereOk && nearOk) stats.allOk++;
    if (e._errArmed) stats.armed++;
  }
  stats.vMean = +(stats.vMean / stats.frames).toFixed(1);
  stats.msMean = +(stats.msMean / stats.frames).toFixed(1);
  stats.mistakes = e._mistakes;
  const dump = window.__rally.dump().split('\n').filter((l) => l.includes('mistake') || l.includes('overtake') || l.includes('aiState'));
  return { stats, evLines: dump.length, sample: dump.slice(0, 6) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
