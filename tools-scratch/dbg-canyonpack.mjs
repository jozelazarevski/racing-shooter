/* #54 — WHERE does CANYON RUN's field re-pack after the sort? Runs airace's
 * own expert stand-in races and stamps every late rival-only pack tick with
 * lap position, section kind, road width, and crest/pinch proximity. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const RACES = Math.max(1, Number(process.env.RACES ?? 3));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 120)));
await p.goto(`${BASE}/?level=4&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const RS = await p.evaluate(async () => (await import('./src/track.js')).ROUTE_SCALE ?? 1);
for (let raceN = 0; raceN < RACES; raceN++) {
  const r = await p.evaluate((RS) => {
    const g = window.__game, t = g.track, N = t.center.length;
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    g.resetRace(); g.startRace?.();
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
    const cars = [g.player, ...g.enemies];
    const skill = 0.94;
    const ticks = [];
    let frames = 0;
    const CAP = 150 * 60 * RS;
    const ROAD_HALF = 9;
    while (frames < CAP) {
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
      const now = g.raceTime;
      if (frames % 15 === 0 && now > 45 * RS) {
        for (let ai = 1; ai < cars.length; ai++) {
          let close = 0; const members = [ai];
          for (let bi = 1; bi < cars.length; bi++) {
            if (ai === bi || !cars[bi].alive) continue;
            if (cars[ai].pos.distanceToSquared(cars[bi].pos) < 400) { close++; members.push(bi); }
          }
          if (close >= 3) {
            const gi = cars[ai].trackIndex;
            let nearCrest = 1e9;
            for (const cr of t.crests ?? []) {
              const d = Math.min((gi - cr.index + N) % N, (cr.index - gi + N) % N);
              if (d < nearCrest) nearCrest = d;
            }
            const w = t.widthAt ? t.widthAt(gi) : ROAD_HALF;
            const spd = members.map((m) => Math.round(Math.hypot(cars[m].vel.x, cars[m].vel.z)));
            ticks.push({ t: +now.toFixed(0), gi, kind: g.route?.kindAtIndex?.(gi),
              w: +w.toFixed(1), crestD: nearCrest, n: close + 1, spd });
            break;
          }
        }
      }
      const done = cars.every((c) => (c.lap ?? 1) >= 2);
      if (done && now > 20) break;
    }
    return { ticks, raceT: +g.raceTime.toFixed(0) };
  }, RS);
  const byGi = {};
  for (const tk of r.ticks) { const b = Math.round(tk.gi / 50) * 50; byGi[b] = (byGi[b] ?? 0) + 1; }
  console.log(`race ${raceN + 1}: ${r.ticks.length} late pack ticks over ${r.raceT}s; hot spots ${JSON.stringify(byGi)}`);
  for (const tk of r.ticks.slice(0, 10)) console.log('  ', JSON.stringify(tk));
}
await browser.close();
