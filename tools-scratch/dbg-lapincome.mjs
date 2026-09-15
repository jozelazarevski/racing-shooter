/* WHAT THE ONE-LAP RACE ACTUALLY PAYS (RALLY_RULES M-2).
 *
 * §6.1c cut races from 3 laps to 1 on long tracks and filed the consequence
 * as "per-race score and credits shrink with the shorter race; recorded, not
 * retuned, pending play". This measures the shrink instead of assuming it:
 * the SAME world, the SAME bot, driven at 1 lap and at 3, reporting the race
 * score, the race-derived credits, the flat bonuses, and the wall clock.
 *
 * The point is the MIX, not the total. raceCr scales with race length;
 * PODIUM_CR / FIRST_CLEAR_CR / SWEEP_CR do not. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVELS = process.env.LEVELS ? process.env.LEVELS.split(',').map(Number) : [1, 21];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(600000);
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 120)));

const run = async (level, laps) => {
  await p.goto(`${BASE}/?level=${level}&go=1&unlockall=1&fresh=1`,
    { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  return p.evaluate(({ laps }) => {
    const g = window.__game, pl = g.player;
    if (g.composer) g.composer.render = () => {};
    let el = g.clock.elapsedTime;
    g.clock = { getDelta: () => { el += 1 / 60; return 1 / 60; }, get elapsedTime() { return el; } };
    for (let f = 0; f < 400 && g.state !== 'race'; f++) { g.countdown = 0.01; g._frameBody(); }
    const score0 = g.score ?? 0;
    // THE PLAYER IS DRIVEN THROUGH THE GAME'S OWN INPUT, not by calling
    // step() beside the frame: _frameBody steps the car from input.analog,
    // so a direct step() double-integrates and the frame overwrites it.
    const N = g.track.center.length;
    let frames = 0;
    while (g.state === 'race' && frames < 108000) {
      g.lapsTotal = laps;                     // re-asserted: the one variable
      const t = g.track, i = pl.trackIndex;
      const aim = t.center[(i + 12) % N];
      const dx = aim.x - pl.pos.x, dz = aim.z - pl.pos.z;
      let d = Math.atan2(dx, dz) - pl.heading;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      g.input.analog.steer = Math.max(-1, Math.min(1, d * 1.6));
      g.input.analog.throttle = 1;
      g.input.analog.brake = 0;
      g._frameBody();
      frames++;
    }
    const rows = {};
    for (const row of document.querySelectorAll('#cb-rows .cb-row')) {
      const k = (row.querySelector('span')?.textContent ?? '?').trim();
      const v = Number((row.querySelector('b')?.textContent ?? '0').replace(/[^0-9-]/g, ''));
      if (v) rows[k] = (rows[k] ?? 0) + v;
    }
    return { world: g.level?.name, laps, finished: g.state !== 'race',
      lapsTotal: g.lapsTotal, lap: pl.lap,
      raceScore: Math.round((g.score ?? 0) - score0), raceSecs: +(frames / 60).toFixed(1),
      place: pl.place ?? null, rows };
  }, { laps });
};

for (const L of LEVELS) {
  const a = await run(L, 1), b = await run(L, 3);
  console.log(`\n${a.world}`);
  for (const r of [a, b]) {
    const flat = Object.entries(r.rows)
      .filter(([k]) => !/RACE SCORE|TOTAL/i.test(k))
      .reduce((s, [, v]) => s + v, 0);
    const race = Object.entries(r.rows)
      .filter(([k]) => /RACE SCORE/i.test(k)).reduce((s, [, v]) => s + v, 0);
    console.log(`  ${r.laps} lap${r.laps > 1 ? 's' : ''}: score ${String(r.raceScore).padStart(6)}`
      + `  ${String(r.raceSecs).padStart(6)} s  P${r.place}  finished ${r.finished}`
      + `  raceCr ${String(race).padStart(5)}  flat ${String(flat).padStart(5)}`
      + `  variable share ${race + flat ? Math.round(race / (race + flat) * 100) : 0}%`);
    console.log(`     ${JSON.stringify(r.rows)}`);
  }
}
await browser.close();
