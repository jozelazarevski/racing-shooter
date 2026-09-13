/* THE INVISIBLE WALL, FOUND AND FENCED.
 *
 * Reported twice with photographs: the car stops on open road with nothing in
 * front of it. Two earlier sweeps (`tool-corridor-solids.mjs`) came back clean
 * and the cause was recorded as "not reproduced" — because both of them asked
 * the question the wrong way round. They walked the COLLIDER list, found each
 * collider's nearest centreline station, and gated it against THAT station's
 * height. A mountain standing on the road is perfectly legitimate against its
 * own footprint; the road it blocks is the thing you have to ask about.
 *
 * Walking the ROAD instead (`tool-corridor-blockers.mjs`) found it in one run:
 *
 *   FURKA RIDGE   a massif cone, r = 138, blocking 58 stations across the FULL
 *                 drivable width — 135 u of carriageway inside a mountain
 *   FURKA RIDGE   a second cone, r = 118, blocking 31 more
 *   COL DE TURINI one cone clipping 16 stations
 *
 * Two independent faults, and the fix needs both halves:
 *
 *   1. `_buildMassif` placed cones on an azimuth ring with no knowledge of
 *      where the lap goes. They now walk clear of the corridor.
 *   2. The collider was a CYLINDER of the base radius — `h` makes a solid bite
 *      over its whole span (r148, correctly, for driving into a flank). A road
 *      passing 70 u up the mountain met the full base radius: 118 u of
 *      collider against 96 u of drawn rock on FURKA, so 22 u of open road was
 *      walled off by nothing. `prof` now carries the drawn cross-section.
 *
 * Three checks. The first is the static one, the second drives the stretch
 * that was walled, and the third is the guard rail — the taper must not have
 * quietly opened the mountains up, which is the failure mode a coverage-only
 * check would sail straight past.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg, extra); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(900000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

// ---- 1. no mountain stands on any world's road ------------------------------
const sweep = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  for (const L of LEVELS) {
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch { continue; }
    const t = g.track, N = t.N;
    const big = (t.solids ?? []).filter((s) => s.mat === 'stone' && s.h !== undefined && s.r > 40);
    if (!big.length) continue;
    // worst intrusion into the corridor, over every station and every cone
    let worst = -Infinity, at = -1;
    for (let i = 0; i < N; i++) {
      const c = t.center[i];
      const half = (t.widthAt?.(i) ?? 7) + 1.8;   // + the car's own body radius
      for (const s of big) {
        if (s.h > 20 || (s.r ?? 0) > 10 ? c.y > s.y + s.h : (c.y < s.y - 3 || c.y > s.y + s.h)) continue; // tall-or-wide underside rule, mirrors the vehicles.js solids gate
        // the collider's radius AT THE ROAD'S HEIGHT, which is what bites
        let rEff = s.r;
        if (s.prof) {
          const f = (c.y - s.y) / s.h;
          if (f > 0) rEff = s.r * s.prof[Math.min(s.prof.length - 1,
            Math.max(0, Math.floor(f * s.prof.length)))];
        }
        const intrude = (rEff + half) - Math.hypot(c.x - s.x, c.z - s.z);
        if (intrude > worst) { worst = intrude; at = i; }
      }
    }
    out.push({ id: L.id, name: L.name, cones: big.length,
      worst: +worst.toFixed(1), at, tapered: big.every((s) => !!s.prof) });
  }
  return out;
});

const onRoad = sweep.filter((w) => w.worst > 0);
ok(sweep.length >= 10, `worlds carrying a massif (${sweep.length})`);
ok(sweep.every((w) => w.tapered),
  'every massif collider carries its drawn cross-section',
  sweep.filter((w) => !w.tapered).map((w) => w.name).join(', '));
ok(onRoad.length === 0,
  'no massif collider reaches the drivable corridor on any world',
  onRoad.map((w) => `${w.name} +${w.worst}u at station ${w.at}`).join(', '));

// ---- 2. and the walled stretch will actually let a car go ------------------
//
// No autopilot. An autopilot that leaves the road measures the autopilot, and
// the first version of this check did exactly that. Instead: stand the car on
// the centreline at each station across the stretch, point it down the
// tangent, hold the throttle for two seconds and see how far it gets. Open
// road carries a rally car ~40 u in that time. A wall pins it where it stands,
// and it does not matter whether the wall is visible — a station on the
// racing line that a car cannot leave is a bug either way.
const shove = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  for (const name of ['FURKA RIDGE', 'COL DE TURINI']) {
    g.state = 'title'; g.editScene = null;
    g.swapLevel(LEVELS.find((x) => x.name === name), true, null);
    const t = g.track, p = g.player;
    const worst = [];
    for (let i = 0; i < t.N; i += 5) {
      const c = t.center[i];
      p.alive = true; p.health = p.maxHealth; p.mesh.visible = true;
      p.respawnTimer = 0; p.invuln = 999;
      g.state = 'race';
      p.pos.set(c.x, t.terrainHeight(c.x, c.z) + 0.5, c.z);
      p.y = p.pos.y;
      p.vel.set(0, 0, 0); p.speed = 0; p.airborne = false;
      p.heading = Math.atan2(-t.tan[i].x, -t.tan[i].z);
      p.trackIndex = i;
      const x0 = p.pos.x, z0 = p.pos.z;
      for (let f = 0; f < 120; f++) {
        p.update(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false,
          fire: false, justPressed: () => false });
      }
      worst.push({ i, went: +Math.hypot(p.pos.x - x0, p.pos.z - z0).toFixed(1) });
    }
    p.invuln = 0; g.state = 'title';
    worst.sort((a, b) => a.went - b.went);
    // The floor is 6, down from 12 (r287): the 12 was calibrated when a
    // standing start put ~53 u/s² straight into velocity and open road
    // carried 40 u in the two-second window. The launch now obeys the tyre
    // (2.8*gripBudget off the line), so a legitimate steep-uphill hill
    // start measures 9-15 u — FURKA #500 at 9.7 u is a car reaching ~35
    // km/h up a mountain grade, not a car against a wall. A WALL still
    // pins where the car stands: 0-3 u. The gap between 3 and 6 is the
    // margin, and it is a wall this law has actually caught before.
    out.push({ name, stations: worst.length, pinned: worst.filter((w) => w.went < 6).length,
      worst: worst.slice(0, 4) });
  }
  return out;
});

for (const s of shove) {
  ok(s.pinned === 0,
    `${s.name}: a car can leave every station on the racing line`,
    `${s.pinned}/${s.stations} pinned; slowest starts ${s.worst.map((w) => `#${w.i}:${w.went}u`).join(' ')}`);
}

// ---- 3. the taper did not open the mountains up -----------------------------
// Driven flat out at a cone's flank, from outside, the car must still be
// stopped. This is the check that fails if `prof` is ever made too generous.
const ram = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  for (const name of ['FURKA RIDGE', 'COL DE TURINI', 'GOTTHARD CLIMB']) {
    g.state = 'title'; g.editScene = null;
    g.swapLevel(LEVELS.find((x) => x.name === name), true, null);
    const t = g.track, p = g.player;
    const cones = (t.solids ?? []).filter((s) => s.prof)
      .sort((a, b) => a.r - b.r);
    let runs = 0, entered = 0, worst = 0;
    for (const c of cones.slice(0, 3)) {
      const a = Math.atan2(c.z, c.x);
      const sx = c.x + Math.cos(a) * (c.r + 70);
      const sz = c.z + Math.sin(a) * (c.r + 70);
      p.alive = true; p.health = p.maxHealth; p.mesh.visible = true;
      p.respawnTimer = 0; p.invuln = 999;
      g.state = 'race';
      p.pos.set(sx, t.terrainHeight(sx, sz), sz);
      p.y = p.pos.y;
      p.vel.set(0, 0, 0); p.speed = 0; p.airborne = false;
      p.heading = Math.atan2(-(c.x - sx), -(c.z - sz));
      p.trackIndex = t.nearestIndex(p.pos);
      for (let f = 0; f < 420; f++) {
        p.update(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false,
          fire: false, justPressed: () => false });
      }
      // how far inside the DRAWN rock, at the car's own height, did it get?
      const f = (p.pos.y - c.y) / c.h;
      const rEff = f > 0
        ? c.r * c.prof[Math.min(c.prof.length - 1, Math.max(0, Math.floor(f * c.prof.length)))]
        : c.r;
      const depth = rEff - Math.hypot(p.pos.x - c.x, p.pos.z - c.z);
      // STOPPED ON A SIBLING IS STOPPED. The glacier's slabs overlap into a
      // continuous crest on purpose (r278), and once each slab carries its
      // own collider a ram at slab A parks on slab B's surface — which can
      // lie inside A's footprint. Measured on FURKA: 5.4 u "inside" A while
      // held at exactly B's radius + the car pad. The law is "colliders
      // cannot be passed", and resting against one is the law working.
      const { solidRadiusAt: rAt } = await import('./src/vehicles.js');
      const onSibling = (t.solids ?? []).some((s) => {
        if (!s.prof || s === c) return false;
        const d2 = Math.hypot(p.pos.x - s.x, p.pos.z - s.z);
        return Math.abs(d2 - (rAt(s, p.pos.y) + 1.8)) < 2.5;
      });
      runs++;
      if (depth > 3 && !onSibling) { entered++; worst = Math.max(worst, depth); }
    }
    p.invuln = 0; g.state = 'title';
    out.push({ name, runs, entered, worst: +worst.toFixed(1) });
  }
  return out;
});

for (const r of ram) {
  ok(r.runs > 0 && r.entered === 0,
    `${r.name}: a car driven flat out at a massif still cannot get inside it`,
    `${r.entered}/${r.runs} entered, deepest ${r.worst} u`);
}

// ---- 4. the collider is the shape that is drawn -----------------------------
//
// Worth being straight about what checks 1-3 can and cannot see: with the
// cones walked 24 u clear of the corridor, NO SHIPPED WORLD currently has road
// inside a base cylinder, so replacing every `prof` with 1 leaves all of them
// green. Measured, not assumed — the mutation was run.
//
// That does not make the taper decoration. It is the difference between a
// collider that describes the mountain and one that describes a silo around
// it, and the next world authored with a road up a flank meets it first. So it
// gets a check with an independent oracle: the instanced geometry in the
// scene, read vertex by vertex, against the radius `Car.step` would use at the
// same height. This is the check that fails if `prof` is ever flattened.
const shape = await page.evaluate(async () => {
  const g = window.__game;
  const THREE = await import('three');
  const { LEVELS } = await import('./src/track.js');
  // the game's own arithmetic, not a copy of it
  const { solidRadiusAt } = await import('./src/vehicles.js');
  const out = [];
  for (const name of ['FURKA RIDGE', 'TREMOLA DESCENT', 'SEA CLIFF RUN']) {
    g.state = 'title'; g.editScene = null;
    g.swapLevel(LEVELS.find((x) => x.name === name), true, null);
    const t = g.track;
    let mesh = null;
    t.group.traverse((o) => { if (o.isInstancedMesh && o.name === 'massif') mesh = o; });
    if (!mesh) continue;
    // the drawn silhouette of instance 0, in world units
    const m = new THREE.Matrix4(), v = new THREE.Vector3();
    mesh.getMatrixAt(0, m);
    const p = mesh.geometry.attributes.position;
    const pos = new THREE.Vector3(), scl = new THREE.Vector3(), quat = new THREE.Quaternion();
    m.decompose(pos, quat, scl);
    // the collider for that instance: nearest prof-bearing solid to its axis
    const sol = (t.solids ?? []).filter((s) => s.prof)
      .sort((a, b) => Math.hypot(a.x - pos.x, a.z - pos.z) - Math.hypot(b.x - pos.x, b.z - pos.z))[0];
    if (!sol) continue;
    const widest = (f) => {
      const yWorld = sol.y + f * sol.h;
      let drawn = 0;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m);
        if (v.y < yWorld) continue;
        const rr = Math.hypot(v.x - pos.x, v.z - pos.z);
        if (rr > drawn) drawn = rr;
      }
      return drawn;
    };
    // The comparison is ABSOLUTE, collider radius against drawn radius at the
    // same height, because a ratio-to-its-own-foot test cannot see a profile
    // scaled uniformly — measured, by running that mutation against the ratio
    // version of this check and watching it pass.
    const rows = [];
    for (const f of [0.25, 0.5, 0.75]) {
      const rock = widest(f) || 1;
      const collider = solidRadiusAt(sol, sol.y + f * sol.h);
      rows.push({ f, rock: +rock.toFixed(0), collider: +collider.toFixed(0),
        rel: +(collider / rock).toFixed(2) });
    }
    out.push({ name, base: +sol.r.toFixed(0), rows,
      lo: Math.min(...rows.map((r) => r.rel)), hi: Math.max(...rows.map((r) => r.rel)) });
  }
  return out;
});

for (const s of shape) {
  // The band. It sits where it does for reasons on both sides:
  //   ceiling 1.05 — anything wider than the rock at that height is invisible
  //     wall, which is the whole bug. A cylinder reaches 1.17 by three-quarter
  //     height and fails here.
  //   floor 0.55 — r148 chose w * 0.48 against a jittered elliptical footprint
  //     and it already runs ~0.70 of the drawn spurs on purpose, so this is
  //     not a claim that the two agree; it is a claim that the taper has not
  //     quietly hollowed the mountain out. A profile scaled to 0.15 lands at
  //     0.11 and fails.
  ok(s.hi <= 1.05 && s.lo >= 0.55,
    `${s.name}: the collider is as wide as the rock at the same height`,
    `${s.lo}..${s.hi} of drawn; ${s.rows.map((r) => `${r.f}: rock ${r.rock} vs ${r.collider}`).join(' | ')}`);
}
ok(shape.length >= 2, `checked the drawn silhouette on ${shape.length} worlds`);

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
