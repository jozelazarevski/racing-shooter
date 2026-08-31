/* RALLY_CORRIDOR_REFACTOR §17 — step-1 acceptance (shadow mode).
 *
 *   R1  drive the ribbon on all three §13 stages  every gate passes in
 *       order, the route lap counts, telemetry carries the crossings
 *   R2  cross gate 1's plane outside halfWidth    not counted; driving
 *       back through inside the width counts
 *
 * Plus the step-1 invariants the spec states in §4.2: layout counts match
 * the table, pacing (≤3 consecutive street, ≤2 consecutive open, at least
 * one of each kind), and NO RULE CHANGES — the old lap machinery still owns
 * the lap counter, so a route lap and a _cpMask lap must coexist.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const EXPECT = {
  4:  { street: 3, trail: 4, open: 5 },   // CANYON RUN   (§13)
  66: { street: 4, trail: 6, open: 2 },   // GLACIER COL
  74: { street: 5, trail: 3, open: 1 },   // IL BUDELLO
};

for (const [lvl, counts] of Object.entries(EXPECT)) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.route && window.__game.player, undefined, { timeout: 300000 });

  const r = await p.evaluate(() => {
    const g = window.__game, c = g.player, t = g.track, route = g.route;
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    for (let k = 0; k < 600 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    const out = {};
    out.kinds = route.gates.map((gt) => gt.kind);
    // pacing (§4.2): run-lengths per kind around the loop
    let worstStreet = 0, worstOpen = 0, run = 1;
    const ks = out.kinds;
    for (let i = 1; i <= ks.length; i++) {
      if (ks[i % ks.length] === ks[i - 1]) run++;
      else {
        if (ks[i - 1] === 'street') worstStreet = Math.max(worstStreet, run);
        if (ks[i - 1] === 'open') worstOpen = Math.max(worstOpen, run);
        run = 1;
      }
    }
    out.pacing = { worstStreet, worstOpen };

    // ---- R1: ride the ribbon one full lap through the REAL frame loop ----
    window.__rally?.clear?.();
    const N = t.center.length;
    route.reset(c);
    const start = route.gates[0].si;
    const ride = (from, samples) => {
      for (let s = 0; s < samples; s++) {
        const idx = (from + s) % N;
        const pt = t.pointAt(idx, 0);
        c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
        c.trackIndex = idx; c.heading = t.headingAt(idx);
        c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(20);
        c.airborne = false; c.vy = 0; c.alive = true; c.health = 100; c.invuln = 5;
        g.frame();
      }
    };
    ride((start - 8 + N) % N, N + 16);
    const dump = window.__rally?.dump?.() ?? '';
    const gateEvs = dump.split('\n').filter((l) => l.includes('"kind":"gate"'))
      .map((l) => JSON.parse(l));
    out.r1 = {
      laps: c._routeLaps ?? 0,
      passedIds: gateEvs.filter((e) => e.passed).map((e) => e.id),
      missed: gateEvs.filter((e) => !e.passed).length,
      oldLap: c.lap,                     // no-rule-change: old machinery intact
    };

    // ---- R2: cross gate 1's plane 1 u OUTSIDE halfWidth, then correctly ----
    route.reset(c);
    c._nextGate = 1;
    const gt = route.gates[1];
    const cross = (lat) => {
      const evs = [];
      for (let s = -6; s <= 6; s += 2) {
        c.pos.set(gt.x + gt.hx * s + gt.nx * lat, gt.y + 0.3,
          gt.z + gt.hz * s + gt.nz * lat);
        c.y = c.pos.y;
        const ev = route.step(c);
        if (ev) evs.push(ev);
      }
      return evs;
    };
    const wide = cross(gt.halfWidth + 1);
    const wideAdvanced = c._nextGate !== 1;
    const good = cross(0);
    out.r2 = {
      wide: wide.map((e) => e.passed), wideAdvanced,
      good: good.map((e) => e.passed), nowNext: c._nextGate,
    };
    return out;
  });

  const got = { street: 0, trail: 0, open: 0 };
  for (const k of r.kinds) got[k]++;
  check(`[${lvl}] §13 layout counts match the table`,
    got.street === counts.street && got.trail === counts.trail && got.open === counts.open,
    JSON.stringify(got));
  check(`[${lvl}] §4.2 pacing: ≤3 consecutive street, ≤2 consecutive open`,
    r.pacing.worstStreet <= 3 && r.pacing.worstOpen <= 2, JSON.stringify(r.pacing));
  const G = r.kinds.length;
  const allInOrder = r.r1.passedIds.length >= G
    && r.r1.passedIds.slice(0, G).every((id, i) => id === i);
  check(`R1 [${lvl}] riding the ribbon passes every gate in order and laps`,
    allInOrder && r.r1.laps >= 1 && r.r1.missed === 0,
    `passed ${r.r1.passedIds.length}/${G}, laps ${r.r1.laps}, missed ${r.r1.missed}`);
  check(`R1 [${lvl}] no rule changed: the old lap counter still owns laps`,
    typeof r.r1.oldLap === 'number' && r.r1.oldLap >= 1, `old lap ${r.r1.oldLap}`);
  check(`R2 [${lvl}] a crossing outside halfWidth is seen but not counted`,
    r.r2.wide.length === 1 && r.r2.wide[0] === false && !r.r2.wideAdvanced,
    JSON.stringify(r.r2.wide));
  check(`R2 [${lvl}] driving back through inside the width counts`,
    r.r2.good.includes(true) && r.r2.nowNext === 2, JSON.stringify(r.r2.good));
  check(`[${lvl}] no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await p.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe race is a list of gates through an open world');
process.exit(fail ? 1 : 0);
