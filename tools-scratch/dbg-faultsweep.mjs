/* R3 of the x10 — THE AGENT DRIVER RIDES AGAIN. The expert stand-in races
 * ~100 s on each world of a spread sample, logging what the fault
 * telemetry sees: returns by reason, wrecks, page errors, and stall
 * streaks (speed < 8 for > 6 s — the X1 law's shape). Worlds with any
 * fault print their evidence. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const WORLDS = (process.env.WORLDS ?? '1,2,3,4,5,6,7,8,9,11,22,32,41,44,50,60,66,73,76,78')
  .split(',').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 100)));
const bad = [];
for (const lvl of WORLDS) {
  errs.length = 0;
  try {
    await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
    await p.waitForFunction(() => window.__game?.player && window.__game.track,
      undefined, { timeout: 300000 });
    const r = await p.evaluate(async () => {
      const g = window.__game, t = g.track, N = t.center.length;
      const su = t.segLen ?? 4;
      g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
      for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
      const car = g.player;
      const returns = {};
      const origRet = g.returnToGate?.bind(g);
      if (origRet) g.returnToGate = (c, gate, reason) => {
        if (c === car) returns[reason ?? '?'] = (returns[reason ?? '?'] ?? 0) + 1;
        return origRet(c, gate, reason);
      };
      let wrecks = 0, prevH = car.health, stallMax = 0, stallCur = 0;
      const skill = 0.94;
      let frames = 0;
      const CAP = 60 * 100;
      while (frames < CAP && !g.raceOver) {
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
        if (car.health <= 0 && prevH > 0) wrecks++;
        prevH = car.health;
        if (sp < 8) { stallCur += 1 / 60; if (stallCur > stallMax) stallMax = stallCur; }
        else stallCur = 0;
      }
      return { world: g.level?.name, returns, wrecks, stallMaxS: +stallMax.toFixed(1),
        lap: car.lap, idx: car.trackIndex };
    });
    r.pageErrs = errs.slice(0, 2);
    const faulty = Object.keys(r.returns).length || r.wrecks || r.stallMaxS > 6 || r.pageErrs.length;
    process.stdout.write(faulty ? 'F' : '.');
    if (faulty) bad.push(r);
  } catch (e) { process.stdout.write('x'); bad.push({ world: 'level ' + lvl, loadErr: String(e).slice(0, 80) }); }
}
console.log('');
for (const b of bad) console.log(JSON.stringify(b));
console.log(`${bad.length} of ${WORLDS.length} worlds with faults`);
await browser.close();
