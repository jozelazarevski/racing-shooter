import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const N = t.center.length;
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
  const treesOn = (i, lat) => {
    const h = t.headingAt(i), pt = t.pointAt(i, lat);
    const dx = Math.sin(h), dz = Math.cos(h);
    let n = 0;
    for (let s = 0; s <= 100; s += 10) {
      for (const tr of (t.camTreesNear ? t.camTreesNear(pt.x + dx * s, pt.z + dz * s) : [])) {
        if (Math.hypot(tr.x - (pt.x + dx * s), tr.z - (pt.z + dz * s)) < 4) n++;
      }
    }
    return n;
  };
  let best = 220, bg = Infinity;
  for (let i = 0; i < N; i += 10) {
    const w = runwayGrade(i, 14) + treesOn(i, 14) * 0.05;
    if (w < bg) { bg = w; best = i; }
  }
  const idx = best;
  const place = (sp) => {
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    const pt = t.pointAt(idx, 14);
    c.pos.set(pt.x, t.terrainHeight(pt.x, pt.z) + 0.3, pt.z);
    c.y = c.pos.y; c.trackIndex = idx; c.lateral = 14; c.heading = t.headingAt(idx);
    c.slip = 0; c._wetT = 0; c._fordNow = 0; c._wetMax = 0;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(sp);
  };
  place(0);
  const seg = [];
  let vTop = 0;
  for (let k = 0; k < 1200; k++) {
    if (k > 0 && k % 90 === 0) {
      seg.push({ k, v: +(Math.hypot(c.vel.x, c.vel.z) * 3.6).toFixed(0),
        offB: +(c._offB ?? -1).toFixed(2), air: c.airborne, hp: Math.round(c.health) });
      place(Math.hypot(c.vel.x, c.vel.z));
    }
    c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    vTop = Math.max(vTop, Math.hypot(c.vel.x, c.vel.z));
  }
  return { idx, grade: +bg.toFixed(3), trees: treesOn(idx, 14),
    vTop: +(vTop * 3.6).toFixed(0), seg,
    machine: c.machine?.id ?? c.machine?.name, top: c.topSpeed };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
