/* MASTER WR-4 — camera and image stability, the two §6 checks the gate
 * still lacked:
 *
 *   T1  camera twitch harness (WR-4.1 / §6): drive ~40 s of a real lap and
 *       measure the camera's angular velocity per frame. Normal driving
 *       stays under 120°/s (sustained — a single respawn snap is not
 *       twitching), and the yaw rate must not REVERSE faster than 3 Hz
 *       over any 1 s window (reversal churn is the shimmer the owner
 *       filmed as "wavy" cameras).
 *
 *   T2  sky pixel-crawl diff (WR-4.2 / FIX-4 accept): with time frozen
 *       (getDelta 0 — nothing animates, camera parked) two consecutive
 *       renders must produce an IDENTICAL sky band. Any changing pixel up
 *       there is temporal post-process noise, the artifact class R11/R12
 *       filmed as scanline crawl.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const LVL = Number(process.env.LVL ?? 2);

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail ?? ''}`);
  ok ? pass++ : fail++;
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 720 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  // T1 needs the camera MATH, not the pixels — stub the composer for the
  // drive (swiftshader cannot render 2400 frames in test time) and restore
  // it for T2's two real frames.
  const realRender = g.composer?.render;
  if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));

  // ---- T1: drive with the laptime rig, sample camera yaw each frame ----
  const skill = 0.9;
  const dirV = new (Object.getPrototypeOf(g.camera.position).constructor)();
  const yawOf = () => {
    g.camera.getWorldDirection(dirV);
    return Math.atan2(dirV.x, dirV.z);
  };
  let prevYaw = yawOf(), prevRate = 0;
  const FRAMES = 60 * 40;
  let overSpeed = 0, worstRate = 0;
  const revTimes = [];   // frame indices where the yaw RATE crossed zero
  let settled = 0;       // skip the first second (grid settle)
  for (let k = 0; k < FRAMES; k++) {
    const car = g.player;
    const sp = Math.hypot(car.vel.x, car.vel.z);
    const i = car.trackIndex;
    const aim = t.center[(i + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
    let a = Math.atan2(aim.x - car.pos.x, aim.z - car.pos.z) - car.heading;
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
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
    g.input.analog.throttle = sp > vAllow ? 0 : skill;
    g.input.analog.brake = sp > vAllow + 3 ? 0.9 : 0;
    g.frame();
    const yaw = yawOf();
    let dy = yaw - prevYaw;
    while (dy > Math.PI) dy -= 2 * Math.PI;
    while (dy < -Math.PI) dy += 2 * Math.PI;
    const rate = dy * 60 * 180 / Math.PI;      // deg/s this frame
    prevYaw = yaw;
    if (k < 60) { prevRate = rate; continue; } // grid settle
    settled++;
    const aRate = Math.abs(rate);
    if (aRate > worstRate) worstRate = aRate;
    if (aRate > 120) overSpeed++;
    // a reversal is the rate crossing zero with real amplitude both sides
    if (prevRate * rate < 0 && Math.abs(prevRate) > 6 && aRate > 6) revTimes.push(k);
    prevRate = rate;
  }
  g.input.analog.throttle = 0; g.input.analog.brake = 0; g.input.analog.steer = 0;
  // worst 1 s reversal frequency: max reversals inside any 60-frame window
  let worstRevHz = 0;
  for (let a2 = 0; a2 < revTimes.length; a2++) {
    let n2 = 1;
    for (let b2 = a2 + 1; b2 < revTimes.length && revTimes[b2] - revTimes[a2] <= 60; b2++) n2++;
    if (n2 > worstRevHz) worstRevHz = n2;
  }

  // ---- T2: frozen-time sky diff -----------------------------------------
  if (g.composer && realRender) g.composer.render = realRender;
  g.clock.getDelta = () => 0;                  // nothing animates
  const cvs = g.renderer?.domElement;
  const grab = () => {
    g.frame();
    const c2 = document.createElement('canvas');
    const H = Math.floor(cvs.height * 0.22);   // the sky band
    c2.width = cvs.width; c2.height = H;
    c2.getContext('2d').drawImage(cvs, 0, 0);
    return c2.getContext('2d').getImageData(0, 0, c2.width, H).data;
  };
  const A = grab(), B = grab();
  let crawl = 0;
  for (let i2 = 0; i2 < A.length; i2 += 4) {
    if (Math.abs(A[i2] - B[i2]) > 2 || Math.abs(A[i2 + 1] - B[i2 + 1]) > 2
      || Math.abs(A[i2 + 2] - B[i2 + 2]) > 2) crawl++;
  }
  g.clock.getDelta = () => 1 / 60;
  return {
    world: g.level?.name,
    worstRate: +worstRate.toFixed(0),
    overSpeedPct: +(100 * overSpeed / Math.max(1, settled)).toFixed(2),
    worstRevHz,
    skyPx: A.length / 4, crawl,
  };
});

check('WR-4.1 camera yaw stays under 120°/s in normal driving (sustained)',
  r.overSpeedPct < 2.0,
  `${r.overSpeedPct}% of frames over, worst ${r.worstRate}°/s on ${r.world}`);
check('WR-4.1 yaw-rate reversals never exceed 3 Hz (no twitch churn)',
  r.worstRevHz <= 3,
  `worst ${r.worstRevHz} reversals in any 1 s window`);
check('WR-4.2 frozen-time sky diff is clean — zero pixel-crawl',
  r.crawl === 0,
  `${r.crawl} of ${r.skyPx} sky pixels changed between two frozen frames`);
check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
