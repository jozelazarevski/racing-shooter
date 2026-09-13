import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=4&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.resetRace(); g.startRace?.();
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
  const skill = 0.94;
  const hits = [];
  const orig = g.player.damage.bind(g.player);
  g.player.damage = (amt, src) => {
    if (src && g.enemies.includes(src) && amt >= 2) {
      hits.push({ t: +g.raceTime.toFixed(1), amt: +amt.toFixed(1), who: src.persona,
        st: src._ovState, ram: src.ramTimer > 0,
        rel: +Math.hypot(src.vel.x - g.player.vel.x, src.vel.z - g.player.vel.z).toFixed(1),
        pv: +Math.hypot(g.player.vel.x, g.player.vel.z).toFixed(1) });
    }
    return orig(amt, src);
  };
  const packs = [];
  let frames = 0;
  while (frames < 110 * 60) {
    const car = g.player;
    const sp = Math.hypot(car.vel.x, car.vel.z);
    const i = car.trackIndex;
    const aim = t.center[(i + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
    let a = Math.atan2(aim.x - car.pos.x, aim.z - car.pos.z) - car.heading;
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    const drop = t.center[i].y - t.center[(i + 6) % N].y;
    const lift = drop > 1.2 ? 0.55 : 1;
    const K2 = Math.max(4, Math.round(24 / su));
    let vAllow = 1e9;
    const horizon = Math.max(K2, Math.round((24 + sp * sp / 24) / su));
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
    g.frame(); frames++;
    if (frames % 15 === 0 && g.raceTime > 15) {
      const cars = [g.player, ...g.enemies];
      for (let ai = 0; ai < cars.length; ai++) {
        let members = [];
        for (let bi = 0; bi < cars.length; bi++) {
          if (ai === bi || !cars[bi].alive) continue;
          if (cars[ai].pos.distanceToSquared(cars[bi].pos) < 400) members.push(bi);
        }
        if (members.length >= 3 && ai !== 0 && !members.includes(0)) {
          packs.push({ t: +g.raceTime.toFixed(0),
            si: cars[ai].trackIndex,
            group: [ai, ...members].map((m) => cars[m].persona + '(v' + Math.round(Math.abs(cars[m].speedAlong))
              + ',' + (cars[m]._ovState ?? '?')[0]
              + (g.raceTime - (cars[m]._lastReturnT ?? -99) < 8 ? ',RET' : '')
              + (!cars[m].alive ? ',DEAD' : '') + ')').join(' ') });
          break;
        }
      }
    }
  }
  return { rivalPacks: packs.length,
    packSample: packs.filter((_, i2) => i2 % 3 === 0).slice(0, 16) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
