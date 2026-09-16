/* WHAT DOES THE RIVAL AI ACTUALLY DO BADLY?
 *
 * "The AI needs to be smarter in driving. Needs to make sure it feels
 * intelligent." Before changing a line of it: EnemyCar already has a
 * precomputed racing line, a physics braking model (vMax = sqrt(aLat/k)),
 * per-driver corner skill, deliberate blocking, overtaking, slipstream
 * awareness, hazard avoidance and staged stuck-recovery. That is not a dumb
 * driver on paper, so "feels dumb" is a report about behaviour that has to be
 * found, not a request to add more features to a list.
 *
 * This drives a real race and counts the things a watching player would call
 * stupid, each one separately, so a fix can be aimed rather than sprayed:
 *
 *   wallT       seconds spent grinding a barrier
 *   stallN      how often a rival sits under 4 u/s while alive and racing
 *   offroadT    seconds with a wheel outside the carriageway
 *   pileN       frames with 3+ rivals inside 6 u of each other (start scrums)
 *   reverseT    seconds driving backwards along the lap
 *   yawJerk     mean |change in heading| per second — the twitch that reads
 *               as a car that cannot decide where it is going
 *   gapVar      spread of rival progress: a field that never separates looks
 *               like a train on rails rather than eight drivers
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const WORLDS = (process.env.WORLDS ?? '1,3,10,19').split(',').map(Number);
const SECS = Number(process.env.SECS ?? 60);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(600000);

console.log(`world                 wallT  stalls  offroadT  pileN  revT  yawJerk  gapVar`);
for (const lvl of WORLDS) {
  await page.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
    undefined, { timeout: 600000 });
  const r = await page.evaluate(async (SECS) => {
    const g = window.__game;
    const DT = 1 / 60;
    const N = Math.round(SECS / DT);
    // FIXED STEP, because this page runs ~2.5 real steps per second under
    // swiftshader and a wall-clock probe would measure a tenth of the race.
    const prevYaw = g.enemies.map((e) => e.heading);
    const acc = { wallT: 0, stallN: 0, offroadT: 0, pileN: 0, revT: 0, yaw: 0, samples: 0 };
    const wasStalled = g.enemies.map(() => false);
    for (let i = 0; i < N; i++) {
      for (const e of g.enemies) e.update(DT);
      g.raceTime += DT;
      for (let k = 0; k < g.enemies.length; k++) {
        const e = g.enemies[k];
        if (!e.alive) continue;
        acc.samples++;
        const v = Math.hypot(e.vel.x, e.vel.z);
        const halfW = g.track.widthAt?.(e.trackIndex) ?? 9;
        if (Math.abs(e.lateral ?? 0) > halfW - 0.6) acc.wallT += DT;
        if (Math.abs(e.lateral ?? 0) > halfW + 1) acc.offroadT += DT;
        if (e.speedAlong < -1) acc.revT += DT;
        const st = v < 4;
        if (st && !wasStalled[k]) acc.stallN++;
        wasStalled[k] = st;
        let d = e.heading - prevYaw[k];
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        acc.yaw += Math.abs(d);
        prevYaw[k] = e.heading;
      }
      // pack density
      let close = 0;
      for (let a = 0; a < g.enemies.length; a++) {
        for (let b = a + 1; b < g.enemies.length; b++) {
          const A = g.enemies[a], B = g.enemies[b];
          if (!A.alive || !B.alive) continue;
          if ((A.pos.x - B.pos.x) ** 2 + (A.pos.z - B.pos.z) ** 2 < 36) close++;
        }
      }
      if (close >= 3) acc.pileN++;
    }
    const prog = g.enemies.filter((e) => e.alive).map((e) => e.progress);
    const mean = prog.reduce((a, b) => a + b, 0) / Math.max(1, prog.length);
    const gapVar = Math.sqrt(prog.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, prog.length));
    return { name: g.level.name,
      wallT: +acc.wallT.toFixed(1), stallN: acc.stallN, offroadT: +acc.offroadT.toFixed(1),
      pileN: acc.pileN, revT: +acc.revT.toFixed(1),
      yawJerk: +(acc.yaw / Math.max(1, acc.samples) / DT).toFixed(2),
      gapVar: +gapVar.toFixed(3) };
  }, SECS);
  console.log(`${r.name.padEnd(20)} ${String(r.wallT).padStart(6)} ${String(r.stallN).padStart(7)}`
    + ` ${String(r.offroadT).padStart(9)} ${String(r.pileN).padStart(6)} ${String(r.revT).padStart(5)}`
    + ` ${String(r.yawJerk).padStart(8)} ${String(r.gapVar).padStart(7)}`);
}
await browser.close();
