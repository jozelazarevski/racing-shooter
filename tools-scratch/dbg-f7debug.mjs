import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player, N = t.center.length;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  // replicate the suite's flattest-grass search
  const runwayGrade = (i, lat) => {
    const h = t.headingAt(i), pt = t.pointAt(i, lat);
    const dx = Math.sin(h), dz = Math.cos(h);
    let worst = 0, prev = t.terrainHeight(pt.x, pt.z);
    for (let s = 1; s <= 5; s++) {
      const y2 = t.terrainHeight(pt.x + dx * s * 20, pt.z + dz * s * 20);
      worst = Math.max(worst, Math.abs(y2 - prev) / 20);
      prev = y2;
    }
    return worst;
  };
  let best = 220, bg = Infinity;
  for (let i = 0; i < N; i += 10) {
    const w = runwayGrade(i, 14);
    if (w < bg) { bg = w; best = i; }
  }
  const pt = t.pointAt(best, 14);
  c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
  c.pos.set(pt.x, t.terrainHeight(pt.x, pt.z) + 0.3, pt.z);
  c.y = c.pos.y; c.trackIndex = best; c.lateral = 14; c.heading = t.headingAt(best);
  c.slip = 0; c._wetT = 0; c._fordNow = 0; c._wetMax = 0;
  c.vel.set(0, 0, 0);
  const log = [];
  for (let k = 0; k < 240; k++) {
    c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    if (k % 30 === 0) {
      const slow = (c.vel.x * c.vel.x + c.vel.z * c.vel.z) <= 1;
      const dirx = slow ? Math.sin(c.heading) : c.vel.x / Math.hypot(c.vel.x, c.vel.z);
      const dirz = slow ? Math.cos(c.heading) : c.vel.z / Math.hypot(c.vel.x, c.vel.z);
      const h0 = t.terrainHeight(c.pos.x, c.pos.z);
      const g4 = (t.terrainHeight(c.pos.x + dirx * 4, c.pos.z + dirz * 4) - h0) / 4;
      log.push({ k, g4: +g4.toFixed(3), v: +(Math.hypot(c.vel.x, c.vel.z) * 3.6).toFixed(1),
      offB: +(c._offB ?? -1).toFixed(2), lat: +c.lateral.toFixed(1),
      wilds: !!c._wilds, y: +c.pos.y.toFixed(1),
      terr: +t.terrainHeight(c.pos.x, c.pos.z).toFixed(1),
      bog: c._boggedT ?? 0, wet: c._wetT ?? 0, stuck: c._stuckT ?? 0 }); }
  }
  return { best, bg: +bg.toFixed(3), skill: c.offroadSkill, log };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
