/* WHAT A RACE ACTUALLY PAYS, PER WORLD, IN SHIPPED CONFIGURATION (M-2).
 *
 * The lap A/B established that shortening a race halves the share of the
 * payout that comes from driving (PINE VALLEY: 57% at 3 laps, 29% at 1).
 * It also turned up something the lap rule cannot explain — PINE scored
 * 3.67 points per second and FALKEN RIDGE 0.76, a 5x spread — so this
 * censuses the shipped lap count across a spread of worlds and reports the
 * rate, not just the total. Two worlds and one bot is a signal; this is the
 * map. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVELS = process.env.LEVELS ? process.env.LEVELS.split(',').map(Number)
  : [0, 1, 5, 12, 21, 30, 41, 52, 63, 71];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(600000);
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 120)));
const rows = [];
for (const L of LEVELS) {
  await p.goto(`${BASE}/?level=${L}&go=1&unlockall=1&fresh=1`,
    { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  rows.push(await p.evaluate(() => {
    const g = window.__game, pl = g.player;
    if (g.composer) g.composer.render = () => {};
    let el = g.clock.elapsedTime;
    g.clock = { getDelta: () => { el += 1 / 60; return 1 / 60; }, get elapsedTime() { return el; } };
    for (let f = 0; f < 400 && g.state !== 'race'; f++) { g.countdown = 0.01; g._frameBody(); }
    const score0 = g.score ?? 0, laps = g.lapsTotal, len = Math.round(g.track.length);
    const N = g.track.center.length;
    let frames = 0;
    while (g.state === 'race' && frames < 108000) {
      const t = g.track, i = pl.trackIndex;
      const aim = t.center[(i + 12) % N];
      const dx = aim.x - pl.pos.x, dz = aim.z - pl.pos.z;
      let d = Math.atan2(dx, dz) - pl.heading;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      g.input.analog.steer = Math.max(-1, Math.min(1, d * 1.6));
      g.input.analog.throttle = 1; g.input.analog.brake = 0;
      g._frameBody(); frames++;
    }
    const cb = {};
    for (const row of document.querySelectorAll('#cb-rows .cb-row')) {
      const k = (row.querySelector('span')?.textContent ?? '?').trim();
      const v = Number((row.querySelector('b')?.textContent ?? '0').replace(/[^0-9-]/g, ''));
      if (v) cb[k] = (cb[k] ?? 0) + v;
    }
    const raceCr = Object.entries(cb).filter(([k]) => /RACE SCORE/i.test(k))
      .reduce((s, [, v]) => s + v, 0);
    const total = Object.entries(cb).filter(([k]) => /TOTAL/i.test(k))
      .reduce((s, [, v]) => s + v, 0);
    return { world: g.level?.name, laps, lenU: len,
      score: Math.round((g.score ?? 0) - score0), secs: +(frames / 60).toFixed(0),
      rank: g.playerRank ?? null, raceCr, total, finished: g.state !== 'race', cb };
  }));
}
console.log('world                laps  len    secs  score  pts/s  raceCR  total  CR/min  drive%');
for (const r of rows) {
  const rate = r.secs ? (r.score / r.secs) : 0;
  const crMin = r.secs ? (r.total / (r.secs / 60)) : 0;
  const drive = r.total ? Math.round(r.raceCr / r.total * 100) : 0;
  console.log(`${(r.world ?? '?').padEnd(20)} ${String(r.laps).padStart(3)}`
    + ` ${String(r.lenU).padStart(6)} ${String(r.secs).padStart(6)} ${String(r.score).padStart(6)}`
    + ` ${rate.toFixed(2).padStart(6)} ${String(r.raceCr).padStart(7)} ${String(r.total).padStart(6)}`
    + ` ${crMin.toFixed(0).padStart(7)} ${String(drive).padStart(6)}%`);
}
await browser.close();
