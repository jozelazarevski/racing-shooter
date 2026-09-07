/* jolt forensics: at any grounded frame with |dPosY| > 0.3, log index/lateral
 * before and after, and the ground reads at both indices. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
  const c = g.player, skill = 0.9, spots = [];
  let prevY = c.pos.y, prevI = c.trackIndex, prevLat = 0, prevAir = false;
  for (let k = 0; k < 3600; k++) {
    const sp = Math.hypot(c.vel.x, c.vel.z);
    const i = c.trackIndex;
    const aim = t.center[(i + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
    let a = Math.atan2(aim.x - c.pos.x, aim.z - c.pos.z) - c.heading;
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    const K2 = Math.max(4, Math.round(24 / su));
    let vAllow = 1e9;
    for (let kk = 0; kk <= Math.max(K2, Math.round((24 + sp * sp / 24) / su)); kk += 2) {
      const j = (i + kk) % N;
      let tn = t.headingAt((j + K2) % N) - t.headingAt(j);
      while (tn > Math.PI) tn -= 2 * Math.PI;
      while (tn < -Math.PI) tn += 2 * Math.PI;
      const vm = Math.sqrt(18.9 * (24 / Math.max(0.06, Math.abs(tn)))) * 0.93;
      const vh = kk === 0 ? vm : Math.sqrt(vm * vm + 2 * 12 * kk * su);
      if (vh < vAllow) vAllow = vh;
    }
    g.input.analog.steer = Math.max(-1, Math.min(1, a * 1.8));
    g.input.analog.throttle = sp > vAllow ? 0 : skill;
    g.input.analog.brake = sp > vAllow + 3 ? 0.9 : 0;
    g.frame();
    if (!c.airborne && !prevAir && sp > 8 && Math.abs(c.pos.y - prevY) > 0.3 && spots.length < 8) {
      const lat = t.lateralAt ? t.lateralAt(c.pos, c.trackIndex) : null;
      spots.push({ k, iPrev: prevI, iNow: c.trackIndex, latPrev: +prevLat.toFixed(1),
        latNow: lat === null ? null : +lat.toFixed(1),
        yPrev: +prevY.toFixed(2), yNow: +c.pos.y.toFixed(2),
        gPrev: +t.groundHeightAtPos(c.pos, prevI, c.lateral ?? 0).toFixed(2),
        gNow: +t.groundHeightAtPos(c.pos, c.trackIndex, c.lateral ?? 0).toFixed(2),
        cyPrev: +t.center[prevI].y.toFixed(2), cyNow: +t.center[c.trackIndex].y.toFixed(2),
        v: +(sp * 3.6).toFixed(0) });
    }
    prevY = c.pos.y; prevI = c.trackIndex;
    prevLat = (t.lateralAt ? t.lateralAt(c.pos, c.trackIndex) : 0) ?? 0;
    prevAir = c.airborne;
  }
  return { world: g.level?.name, spots };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
