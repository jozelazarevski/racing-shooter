/* WALLS ARE SOLID — the Law of Solidity, for masonry.
 *
 * A wall is a continuous barrier. Registered as a row of circle colliders
 * (one per block, 1.2 u for a 3.4 u block) it was not: driven head-on at a
 * GOTTHARD parapet, four runs in six went straight through and one finished
 * parked on top of it. Reported as "walls like this need to be not
 * penetrable, now I can just go into it and drive up on top of it".
 *
 * This drives the player at real wall blocks on every world that builds
 * masonry and fails if the car ends up past the wall line or on the coping.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
// one world per masonry family: alpine parapets, cobbled pass + stone bridge,
// and a world whose kit scatters dry-stone field walls
const WORLDS = [19, 20, 46];

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

for (const lv of WORLDS) {
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await page.goto(`${BASE}/?level=${lv}&go=1&unlockall=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });

  const R = await page.evaluate(async () => {
    const g = window.__game, t = g.track;
    g.state = 'race';
    const out = { level: t.level.name, barriers: (t.barriers || []).length, runs: [] };
    if (!out.barriers) return out;
    const raf = () => new Promise((r) => requestAnimationFrame(r));
    const pl = g.player;
    const step = Math.max(1, Math.floor(t.barriers.length / 5));
    for (let bi = 0; bi < t.barriers.length && out.runs.length < 5; bi += step) {
      const w = t.barriers[bi];
      const wx = (w.x1 + w.x2) / 2, wz = (w.z1 + w.z2) / 2;
      // approach square-on from the road side
      let ci = 0, best = Infinity;
      for (let i = 0; i < t.center.length; i++) {
        const d = (t.center[i].x - wx) ** 2 + (t.center[i].z - wz) ** 2;
        if (d < best) { best = d; ci = i; }
      }
      const c = t.center[ci];
      const dx = wx - c.x, dz = wz - c.z;
      const dl = Math.hypot(dx, dz) || 1;
      const ux = dx / dl, uz = dz / dl;
      // aim at the block's END as well as its middle: the end and the joint
      // between blocks are exactly where a row of circle colliders leaves a
      // hole, so a test that only ever hits the middle proves nothing
      const aimEnd = (bi / step) % 2 === 1;
      const tx = aimEnd ? w.x2 : wx, tz = aimEnd ? w.z2 : wz;
      const sx = tx - ux * 14, sz = tz - uz * 14;
      pl.alive = true; pl.airborne = false; pl.vy = 0;
      pl.pos.set(sx, t.terrainHeight(sx, sz) + 0.5, sz);
      pl.y = pl.pos.y;
      pl.heading = Math.atan2(ux, uz);
      pl.vel.set(ux * 30, 0, uz * 30);
      pl.speedAlong = 30;
      g.input.keys = new Set(['KeyW']);
      // 45 frames: long enough to arrive and be stopped, short enough that
      // the car cannot slide along the wall and drive around its far end -
      // which a longer run does, and which is NOT penetration
      const ex = w.x2 - w.x1, ez = w.z2 - w.z1;
      const len2 = ex * ex + ez * ez || 1;
      let minDist = Infinity, throughInside = false;
      for (let f = 0; f < 45; f++) {
        g.frame();
        await raf();
        let s = ((pl.pos.x - w.x1) * ex + (pl.pos.z - w.z1) * ez) / len2;
        const inSpan = s > -0.05 && s < 1.05;
        s = s < 0 ? 0 : s > 1 ? 1 : s;
        const cx = w.x1 + ex * s, cz = w.z1 + ez * s;
        const d = Math.hypot(pl.pos.x - cx, pl.pos.z - cz);
        if (d < minDist) minDist = d;
        // THROUGH means crossing the wall line while still up against the
        // wall - not driving around its end, which a 45-frame run on a
        // hairpin can legitimately do
        const beyond = (pl.pos.x - tx) * ux + (pl.pos.z - tz) * uz;
        // and it must have been INSIDE the masonry to count: held at the
        // standoff while sliding along and round the end of a 3.6 u block is
        // not penetration, and on a hairpin a 45-frame run does exactly that
        if (inSpan && beyond > 0.4 && d < w.hw + 1.1) throughInside = true;
      }
      g.input.keys = new Set();
      // a run that never reached the wall proves nothing either way - the
      // approach geometry (a wall tucked behind a bank) simply did not work
      if (minDist > 6) continue;
      out.runs.push({
        minDist: +minDist.toFixed(2),
        standoff: +(w.hw + 1.7).toFixed(2),
        throughInside,
        // ON TOP means standing on the masonry - well above the GROUND at the
        // car's own position. Comparing against the wall's coping alone
        // cannot tell that from standing on the higher ground behind it,
        // which is exactly what a wall in a cutting has.
        // ...and it must be RESTING there. A car in the air over the drop
        // the wall guards is also "above the ground near a wall", and that is
        // a jump, not a wall being climbed.
        // ON TOP is measured against the WALL, not the terrain: on a shelf
        // or a gorge crossing the road itself stands tens of metres above
        // terrainHeight, and one run flagged a car sitting on the road over
        // a gorge (y -3.4, terrain -40.1) as having climbed a parapet.
        onTop: !pl.airborne && Math.abs(pl.vy || 0) < 1.5
          && pl.pos.y > w.y + w.h - 0.3
          // ON the wall means OVER ITS FOOTPRINT. A parapet on the falling
          // side of a shelf has its base below the road, so a car simply
          // parked beside it - held at the full standoff, 2.15 u away - is
          // above the coping without ever having climbed anything.
          && minDist < w.hw + 0.9,
        airborne: !!pl.airborne,
        y: +pl.pos.y.toFixed(2),
        ground: +t.terrainHeight(pl.pos.x, pl.pos.z).toFixed(2),
      });
    }
    return out;
  });

  console.log(`\n--- ${R.level} (${R.barriers} barrier segments) ---`);
  ok(R.barriers > 0, `${R.level}: masonry registers barrier segments`, R.barriers);
  const through = R.runs.filter((r) => r.throughInside);
  const buried = R.runs.filter((r) => r.minDist < r.standoff - 0.6);
  const onTop = R.runs.filter((r) => r.onTop);
  ok(through.length === 0, `${R.level}: no run drives THROUGH a wall`,
    `${through.length}/${R.runs.length} crossed ` + JSON.stringify(through));
  ok(buried.length === 0, `${R.level}: the car is held off the masonry`,
    `${buried.length}/${R.runs.length} got inside; ` +
    R.runs.map((r) => `${r.minDist}/${r.standoff}`).join(' '));
  ok(onTop.length === 0, `${R.level}: no run ends up ON TOP of a wall`,
    `${onTop.length}/${R.runs.length} ` + JSON.stringify(onTop));
  await page.close();
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
