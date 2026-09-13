/* r425: HOW FAR DOES A SEATED CAR MOVE WHILE NOBODY TOUCHES IT?
 *
 * r424 fixed WHERE the reset puts the car. This asks what happens next. Two
 * runs disagreed: the gate saw a car go from a 1.54 u seat to 3.97 (off a
 * 3.04 u road), a later run saw worst drift 0.27/-0.57 u. So it varies, and
 * a single sample cannot characterise it — REPEAT and report the spread.
 *
 * No claim until the numbers are in.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8921';
const LEVEL = process.env.LEVEL ?? '74';
const REPS = Number(process.env.REPS ?? 8);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
const errors = [];
p.on('pageerror', (e) => errors.push(String(e.message)));
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });

const R = await p.evaluate(async (reps) => {
  const g = window.__game;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
              get elapsedTime() { return elapsed; } };
  const pl = g.player, N = g.track.center.length;
  const w = [];
  for (let i = 0; i < N; i++) w.push(Number(g.track.widthAt ? g.track.widthAt(i) : 9));
  const minIdx = w.indexOf(Math.min(...w));
  const out = { world: g.level?.name, minHalf: +Math.min(...w).toFixed(2), runs: [] };

  for (let rep = 0; rep < reps; rep++) {
    g.state = 'race'; g.deaths = 0;
    pl.outOfHulls = false; pl.alive = true; pl.health = pl.maxHealth;
    pl.placeAt(minIdx, 8, true);
    for (let f = 0; f < 20; f++) g._frameBody();
    pl.invuln = 0; pl._gridInvuln = false;
    pl.damage(99999, null, true);
    let seat = null, seatIdx = null, worst = 0, offRoadFrames = 0, endLat = 0;
    // 7 of 8 runs the car does not move at all; the outlier travelled 37
    // stations (~148 m). No camber does that, so record WHAT WAS NEAR IT and
    // whether it was still invulnerable when it first moved.
    let firstMove = null;
    for (let f = 0; f < 700; f++) {
      g._frameBody();
      if (seat === null && pl.alive) { seat = Math.abs(pl.lateral ?? 0); seatIdx = pl.trackIndex; }
      if (seat !== null) {
        const lat = Math.abs(pl.lateral ?? 0);
        const half = Number(g.track.widthAt ? g.track.widthAt(pl.trackIndex) : 9);
        if (Math.abs(lat - seat) > Math.abs(worst)) worst = lat - seat;
        if (lat > half) offRoadFrames++;
        endLat = lat;
        if (firstMove === null && Math.abs(pl.trackIndex - seatIdx) >= 2) {
          let near = Infinity, who = null;
          for (const e of (g.enemies ?? [])) {
            if (!e.alive) continue;
            const d = Math.hypot(e.mesh.position.x - pl.mesh.position.x,
                                 e.mesh.position.z - pl.mesh.position.z);
            if (d < near) { near = d; who = e.name ?? 'rival'; }
          }
          firstMove = { atFrame: f, sinceSeatS: +((f) / 60).toFixed(2),
            nearestRivalM: +near.toFixed(1), who,
            invulnLeft: +(pl.invuln ?? 0).toFixed(2) };
        }
      }
    }
    out.runs.push({ seat: +(seat ?? 0).toFixed(2), seatIdx,
      drift: +worst.toFixed(2), endLat: +endLat.toFixed(2),
      offRoadFrames, movedIdx: pl.trackIndex - seatIdx, firstMove });
  }
  return out;
}, REPS);
await browser.close();
console.log(`${R.world}  narrowest half ${R.minHalf} u  — ${R.runs.length} identical resets`);
for (const r of R.runs) {
  const fm = r.firstMove
    ? `  MOVED at +${r.firstMove.sinceSeatS}s, nearest rival ${r.firstMove.nearestRivalM} m (${r.firstMove.who}), invuln left ${r.firstMove.invulnLeft}s`
    : '';
  console.log(`  seat ${String(r.seat).padStart(5)} @${String(r.seatIdx).padStart(3)}  drift ${String(r.drift).padStart(6)} u  end ${String(r.endLat).padStart(5)}  offRoad ${String(r.offRoadFrames).padStart(3)} frames  idx moved ${r.movedIdx}${fm}`);
}
const d = R.runs.map((r) => Math.abs(r.drift));
console.log(`drift: min ${Math.min(...d).toFixed(2)}  max ${Math.max(...d).toFixed(2)}  mean ${(d.reduce((a, b) => a + b, 0) / d.length).toFixed(2)} u`);
console.log(`runs that ended off the road: ${R.runs.filter((r) => r.offRoadFrames > 0).length} of ${R.runs.length}`);
if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 3));
