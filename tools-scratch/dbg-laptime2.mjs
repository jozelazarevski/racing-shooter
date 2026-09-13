/* Scale-4 stall hunt: same expert stand-in as dbg-laptime, but samples the
 * car every 20 game-seconds and counts recovery events. LEVELS=1 node ... */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVELS = (process.env.LEVELS ?? '1').split(',').map(Number);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

for (const lvl of LEVELS) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 160)));
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length;
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    g.resetRace(); g.startRace?.();
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    g.lapsTotal = 99;
    const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
    const skill = 0.94;
    const samples = [];
    let returns = 0;
    const realLog = g.telemetry?.log?.bind(g.telemetry);
    if (realLog) g.telemetry.log = (kind, d2) => { if (kind === 'return' || kind === 'unstuck') returns++; return realLog(kind, d2); };
    let lapT = null, frames = 0, nextSample = 0;
    const CAP = 60 * 60 * 8;
    while (frames < CAP && lapT === null) {
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
      if (g.raceTime >= nextSample) {
        samples.push({ t: +g.raceTime.toFixed(0), lap: g.player.lap, idx: g.player.trackIndex,
          sp: +sp.toFixed(1), hull: Math.round(g.player.hull ?? -1),
          wrecked: !!g.player.wrecked, state: g.state, returns });
        nextSample += 20;
      }
      if ((g.player.lap ?? 1) >= 2) lapT = g.raceTime;
    }
    return { lapT: lapT && +lapT.toFixed(1), samples, returns, gates: g.route?.gates?.length,
      nextGate: g.player._nextGate, su: +su.toFixed(2) };
  });
  console.log(`level ${lvl}: lap=${r.lapT}  gates=${r.gates}  su=${r.su}  returns=${r.returns}  nextGate=${r.nextGate}`);
  for (const s of r.samples) console.log(' ', JSON.stringify(s));
  await p.close();
}
await browser.close();
