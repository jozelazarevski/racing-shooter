/* r329 — v2.3 B1: the below-terrain watchdog (§3.2) and the camera
 * close-clamp (§3.9 / P10).
 *
 * §3.2: a car more than belowTerrainM (1.0 u) under min(terrainHeight, the
 * ground physics stands it on) is a containment failure: returnToGate,
 * reason 'void', telemetry `void {car, depthM}` — every car, rivals
 * included. Grounded past voidDeepM (4 u) fires at once; anything else
 * needs voidConfirmS (0.5 s) held, which healthy driving never reaches
 * (measured 0.83 u worst-case over four worlds, voiddepth.mjs).
 *
 * §3.9: when the camera guards leave the eye inside camMinDistU (6 u) of
 * the car, it RISES toward top-down instead of staying edge-on — the
 * recording-F waterfall frames.
 *
 *   T1  player buried 10 u off-road -> immediate void return, event logged
 *   T2  rival buried 10 u off-road  -> void return, rivals covered
 *   T3  sustained shallow burial (2 u held) -> confirmed void within ~1 s
 *   T4  a car parked in a tunnel bore is NOT a void (datum = bore floor)
 *   T5  60 s of rival racing on a shelf world logs ZERO void events
 *   T6  camera seeded 2 u from the car ends the frame >= 5.9 u away
 *   T7  agent-driven lap: no frame with camera-car distance < 5.9 u
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 800, height: 520 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));

const boot = async (level) => {
  await p.goto(`${BASE}/?level=${level}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });
  await p.evaluate(() => {
    const g = window.__game;
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    g.startRace?.();
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    return g.state;
  });
};

// ---- T1-T3 + T5 + T6 on a shelf world (FURKA class) ----
await boot(12);
const r1 = await p.evaluate(() => {
  const g = window.__game, t = g.track, pl = g.player;
  const voids = () => {
    const out = [];
    for (let i = 0; i < g.telemetry.n; i++) {
      const e = g.telemetry.buf[(g.telemetry.head - g.telemetry.n + i + 4000) % 4000];
      if (e?.kind === 'void') out.push(e);
    }
    return out;
  };
  const bury = (car, idx, lat, depth) => {
    const c = t.center[idx], c2 = t.center[(idx + 1) % t.center.length];
    let sx = c2.z - c.z, sz = -(c2.x - c.x);
    const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    car.placeAt(idx, 0, true);
    car.pos.x = c.x + sx * lat; car.pos.z = c.z + sz * lat;
    car.vel.set(0, 0, 0); car.vy = 0; car.airborne = false;
    g.frame();   // let `lateral` see the move — a stale 0 reads as on-road
    car.y = t.terrainHeight(car.pos.x, car.pos.z) - depth;
    car.vel.set(0, 0, 0); car.vy = 0; car.airborne = false; car._voidT = 0;
  };
  // T1: player, deep
  const v0 = voids().length;
  bury(pl, 200, 40, 10);
  let t1Frames = -1;
  for (let k = 0; k < 40; k++) {
    g.frame();
    if (voids().length > v0) { t1Frames = k; break; }
  }
  const terr1 = t.terrainHeight(pl.pos.x, pl.pos.z);
  const t1 = { frames: t1Frames, backUp: pl.y > terr1 - 1.5,
    ev: voids().slice(-1)[0] ?? null };
  // T2: rival, held under. A one-shot burial is healed by the rival's own
  // instant lift (that is containment succeeding, not the watchdog failing),
  // so pin it under until the watchdog's confirmed path speaks for rivals.
  // (a rival's physics re-grounds it inside the same frame — lateral is
  // held state, so no teleport can leave one under the world through
  // g.frame(). That containment-by-construction is T5's subject; here the
  // watchdog LOOP itself is exercised for a rival by stepping the route
  // directly with a forged under-terrain state, proving the net covers
  // every car if physics ever does lose one.)
  const e1 = g.enemies.find((e) => e.alive);
  const v1 = voids().length;
  e1._voidT = 0;
  let t2Frames = -1;
  for (let k = 0; k < 90; k++) {
    if (voids().length === v1) {
      const terr = t.terrainHeight(e1.pos.x, e1.pos.z);
      e1.airborne = false;
      e1.y = terr - 2;
      e1._physGY = terr;
    }
    g._stepRoute();
    if (voids().length > v1) { t2Frames = k; break; }
  }
  const t2 = { frames: t2Frames, ev: voids().slice(-1)[0] ?? null };
  // T3: sustained shallow — hold the player 2 u under (the ease would heal a
  // one-off; a force that keeps making depth is what the confirm path is for)
  const v2 = voids().length;
  bury(pl, 600, 40, 2);
  let t3Frames = -1;
  for (let k = 0; k < 90; k++) {
    const terr = t.terrainHeight(pl.pos.x, pl.pos.z);
    if (voids().length === v2) pl.y = Math.min(pl.y, terr - 2);
    g.frame();
    if (voids().length > v2) { t3Frames = k; break; }
  }
  const t3 = { frames: t3Frames };
  // T6: camera seeded on the bumper
  pl.placeAt(300, 0, true);
  for (let k = 0; k < 10; k++) g.frame();          // settle the boom
  g.camPos.set(pl.pos.x + 1.4, pl.pos.y + 1.4, pl.pos.z);
  g.frame();
  const t6 = { d: +g.camera.position.distanceTo(pl.pos).toFixed(2) };
  return { t1, t2, t3, t6 };
});
check('T1  player buried 10 u: immediate void return',
  r1.t1.frames >= 0 && r1.t1.frames <= 3 && r1.t1.backUp && r1.t1.ev?.car === 'player',
  JSON.stringify(r1.t1));
check('T2  rival held 2 u under: the watchdog speaks for rivals too',
  r1.t2.frames >= 25 && r1.t2.frames <= 75 && r1.t2.ev?.car !== 'player',
  JSON.stringify(r1.t2));
check('T3  sustained 2 u burial: confirmed void inside a second',
  r1.t3.frames >= 25 && r1.t3.frames <= 60, JSON.stringify(r1.t3));
check('T6  camera seeded 2 u out ends the frame >= 5.9 u away',
  r1.t6.d >= 5.9, JSON.stringify(r1.t6));

// T5: healthy racing logs zero voids (fresh page state: reboot the level)
await boot(12);
const r5 = await p.evaluate(() => {
  const g = window.__game;
  for (let k = 0; k < 60 * 60; k++) g.frame();
  let voids = 0;
  for (let i = 0; i < g.telemetry.n; i++) {
    const e = g.telemetry.buf[(g.telemetry.head - g.telemetry.n + i + 4000) % 4000];
    if (e?.kind === 'void') voids++;
  }
  return { voids };
});
check('T5  60 s of rival racing: zero void events', r5.voids === 0, JSON.stringify(r5));

// ---- T4 + T7 on CANYON RUN (has a real bore) ----
await boot(4);
const r4 = await p.evaluate(() => {
  const g = window.__game, t = g.track, pl = g.player;
  const bore = t._tunnels?.[0];
  if (!bore) return { skip: 'no bore on this world' };
  // park mid-bore, idle 2.5 s: terrainHeight is the mountain over the roof,
  // the datum must be the bore floor
  // find the spot in the bore with the most mountain over the road
  let bi = bore.mid % t.center.length, bOver = -1e9;
  for (let i = bore.s; i <= bore.e; i++) {
    const j = ((i % t.center.length) + t.center.length) % t.center.length;
    const c = t.center[j];
    const ov = t.terrainHeight(c.x, c.z) - c.y;
    if (ov > bOver) { bOver = ov; bi = j; }
  }
  pl.placeAt(bi, 0, true);
  pl.vel.set(0, 0, 0);
  let voids0 = 0;
  for (let i = 0; i < g.telemetry.n; i++) {
    const e = g.telemetry.buf[(g.telemetry.head - g.telemetry.n + i + 4000) % 4000];
    if (e?.kind === 'void') voids0++;
  }
  const over = t.terrainHeight(pl.pos.x, pl.pos.z) - pl.y;
  for (let k = 0; k < 150; k++) g.frame();
  let voids = 0;
  for (let i = 0; i < g.telemetry.n; i++) {
    const e = g.telemetry.buf[(g.telemetry.head - g.telemetry.n + i + 4000) % 4000];
    if (e?.kind === 'void') voids++;
  }
  return { newVoids: voids - voids0, mountainOverCar: +over.toFixed(1) };
});
// (measured: _blendHeight flattens terrainHeight to the roadline even inside
// the bore, so the datum exemption is belt-and-braces on this engine — the
// binding assertion is simply that a car in a bore is never a void)
check('T4  parked in a tunnel bore: not a void',
  r4.skip ? false : r4.newVoids === 0, JSON.stringify(r4));

const r7 = await p.evaluate(() => {
  const g = window.__game, t = g.track, pl = g.player, N = t.center.length;
  pl.placeAt(4, 0, true);
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const clamp = (v, a, z) => Math.max(a, Math.min(z, v));
  let su = 0;
  for (let i = 0; i < 64; i++) {
    const a = t.center[(i * 37) % N], c = t.center[((i * 37) % N + 1) % N];
    su += Math.hypot(c.x - a.x, c.z - a.z);
  }
  su = Math.max(0.5, su / 64);
  let minD = 1e9, minAt = -1, below = 0;
  for (let k = 0; k < 75 * 60; k++) {
    const speed = pl.vel.length();
    const look = Math.max(3, Math.round((9 + speed * 0.45) / su));
    const li = (pl.trackIndex + look) % N;
    const c = t.pointAt ? t.pointAt(li, 0) : t.center[li];
    const err = wrap(Math.atan2(c.x - pl.pos.x, c.z - pl.pos.z) - pl.heading);
    const K2 = Math.max(4, Math.round(30 / su));
    const turn = Math.abs(wrap(t.headingAt((pl.trackIndex + K2) % N) - t.headingAt(pl.trackIndex)));
    const vmax = clamp(Math.sqrt(15 * (30 / Math.max(0.06, turn))), 14, 60);
    g.input.analog.steer = clamp(err * 1.8, -1, 1);
    g.input.analog.throttle = speed < vmax ? 1 : 0;
    g.input.analog.brake = speed > vmax + 4 ? 1 : 0;
    g.frame();
    const d = g.camera.position.distanceTo(pl.pos);
    if (d < minD) { minD = d; minAt = pl.trackIndex; }
    if (d < 5.9) below++;
  }
  return { minD: +minD.toFixed(2), minAt, framesBelow: below };
});
check('T7  75 s driven on a tunnel world: no frame with camera < 5.9 u (P10)',
  r7.framesBelow === 0, JSON.stringify(r7));
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe world holds the car, and the camera keeps its distance');
