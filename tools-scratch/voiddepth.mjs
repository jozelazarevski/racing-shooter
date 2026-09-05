/* VOID DEPTH SURVEY (r329 groundwork, v2.3 §3.2).
 *
 * Before the below-terrain watchdog gets a threshold, measure how far below
 * the terrain field a HEALTHY car ever sits. Two sources of legitimate
 * "below terrain" in this engine:
 *   - the grounded off-road ease lags the ground by up to VY_CAP u/s on a
 *     steep climb (the rejoin scramble is protected behaviour: test-goat),
 *   - tunnel bores: y = bore floor, terrainHeight = the mountain over it.
 * The candidate datum is min(terrainHeight, physics gY): the bore case
 * vanishes because gY IS the floor; what remains is the ease lag. This
 * probe races rivals (they drive honest laps) + scrambles the player up
 * FURKA-class banks, and reports the depth distribution against BOTH
 * datums so the threshold is a measured number, not a guess.
 *
 *   node tools-scratch/voiddepth.mjs 4 12 22      # level ids
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const SIM = Number(process.env.SIM ?? 120);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 800, height: 520 } });
page.setDefaultTimeout(300000);

for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 90000 });
  const r = await page.evaluate(async (SIM) => {
    const g = window.__game, t = g.track;
    g.startRace?.();
    const f = () => new Promise((r2) => requestAnimationFrame(r2));
    for (let i = 0; i < 600 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
    if (g.state !== 'race') return { fail: 'no race, state=' + g.state };
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};
    // depth vs raw terrain and vs min(terr, physics gY) for every car
    const cars = [g.player, ...g.enemies];
    let maxT = 0, maxD = 0, maxTat = null, maxDat = null;
    const histD = [0, 0, 0, 0, 0, 0]; // <0.5,<1,<2,<4,<8,8+
    const frames = SIM * 60;
    for (let k = 0; k < frames; k++) {
      g.frame();
      for (const c of cars) {
        if (!c.alive || c.airborne) continue;
        const terr = t.terrainHeight(c.pos.x, c.pos.z);
        const gY = c._physGY ?? terr;
        const dT = terr - c.y;
        const dD = Math.min(terr, gY) - c.y;
        if (dT > maxT) { maxT = dT; maxTat = { i: c.trackIndex, lat: +c.lateral?.toFixed(1), who: c === g.player ? 'player' : c.persona ?? 'rival' }; }
        if (dD > maxD) { maxD = dD; maxDat = { i: c.trackIndex, lat: +c.lateral?.toFixed(1), who: c === g.player ? 'player' : c.persona ?? 'rival' }; }
        if (dD > 0.01) histD[dD < 0.5 ? 0 : dD < 1 ? 1 : dD < 2 ? 2 : dD < 4 ? 3 : dD < 8 ? 4 : 5]++;
      }
    }
    return { maxT: +maxT.toFixed(2), maxD: +maxD.toFixed(2), maxTat, maxDat, histD };
  }, SIM);
  console.log(`world ${id}:`, JSON.stringify(r));
}

// bank scramble: park the player on terrain below a shelf road, hold
// throttle toward the road, watch the depth as the ease climbs the bank
console.log('--- bank scramble (FURKA-class shelves) ---');
for (const id of [12, 22]) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 90000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    g.startRace?.();
    const f = () => new Promise((r2) => requestAnimationFrame(r2));
    for (let i = 0; i < 600 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};
    // find the tallest shelf: max(roadY - terrain at 30u lateral)
    let best = null;
    for (let i = 0; i < N; i += 4) {
      const c = t.center[i];
      const road = t.groundHeightAt(i, 0);
      const h = c.heading ?? t.headingAt(i);
      const sx = Math.cos(h), sz = -Math.sin(h);
      const terr = t.terrainHeight(c.x + sx * 30, c.z + sz * 30);
      const dh = road - terr;
      if (!best || dh > best.dh) best = { i, dh: +dh.toFixed(1), sx, sz };
    }
    const runs = [];
    for (const lat of [24, 34, 45]) {
      const c = t.center[best.i];
      p.placeAt(best.i, 0, true);
      p.pos.x = c.x + best.sx * lat; p.pos.z = c.z + best.sz * lat;
      p.y = t.terrainHeight(p.pos.x, p.pos.z);
      p.vel.set(0, 0, 0); p.airborne = false; p._lostT = 0; p._wedgeT = 0;
      // face the road
      p.heading = Math.atan2(c.x - p.pos.x, c.z - p.pos.z);
      let maxD = 0, retD = 0;
      for (let k = 0; k < 6 * 60; k++) {
        g.input.analog = { steer: 0, throttle: 1, brake: 0 };
        g.frame();
        const terr = t.terrainHeight(p.pos.x, p.pos.z);
        const gY = p._physGY ?? terr;
        const d = Math.min(terr, gY) - p.y;
        if (d > maxD) maxD = d;
        if (terr - p.y > retD) retD = terr - p.y;
      }
      runs.push({ lat, maxDatumDepth: +maxD.toFixed(2), maxTerrDepth: +retD.toFixed(2), endLat: +p.lateral.toFixed(1) });
    }
    return { shelf: best.dh, at: best.i, runs };
  });
  console.log(`world ${id}:`, JSON.stringify(r));
}
await b.close();
