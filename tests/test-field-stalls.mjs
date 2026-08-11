/* THE RIVAL FIELD STALLS ON THREE WORLDS. A fixed-step reproduction.
 *
 * OPEN BUG — this test is RED on MOUNTAIN TO SEA (57), OLIVE CROSSING (56)
 * and SEA CLIFF RUN (60), and green everywhere else checked. It exists so the
 * fix has a definition of done. Reported twice with photographs: "Everyone is
 * stuck here under the tunnel" (57) and a pile at the crossing (56).
 *
 * MEASURE FIXED-STEP OR MEASURE NOTHING. Headless SwiftShader renders these
 * heavy worlds at a few fps and the game clock advances per-frame capped at
 * 50 ms, so wall-clock probes run the sim at ~1/8 speed — raceTime read 1.8 s
 * after 20 real seconds. Every wall-clock observation of "stalled" rivals is
 * an artifact (COORDINATION.md documents the same trap in BUGS.md #8). This
 * harness stubs the clock to a true 1/60 and the composer to nothing, the
 * blackboard's own method; under it PINE VALLEY runs 1.9-2.1 rival laps in
 * 90 s and the three worlds above run 0.13-0.70 with the whole field wedged.
 *
 * What is KNOWN (all measured under fixed-step, see COORDINATION.md):
 *   - jam sites: 57 at (4,-72) frac 0.12; 56 at (-80,130) frac 0.29;
 *     60 at (-82,-58) frac 0.67 — stable across runs and across a route
 *     rotation (the jam follows the field, not the start line)
 *   - stalled rivals sit at FULL THROTTLE with v ~ 0-6, legal lateral,
 *     correct track index, alive, no reverse-recovery cycling
 *   - eliminated: racing-line curvature/width/speed profile (healthy, equal
 *     to PINE VALLEY's), traffic (none spawns on these themes), the grid
 *     position, at-grade corridor overlap alone (56's jam site has 28 u of
 *     vertical leg separation; 60's has 11 u)
 *
 *   node tests/test-field-stalls.mjs             # 57,56 by default
 *   LEVELS=1,57,56,60,20 node tests/test-field-stalls.mjs
 */
import { chromium } from 'playwright-core';
let fail = 0;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(900000);
for (const lvl of (process.env.LEVELS ?? '57,56').split(',')) {
  await page.goto(`http://localhost:8901/?level=${lvl}&unlockall=1`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__game, null, { timeout: 30000 });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 25000 });
  const r = await page.evaluate(async () => {
    const g = window.__game;
    // stub renderer AND clock: pure sim at a true 1/60 step
    const oldRender = g.composer?.render?.bind(g.composer);
    if (g.composer) g.composer.render = () => {};
    const oldClock = g.clock;
    let elapsed = oldClock.elapsedTime;
    g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
    const start = g.enemies.map((e) => e.progress ?? 0);
    for (let f = 0; f < 5400; f++) {
      g._frameBody();
      if (f % 300 === 0) await new Promise((res) => setTimeout(res, 0));
    }
    g.clock = oldClock;
    if (g.composer && oldRender) g.composer.render = oldRender;
    const t = g.track;
    const rows = g.enemies.map((e, i) => ({ n: e.name,
      laps: +(((e.progress ?? 0) - start[i])).toFixed(2),
      v: +Math.hypot(e.vel.x, e.vel.z).toFixed(0), alive: e.alive ? 1 : 0,
      x: +e.pos.x.toFixed(0), z: +e.pos.z.toFixed(0),
      frac: +(e.trackIndex / t.N).toFixed(2),
      lat: +e.lateral.toFixed(1), lim: +(((t.widthAt?.(e.trackIndex) ?? 7) + 0.55)).toFixed(1),
      stuckT: +(e._deepStuckT ?? 0).toFixed(1) }));
    const stalled = rows.filter((x) => x.laps < 0.8).length;
    return { name: g.level.name, t: +g.raceTime.toFixed(0), rows, stalled };
  });
  console.log(`${r.stalled ? 'FAIL' : 'PASS'}  ${r.name} after ${r.t} game-s: ${r.stalled} stalled — `
    + r.rows.map((x) => `${x.n}:${x.laps}lap,v${x.v},(${x.x},${x.z})f${x.frac},lat${x.lat}/${x.lim}`).join(' '));
  if (r.stalled) fail++;
}
await b.close();
process.exit(fail ? 1 : 0);
