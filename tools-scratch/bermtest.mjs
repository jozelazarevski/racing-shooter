/* THE START BOWL HOLDS RACERS AND RELEASES ROAMERS — both, on the same berm.
 *
 * The r273 phone shot: UNDERCITY SLIPSTREAM, 8th of 8 at 16.7 s, the car at
 * 3 km/h out on the black apron ABOVE the trench with the stick at rest. The
 * cliff clamp's low-berm exemption (written "so free-roamers can drive out")
 * never said free-roamers in code, and the start bowl runs a 1.7 u berm for
 * ~40 samples on BOTH sides — so a racer carving wide off the line, or shoved
 * wide by the pack, left the race entirely; with the throttle released no
 * automatic net fires out there (that part is deliberate — SOS is the way
 * back), so the exit itself had to close.
 *
 * This gate pins BOTH halves of the fix (`wallHere = ... || !freeRoam`):
 *   RACE  full-throttle carve-out at sample 10, both sides, stays inside
 *         wallLim (+2 u of tolerance for the crash bounce).
 *   ROAM  the same manoeuvre still gets out — the berm exemption is the way
 *         free-roamers reach the hinterland, and clamping THEM is the
 *         regression on the other side.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(300000);
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
for (const mode of ['race', 'roam']) {
  await p.goto(`${BASE}/?level=18&mode=${mode}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 180000 });
  const r = await p.evaluate(async (mode) => {
    const g = window.__game, t = g.track, pl = g.player;
    if (mode === 'race') {
      g.startRace?.();
      const f = () => new Promise((r2) => requestAnimationFrame(r2));
      for (let i = 0; i < 600 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
    }
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};
    let maxLat = 0;
    for (const side of [1, -1]) {
      const c = t.center[10];
      pl.pos.set(c.x, c.y + 1, c.z); pl.trackIndex = 10; pl.heading = t.headingAt(10);
      pl.vel.set(0, 0, 0); pl.vy = 0; pl.airborne = false; pl.alive = true; pl.health = pl.maxHealth ?? 100;
      for (let k = 0; k < 420; k++) {
        g.input.analog.throttle = 1;
        g.input.analog.steer = k < 60 ? 0 : side * 0.8;
        g.frame();
        const la = Math.abs(pl.lateral ?? 0);
        if (la > maxLat) maxLat = la;
      }
    }
    return { freeRoam: !!g.freeRoam, maxLat: +maxLat.toFixed(1), w: t.widthAt ? +t.widthAt(10).toFixed(1) : 9 };
  }, mode);
  if (mode === 'race') check('race: the trench holds at the start bowl', r.maxLat <= r.w + 2, `maxLat ${r.maxLat} vs width ${r.w}`);
  else check('roam: the berm still lets a roamer out', r.freeRoam && r.maxLat > r.w + 6, `maxLat ${r.maxLat} vs width ${r.w}`);
}
console.log(fail ? `\n${fail} FAILED` : '\nthe bowl holds racers and releases roamers');
await b.close();
process.exit(fail ? 1 : 0);
