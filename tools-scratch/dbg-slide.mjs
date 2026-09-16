import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 800, height: 520 } });
await page.goto('http://localhost:8901/?level=12&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 90000 });
const r = await page.evaluate(async () => {
  const g = window.__game, t = g.track, p = g.player, N = t.center.length;
  g.startRace?.();
  const f = () => new Promise((r2) => requestAnimationFrame(r2));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
  g.clock.getDelta = () => 1/60; if (g.composer) g.composer.render = () => {};
  // find the same third spot as slopehang (grade ~1.88)
  const spots = [];
  for (let i = 0; i < N && spots.length < 4; i += 12) {
    const c = t.center[i], c2 = t.center[(i+1)%N];
    let sx = c2.z-c.z, sz = -(c2.x-c.x); const sl = Math.hypot(sx,sz)||1; sx/=sl; sz/=sl;
    for (const side of [1,-1]) {
      let done = false;
      for (const dist of [70,90,120,150]) {
        const x = c.x+sx*side*dist, z = c.z+sz*side*dist;
        const h0 = t.terrainHeight(x,z), E = 4;
        const gx = (t.terrainHeight(x+E,z)-t.terrainHeight(x-E,z))/(2*E);
        const gz = (t.terrainHeight(x,z+E)-t.terrainHeight(x,z-E))/(2*E);
        const gm = Math.hypot(gx,gz);
        if (gm < 1.0 || gm > 8) continue;
        const ux = gx/gm, uz = gz/gm;
        if ((t.terrainHeight(x+ux*14, z+uz*14)-h0)/14 < 0.9) continue;
        spots.push({x,z,ux,uz,grade:+gm.toFixed(2)}); done = true; break;
      }
      if (done && spots.length >= 4) break;
    }
  }
  const s = spots[2];
  p.pos.x = s.x; p.pos.z = s.z; p.y = t.terrainHeight(s.x,s.z);
  p.heading = Math.atan2(s.ux, s.uz);
  p.vel.set(s.ux*17, 0, s.uz*17); p.vy = 0; p.airborne = false; p.invuln = 9;
  const rows = [];
  for (let k = 0; k < 8*60; k++) {
    g.input.analog = { steer: 0, throttle: 1, brake: 0 };
    g.frame();
    if (k % 45 === 0) {
      const ci = t.center[p.trackIndex];
      const E = 4;
      const gx = (t.terrainHeight(p.pos.x+E,p.pos.z)-t.terrainHeight(p.pos.x-E,p.pos.z))/(2*E);
      const gz = (t.terrainHeight(p.pos.x,p.pos.z+E)-t.terrainHeight(p.pos.x,p.pos.z-E))/(2*E);
      rows.push({ k, y:+p.y.toFixed(1), lat:+(p.lateral??0).toFixed(1),
        dSample: ci?+Math.hypot(p.pos.x-ci.x,p.pos.z-ci.z).toFixed(0):null,
        steepT:+(p._steepT??-1).toFixed(2), grade:+Math.hypot(gx,gz).toFixed(2),
        air:!!p.airborne, spd:+p.vel.length().toFixed(1), wilds:!!p._wilds });
    }
  }
  return { spotGrade: s.grade, rows };
});
console.log(JSON.stringify(r, null, 0));
await b.close();
