/* THE STARTING GRID, MEASURED (owner: "cars start really strange… they all
 * start super far away. Unusual for a race").
 * Reports every slot's world position, the gap between rows in metres, the
 * total front-to-back depth, and which slot the player takes. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=21&go=1&unlockall=1',
  { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 400 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const slots = [];
  for (let s = 0; s < 8; s++) {
    const q = t.gridSlot(s);
    const c = t.center[q.index];
    slots.push({ slot: s, index: q.index, lateral: q.lateral, x: c.x, z: c.z });
  }
  // along-road metres between consecutive slots, front (0) to back (7)
  const segLen = t.segLen ?? 4;
  const gapRow = Math.abs(slots[0].index - slots[2].index) * segLen;   // row to row
  const depth = Math.abs(slots[0].index - slots[7].index) * segLen;
  // where does each car actually sit at GO?
  const field = [g.player, ...g.enemies].map((c) => ({
    who: c === g.player ? 'YOU' : (c.driverName ?? c.name),
    idx: c.trackIndex, lat: +(c.lateral ?? 0).toFixed(1),
    place: c === g.player ? undefined : undefined,
  }));
  // distance from the player to each rival, along the road
  const pi = g.player.trackIndex;
  const rel = g.enemies.map((e) => {
    let d = e.trackIndex - pi;
    const N = t.center.length;
    if (d > N / 2) d -= N; if (d < -N / 2) d += N;
    return { who: e.driverName ?? e.name, aheadM: Math.round(d * segLen) };
  }).sort((a, b) => b.aheadM - a.aheadM);
  return { world: g.level?.name, segLen: +segLen.toFixed(2),
    rowGapM: Math.round(gapRow), gridDepthM: Math.round(depth),
    playerIndex: pi, playerPlaceAtStart: g.player.place ?? null,
    slots, rivalsRelativeToPlayer: rel };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
