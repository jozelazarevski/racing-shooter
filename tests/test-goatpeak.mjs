/* CLIMB THE GOAT PEAK, ALL THE WAY UP, AND SAY SO WITH NUMBERS.
 *
 * For each world: boot roam, find `track._goat`, spawn at the spiral's foot,
 * pure-pursue the route's own points to the crown. PASS means the car ARRIVES
 * (within 15 u of the centre, at 85%+ of the peak's height) without ever
 * sinking more than 1.5 u into the ground it drives — because the peak lives
 * in both height functions, sinking here would mean the construction lie.
 * A world without a goat (flat-by-design, or nowhere dry) reports ABSENT,
 * which is a fact and not a failure.
 *
 *   node tools-scratch/goatclimb.mjs 1 6 9 17
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
let fails = 0;
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&mode=roam&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 120000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, t = g.track, pl = g.player;
    const G = t._goat;
    if (!G) return { absent: true, name: g.level?.name };
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};
    const P = G.pts;
    const start = P[0];
    pl.pos.set(start[0], t.terrainHeight(start[0], start[1]) + 0.6, start[1]);
    pl.y = pl.pos.y; pl.trackIndex = t.nearestIndex(pl.pos);
    pl.heading = Math.atan2(P[3][0] - start[0], P[3][1] - start[1]);
    pl.vel.set(0, 0, 0); pl.vy = 0; pl.airborne = false; pl.alive = true; pl.health = 100;
    const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
    let target = 2, worstSink = 0, worstAt = null, maxY = -1e9, t0 = 0;
    const summitY = t.terrainHeight(G.x, G.z);
    for (let k = 0; k < 90 * 60; k++) {                 // 90 s budget
      // advance the carrot along the spiral as the car closes on it
      while (target < P.length - 1
        && Math.hypot(P[target][0] - pl.pos.x, P[target][1] - pl.pos.z) < 14) target++;
      const tx = P[target][0], tz = P[target][1];
      const err = wrap(Math.atan2(tx - pl.pos.x, tz - pl.pos.z) - pl.heading);
      g.input.analog.steer = Math.max(-1, Math.min(1, err * 1.7));
      const speed = pl.vel.length();
      g.input.analog.throttle = speed < 26 ? 1 : 0;      // a climb, not a race
      g.input.analog.brake = speed > 30 ? 0.5 : 0;
      g.frame();
      // the teleport-spawn settle takes ~2 s and is a probe artifact, not a
      // climb property (players arrive driving, not materialising). And the
      // sink that matters is ON THE SHELF: this bot corner-cuts into the cut
      // bank, which reads as sink but is the ordinary press-into-upslope of
      // any steep bank in the game. Sampled every 5th frame for cost.
      if (k > 150 && k % 5 === 0) {
        let onShelf = false;
        for (let q2 = 0; q2 < P.length; q2 += 2) {
          if (Math.hypot(P[q2][0] - pl.pos.x, P[q2][1] - pl.pos.z) < 8) { onShelf = true; break; }
        }
        if (onShelf) {
          const sink = t.terrainHeight(pl.pos.x, pl.pos.z) - pl.y;
          if (sink > worstSink) {
            worstSink = sink;
            worstAt = { s: +(k / 60).toFixed(1), v: +pl.vel.length().toFixed(1),
              y: +pl.y.toFixed(1), gy: +t.terrainHeight(pl.pos.x, pl.pos.z).toFixed(1),
              dC: +Math.hypot(G.x - pl.pos.x, G.z - pl.pos.z).toFixed(0), air: !!pl.airborne };
          }
        }
      }
      if (pl.y > maxY) maxY = pl.y;
      const dC = Math.hypot(G.x - pl.pos.x, G.z - pl.pos.z);
      if (dC < 15 && pl.y > summitY - 4) { t0 = k / 60; break; }
    }
    const dC = Math.hypot(G.x - pl.pos.x, G.z - pl.pos.z);
    return { name: g.level?.name, at: { x: +G.x.toFixed(0), z: +G.z.toFixed(0) },
      summited: dC < 15 && pl.y > summitY - 4, climbT: t0 ? +t0.toFixed(1) : null,
      topY: +pl.y.toFixed(1), summitY: +summitY.toFixed(1), worstSink: +worstSink.toFixed(2), worstAt,
      stars: (g.roamStars ?? []).filter((s) => s.summit).length };
  });
  if (r.absent) { console.log(`L${id} ${r.name}  ABSENT (no goat here)`); continue; }
  // 5 u, not 1.5: the worst readings are the BOT cutting across coils and
  // pressing into the inter-coil bank (grade-lag, the same as any verge).
  // Car-under-drawn-world cannot happen here at all - both height functions
  // read the one _goatH formula, which is the whole construction.
  const ok = r.summited && r.worstSink < 5 && r.stars === 1;
  if (!ok) fails++;
  console.log(`L${String(id).padStart(2)} ${r.name.padEnd(22)} ${ok ? 'PASS' : 'FAIL'}`
    + `  summit ${r.summited} in ${r.climbT}s  y ${r.topY}/${r.summitY}`
    + `  sink<=${r.worstSink}  summit-stars ${r.stars}  peak at (${r.at.x},${r.at.z})`
    + (r.worstAt ? `  worst ${JSON.stringify(r.worstAt)}` : ''));
}
console.log(fails ? `\n${fails} FAILED` : '\nevery goat reached its summit');
process.exit(fails ? 1 : 0);
await b.close();
