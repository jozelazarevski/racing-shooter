/* Fine shake metrics: drive the bot 3600 frames; while grounded and > 40 km/h
 * record |dy| and |d2y| per frame plus camera-y deltas; report p50/p95/max. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 16);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1${process.env.NOCW ? '#nocw' : ''}`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const cw0 = t.T.cliffWalls;
  if ((window.location.hash || '').includes('nocw')) t.T.cliffWalls = false;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
  const c = g.player;
  const dys = [], d2ys = [], camDys = [], spikes = [];
  let py = c.pos.y, pdy = 0, pcy = g.camera.position.y;
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
    g.input.analog.throttle = sp > vAllow ? 0 : 0.9;
    g.input.analog.brake = sp > vAllow + 3 ? 0.9 : 0;
    g.frame();
    const dy = c.pos.y - py, cdy = g.camera.position.y - pcy;
    if (!c.airborne && sp > 11) {
      dys.push(Math.abs(dy)); d2ys.push(Math.abs(dy - pdy)); camDys.push(Math.abs(cdy));
      if (Math.abs(cdy) > 1 && spikes.length < 14) {
        const cp2 = g.camPos;
        spikes.push({ k, i: c.trackIndex, cdy: +cdy.toFixed(2),
          camY: +cp2.y.toFixed(1), carY: +c.pos.y.toFixed(1),
          tun: !!(t.tunnelAt && (t.tunnelAt(c.pos, c.trackIndex, 6) || t.tunnelAt(cp2, c.trackIndex, 6))),
          deck: !!(t.deckOverhead && (t.deckOverhead(c.pos, c.trackIndex) || t.deckOverhead(cp2, c.trackIndex))),
          shk: +(g.shake ?? 0).toFixed(2) });
      }
    }
    py = c.pos.y; pdy = dy; pcy = g.camera.position.y;
  }
  const pct = (arr, q) => { const s = [...arr].sort((x, y) => x - y); return +(s[Math.floor(s.length * q)] ?? 0).toFixed(3); };
  return { world: g.level?.name, cliffWalls: cw0, n: dys.length,
    dy: { p50: pct(dys, 0.5), p95: pct(dys, 0.95), max: pct(dys, 0.999) },
    d2y: { p50: pct(d2ys, 0.5), p95: pct(d2ys, 0.95), max: pct(d2ys, 0.999) },
    cam: { p50: pct(camDys, 0.5), p95: pct(camDys, 0.95), max: pct(camDys, 0.999) }, spikes };
});
console.log(JSON.stringify(r));
await browser.close();
