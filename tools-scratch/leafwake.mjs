/* DOES DRIVING THROUGH THE LITTER ACTUALLY KICK LEAVES. Counting the pool is
 * hopeless — the ambient fall holds ~390 live particles and the wake adds at
 * most one per frame, inside the noise. Count the CALLS instead: wrap
 * particles.leafKick, drive, and compare against standing still. Also checks
 * a non-autumn world never calls it at all.
 *
 *   node leafwake.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 480 } });
p.setDefaultTimeout(600000);
let bad = 0;
for (const [lv, expectWake] of [[68, true], [1, false]]) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
  const r = await p.evaluate(async () => {
    const g = window.__game, pl = g.player;
    g.startRace?.();
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
    if (g.state !== 'race') throw new Error('race never started');
    if (typeof g.particles.leafKick !== 'function') throw new Error('leafKick missing');
    let calls = 0;
    const orig = g.particles.leafKick.bind(g.particles);
    g.particles.leafKick = (...a) => { calls++; return orig(...a); };
    // standing still: the wake must be silent
    for (let i = 0; i < 30; i++) { pl.vel.set(0, 0, 0); await f(); }
    const still = calls; calls = 0;
    // driving
    for (let i = 0; i < 60; i++) { if (g.input?.analog) g.input.analog.throttle = 1; await f(); }
    return { weather: g.track?.theme?.weather?.type ?? null,
      still, driving: calls, spd: +pl.vel.length().toFixed(1) };
  });
  const ok = expectWake ? (r.still === 0 && r.driving > 10) : (r.still === 0 && r.driving === 0);
  if (!ok) bad++;
  console.log(`L${lv} weather=${r.weather}  still ${r.still} calls, driving ${r.driving} calls at ${r.spd} u/s ${ok ? 'OK' : 'WRONG'}`);
}
console.log(bad ? 'FAIL: the leaf wake misfires' : 'PASS: silent at rest, firing on the move, only on shedding worlds');
await b.close();
process.exit(bad ? 1 : 0);
