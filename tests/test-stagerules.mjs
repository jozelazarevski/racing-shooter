/* CLAUDE.md v1.5 §11/§12 — the stage rules, as laws (r310, Phase 1).
 *
 *   S1  §11.1 the line lives on a straight: run-in 60 m + run-out 80 m
 *       clear of corners under 60 m radius, on the recording-E stage, the
 *       street reference and the canyon reference (generator rotation)
 *   S2  §11.5/§6.6 the nitro ceiling: held boost cannot pass the stage
 *       budget (street 160 absolute; recording E measured 205-213)
 *   S3  §11.2 nitro pickups: per-lap cap (street 1, others 2), none
 *       within 80 m of the line
 *   S4  §11.3 the validator's auto-fixes hold: no live cullable
 *       obstacle-class prop in a street corridor or a kicker landing fan
 *   S5  §6.8 buildings are in the camera probe: parked against the
 *       biggest structure in town, the boom does not sink inside it
 *
 *   node tests/test-stagerules.mjs
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (c, m, e = '') => { if (c) { pass++; console.log('PASS ', m, e); } else { fail++; console.log('FAIL ', m, e); } };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

const boot = async (lvl) => {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  p.setDefaultTimeout(300000);
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e.message)));
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
    undefined, { timeout: 300000 });
  await p.evaluate(() => {
    const g = window.__game;
    if (g.composer) g.composer.render = () => {};
    let elapsed = g.clock.elapsedTime;
    g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    g._frameBody();                                  // validator frame
  });
  return { p, errors };
};

for (const [lvl, tag] of [[59, 'CLIFF KNOT'], [74, 'IL BUDELLO'], [4, 'CANYON RUN']]) {
  const { p, errors } = await boot(lvl);
  const R = await p.evaluate(async () => {
    const g = window.__game, t = g.track, N = t.center.length, pl = g.player;
    const sampleLen = Math.max(1, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
    const rad = (i) => {
      const a = t.center[(i - 6 + N) % N], b = t.center[i % N], c = t.center[(i + 6) % N];
      const abx = b.x - a.x, abz = b.z - a.z, bcx = c.x - b.x, bcz = c.z - b.z;
      const cross = abx * bcz - abz * bcx;
      if (Math.abs(cross) < 1e-6) return 1e9;
      const ab = Math.hypot(abx, abz), bc = Math.hypot(bcx, bcz), ac = Math.hypot(c.x - a.x, c.z - a.z);
      return (ab * bc * ac) / (2 * Math.abs(cross));
    };
    let worst = 1e9;
    const outS = Math.round(80 / sampleLen), inS = Math.round(60 / sampleLen);
    for (let j = -inS; j <= outS; j += 3) worst = Math.min(worst, rad((j + N) % N));
    // S2: hold the boost 6 s on the back straight
    pl.placeAt(Math.floor(N * 0.5), 0, true);
    const v0 = 30 / 3.6 * 3.1;
    pl.speedAlong = v0; pl.vel.set(Math.sin(pl.heading) * v0, 0, Math.cos(pl.heading) * v0);
    g.input.analog.throttle = 1;
    let maxKmh = 0;
    for (let f = 0; f < 360; f++) {
      pl.nitro = 1; pl.boostTimer = 1;
      g._frameBody();
      if (!pl.airborne) maxKmh = Math.max(maxKmh, Math.hypot(pl.vel.x, pl.vel.z) * 3.1);
    }
    g.input.analog.throttle = 0; pl.boostTimer = 0;
    // S3: nitro pickups
    const guard = Math.round(80 / sampleLen);
    const nitros = g.pickups.filter((x) => x.type === 'nitro');
    const nearLine = nitros.filter((x) => Math.min(x.index, N - x.index) <= guard).length;
    // S4: live cullable obstacles in street corridors / landing fans
    const { propClassOf } = await import('./src/route.js');
    const half = (i) => t.widthAt?.(i) ?? 9;
    let streetLive = 0, fanLive = 0;
    const reachS = Math.round(((g._nitroCeilU ?? 48) * 1.9) / sampleLen);
    const fans = (t.crests ?? []).map((cr) => [
      (cr.index + Math.round(cr.len * 0.5)) % N, Math.round(cr.len * 0.5) + reachS]);
    const scan = (list, cullable) => {
      for (const it of list ?? []) {
        if (!it || it.dead || it.culled) continue;
        if (propClassOf(it) !== 'obstacle') continue;
        if (!cullable(it)) continue;
        const gi = t.nearestIndex(it, null);
        const c = t.center[gi];
        const d = Math.hypot(it.x - c.x, it.z - c.z);
        if (g.route.kindAtIndex(gi) === 'street' && d <= half(gi) + 12) streetLive++;
        for (const [from, span] of fans) {
          if ((gi - from + N) % N <= span && d <= half(gi) + 6) { fanLive++; break; }
        }
      }
    };
    scan(t.trees, (x) => !!x.parts?.length);
    scan(t.solids, (x) => x.mat === 'stone' && x.r > 0 && x.r <= 8 && x.im && x.inst !== undefined);
    const rep = (g._stageReport ?? []).map((v) => v.rule);
    return { worst: Math.round(Math.min(worst, 9999)), maxKmh: +maxKmh.toFixed(0),
      ceil: +((g._nitroCeilU ?? 0) * 3.1).toFixed(0), nitros: nitros.length,
      nearLine, streetLive, fanLive, rep,
      kind: (await import('./src/driving.js')).stageTemplate(g.level) };
  });
  const cap = R.kind === 'street' ? 1 : 2;
  ok(R.worst >= 60, `S1 [${tag}] the line lives on a straight (run-in 60 m + run-out 80 m)`,
    `worst radius ${R.worst} m`);
  ok(R.maxKmh <= R.ceil + 12,
    `S2 [${tag}] held nitro respects the stage ceiling`,
    `${R.maxKmh} km/h vs ceiling ${R.ceil} (${R.kind})`);
  ok(R.nitros <= cap && R.nearLine === 0,
    `S3 [${tag}] nitro pickups: ≤${cap} per lap, none near the line`,
    `${R.nitros} nitro pickup(s), ${R.nearLine} within 80 m of the line`);
  ok(R.streetLive === 0 && R.fanLive === 0,
    `S4 [${tag}] street corridors and kicker landing fans hold no cullable obstacle`,
    `street ${R.streetLive}, fans ${R.fanLive} (validator saw: ${R.rep.join(',') || 'clean'})`);
  ok(errors.length === 0, `[${tag}] no page errors`, errors.slice(0, 3).join(' | '));
  await p.close();
}

// ---- S5: buildings are in the camera probe (street reference) -------------
{
  const { p, errors } = await boot(74);
  const C = await p.evaluate(() => {
    const g = window.__game, t = g.track, pl = g.player;
    g.camMode = 3;                                  // CHASE: the low boom
    const big = (t.solids ?? []).filter((s) => (s.r ?? 0) >= 3 && s.r <= 20 && s.y !== -9999)
      .sort((a, b) => b.r - a.r)[0];  // building-scale: landscape cones are the terrain probe's job
    if (!big) return { none: true };
    // park just off the structure, nose away — the boom swings toward it
    const ang = Math.atan2(pl.pos.z - big.z, pl.pos.x - big.x);
    pl.placeAt(pl.trackIndex, 0, true);
    pl.pos.set(big.x + Math.cos(ang) * (big.r + 3), pl.pos.y, big.z + Math.sin(ang) * (big.r + 3));
    pl.heading = Math.atan2(big.x - pl.pos.x, big.z - pl.pos.z) + Math.PI;
    pl.vel.set(0, 0, 0);
    let worstIn = 0;
    for (let f = 0; f < 90; f++) {
      pl._wedgeT = 0; pl._lostT = 0; g._gateMissT = 0;
      g.frame();
      const cp = g.camera.position;
      const d = Math.hypot(cp.x - big.x, cp.z - big.z);
      const top = (big.y ?? t.terrainHeight(big.x, big.z)) + Math.min(14, big.r * 1.6);
      if (d < big.r - 0.5 && cp.y < top) worstIn = Math.max(worstIn, big.r - d);
    }
    return { r: +big.r.toFixed(1), worstIn: +worstIn.toFixed(1) };
  });
  if (C.none) ok(false, 'S5 the street world has a structure to test against');
  else ok(C.worstIn === 0,
    'S5 the boom never sinks inside the biggest structure in town',
    `structure r=${C.r}, deepest intrusion ${C.worstIn} u`);
  ok(errors.length === 0, 'S5 no page errors', errors.slice(0, 3).join(' | '));
  await p.close();
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
