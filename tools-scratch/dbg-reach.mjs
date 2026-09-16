/* W-EDGE-01a, L-3: DERIVE THE BAND, DO NOT PICK IT.
 *
 * The patch's own acceptance is "deliberate ram tests at the known spots at
 * 250 km/h keep the car recoverable". So the honest lateral band is HOW FAR
 * A CAR ACTUALLY REACHES sideways once it leaves the road at racing speed —
 * not a number chosen to make the audit report a comfortable count.
 *
 * At each sampled station: put the car on the line at `kmh`, steer full lock
 * to one side, and record the maximum lateral distance from the road it
 * reaches before it stops, falls, or is rescued. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 21);
const KMH = Number(process.env.KMH ?? 250);
const SAMPLES = Number(process.env.SAMPLES ?? 16);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(900000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,
  { waitUntil: 'load', timeout: 900000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 900000 });
const r = await p.evaluate(({ S9, KMH9 }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 500 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const c = g.player;
  const runs = [];
  for (let s = 0; s < S9; s++) {
    const i = Math.round((s + 0.5) * N / S9) % N;
    for (const side of [1, -1]) {
      const c0 = t.center[i], c1 = t.center[(i + 2) % N];
      c.placeAt(i, 0, true);
      c.alive = true; c.health = c.maxHealth; c.mesh.visible = true;
      const h = Math.atan2(c1.x - c0.x, c1.z - c0.z);
      c.heading = h;
      const v = KMH9 / 3.6;
      c.vel.set(Math.sin(h) * v, 0, Math.cos(h) * v);
      c.speedAlong = v;
      // let the seat settle before measuring: placeAt seats on the road and
      // the first frames resolve onto the real ground. Counting those as a
      // fall reported 20 of 24 "falls" at frame 0, which was the harness.
      for (let k = 0; k < 12; k++) {
        g.input.analog.throttle = 1; g.input.analog.steer = 0; g.frame();
      }
      const startY = c.pos.y;
      let maxLat = 0, fell = false, frames = 0;
      for (let k = 0; k < 300; k++) {
        g.input.analog.throttle = 1; g.input.analog.steer = side; g.input.analog.brake = 0;
        g.frame();
        frames = k;
        const d = t._distToTrack ? t._distToTrack(c.pos.x, c.pos.z) : 0;
        const lat = Math.max(0, d - t.widthAt(c.trackIndex));
        if (lat > maxLat) maxLat = lat;
        // measured against the ROAD at the car's own station, not the seat
        const roadY = t.center[c.trackIndex].y;
        if (k > 10 && c.pos.y < roadY - 8) { fell = true; break; }
        if (Math.hypot(c.vel.x, c.vel.z) < 2) break;
        if (!c.alive) break;
      }
      runs.push({ i, side, reach: +maxLat.toFixed(1), fell, frames });
    }
  }
  const reaches = runs.map((x) => x.reach).sort((a, b) => a - b);
  const q = (f) => reaches[Math.min(reaches.length - 1, Math.floor(reaches.length * f))];
  return { world: g.level?.name, kmh: KMH9, runs: runs.length,
    reach_p50: q(0.5), reach_p90: q(0.9), reach_max: reaches[reaches.length - 1],
    fellCount: runs.filter((x) => x.fell).length,
    worst: runs.sort((a, b) => b.reach - a.reach).slice(0, 6) };
}, { S9: SAMPLES, KMH9: KMH });
console.log(JSON.stringify(r, null, 1));
await browser.close();
