/* DRIVE IN ONE PORTAL, DRIVE OUT THE OTHER.
 *
 * Asked for directly: tunnels through the mountain worlds, and a car that
 * drives in and drives out. Counting bores in `track._tunnels` proves the
 * PLANNER ran; it says nothing about whether the thing it planned can be
 * driven through, and every tunnel defect this game has had was of the second
 * kind:
 *
 *   - a bore sited over a crest, where the car launches off the hump and
 *     leaves through the ceiling into the empty slot `_tunnelRidge` keeps
 *     above the tube (measured on TREMOLA DESCENT at -0.07 u of clearance;
 *     `tunnelFitAt` refuses crest stations because of it)
 *   - wall solids at the bore half-width, which are a wall if the roadway
 *     inside is wider than the tube
 *   - a portal in a hillside the road does not actually reach
 *
 * None of those show up in a count. So this drives the real car with the real
 * physics from outside one portal to outside the other, and asserts what a
 * player would notice:
 *
 *   ENTERED   `tunnelAt` returned a bore for at least one frame
 *   EXITED    the car came out the FAR portal, not back the way it went in
 *   ROOFED    while inside, it never got above the crown — the silent strike
 *   MOVING    it did not stop dead against a wall on the way through
 *
 * The car is steered to the centreline rather than left to its own devices: an
 * unsteered car at full throttle just drives off the road, and its damage is
 * crash damage rather than anything the tunnel did.
 *
 *   node tests/test-tunnels.mjs           # every world that asks for a bore
 *   node tests/test-tunnels.mjs 48 22     # only these
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const only = process.argv.slice(2).map(Number).filter(Boolean);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });

// Every world that ASKS for a bore, straight from the roster — so a world that
// gains or loses tunnels is covered without editing a list here.
const roster = await page.evaluate(async () => {
  const { LEVELS } = await import('./src/track.js');
  return LEVELS.filter((l) => l.tune?.tunnels)
    .map((l) => ({ id: l.id, name: l.name, want: l.tune.tunnels.count ?? 1 }));
});
const worlds = only.length ? roster.filter((l) => only.includes(l.id)) : roster;
console.log(`${worlds.length} worlds ask for a tunnel\n`);

let bores = 0, driven = 0, planless = [];

for (const lv of worlds) {
  await page.goto(`${BASE}/?level=${lv.id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const built = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!built) { console.log(`SKIP  ${lv.name} did not build`); fail++; continue; }

  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, c = g.player, N = t.center.length;
    g.state = 'race';
    const T = t._tunnels ?? [];

    // Put the car on the road `back` samples before the entry portal, pointed
    // down the lap, already rolling — a standing start half a lap away would
    // measure the drive there, not the tunnel.
    const runBore = (bore) => {
      const start = (bore.s - 18 + N) % N;
      const p0 = t.center[start];
      c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
      c.pos.set(p0.x, p0.y + 0.4, p0.z);
      c.y = c.pos.y;
      c.heading = t.headingAt(start);
      const tan = t.tan[start];
      c.vel.set(tan.x * 26, 0, tan.z * 26);
      c.trackIndex = start;
      if (c.mesh) c.mesh.position.copy(c.pos);

      let inside = 0, roofBreak = 0, worstHead = Infinity, stalled = 0;
      let exited = false, maxI = start, minSpeed = Infinity;
      let insideEver = false, wentBackwards = false;
      // 20 simulated seconds is far more than a bore needs at 26 u/s; the run
      // stops as soon as the car is clear of the far portal.
      for (let k = 0; k < 1200 && !exited; k++) {
        // steer to the centreline of the sample ahead: the line a driver
        // takes, not the line an unsteered car falls into
        const i = t.nearestIndex(c.pos, c.trackIndex);
        const aim = (i + 6) % N;
        const a = t.center[aim];
        const want = Math.atan2(a.x - c.pos.x, a.z - c.pos.z);
        let d = want - c.heading;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const steer = Math.max(-1, Math.min(1, d * 1.9));
        c.step(1 / 60, { throttle: 1, brake: 0, steer, drift: false, hold: false });

        const at = t.tunnelAt(c.pos, c.trackIndex);
        const speed = Math.hypot(c.vel.x, c.vel.z);
        if (at) {
          insideEver = true; inside++;
          minSpeed = Math.min(minSpeed, speed);
          // THE SILENT STRIKE: the bore has wall colliders and no roof
          // collider, so a car thrown up by a hump leaves through the crown
          // and drops back in. Headroom is the crown minus the car.
          const head = (at.floorY + at.apex) - c.pos.y;
          worstHead = Math.min(worstHead, head);
          if (head < 0) roofBreak++;
        }
        if (speed < 2) stalled++; else stalled = 0;
        // out the FAR portal: past the exit sample and no longer in a bore
        const fwd = (i - bore.s + N) % N;
        if (fwd > maxI) maxI = fwd;
        if (insideEver && !at && i > bore.e && i < bore.e + 90) exited = true;
        if (insideEver && !at && ((bore.s - i + N) % N) < 40) wentBackwards = true;
        if (stalled > 120) break;                  // two seconds hard against something
      }
      return {
        len: bore.e - bore.s, entered: insideEver, exited, frames: inside,
        roofBreak, wentBackwards,
        head: worstHead === Infinity ? null : +worstHead.toFixed(2),
        minSpeed: minSpeed === Infinity ? null : +minSpeed.toFixed(1),
        stalled: stalled > 120,
      };
    };

    // r350 (owner: "All Tunels needs to be under a mountain otherwise makes
    // no sense"): the WORST flank along the bore. At every 4th sample, the
    // tallest terrain within 150 u to either side, relative to the road —
    // the mountain's shoulder. Before the ridge-line extension the quarter
    // points read 5-30 u (a pipe through a mound); with it the whole bore
    // sits under ~45-50 u of rock and the approaches are cuttings.
    const mtnOf = (bore) => {
      let worst = Infinity, at = -1;
      for (let i = bore.s; i <= bore.e; i += 4) {
        const cc = t.center[((i % N) + N) % N], nn = t.nrm[((i % N) + N) % N];
        let pk = -99;
        for (let d2 = 14; d2 <= 150; d2 += 6) {
          for (const sd of [1, -1]) {
            const h2 = t.terrainHeight(cc.x + nn.x * d2 * sd, cc.z + nn.z * d2 * sd) - cc.y;
            if (h2 > pk) pk = h2;
          }
        }
        if (pk < worst) { worst = pk; at = i; }
      }
      return { worst: +worst.toFixed(1), at };
    };

    return { name: t.level?.name, segLen: +t.segLen.toFixed(2),
      bores: T.map((b) => ({ s: b.s, e: b.e, mid: b.mid })),
      runs: T.map(runBore), mtns: T.map(mtnOf) };
  });

  if (!r.bores.length) {
    planless.push(`${lv.name} (asked ${lv.want})`);
    console.log(`----  ${lv.name.padEnd(20)} asked for ${lv.want}, the planner sited NONE`);
    continue;
  }
  console.log(`      ${r.name.padEnd(20)} asked ${lv.want}, sited ${r.bores.length}`);
  for (let k = 0; k < r.runs.length; k++) {
    const q = r.runs[k], b = r.bores[k];
    bores++;
    const len = +(q.len * r.segLen).toFixed(0);
    const ok = q.entered && q.exited && !q.roofBreak && !q.stalled;
    if (ok) driven++;
    check(`${r.name} bore ${k + 1} (${len} u at ${b.s}-${b.e}): drive in, drive out`, ok,
      `${q.entered ? 'entered' : 'NEVER ENTERED'}, `
      + `${q.exited ? 'exited the far portal' : q.wentBackwards ? 'CAME BACK OUT THE WAY IT WENT IN' : 'NEVER EXITED'}`
      + `, ${q.frames} frames inside, headroom ${q.head} u`
      + (q.roofBreak ? `, THROUGH THE ROOF on ${q.roofBreak} frames` : '')
      + (q.stalled ? ', STOPPED DEAD' : `, slowest ${q.minSpeed} u/s`));
    const m = r.mtns[k];
    check(`${r.name} bore ${k + 1}: under a mountain, end to end (r350)`,
      m.worst >= 25, `thinnest flank ${m.worst} u at sample ${m.at}`);
  }
}

console.log(`\n${driven} of ${bores} bores driven in one portal and out the other`);
if (planless.length) {
  // NOT a failure: `count` is a request and `tunnelFitAt` has the last word.
  // Named rather than swallowed, because "the planner found nowhere" and "the
  // world has no tunnels because nobody asked" look identical in a count.
  console.log(`NOTE  no station fit on: ${planless.join(', ')}`);
}
await page.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nin one end and out the other');
process.exit(fail ? 1 : 0);
