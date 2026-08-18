/* OFF THE ROAD ON PURPOSE — UP THE MOUNTAIN, AND INTO THE WATER.
 *
 * `tour.mjs` drives the racing line, which is the one part of every world that
 * gets looked at. This drives the parts that do not: it picks the highest
 * ground within reach and climbs at it, then picks water and drives into it,
 * shooting from the CHASE camera every 5 s of sim time.
 *
 * The recovery net in vehicles.js deliberately allows this — "the lateral test
 * used to drag you back to the racing line, which made 'go and look at that
 * mountain' impossible" — so a rescue that DOES fire here is itself a finding:
 * it means the car wedged on ground too steep to climb, which is what the
 * wedge net is for.
 *
 * Each excursion is re-seated on the road first so every world is sampled at
 * the same points of its lap, and the target is re-chosen every second so a
 * ridge that turns out to be a dead end is not driven at forever.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '/tmp/wild';
const SHOTS = Number(process.env.SHOTS ?? 3);       // per excursion
const STEP = Number(process.env.STEP ?? 300);       // 5 s at 1/60
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 800, height: 460 } });
page.setDefaultTimeout(600000);

for (const id of process.argv.slice(2)) {
  const errs = [];
  const onErr = (e) => errs.push(String(e.message ?? e));
  page.on('pageerror', onErr);
  try {
    await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
    const ok = await page.waitForFunction(
      () => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 })
      .then(() => 1).catch(() => 0);
    if (!ok) { console.log(`${id} SKIP never booted`); page.off('pageerror', onErr); continue; }

    const setup = await page.evaluate(() => {
      const g = window.__game, t = g.track;
      const CN = g.constructor.CAM_NAMES ?? [];
      const ci = CN.indexOf('CHASE');
      if (ci >= 0) g.camMode = ci;
      g.clock.getDelta = () => 1 / 60;
      g.__realRender = g.composer.render.bind(g.composer);
      g.composer.render = () => { if (g.__want) g.__realRender(); };

      // ---- WHERE IS THE WATER? Asked of the world, not guessed. A coast
      // gives a level and a seabed; a river and the creeks give polylines.
      // If none of those exist the deepest ground within reach is the answer,
      // because that is where a lake or a gorge floor is if there is one.
      const sea = t.T?.coast ? (t.T.coast.level ?? -2) : null;
      let water = null, waterKind = 'none';
      const far = (p) => t._distToTrack(p.x, p.z) > 30;
      if (t._river?.line?.length) {
        const pts = t._river.line.filter(far);
        if (pts.length) { water = pts[(pts.length * 0.5) | 0]; waterKind = 'river'; }
      }
      if (!water && t.creeks?.length) {
        for (const c of t.creeks) {
          const pts = (c.line ?? []).filter(far);
          if (pts.length) { water = pts[(pts.length * 0.5) | 0]; waterKind = 'creek'; break; }
        }
      }
      if (!water && sea !== null) {
        // sweep for ground that is under the waterline and is not the seabed
        // directly beneath the road
        let best = null;
        for (let a = 0; a < 48; a++) {
          for (let r = 120; r <= 900; r += 60) {
            const x = Math.cos(a / 48 * Math.PI * 2) * r, z = Math.sin(a / 48 * Math.PI * 2) * r;
            const h = t.terrainHeight(x, z);
            if (h > sea - 1.5) continue;
            if (!best || h < best.h) best = { x, z, h };
          }
        }
        if (best) { water = { x: best.x, z: best.z }; waterKind = 'sea'; }
      }
      if (!water) {
        let best = null;
        for (let a = 0; a < 48; a++) for (let r = 120; r <= 700; r += 60) {
          const x = Math.cos(a / 48 * Math.PI * 2) * r, z = Math.sin(a / 48 * Math.PI * 2) * r;
          const h = t.terrainHeight(x, z);
          if (!best || h < best.h) best = { x, z, h };
        }
        water = { x: best.x, z: best.z }; waterKind = 'low ground';
      }
      g.__sea = sea; g.__water = water;

      // ---- SEAT THE CAR ON THE ROAD AND POINT IT OFF IT. Not `placeAt`: that
      // aligns the car to the road heading, which is the one direction an
      // excursion must not start in.
      // SEATED OFF THE ROAD, NOT ON IT. Seating on the centreline and driving
      // outward spent every excursion on the verge: `_buildEdgeRails` guards
      // ~90% of the tight stations by design, so the car ground along a rail
      // at 6 km/h and the tour photographed the rail. Whether the rails hold is
      // `test-edgerails`' question; this one is what the OFF-ROAD looks like,
      // so the car starts out in it, seated on the terrain at that point.
      // START AT THE FOOT OF THE THING. `__seatNear` puts the car `back` units
      // short of the target on the line from the world origin, on the terrain,
      // pointed at it — so the twenty seconds are spent ON the mountain or IN
      // the water instead of driving towards them.
      // OFFSET FROM THE TARGET, NOT FROM THE ORIGIN. The first cut seated the
      // car at radius (|target| - back) along the target's own bearing from
      // the world centre, which is fine for a summit 840 u out and nonsense
      // for water 180 u out: `back` 170 collapsed the seat onto (10, 0), i.e.
      // the middle of the map next to the road, and every "drive into the sea"
      // excursion was shot standing on the start straight at 0 km/h.
      g.__seatNear = (target, back, spin) => {
        const p = g.player;
        const a = (Math.atan2(target.z, target.x) || 0) + spin;
        const x = target.x - Math.cos(a) * back;
        const z = target.z - Math.sin(a) * back;
        const y = t.terrainHeight(x, z);
        p.pos.set(x, y + 1.2, z);
        p.y = y; p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
        p.alive = true; p.health = p.maxHealth ?? 100;
        p._lostT = 0; p._wedgeT = 0; p._bogT = 0;
        p.trackIndex = t.nearestIndex(p.pos);
        g.__aim(target);
      };
      g.__seat = (i, awayDeg, lat = 55) => {
        const j = i % t.center.length;
        const c0 = t.center[j], n = t.nrm[j];
        const side = (i % 2) ? 1 : -1;
        const x = c0.x + n.x * lat * side, z = c0.z + n.z * lat * side;
        const c = { x, y: t.terrainHeight(x, z), z };
        const p = g.player;
        p.pos.set(c.x, c.y + 1.2, c.z);
        p.y = c.y; p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
        p.trackIndex = j;
        p.heading = t.headingAt(j) + awayDeg;
        p.alive = true; p.health = p.maxHealth ?? 100;
        p._lostT = 0; p._wedgeT = 0; p._bogT = 0;
      };
      // ---- THE MOUNTAIN, found once and globally.
      //
      // Re-asking "what is the highest ground within 460 u of the car" every
      // second sounded adaptive and was useless: the massif on this roster
      // sits 430-700 u out (THEMES `massif: {r0, r1}`), so 20 s at 60 km/h —
      // about 330 u — never reached one. Every climb ended between y -9 and
      // +7 on rolling ground. Find the summit over the WHOLE world, then put
      // the car at its foot and point it up.
      let peak = null;
      for (let a = 0; a < 72; a++) {
        for (let r = 80; r <= 900; r += 40) {
          const th = a / 72 * Math.PI * 2;
          const x = Math.cos(th) * r, z = Math.sin(th) * r;
          const h = t.terrainHeight(x, z);
          if (!peak || h > peak.h) peak = { x, z, h };
        }
      }
      g.__peak = peak;
      g.__highest = () => g.__peak;
      // A STUCK CAR PHOTOGRAPHS A WALL. The first cut drove off at a fixed
      // 90 degrees to the road and the very first excursion put the car nose
      // into a house in SEA CLIFF RUN's town: 9 u off the road, 3 km/h, three
      // identical frames of masonry. So the drive watches its own progress and
      // re-seats somewhere else on the lap when it has stopped getting
      // anywhere — the point is to SEE the off-road, not to prove a wall is
      // solid, which `test-solidity` already does.
      g.__stuckHops = 0;
      g.__rescues = 0;
      g.__driveTo = (target, n, retarget, seatBase) => {
        const p = g.player;
        let last = { x: p.pos.x, z: p.pos.z }, still = 0;
        let prev = { x: p.pos.x, z: p.pos.z };
        for (let k = 0; k < n; k++) {
          // THE RECOVERY NET TELEPORTS YOU BACK TO THE ROAD, and it fires out
          // here: 6 u under the drawn ground, or five seconds of full throttle
          // going nowhere on a face too steep to climb. That is real behaviour
          // and it is COUNTED rather than suppressed — but the tour's job is
          // pictures of the off-road, so a rescued car is put straight back at
          // the foot of what it was climbing instead of spending the rest of
          // the excursion photographing the racing line.
          if (Math.hypot(p.pos.x - prev.x, p.pos.z - prev.z) > 60) {
            g.__rescues++;
            g.__seatNear(target, 150, g.__rescues * 0.9);
          }
          prev = { x: p.pos.x, z: p.pos.z };
          if (retarget && k % 60 === 0) target = retarget();
          if (k % 60 === 59) {
            const moved = Math.hypot(p.pos.x - last.x, p.pos.z - last.z);
            still = moved < 12 ? still + 1 : 0;
            last = { x: p.pos.x, z: p.pos.z };
            if (still >= 2) {                      // 2 s of going nowhere
              still = 0;
              g.__stuckHops++;
              // come at it from a different bearing rather than giving up:
              // a face that cannot be climbed from the south often can be
              // from the west, and that difference is itself worth seeing
              g.__seatNear(target, 120 + (g.__stuckHops % 3) * 60,
                g.__stuckHops * 1.1);
            }
          }
          let want = Math.atan2(target.x - p.pos.x, target.z - p.pos.z) - p.heading;
          while (want > Math.PI) want -= 2 * Math.PI;
          while (want < -Math.PI) want += 2 * Math.PI;
          g.input.analog.throttle = 1;
          g.input.analog.steer = Math.max(-1, Math.min(1, want * 2));
          g.frame();
        }
      };
      // point the car AT the thing it is going to, not at a fixed angle off
      // the road: the target is only known once the car has been seated
      g.__aim = (target) => {
        const p = g.player;
        p.heading = Math.atan2(target.x - p.pos.x, target.z - p.pos.z);
      };
      return { name: t.level?.name ?? '?', sea, waterKind,
        water: [Math.round(water.x), Math.round(water.z)],
        peak: [Math.round(peak.x), Math.round(peak.z), +peak.h.toFixed(1)],
        N: t.center.length };
    });

    for (const tag of ['climb', 'water']) {
      await page.evaluate((mode) => {
        const g = window.__game;
        g.__stuckHops = 0; g.__rescues = 0;
        g.__seatNear(mode === 'climb' ? g.__peak : g.__water, 170, 0);
      }, tag);
      for (let s = 0; s < SHOTS; s++) {
        const info = await page.evaluate(([n, mode]) => {
          const g = window.__game, t = g.track;
          if (mode === 'climb') g.__driveTo(g.__highest(), n, () => g.__highest(), 0.15);
          else g.__driveTo(g.__water, n, null, 0.55);
          g.__want = 1; g.frame(); g.__want = 0;
          const p = g.player;
          const gh = t.terrainHeight(p.pos.x, p.pos.z);
          // AND WHERE THE LENS IS. A frame that comes out black is useless
          // without this: SILVERSTONE produced one at 67 km/h and there was no
          // way to tell whether the camera was under the ground, inside a
          // building, or looking at an unlit face.
          const cam = g.camera.position;
          const camGround = t.terrainHeight(cam.x, cam.z);
          return { y: +p.y.toFixed(1), ground: +gh.toFixed(1), rescues: g.__rescues,
            camY: +cam.y.toFixed(1), camDig: +(camGround - cam.y).toFixed(1),
            under: g.__sea !== null && p.y < g.__sea,
            d: Math.round(t._distToTrack(p.pos.x, p.pos.z)),
            spd: Math.round(Math.abs(p.speedAlong ?? 0) * 3.1),
            hull: Math.round(p.health ?? 0), air: !!p.airborne };
        }, [STEP, tag]);
        await page.screenshot({ path: `${OUT}/L${String(id).padStart(2, '0')}-${tag}${(s + 1) * 5}s.png` });
        console.log(`${String(id).padStart(2)} ${setup.name.padEnd(20)} ${tag.padEnd(5)} t=${(s + 1) * 5}s  `
          + `y ${String(info.y).padStart(7)}  ground ${String(info.ground).padStart(7)}  `
          + `${String(info.d).padStart(4)} u off-road  ${String(info.spd).padStart(3)} km/h  hull ${String(info.hull).padStart(3)}`
          + (info.under ? '  UNDER THE WATERLINE' : '') + (info.air ? '  AIRBORNE' : '')
          + (info.rescues ? `  rescued x${info.rescues}` : '')
          + `  | lens y ${info.camY}${info.camDig > 0 ? ` ${info.camDig} u UNDER THE GROUND` : ''}`);
      }
    }
    console.log(`   ${setup.name}: summit ${JSON.stringify(setup.peak)}, water is ${setup.waterKind}`
      + ` at ${JSON.stringify(setup.water)}, sea level ${setup.sea}`);
    if (errs.length) console.log(`${id} PAGE ERRORS: ${[...new Set(errs)].slice(0, 4).join(' | ')}`);
  } catch (e) {
    console.log(`${id} FAILED ${String(e.message).slice(0, 200)}`);
  }
  page.off('pageerror', onErr);
}
await b.close();
