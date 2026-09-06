/* WHO KILLS THE AGENT DRIVER? agentdrive.mjs wrecks 2-3 times a lap on most
 * worlds and hull hits 0 almost everywhere, but a wreck count is not a cause.
 * Wrap player.damage() and bucket every hull point by its caller before the
 * difficulty scale is applied — landing, wall, obstacle, gunfire — and sample
 * everyone's progress each simulated second so rival pace comes out of the
 * same run in laps/30s, measured mid-race rather than from the grid.
 *
 *   node tools-scratch/whokilled.mjs 2 3 27
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const SIM = Number(process.env.SIM ?? 90);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 800, height: 520 } });
page.setDefaultTimeout(300000);
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 90000 });
  const r = await page.evaluate(async ({ SIM, DODGE }) => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    g.startRace?.();
    const f = () => new Promise((r2) => requestAnimationFrame(r2));
    for (let i = 0; i < 600 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
    if (g.state !== 'race') return { fail: 'no race' };
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};
    // -- attribute every hull point by the code that charged it --
    const buckets = {}, events = [];
    const orig = p.damage.bind(p);
    p.damage = (amount, attacker) => {
      const line = (new Error().stack.split('\n')[2] ?? '?').replace(/^\s*at\s*/, '').replace(location.origin, '');
      const key = attacker ? `fire:${attacker.name ?? 'enemy'}` : line.replace(/.*\((.*)\)/, '$1');
      buckets[key] = (buckets[key] ?? 0) + amount;
      if (events.length < 30 && amount >= 8) events.push({ amount: +amount.toFixed(0), key, at: p.trackIndex, v: +p.vel.length().toFixed(0) });
      return orig(amount, attacker);
    };
    const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
    const clamp = (v, a, z) => Math.max(a, Math.min(z, v));
    let su = 0; for (let i = 0; i < 64; i++) { const a = t.center[(i * 37) % N], c = t.center[((i * 37) % N + 1) % N]; su += Math.hypot(c.x - a.x, c.z - a.z); }
    su = Math.max(0.5, su / 64);
    // progress samples: [t, player, bestRival, meanRival]
    const pace = [];
    let wrecks = 0, stuckT = 0, teleports = 0;
    const frames = Math.round(SIM * 60);
    for (let k = 0; k < frames; k++) {
      const speed = p.vel.length();
      const look = Math.max(3, Math.round((9 + speed * 0.45) / su));
      const li = (p.trackIndex + look) % N;
      // DODGE=1: a thumb that has seen the red ring. If a live mine sits
      // within 14 u of the path ahead, aim the pursuit point 4.5 u to the
      // side of the road away from it — the only change is WHERE the driver
      // looks, so the mine bucket's delta measures dodgeability itself.
      let aimLat = 0;
      if (DODGE) {
        for (const m of g.weapons?.mines ?? []) {
          const dx = m.pos.x - p.pos.x, dz = m.pos.z - p.pos.z;
          const ahead = dx * Math.sin(p.heading) + dz * Math.cos(p.heading);
          if (ahead < 2 || ahead > 45 || Math.hypot(dx, dz) > 45) continue;
          const side = Math.sign(dx * Math.cos(p.heading) - dz * Math.sin(p.heading)) || 1;
          aimLat = -side * 4.5;
          break;
        }
      }
      const c = t.pointAt ? t.pointAt(li, aimLat) : t.center[li];
      const err = wrap(Math.atan2(c.x - p.pos.x, c.z - p.pos.z) - p.heading);
      const K2 = Math.max(4, Math.round(30 / su));
      const turn = Math.abs(wrap(t.headingAt((p.trackIndex + K2) % N) - t.headingAt(p.trackIndex)));
      const vmax = clamp(Math.sqrt(15 * (30 / Math.max(0.06, turn))), 14, 60); // 15 = ~75% of the 4·grip budget: a driver keeps margin, a bot at 100% slides into the rails
      g.input.analog.steer = clamp(err * 1.8, -1, 1);
      g.input.analog.throttle = speed < vmax ? 1 : 0;
      g.input.analog.brake = speed > vmax + 4 ? 1 : 0;
      g.frame();
      if (k % 60 === 0) {
        const rp = g.enemies.filter((e) => e.alive).map((e) => e.progress);
        pace.push([k / 60, +p.progress.toFixed(3), +Math.max(...rp).toFixed(3),
          +(rp.reduce((a, x) => a + x, 0) / rp.length).toFixed(3)]);
      }
      if (p.alive === false) { wrecks++; p.alive = true; p.health = p.maxHealth ?? 100; p.vel.set(0, 0, 0); }
      stuckT = (speed < 2) ? stuckT + 1 / 60 : 0;
      if (stuckT > 4) {
        teleports++; const ci = p.trackIndex % N, cc = t.center[ci];
        p.pos.set(cc.x, cc.y + 1, cc.z); p.heading = t.headingAt(ci); p.vel.set(0, 0, 0); stuckT = 0;
        if (teleports > 10) break;
      }
      if (g.state !== 'race') break;
    }
    // laps/30s over the middle of the window, grid start excluded
    const mid = pace.filter((s) => s[0] >= 10);
    const span = mid.length > 1 ? mid[mid.length - 1][0] - mid[0][0] : 0;
    const rate = (i) => span > 0 ? +((mid[mid.length - 1][i] - mid[0][i]) / span * 30).toFixed(3) : null;
    return { name: g.level?.name, difficulty: g.difficulty?.id, wrecks, teleports,
      playerRate: rate(1), bestRivalRate: rate(2), meanRivalRate: rate(3),
      buckets: Object.fromEntries(Object.entries(buckets).map(([k2, v]) => [k2, +v.toFixed(0)]).sort((a, z) => z[1] - a[1])),
      events: events.slice(0, 12) };
  }, { SIM, DODGE: !!process.env.DODGE });
  console.log(`\n== L${id} ${r.name} (difficulty ${r.difficulty}) wrecks ${r.wrecks} teleports ${r.teleports}`);
  console.log(`   laps/30s  player ${r.playerRate}  bestRival ${r.bestRivalRate}  meanRival ${r.meanRivalRate}`);
  console.log('   hull spent by source (pre-scale):', JSON.stringify(r.buckets));
  for (const e of r.events ?? []) console.log(`   hit ${String(e.amount).padStart(3)} @sample ${e.at} v=${e.v}  ${e.key}`);
}
await b.close();
