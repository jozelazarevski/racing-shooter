/* YOU CANNOT DRIVE INTO A MOUNTAIN.
 *
 * Reported plainly: "I can still enter the mountains instead of hitting them
 * or climbing them. I just enter."
 *
 * Two faults, and the second is the one that mattered.
 *
 *   The collider was r = w * 0.3 against a cone drawn with a base of w / 2, so
 *   30-86 u of the visible rock had nothing in it.
 *
 *   And it was skipped anyway. The solid height gate was a flat +/-6 u around
 *   the collider's own y — right for a boulder, wrong for a massif cone that
 *   is 110-360 u tall and stands on sloping highland. By the time the car had
 *   climbed toward one, its height differed from the cone's BASE by far more
 *   than 6, and the whole collider was skipped.
 *
 * So this drives at the mountains, from outside, at speed, and asks where the
 * car ended up. Nothing here is about how it feels to hit one — only that the
 * rock is there at all.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVELS = (process.env.LEVELS ?? '20,21,5,57').split(',');

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

for (const lv of LEVELS) {
  const R = await page.evaluate(async (lvl) => {
    const g = window.__game;
    const { LEVELS } = await import('./src/track.js');
    const L = LEVELS.find((x) => x.id === +lvl);
    if (!L) return null;
    g.state = 'title'; g.editScene = null;
    g.swapLevel(L, true, null);
    // A MOUNTAIN IS NARROWER AT THE TOP, so "how far inside it did the car
    // finish" has to be asked at the car's own height. The cones taper now
    // (`Track._formProfile`, `solidRadiusAt`); measured against the base
    // radius instead, a car that has simply climbed the foot of the flank
    // reads as 2.3 u INSIDE the rock, which is what this test caught on
    // TREMOLA the day the taper landed. Same function the game uses, so the
    // two cannot describe different mountains.
    const { solidRadiusAt } = await import('./src/vehicles.js');
    const t = g.track, p = g.player;
    if (!t.T.massif) return { name: g.level.name, none: true };

    // the massif cones, recovered from the solids the builder registered
    const cones = (t.solids || []).filter((s) => s.h !== undefined && s.mat === 'stone');
    const out = { name: g.level.name, cones: cones.length, runs: 0, entered: 0,
      worstDepth: 0, stopped: 0 };
    if (!cones.length) return out;

    const step = (n) => {
      for (let i = 0; i < n; i++) {
        p.update(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false,
          fire: false, justPressed: () => false });
      }
    };

    for (const c of cones.slice(0, 6)) {
      // start 90 u out from the rim of the collider, aimed dead at the middle
      const a = Math.atan2(c.z, c.x);
      const sx = c.x + Math.cos(a) * (c.r + 90);
      const sz = c.z + Math.sin(a) * (c.r + 90);
      p.alive = true; p.health = p.maxHealth; p.mesh.visible = true;
      p.respawnTimer = 0; p.invuln = 999;
      g.state = 'race';
      p.pos.set(sx, t.terrainHeight(sx, sz), sz);
      p.y = p.pos.y;
      p.vel.set(0, 0, 0); p.speed = 0; p.airborne = false;
      // point it at the cone's centre and hold the throttle down
      p.heading = Math.atan2(-(c.x - sx), -(c.z - sz));
      p.trackIndex = t.nearestIndex(p.pos);
      step(420);                                   // 7 s flat out
      const d = Math.hypot(p.pos.x - c.x, p.pos.z - c.z);
      out.runs++;
      // how far INSIDE the collider did it finish, at the height it is at?
      const depth = solidRadiusAt(c, p.pos.y) - d;
      if (depth > 2) { out.entered++; out.worstDepth = Math.max(out.worstDepth, depth); }
      else out.stopped++;
    }
    out.worstDepth = +out.worstDepth.toFixed(1);
    p.invuln = 0;
    g.state = 'title';
    return out;
  }, lv);

  if (!R) { ok(false, `level ${lv} exists`); continue; }
  if (R.none) { console.log(`NOTE  ${R.name}: no massif on this world`); continue; }
  console.log(`\n--- ${R.name}: ${R.cones} peaks, ${R.runs} runs at them ---`);
  ok(R.cones > 0, `${R.name}: the peaks register colliders`, R.cones);
  ok(R.entered === 0,
    `${R.name}: a car driven flat out at a mountain does not get inside it`,
    `${R.entered}/${R.runs} entered, deepest ${R.worstDepth} u past the rock face`);
}

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
