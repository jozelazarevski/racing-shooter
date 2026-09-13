/* FIX-8b acceptance: three kills on cars ahead each advance the player one
 * position within 5 s (MASTER FIX-8b). Scripted: place player mid-lap,
 * destroy the nearest rival AHEAD three times, watch position + respawn. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 30; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  for (let k = 0; k < 8 * 30; k++) g.frame(); // let the field spread
  { // start from the BACK so three kills-ahead are available
    const minIdx = Math.min(...g.enemies.map(e => e.trackIndex));
    g.player.trackIndex = Math.max(0, minIdx - 20);
    g.player.placeAt(g.player.trackIndex, 0, true);
    for (let k = 0; k < 30; k++) g.frame();
  }
  const segLen = g.track.segLen ?? 5;
  const results = [];
  const posOf = () => 1 + g.enemies.filter(e =>
    (e._lapsDone ?? 0) + e.trackIndex / g.track.center.length >
    (g.player._lapsDone ?? 0) + g.player.trackIndex / g.track.center.length).length;
  for (let kill = 0; kill < 3; kill++) {
    const before = posOf();
    const ahead = g.enemies.filter(e => e.alive &&
      e.trackIndex > g.player.trackIndex).sort((a, b) => a.trackIndex - b.trackIndex)[0];
    if (!ahead) { results.push({ kill, err: 'no rival ahead' }); break; }
    ahead.destroy();
    let after = before, respawnIdx = null, gapM = null;
    for (let k = 0; k < 5 * 30; k++) {
      g.frame();
      if (ahead.alive && respawnIdx === null) {
        respawnIdx = ahead.trackIndex;
        gapM = (g.player.trackIndex - respawnIdx) * segLen;
      }
      after = Math.min(after, posOf());
    }
    const prog = (c) => (c._lapsDone ?? 0) + c.trackIndex / g.track.center.length;
    results.push({ kill, before, after, gained: before - after,
      respawnIdx, playerIdx: g.player.trackIndex, gapM: gapM === null ? null : +gapM.toFixed(0),
      victimBehind: prog(ahead) < prog(g.player),
      tailPace: ahead._tailPaceT > 0 });
  }
  return results;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
