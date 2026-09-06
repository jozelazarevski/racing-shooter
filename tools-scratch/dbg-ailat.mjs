/* FIX-1 evidence: rival lateral census. Runs a fixed-step race and samples
 * every rival's |lateral| vs local widthAt each second, bucketed by section
 * kind. LEVEL=n SECS=60 node dbg-ailat.mjs */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const SECS = Number(process.env.SECS ?? 60);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
await p.goto(`${BASE}/?level=${process.env.LEVEL ?? 30}&go=1&unlockall=1`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
await p.evaluate(async () => { window.__RS = (await import('./src/track.js')).ROUTE_SCALE ?? 1; });
const r = await p.evaluate((SECS2) => {
  const g = window.__game, t = g.track;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.resetRace(); g.startRace?.();
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.lapsTotal = 99;
  const buckets = {};   // kind -> {n, off, sumRatio, worst}
  for (let f = 0; f < SECS2 * 60; f++) {
    g.input.analog.throttle = 0.4; g.input.analog.steer = 0;   // player idles along
    g.frame();
    if (f % 60 !== 0) continue;
    for (const e of g.enemies) {
      if (!e.alive) continue;
      const ns = t._nearestSample(e.pos.x, e.pos.z);
      const w = t.widthAt?.(ns.i) ?? 9;
      const kind = (t.curvature?.[ns.i] ?? 0) > 0.012 / ((window.__RS ?? 4)) ? 'curve' : 'straight';
      const b = buckets[kind] || (buckets[kind] = { n: 0, off: 0, sumR: 0, worst: 0 });
      b.n++;
      const ratio = ns.d / w;
      b.sumR += ratio;
      if (ns.d > w + 1.5) b.off++;
      if (ratio > b.worst) b.worst = +ratio.toFixed(2);
    }
  }
  for (const k of Object.keys(buckets)) {
    const b = buckets[k];
    b.meanR = +(b.sumR / b.n).toFixed(2); delete b.sumR;
    b.offPct = +((b.off / b.n) * 100).toFixed(0);
  }
  return { name: g.level?.name, buckets };
}, SECS);
console.log(JSON.stringify(r, null, 1));
await browser.close();
