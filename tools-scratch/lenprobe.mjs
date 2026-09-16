import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
for (const id of process.argv.slice(2).map(Number)) {
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  const r = await p.evaluate(async () => {
    const g = window.__game, t = g.track, N = t.center.length;
    g.startRace?.();
    const f = () => new Promise((r2) => requestAnimationFrame(r2));
    for (let i = 0; i < 900 && g.state !== 'race'; i++) { g.countdown = 0.01; g.frame(); }
    g.clock.getDelta = () => 1/60; if (g.composer) g.composer.render = () => {};
    for (let k = 0; k < 10; k++) g.frame();       // validator runs frame 1
    let L = 0, maxR = 0, wetSamples = 0;
    const level = t.T.coast?.level;
    for (let i = 0; i < N; i++) {
      const a = t.center[i], c2 = t.center[(i + 1) % N];
      L += Math.hypot(c2.x - a.x, c2.z - a.z);
      const rr = Math.hypot(a.x, a.z);
      if (rr > maxR) maxR = rr;
      if (level !== undefined && a.y < level - 0.2) wetSamples++;
    }
    return { L: Math.round(L), maxR: Math.round(maxR),
      gates: g.route?.gates?.length ?? 0,
      segLen: +(L / N).toFixed(2), wetSamples,
      violations: (g._stageReport ?? []).map((v) => v.rule) };
  });
  console.log(`world ${id}:`, JSON.stringify(r));
}
await b.close();
