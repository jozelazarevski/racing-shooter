/* AGENT DRIVER: lap every world through the same inputs a thumb has.
 *
 * Everything before this drove the player by teleport (playtest-all rails the
 * car along the centreline) or by open-loop stunts (offroad.mjs). Neither can
 * answer the two standing questions: what does a competent lap TIME look like
 * (HANDOVER item 1 — the number that does not exist), and what breaks when a
 * car actually DRIVES the lap — collisions, launches, stuck spots, camera,
 * swallowed frame-loop faults.
 *
 * So: pure pursuit on the centreline + curvature-limited target speed, fed
 * through `g.input.analog` exactly like the virtual stick, stepped with the
 * fixed-delta synchronous-frame trick from offroad.mjs. The driver is honest:
 * if it wrecks it is revived in place, if it is stuck >4 s it is lifted back
 * onto the line and that is COUNTED as a fault with a location.
 *
 *   node tools-scratch/agentdrive.mjs 1 2 3        # level ids
 *   BASE=http://localhost:8901 SIM=150 node ...
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const SIM = Number(process.env.SIM ?? 150);          // simulated seconds cap per world
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 800, height: 520 } });
page.setDefaultTimeout(300000);

const rows = [];
for (const id of process.argv.slice(2).map(Number)) {
  const errors = [], recovered = new Set();
  const onErr = (e) => errors.push(String(e.message).split('\n')[0].slice(0, 160));
  const onCon = (m) => { const s = m.text(); if (/recovered from/.test(s)) recovered.add(s.split('\n')[0].slice(0, 160)); };
  page.on('pageerror', onErr); page.on('console', onCon);
  try {
    await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 90000 });
    const r = await page.evaluate(async (SIM) => {
      const g = window.__game, t = g.track, p = g.player, N = t.center.length;
      g.startRace?.();
      const f = () => new Promise((r2) => requestAnimationFrame(r2));
      for (let i = 0; i < 600 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
      if (g.state !== 'race') return { fail: 'never reached race state, state=' + g.state };
      // fixed step + no draw: simulated time, not swiftshader time
      g.clock.getDelta = () => 1 / 60;
      if (g.composer) g.composer.render = () => {};
      const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
      const clamp = (v, a, z) => Math.max(a, Math.min(z, v));
      // mean sample spacing, to convert metres of lookahead into indices
      let su = 0; for (let i = 0; i < 64; i++) { const a = t.center[(i * 37) % N], c = t.center[((i * 37) % N + 1) % N]; su += Math.hypot(c.x - a.x, c.z - a.z); }
      su = Math.max(0.5, su / 64);
      const faults = [], F = (kind, detail) => { if (faults.length < 40) faults.push({ kind, at: p.trackIndex, detail }); };
      const t0 = g.raceTime, lap0 = p.lap ?? 0;
      let lapTime = null, lapRivalBest = null, lapDoneAt = null, teleports = 0, wrecks = 0, stuckT = 0,
        maxCam = 0, maxLat = 0, offroadT = 0, airBig = 0, wasAir = false, minHull = p.health ?? 100;
      const frames = Math.round(SIM * 60);
      for (let k = 0; k < frames; k++) {
        const speed = p.vel.length();
        // -- driver --
        const look = Math.max(3, Math.round((9 + speed * 0.45) / su));
        const li = (p.trackIndex + look) % N;
        const c = t.pointAt ? t.pointAt(li, 0) : t.center[li];
        const err = wrap(Math.atan2(c.x - p.pos.x, c.z - p.pos.z) - p.heading);
        const K2 = Math.max(4, Math.round(30 / su));
        const turn = Math.abs(wrap(t.headingAt((p.trackIndex + K2) % N) - t.headingAt(p.trackIndex)));
        const vmax = clamp(Math.sqrt(34 * (30 / Math.max(0.06, turn))), 15, 60);
        g.input.analog.steer = clamp(err * 1.8, -1, 1);
        g.input.analog.throttle = speed < vmax ? 1 : 0;
        g.input.analog.brake = speed > vmax + 4 ? 1 : 0;
        g.frame();
        // -- watch --
        if (!Number.isFinite(p.pos.x + p.pos.y + p.pos.z + p.vel.x + p.vel.y + p.vel.z)) { F('NaN', 'player state non-finite'); break; }
        const gy = t.terrainHeight(p.pos.x, p.pos.z);
        if (p.pos.y < gy - 3) F('under-terrain', `y ${p.pos.y.toFixed(1)} vs ground ${gy.toFixed(1)}`);
        const cd = Math.hypot(g.camera.position.x - p.pos.x, g.camera.position.z - p.pos.z);
        if (cd > maxCam) maxCam = cd;
        const lat = Math.abs(p.lateral ?? 0);
        if (lat > maxLat) maxLat = lat;
        if (lat > 14) offroadT += 1 / 60;
        if (p.airborne && !wasAir && (p.vy ?? 0) > 4) airBig++;
        wasAir = !!p.airborne;
        if ((p.health ?? 100) < minHull) minHull = p.health ?? 100;
        if (p.alive === false) {
          wrecks++; F('wreck', `hull gone at speed ${speed.toFixed(0)}`);
          p.alive = true; p.health = p.maxHealth ?? 100; p.vel.set(0, 0, 0);
        }
        stuckT = (speed < 2) ? stuckT + 1 / 60 : 0;
        if (stuckT > 4) {
          teleports++; F('stuck', `4s under 2 u/s`);
          const ci = p.trackIndex % N, cc = t.center[ci];
          p.pos.set(cc.x, cc.y + 1, cc.z); p.heading = t.headingAt(ci);
          p.vel.set(0, 0, 0); p.vy = 0; stuckT = 0;
          if (teleports > 10) { F('abort', 'stuck >10 times'); break; }
        }
        if (lapTime === null && (p.lap ?? 0) > lap0) {
          lapTime = g.raceTime - t0;
          lapRivalBest = Math.max(...g.enemies.map((e) => (e.lap ?? 0) + (e.progress ?? 0)));
          lapDoneAt = k;
        }
        // one lap plus five seconds is the coverage contract; 78 worlds beat one long soak
        if (lapDoneAt !== null && k > lapDoneAt + 300) break;
        if (g.state !== 'race') break;
      }
      return {
        name: g.level?.name ?? t.level?.name ?? '?', N, su: +su.toFixed(2),
        lapTime: lapTime === null ? null : +lapTime.toFixed(1),
        rivalAtLap: lapRivalBest === null ? null : +lapRivalBest.toFixed(2),
        prog: +((p.lap ?? 0) - lap0 + (p.progress ?? 0)).toFixed(2),
        simT: +(g.raceTime - t0).toFixed(1), wrecks, teleports, airBig,
        maxCam: +maxCam.toFixed(0), maxLat: +maxLat.toFixed(1), offroadT: +offroadT.toFixed(1),
        minHull: +minHull.toFixed(0), state: g.state, faults,
      };
    }, SIM);
    r.errors = errors.slice(0, 3); r.recovered = [...recovered].slice(0, 3);
    rows.push({ id, ...r });
    if (r.fail) { console.log(`L${id} FAIL ${r.fail}`); }
    else console.log(`L${String(id).padStart(2)} ${r.name.padEnd(22)} lap ${r.lapTime === null ? ' none' : String(r.lapTime).padStart(5)}s`
      + `  rival@lap ${r.rivalAtLap ?? '-'}  wreck ${r.wrecks} stuck ${r.teleports} air ${r.airBig}`
      + `  cam<=${r.maxCam} lat<=${r.maxLat} hull>=${r.minHull}`
      + (r.errors.length ? `  PAGEERR ${r.errors[0]}` : '')
      + (r.recovered.length ? `  SWALLOWED ${r.recovered[0]}` : ''));
  } catch (e) {
    rows.push({ id, fail: String(e.message).slice(0, 160), errors });
    console.log(`L${id} HARNESS-FAIL ${String(e.message).split('\n')[0].slice(0, 140)}`);
  }
  page.off('pageerror', onErr); page.off('console', onCon);
}
const fs = await import('node:fs');
const out = process.env.OUT ?? `/tmp/agentdrive-${process.pid}.json`;
fs.writeFileSync(out, JSON.stringify(rows, null, 1));
console.log(`\nwrote ${out}`);
await b.close();
