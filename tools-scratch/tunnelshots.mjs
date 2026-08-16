/* GAMEPLAY SHOTS OF A BORE, DRIVEN RATHER THAN POSED.
 *
 * Three frames per tunnel, captured while the car is actually moving through
 * it under throttle and steering — approach with the portal ahead, mid-bore
 * under the lamps, and the moment it comes out the far end. A posed camera
 * would not show what the chase camera does inside a tube (`tunnelAt` gives it
 * a ceiling), and that is half of what a tunnel screenshot is for.
 *
 *   node tools-scratch/tunnelshots.mjs 48 7 22
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const OUT = process.env.OUT ?? '/tmp';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1000, height: 620 } });
page.setDefaultTimeout(300000);

// A BURST OF PHYSICS IS NOT A DRIVEN FRAME. Stepping the car to the target in
// one `evaluate` and then waiting for the renderer gives a chase camera still
// pointed where the car USED to be, and the game's own rAF keeps driving it
// with no input in the meantime — which is how the first attempt produced a
// picture of a car leaving the road sideways. Step in small chunks and let the
// page draw between them, so the camera follows and the steering keeps working.
const driveChunked = async (spec, chunks = 60) => {
  let r = await drive({ ...spec, steps: 1 });
  for (let k = 0; k < chunks; k++) {
    r = await drive({ ...spec, from: null, steps: 6 });
    if (r.done) break;
    await page.waitForTimeout(24);
  }
  return r;
};

// place the car and drive it forward until `stop(i, inside)` says to hold
const drive = async (spec) => page.evaluate(({ boreIdx, from, mode, steps }) => {
  const g = window.__game, t = g.track, c = g.player, N = t.center.length;
  g.state = 'race';
  const bore = t._tunnels[boreIdx];
  if (from != null) {
    const s = (bore.s + from + N) % N, p = t.center[s], tan = t.tan[s];
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    c.pos.set(p.x, p.y + 0.4, p.z); c.y = c.pos.y;
    c.heading = t.headingAt(s);
    c.vel.set(tan.x * 24, 0, tan.z * 24);
    c.trackIndex = s;
    if (c.mesh) c.mesh.position.copy(c.pos);
  }
  // IN SAMPLES, NOT METRES, IS THE WRONG UNIT FOR A CAMERA. segLen runs 1.3 to
  // 3.0 across the roster, so a fixed sample offset is 9 u before the portal on
  // GLACIAL PASS and 21 u on DOLOMITI — and at 9 u the chase camera is still
  // inside the flank the ridge raises beside the bore, which photographs as a
  // screen full of rock. Hold the shot a fixed DISTANCE out instead.
  const back = Math.round(26 / t.segLen);
  const target = mode === 'approach' ? bore.s - back
    : mode === 'inside' ? Math.round(bore.s + (bore.e - bore.s) * 0.45)
      : bore.e + 6;
  const goal = ((target % N) + N) % N;
  let done = false;
  for (let k = 0; k < (steps ?? 6); k++) {
    const i = t.nearestIndex(c.pos, c.trackIndex);
    if (i >= goal && i < bore.e + 60) { done = true; break; }
    const aim = (i + 6) % N, a = t.center[aim];
    const want = Math.atan2(a.x - c.pos.x, a.z - c.pos.z);
    let d = want - c.heading;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    // hold a steady pace rather than full throttle: a car pinned at maxSpeed
    // is through a 78 u bore in a second and a half and the shot is a blur
    const sp = Math.hypot(c.vel.x, c.vel.z);
    c.step(1 / 60, { throttle: sp > 26 ? 0 : 1, brake: 0,
      steer: Math.max(-1, Math.min(1, d * 1.9)), drift: false, hold: false });
  }
  const at = t.tunnelAt(c.pos, c.trackIndex);
  return { name: t.level?.name, i: t.nearestIndex(c.pos, c.trackIndex),
    bore: `${bore.s}-${bore.e}`, inside: !!at, done,
    speed: +Math.hypot(c.vel.x, c.vel.z).toFixed(1) };
}, spec);

for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });
  const n = await page.evaluate(() => (window.__game.track._tunnels ?? []).length);
  if (!n) { console.log(`${id}: no bore`); continue; }
  for (const [mode, from] of [['approach', -70], ['inside', null], ['out', null]]) {
    const r = await driveChunked({ boreIdx: 0, from, mode });
    await page.waitForTimeout(500);
    const f = `${OUT}/t${id}-${mode}.png`;
    await page.screenshot({ path: f });
    console.log(`${f}  ${r.name} bore ${r.bore} at sample ${r.i} `
      + `${r.inside ? 'INSIDE the bore' : 'outside'} at ${r.speed} u/s`);
  }
}
await b.close();
