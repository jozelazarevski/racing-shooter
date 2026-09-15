/* S10 PROBE (r333 groundwork, v2.3 §5.7): do rivals queue behind traffic,
 * and does traffic ever sit stationary on the carriageway?
 * 90 s race sim per world; per frame:
 *  - every traffic hull: on-road (|lateral proxy| via nearest index < half
 *    width) and speed < 0.5 u/s -> stationary-on-road time
 *  - every rival: within 14 u of a traffic hull, roughly behind it along
 *    the road, speed < 3 u/s -> queued time
 *
 *   node tools-scratch/trafficjam.mjs 1 12 22
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 800, height: 520 } });
page.setDefaultTimeout(300000);

for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 90000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, t = g.track;
    g.startRace?.();
    const f = () => new Promise((r2) => requestAnimationFrame(r2));
    for (let i = 0; i < 900 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    const S = g.__traffic;
    if (!S?.ents?.length) return { traffic: 0, why: S ? 'empty' : 'no-handle' };
    const prevPos = new Map();
    const statT = new Map(), queueT = new Map();
    let worstStat = 0, worstQueue = 0, statAt = null, queueWho = null;
    for (let k = 0; k < 90 * 60; k++) {
      g.frame();
      for (const ent of S.ents) {
        if (!ent || ent.dead) continue;
        const key = ent;
        const pp = prevPos.get(key);
        const moved = pp ? Math.hypot(ent.x - pp.x, ent.z - pp.z) : 1;
        prevPos.set(key, { x: ent.x, z: ent.z });
        const gi = t.nearestIndex ? t.nearestIndex(ent, null) : 0;
        const c = t.center[gi];
        const onRoad = Math.hypot(ent.x - c.x, ent.z - c.z) < (t.widthAt?.(gi) ?? 9);
        if (onRoad && moved < 0.5 / 60) {
          const v = (statT.get(key) ?? 0) + 1 / 60;
          statT.set(key, v);
          if (v > worstStat) { worstStat = v; statAt = { kind: ent.kind, i: gi,
            distToCenter: +Math.hypot(ent.x - c.x, ent.z - c.z).toFixed(1),
            halfW: +(t.widthAt?.(gi) ?? 9).toFixed(1), cross: !!ent.cross,
            nearCrossroad: (t.crossroads ?? []).some((cr) => Math.hypot(cr.x - ent.x, cr.z - ent.z) < 30) }; }
        } else statT.set(key, 0);
      }
      for (const e of g.enemies) {
        if (!e.alive) continue;
        let near = false;
        for (const ent of S.ents) {
          if (!ent || ent.dead) continue;
          if (Math.hypot(e.pos.x - ent.x, e.pos.z - ent.z) < 14) { near = true; break; }
        }
        const slow = Math.hypot(e.vel.x, e.vel.z) < 3;
        if (near && slow) {
          const v = (queueT.get(e) ?? 0) + 1 / 60;
          queueT.set(e, v);
          if (v > worstQueue) { worstQueue = v; queueWho = e.persona ?? 'rival'; }
        } else queueT.set(e, 0);
      }
    }
    return { traffic: S.ents.length,
      worstStationaryOnRoadS: +worstStat.toFixed(1), statAt,
      worstRivalQueueS: +worstQueue.toFixed(1), queueWho };
  });
  console.log(`world ${id}:`, JSON.stringify(r));
}
await b.close();
