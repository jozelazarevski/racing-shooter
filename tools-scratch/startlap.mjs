/* DOES THE START LINE SCOLD YOU FOR CROSSING IT?
 *
 * The grid is at `gridSlot(0).index` = N-10, i.e. BEHIND the line, so the first
 * thing every race does is cross it. `checkLap` reads that as a lap attempt
 * with no gates collected and sets `_missedCP`, which vehicles.js:4459 turns
 * into a full-screen "CHECKPOINT MISSED — LAP NOT COUNTED". Measured per world:
 * the sim time at which the banner fires, and the lap counter either side.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
let bad = 0, n = 0;
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};
    // WATCH THE BANNER, NOT THE FLAG. `_missedCP` is cleared in the same frame
    // it is read, so polling it between frames misses it: hook `centerMsg`.
    const msgs = [];
    const real = g.hud.centerMsg?.bind(g.hud);
    g.hud.centerMsg = (s) => { msgs.push({ s, t: +g.raceTime.toFixed(2), idx: p.trackIndex, lap: p.lap }); return real?.(s); };
    const start = { idx: p.trackIndex, lap: p.lap, N };
    for (let k = 0; k < 1500; k++) {              // 25 s
      const aim = t.center[(p.trackIndex + 10) % N];
      let want = Math.atan2(aim.x - p.pos.x, aim.z - p.pos.z) - p.heading;
      while (want > Math.PI) want -= 2 * Math.PI;
      while (want < -Math.PI) want += 2 * Math.PI;
      const steer = Math.max(-1, Math.min(1, want * 2));
      g.input.analog.steer = steer;
      g.input.analog.throttle = Math.max(0.35, 1 - Math.abs(steer) * 0.8);
      g.frame();
    }
    // THE CONTROL. A fix that silences the banner has to be shown NOT to have
    // silenced the real one, so cut the lap on purpose: drop the car back to
    // 88% of the lap with no gates collected and drive it over the line again.
    // This must still be scolded, and must still refuse the lap.
    const before = msgs.length;
    p._cpMask = 0; p._midCP = false;
    p.placeAt(Math.round(N * 0.88), 0, true);
    const lapBefore = p.lap;
    for (let k = 0; k < 900; k++) {
      const aim = t.center[(p.trackIndex + 10) % N];
      let want = Math.atan2(aim.x - p.pos.x, aim.z - p.pos.z) - p.heading;
      while (want > Math.PI) want -= 2 * Math.PI;
      while (want < -Math.PI) want += 2 * Math.PI;
      const steer = Math.max(-1, Math.min(1, want * 2));
      g.input.analog.steer = steer;
      g.input.analog.throttle = Math.max(0.35, 1 - Math.abs(steer) * 0.8);
      g.frame();
    }
    const control = { fired: msgs.slice(before).some((m) => /CHECKPOINT MISSED/.test(m.s)),
      lapMoved: p.lap !== lapBefore };
    return { name: t.level?.name, start, msgs: msgs.slice(0, before), control, lap: p.lap };
  });
  n++;
  const miss = r.msgs.filter((m) => /CHECKPOINT MISSED/.test(m.s));
  if (miss.length) bad++;
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} grid idx ${r.start.idx}/${r.start.N}  `
    + (miss.length
      ? `SCOLDED at t=${miss[0].t}s (idx ${miss[0].idx}, lap ${miss[0].lap})`
      : 'no false scolding')
    + `   |  CONTROL cut lap: ${r.control.fired ? 'scolded (right)' : 'SILENT (WRONG)'}`
    + `, lap counter ${r.control.lapMoved ? 'MOVED (WRONG)' : 'held (right)'}`);
}
console.log(`\n===== ${bad} of ${n} worlds scold the driver for the start-line crossing =====`);
await b.close();
