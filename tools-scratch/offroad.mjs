/* LEAVE THE ROAD AND SEE WHAT THROWS YOU. The reported launch happened off
 * the racing line on a grass bank, which no line-holding driver ever visits.
 * Drive off deliberately, at speed, all round the lap, and record every
 * departure from the ground with where and how hard. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const TAG = process.env.TAG ?? '';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
let worstAll = null, totBig = 0;
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 }).then(()=>1).catch(()=>0);
  if (!ok) { console.log(`SKIP ${id}`); continue; }
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length, p = g.player;
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};
    let big = 0, air = 0, worst = null, wasAir = false;
    // start each excursion from a fresh point on the lap, drive out and back
    for (let seg = 0; seg < 24; seg++) {
      const start = Math.floor((seg / 24) * N);
      const c = t.center[start];
      p.pos.set(c.x, c.y + 1.0, c.z);
      p.trackIndex = start; p.heading = t.headingAt(start);
      p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false; p.y = c.y;
      p.alive = true; p.health = p.maxHealth ?? 100;
      const side = seg % 2 ? 1 : -1;
      for (let k = 0; k < 180; k++) {          // 3 s per excursion
        g.input.analog.throttle = 1;
        // drive out across the verge for a second, then straighten
        g.input.analog.steer = k < 45 ? side * 0.55 : (k < 90 ? -side * 0.35 : 0);
        g.frame();
        if (p.airborne && !wasAir) {
          air++;
          const vy = p.vy ?? 0;
          if (vy > 4) {
            big++;
            if (!worst || vy > worst.vy) worst = { vy: +vy.toFixed(1),
              lat: +(p.lateral ?? 0).toFixed(1), ti: p.trackIndex, seg };
          }
        }
        wasAir = !!p.airborne;
      }
    }
    return { name: t.level?.name ?? '?', air, big, worst };
  });
  totBig += r.big;
  if (r.worst && (!worstAll || r.worst.vy > worstAll.vy)) worstAll = { ...r.worst, w: r.name };
  console.log(`${TAG} ${String(id).padStart(2)} ${r.name.padEnd(20)} ${String(r.air).padStart(4)} departures   `
    + `${String(r.big).padStart(3)} HARD (vy>4)`
    + (r.worst ? `   worst vy ${r.worst.vy} at lateral ${r.worst.lat}, sample ${r.worst.ti}` : ''));
}
console.log(`\n===== ${totBig} hard launches off the racing line` + (worstAll
  ? `; worst vy ${worstAll.vy} on ${worstAll.w} at lateral ${worstAll.lat} =====` : ' ====='));
await b.close();
