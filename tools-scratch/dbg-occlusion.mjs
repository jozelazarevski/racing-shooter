/* C-C occlusion probe: player painted unlit magenta, drives a lap; every
 * STEP frames, screenshot and count magenta pixels near the car's projected
 * spot. Zero-magenta samples = car fully hidden (foliage/terrain). */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LVL = Number(process.env.LVL ?? 68), CAM = Number(process.env.CAM ?? 3);
const STEP = Number(process.env.STEP ?? 300);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
await p.evaluate((CAM) => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60;
  g.resetRace(); g.startRace?.();
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.camMode = CAM; g.lapsTotal = 99;
  g.player.mesh.traverse(o => {
    if (o.isMesh) { o.material = o.material.clone?.() ?? o.material;
      if (o.material.color) { o.material.color.set(0xff00ff);
        o.material.emissive?.set?.(0xff00ff); o.material.emissiveIntensity = 2; } }
  });
  window.__driveStep = (n) => {
    const t = g.track, N = t.center.length;
    const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
    for (let f = 0; f < n; f++) {
      const car = g.player;
      const sp = Math.hypot(car.vel.x, car.vel.z);
      const i = car.trackIndex;
      const aim = t.center[(i + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
      let a = Math.atan2(aim.x - car.pos.x, aim.z - car.pos.z) - car.heading;
      while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
      const K2 = Math.max(4, Math.round(24 / su));
      let vAllow = 1e9;
      const horizon = Math.max(K2, Math.round((24 + (sp * sp) / 24) / su));
      for (let kk = 0; kk <= horizon; kk += 2) {
        const j = (i + kk) % N;
        let tn = t.headingAt((j + K2) % N) - t.headingAt(j);
        while (tn > Math.PI) tn -= 2 * Math.PI; while (tn < -Math.PI) tn += 2 * Math.PI;
        const vm = Math.sqrt(18.9 * (24 / Math.max(0.06, Math.abs(tn)))) * 0.93;
        const vHere = kk === 0 ? vm : Math.sqrt(vm * vm + 2 * 12 * kk * su);
        if (vHere < vAllow) vAllow = vHere;
      }
      g.input.analog.steer = Math.max(-1, Math.min(1, a * 1.8));
      g.input.analog.throttle = sp > vAllow ? 0 : 0.92;
      g.input.analog.brake = sp > vAllow + 3 ? 0.9 : 0;
      g.frame();
    }
    return { lap: g.player.lap ?? 1 };
  };
}, CAM);
let hidden = 0, low = 0, n = 0;
for (let s = 0; s < 46; s++) {
  const st = await p.evaluate((STEP) => window.__driveStep(STEP), STEP);
  const count = await p.evaluate(async () => {
    const cv = window.__game.renderer.domElement;
    const c2 = document.createElement('canvas');
    c2.width = 480; c2.height = 854;
    c2.getContext('2d').drawImage(cv, 0, 0);
    const d = c2.getContext('2d').getImageData(0, 0, 480, 854).data;
    let mag = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 170 && d[i + 2] > 170 && d[i + 1] < 110) mag++;
    }
    return mag;
  });
  n++;
  if (count === 0) hidden++;
  else if (count < 40) low++;
  if (st.lap >= 2) break;
}
console.log(`LVL ${LVL} CAM ${CAM}: samples ${n}, fully hidden ${hidden}, mostly hidden(<40px) ${low}`);
await browser.close();
