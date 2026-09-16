/* r342 debug — why does +10%/+21% pace budget move world 78's lap-1 by ~0%?
 * Same grid, ramp off vs on: mean rival speed, returns, mistakes, follow
 * time, and where the time actually goes. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=78&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const run = async (pct) => p.evaluate(async (pct) => {
  const g = window.__game;
  window.__DRIVING.ai.progRampPct = pct;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.resetRace(); g.startRace?.(); g.telemetry?.clear();
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.player.pos.x += 4000; g.player.vel.set(0, 0, 0);
  const n = g.enemies.length;
  const spSum = new Array(n).fill(0);
  let frames = 0;
  const SECS = 150;
  for (let f = 0; f < SECS * 60; f++) {
    g.frame(); frames++;
    g.enemies.forEach((e, i) => { spSum[i] += Math.hypot(e.vel.x, e.vel.z); });
  }
  const lines = (g.telemetry?.dump() ?? '').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const returns = lines.filter((e) => e.kind === 'return' && e.car).length;
  const mistakes = lines.filter((e) => e.kind === 'mistake').length;
  const progress = g.enemies.map((e) => +((e.lap ?? 1) - 1 + (e.trackIndex / g.track.N)).toFixed(2));
  return {
    meanSp: +(spSum.reduce((a, b) => a + b, 0) / n / frames * 3.1).toFixed(1),
    perRival: spSum.map((s) => +(s / frames * 3.1).toFixed(0)),
    returns, mistakes, progress,
    meanProg: +(progress.reduce((a, b) => a + b, 0) / n).toFixed(3),
  };
}, pct);
const off = await run(0);
const on = await run(0.10);
console.log('ramp OFF:', JSON.stringify(off));
console.log('ramp ON :', JSON.stringify(on));
console.log(`meanSp ${off.meanSp} -> ${on.meanSp} km/h (${((on.meanSp / off.meanSp - 1) * 100).toFixed(1)}%), `
  + `prog ${off.meanProg} -> ${on.meanProg} (${((on.meanProg / off.meanProg - 1) * 100).toFixed(1)}%), `
  + `returns ${off.returns} -> ${on.returns}, mistakes ${off.mistakes} -> ${on.mistakes}`);
await browser.close();
