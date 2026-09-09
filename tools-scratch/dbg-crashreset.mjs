/* CRASH RESET audit (owner r407: "The resets after crash need fixing").
 * Wrecks the player at sampled stations and measures where the reset puts
 * the car: lateral vs the local half-width, whether the seat is inside a
 * solid it will hit again, heading error, dead time, and whether the car
 * is in trouble again within a second of getting control back. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 4);
const SAMPLES = Number(process.env.SAMPLES ?? 24);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 300 } });
p.setDefaultTimeout(900000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,
  { waitUntil: 'load', timeout: 900000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 900000 });
const r = await p.evaluate((S) => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const c = g.player;
  const rows = [];
  for (let s = 0; s < S; s++) {
    const i = Math.round((s + 0.5) * N / S) % N;
    // put the car on the road at pace, then wreck it where it stands
    c.outOfHulls = false; g.deaths = 0; g.state = 'race';
    c.placeAt(i, 0, true);
    c.alive = true; c.health = c.maxHealth; c.mesh.visible = true;
    for (let k = 0; k < 40; k++) {
      g.input.analog.throttle = 1; g.input.analog.steer = 0; g.frame();
    }
    const diedAt = { x: c.pos.x, z: c.pos.z, i: c.trackIndex,
      kmh: Math.round(Math.hypot(c.vel.x, c.vel.z) * 3.6) };
    c.health = 0; c.alive = false; c.mesh.visible = false;
    c.respawnTimer = c.respawnDelay ?? 5;
    g.onPlayerDestroyed?.(null);
    let dead = 0;
    for (let k = 0; k < 900 && !c.alive; k++) { g.input.analog.throttle = 0; g.frame(); dead++; }
    if (!c.alive) { rows.push({ i, err: 'never came back' }); continue; }
    const si = c.trackIndex, cen = t.center[si], nv = t.nrm[si];
    const lat = (c.pos.x - cen.x) * nv.x + (c.pos.z - cen.z) * nv.z;
    const half = t.widthAt(si);
    const head = t.headingAt(si);
    let he = c.heading - head; while (he > Math.PI) he -= 2 * Math.PI;
    while (he < -Math.PI) he += 2 * Math.PI;
    // is the seat inside something solid?
    let hitR = null;
    for (const so of (t.solids ?? [])) {
      const d = Math.hypot(c.pos.x - so.x, c.pos.z - so.z);
      if (d < (so.r ?? 1) + 1.35) { hitR = +(d - (so.r ?? 1)).toFixed(2); break; }
    }
    let hitT = null;
    for (const tr of (t.trees ?? [])) {
      if (tr.culled || tr.dead) continue;
      const d = Math.hypot(c.pos.x - tr.x, c.pos.z - tr.z);
      if (d < 1.7 && Math.abs(c.pos.y - (tr.y ?? 0)) < 4) { hitT = +d.toFixed(2); break; }
    }
    // drive on for a second: did it go wrong again?
    const h0 = c.health;
    for (let k = 0; k < 60; k++) { g.input.analog.throttle = 1; g.frame(); }
    rows.push({ i, diedI: diedAt.i, diedKmh: diedAt.kmh,
      deadFrames: dead, seatLat: +lat.toFixed(2), half: +half.toFixed(2),
      offRoad: Math.abs(lat) > half, headErrDeg: Math.round(he * 180 / Math.PI),
      inSolid: hitR, inTree: hitT,
      backLost: Math.round(Math.hypot(c.pos.x - diedAt.x, c.pos.z - diedAt.z)),
      hurtAgain: +(h0 - c.health).toFixed(0),
      kmhAfter1s: Math.round(Math.hypot(c.vel.x, c.vel.z) * 3.6) });
  }
  const bad = rows.filter((x) => x.err || x.offRoad || x.inSolid !== null
    || x.inTree !== null || Math.abs(x.headErrDeg) > 8 || x.hurtAgain > 0);
  return { world: g.level?.name, n: rows.length, badCount: bad.length,
    deadFrames: rows[0]?.deadFrames, bad: bad.slice(0, 12), sample: rows.slice(0, 4) };
}, SAMPLES);
console.log(JSON.stringify(r, null, 1));
await browser.close();
