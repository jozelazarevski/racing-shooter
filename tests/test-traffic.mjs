/* r333 — v2.3 §5.7 / S10: TRAFFIC DISCIPLINE, measured in real time.
 * Traffic runs its own wall-clock RAF loop (traffic.js is self-attaching),
 * so this suite does NOT stub the clock or pump g.frame() — it lets the
 * page run and samples. Recording F 0:20.5's fault was a rival parked
 * behind a tractor on the upper road; the current engine's shuttles are
 * kinematic (nothing can physically block them) and rivals read traffic
 * as avoidance proxies, so the laws to hold are:
 *
 *   T1  S10a: no ALIVE traffic vehicle stationary while the race runs
 *       (worst streak under 2.5 s — the hit-pause allowance)
 *   T2  S10b: no rival below ~10 km/h within 14 u of a traffic hull for
 *       more than 2 s
 *   T3  rivals keep lapping on a traffic world (the field is not stalled)
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=12&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const r = await p.evaluate(async () => {
  const g = window.__game;
  g.startRace?.();
  const f = () => new Promise((r2) => requestAnimationFrame(r2));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
  if (g.state !== 'race') return { fail: 'no race' };
  // both the game loop and traffic.js run on wall-clock RAF, so stubbing
  // the composer speeds them up TOGETHER — real-time semantics at headless
  // frame rates
  if (g.composer) g.composer.render = () => {};
  const S = g.__traffic;
  if (!S?.ents?.length) return { fail: 'no traffic on this world' };
  // real-time sampling: ~35 s of wall clock at whatever fps swiftshader gives
  const t0 = performance.now();
  const prev = new Map(), statT = new Map(), queueT = new Map();
  let worstStat = 0, worstQueue = 0, lastNow = t0;
  const prog0 = g.enemies.map((e) => e.progress ?? 0);
  while (performance.now() - t0 < 35000) {
    await f();
    const now = performance.now();
    const dt = Math.min((now - lastNow) / 1000, 0.1);
    lastNow = now;
    for (const ent of S.ents) {
      if (!ent.alive) { statT.set(ent, 0); continue; }
      const pp = prev.get(ent);
      const moved = pp ? Math.hypot(ent.x - pp.x, ent.z - pp.z) : 1;
      prev.set(ent, { x: ent.x, z: ent.z });
      // stationary matters ON the carriageway; a crossing rig waiting at
      // its spur mouth between scripted passes is scenery (§5.7's own
      // carve-out: the pause happens off the driving surface)
      const gi = g.track.nearestIndex ? g.track.nearestIndex(ent, null) : 0;
      const c = g.track.center[gi];
      const onRoad = Math.hypot(ent.x - c.x, ent.z - c.z) < (g.track.widthAt?.(gi) ?? 9);
      if (onRoad && moved < 0.02) {
        const v = (statT.get(ent) ?? 0) + dt;
        statT.set(ent, v);
        if (v > worstStat) worstStat = v;
      } else statT.set(ent, 0);
    }
    for (const e of g.enemies) {
      if (!e.alive) continue;
      let near = false;
      for (const ent of S.ents) {
        if (ent.alive && Math.hypot(e.pos.x - ent.x, e.pos.z - ent.z) < 14) { near = true; break; }
      }
      if (near && Math.hypot(e.vel.x, e.vel.z) < 3) {
        const v = (queueT.get(e) ?? 0) + dt;
        queueT.set(e, v);
        if (v > worstQueue) worstQueue = v;
      } else queueT.set(e, 0);
    }
  }
  const progGain = g.enemies.map((e, i) => +(((e.progress ?? 0) - prog0[i])).toFixed(2));
  return { traffic: S.ents.length, raceS: +g.raceTime.toFixed(1),
    worstStat: +worstStat.toFixed(1), worstQueue: +worstQueue.toFixed(1),
    rivalsMoving: progGain.filter((x) => x > 0.05).length, progGain };
});

if (r.fail) check('setup', false, r.fail);
else {
  check('T1  S10a: no alive traffic stationary beyond the hit-pause',
    r.worstStat < 2.5, JSON.stringify({ worstStat: r.worstStat, traffic: r.traffic }));
  check('T2  S10b: no rival queued behind traffic over 2 s',
    r.worstQueue < 2.0, JSON.stringify({ worstQueue: r.worstQueue }));
  check('T3  the field keeps lapping among traffic',
    r.rivalsMoving >= 6, JSON.stringify({ rivalsMoving: r.rivalsMoving, raceS: r.raceS }));
}
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe field flows through the traffic');
