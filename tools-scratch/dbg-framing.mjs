/* FIX-4 C-B acceptance probe: drives a lap (airace expert stand-in), CAM per
 * arg, samples the player's NDC every frame; reports % frames the car is
 * inside the frame (|ndc|<1) and inside the central 60/85% bands, plus
 * watchdog re-seat count. LEVELS=66 CAM=3 node dbg-framing.mjs */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVELS = (process.env.LEVELS ?? '66').split(',').map(Number);
const CAM = Number(process.env.CAM ?? 3);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const lvl of LEVELS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });
  const r = await p.evaluate((CAM) => {
    const g = window.__game, t = g.track, N = t.center.length;
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    g.resetRace(); g.startRace?.();
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    g.camMode = CAM; g.lapsTotal = 99;
    const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
    const skill = 0.94;
    let frames = 0, seen = 0, central60 = 0, central85 = 0, reseats = 0, worst = 0;
    const w0 = console.warn;
    console.warn = (...a) => { if (String(a[0]).includes('watchdog')) reseats++; w0(...a); };
    const CAP = 60 * 240;
    let lapDone = false;
    while (frames < CAP && !lapDone) {
      const car = g.player;
      const sp = Math.hypot(car.vel.x, car.vel.z);
      const i = car.trackIndex;
      const aim = t.center[(i + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
      let a = Math.atan2(aim.x - car.pos.x, aim.z - car.pos.z) - car.heading;
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      const drop = t.center[i].y - t.center[(i + 6) % N].y;
      const lift = drop > 2.2 ? 0.55 : drop > 1.2 ? 0.8 : 1;
      const K2 = Math.max(4, Math.round(24 / su));
      let vAllow = 1e9;
      const horizon = Math.max(K2, Math.round((24 + (sp * sp) / 24) / su));
      for (let kk = 0; kk <= horizon; kk += 2) {
        const j = (i + kk) % N;
        let tn = t.headingAt((j + K2) % N) - t.headingAt(j);
        while (tn > Math.PI) tn -= 2 * Math.PI;
        while (tn < -Math.PI) tn += 2 * Math.PI;
        const vm = Math.sqrt(18.9 * (24 / Math.max(0.06, Math.abs(tn)))) * (0.84 + 0.10 * skill);
        const vHere = kk === 0 ? vm : Math.sqrt(vm * vm + 2 * 12 * kk * su);
        if (vHere < vAllow) vAllow = vHere;
      }
      g.input.analog.steer = Math.max(-1, Math.min(1, a * 1.8));
      g.input.analog.throttle = sp > vAllow ? 0 : skill * lift;
      g.input.analog.brake = sp > vAllow + 3 ? 0.9 : 0;
      g.frame();
      frames++;
      const v = g.player.mesh.position.clone().project(g.camera);
      const m = Math.max(Math.abs(v.x), Math.abs(v.y));
      if (m < 1 && v.z < 1) seen++;
      if (m < 0.6 && v.z < 1) central60++;
      if (m < 0.85 && v.z < 1) central85++;
      if (m > worst && v.z < 1) worst = m;
      if ((car.lap ?? 1) >= 2) lapDone = true;
    }
    console.warn = w0;
    return { name: g.level?.name, frames,
      seenPct: +(100 * seen / frames).toFixed(1),
      c60: +(100 * central60 / frames).toFixed(1),
      c85: +(100 * central85 / frames).toFixed(1),
      reseats, worst: +worst.toFixed(2), lapDone };
  }, CAM);
  console.log(`level ${lvl} CAM=${CAM}`, JSON.stringify(r));
  await p.close();
}
await browser.close();
