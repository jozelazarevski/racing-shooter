/* THE NUMBER THAT DID NOT EXIST, ROBOT EDITION. Full 3-lap races by the
 * expert stand-in (skill 0.94) on one world per template; race time and
 * best lap recorded as a reproducible baseline fixture for difficulty
 * work. Not a human lap — but a stable anchor until one is measured. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const WORLDS = [1, 4, 3, 32, 76, 9]; // forest, canyon, snow, outback, riviera, open
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', () => {});
const out = {};
for (const lvl of WORLDS) {
  await p.goto(`${BASE}/?level=${lvl}&go=1&fresh=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.player && window.__game.track,
    undefined, { timeout: 300000 });
  const res = await p.evaluate(async () => {
    const g = window.__game, t = g.track, N = t.center.length;
    const su = t.segLen ?? 4;
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    const car = g.player;
    const skill = 0.94;
    let frames = 0;
    const CAP = 60 * 60 * 10;
    const lapT = [];
    let lastLap = car.lap ?? 1, lastT = 0;
    while (frames < CAP && !car.finished && !g.raceOver) {
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
      {
        const f = car.forward;
        for (const e2 of g.enemies) {
          if (!e2.alive) continue;
          const dx = e2.pos.x - car.pos.x, dz = e2.pos.z - car.pos.z;
          const along = dx * f.x + dz * f.z;
          if (along < 1 || along > 16) continue;
          const across = dx * f.z - dz * f.x;
          if (Math.abs(across) > 3.2) continue;
          const es = Math.abs(e2.speedAlong);
          if (sp > es - 0.5) {
            vAllow = Math.min(vAllow, along < 8 ? es - 1 : es + 2);
            a += across > 0 ? 0.25 : -0.25;
          }
        }
      }
      g.input.analog.steer = Math.max(-1, Math.min(1, a * 1.8));
      g.input.analog.throttle = sp > vAllow ? 0 : skill * lift;
      g.input.analog.brake = sp > vAllow + 3 ? 0.9 : 0;
      g.frame();
      frames++;
      if ((car.lap ?? 1) > lastLap) {
        lapT.push(+(g.raceTime - lastT).toFixed(1));
        lastT = g.raceTime; lastLap = car.lap;
      }
    }
    if (car.finished) lapT.push(+(g.raceTime - lastT).toFixed(1));
    return { world: g.level?.name, raceS: +g.raceTime.toFixed(1),
      laps: lapT, bestLapS: lapT.length ? Math.min(...lapT) : null,
      rank: g.playerRank, finished: !!car.finished };
  });
  out[res.world] = res;
  console.log(JSON.stringify(res));
}
writeFileSync('/home/user/racing-shooter/tests/fixtures/robot-baseline-r363.json',
  JSON.stringify({ build: 'r363', driver: 'airace expert stand-in', skill: 0.94,
    note: 'robot reference, not a human lap — see HANDOVER item 1', worlds: out }, null, 1));
console.log('fixture written');
await browser.close();
