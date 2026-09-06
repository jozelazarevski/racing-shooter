/* Owner: "Drift can be improved" — measure the FEEL beyond test-drift's
 * r307 promises. Four scripted scenarios on a straight (CANYON RUN idx 40),
 * off-road grip pinned, rescue timers cleared:
 *   A carry     : 2.0 s held drift at 70/100/120 — slip onset (FT3), total
 *                 heading, speed in -> out, beta max
 *   B modulate  : 1.0 s full steer then 0.8 s at 0.35 — does the angle
 *                 follow the stick down?
 *   C chain     : 1.0 s left then steer flipped right, drift held — time
 *                 for the slide (vl sign) to flip
 *   D exit      : 1.0 s drift then release + counter-steer — time to
 *                 slip < 15 deg and heading wobble after
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 800, height: 520 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=${process.env.LEVEL ?? 4}&go=1&fresh=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 120000 });

const R = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const pl = g.player;
  pl.offroadSkill = 1;
  const t0 = g.track;
  t0.obstacles = []; t0.solids = []; t0.barriers = []; t0.trees = [];
  const dt = 1 / 60;
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const beta = () => {
    const f = pl.forward;
    const vf = pl.vel.x * f.x + pl.vel.z * f.z;
    const vl = pl.vel.x * f.z - pl.vel.z * f.x;
    return { deg: Math.atan2(Math.abs(vl), Math.max(0.5, Math.abs(vf))) * 180 / Math.PI, vl };
  };
  const reset = (kmh) => {
    pl.placeAt(40, 0);
    const v = kmh / 3.6;
    pl.vel.set(Math.sin(pl.heading) * v, 0, Math.cos(pl.heading) * v);
    pl.slip = 0;
  };
  const step = (inp) => {
    pl._lostT = 0; pl._cliffT = 0; pl._wedgeT = 0; pl._bogT = 0;
    pl.step(dt, { throttle: 1, brake: 0, drift: false, hold: false, ...inp });
  };
  const kmhOf = () => Math.hypot(pl.vel.x, pl.vel.z) * 3.6;
  const out = { carry: [], modulate: null, chain: null, exit: null };

  // A. carry — offFrac = fraction of frames spent off the ribbon, to
  // attribute speed loss between the drift law and the surface
  const roadHalf = () => (g.track.roadHalfAt?.(pl.trackIndex) ?? g.track.roadHalf ?? 5);
  for (const kmh of [70, 100, 120]) {
    reset(kmh);
    const h0 = pl.heading;
    let t40 = null, betaMax = 0, offN = 0, kmhMid = 0;
    for (let i = 0; i < 120; i++) {
      step({ steer: 1, drift: true });
      const b = beta();
      betaMax = Math.max(betaMax, b.deg);
      if (Math.abs(pl.lateral) > roadHalf() + 1) offN++;
      if (i === 59) kmhMid = kmhOf();
      if (t40 === null && b.deg > 40) t40 = +(i * dt).toFixed(2);
    }
    out.carry.push({ kmh, t40, betaMax: +betaMax.toFixed(0),
      headingDeg: +(Math.abs(wrap(pl.heading - h0)) * 180 / Math.PI).toFixed(0),
      kmhAt1s: +kmhMid.toFixed(0), kmhOut: +kmhOf().toFixed(0),
      offFrac: +(offN / 120).toFixed(2) });
  }

  // E. off-road floor at the scene of the exit: stand off the ribbon,
  // full throttle 3 s (F7: 0 -> 30 km/h in < 3.0 s on every surface)
  pl.placeAt(40, 0);
  pl.pos.x += pl.forward.z * 14; pl.pos.z -= pl.forward.x * 14;
  pl.vel.set(0, 0, 0);
  for (let i = 0; i < 180; i++) step({ steer: 0 });
  out.offAccel = { kmhAfter3s: +kmhOf().toFixed(0), lateral: +(pl.lateral ?? 0).toFixed(1) };

  // B. modulate: equilibrium drift angle per stick position — enter at
  // full lock (1.0 s), then hold the given steer for 1.0 s and read the
  // settled angle and the turn rate it still delivers
  out.modulate = [];
  for (const s of [1.0, 0.6, 0.35]) {
    reset(90);
    for (let i = 0; i < 60; i++) step({ steer: 1, drift: true });
    let hs = pl.heading, turn = 0, hp = pl.heading;
    for (let i = 0; i < 60; i++) {
      step({ steer: s, drift: true });
      turn += Math.abs(wrap(pl.heading - hp)); hp = pl.heading;
    }
    out.modulate.push({ steer: s, betaEq: +beta().deg.toFixed(0),
      turnDegS: +(turn * 180 / Math.PI).toFixed(0), kmhOut: +kmhOf().toFixed(0) });
  }

  // C. chain: flip steer while held
  reset(90);
  for (let i = 0; i < 60; i++) step({ steer: 1, drift: true });
  const vl0 = beta().vl; let flipT = null;
  for (let i = 0; i < 120; i++) {
    step({ steer: -1, drift: true });
    if (flipT === null && Math.sign(beta().vl) !== Math.sign(vl0) && Math.abs(beta().vl) > 1.5) {
      flipT = +(i * dt).toFixed(2);
    }
  }
  out.chain = { flipT, betaAfter: +beta().deg.toFixed(0), kmhOut: +kmhOf().toFixed(0) };

  // D. exit: release + counter-steer
  reset(90);
  for (let i = 0; i < 60; i++) step({ steer: 1, drift: true });
  const bRel = beta().deg; let calmT = null; let hMax = 0; let hPrev = pl.heading;
  for (let i = 0; i < 120; i++) {
    const b = beta();
    step({ steer: calmT === null ? -0.8 : 0, drift: false });
    hMax = Math.max(hMax, Math.abs(wrap(pl.heading - hPrev)) / dt);
    hPrev = pl.heading;
    if (calmT === null && b.deg < 15) calmT = +(i * dt).toFixed(2);
  }
  out.exit = { betaAtRelease: +bRel.toFixed(0), calmT,
    maxYawAfterDegS: +(hMax * 180 / Math.PI).toFixed(0), kmhOut: +kmhOf().toFixed(0) };
  return out;
});
console.log(JSON.stringify(R, null, 1));
await browser.close();
