/* r359 (owner: "Iterate the careerpath") — WHERE THE MONEY COMES FROM.
 * Stages the same 78-round podium-most career as careersim CS2 and tallies
 * income per stream by parsing the results card's own credit breakdown
 * (#cb-rows) after every finishRace — the game's own itemization, not a
 * re-derivation. Also logs the bank at each tier boundary.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 800, height: 520 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=1&go=1&fresh=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game;
  g.career.finished = {}; g.career.trophies = {}; g.career.seasons = {};
  g.career.seasonHistory = []; delete g.career.sponsors;
  g.garage.credits = 0;
  g.cars.owned = ['brawler']; g.cars.selected = 'brawler';
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.startRace?.();
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const ch = g.chapters();
  const streams = {};
  const tally = () => {
    for (const row of document.querySelectorAll('#cb-rows .cb-row')) {
      const label = row.querySelector('span')?.textContent ?? '?';
      const amt = parseInt((row.querySelector('b')?.textContent ?? '').replace(/[+,]/g, ''), 10);
      if (!Number.isFinite(amt)) continue;
      // normalize labels into streams
      const key = /RACE SCORE/.test(label) ? 'raceScore'
        : /PODIUM/.test(label) ? 'podium'
        : /FIRST CONQUEST/.test(label) ? 'firstClear'
        : /FINALE/.test(label) ? 'finaleDouble'
        : /CHAMPIONSHIP POINTS/.test(label) ? 'points'
        : /BEATEN/.test(label) ? 'rivalDuel'
        : /PRIZE/.test(label) ? 'seasonPrize'
        : /SPONSOR/.test(label) ? 'sponsor'
        : /QUEST/.test(label) ? 'quest'
        : /CLEAN RUN/.test(label) ? 'cleanRun'
        : /TOTAL/.test(label) ? null : 'other';
      if (key) streams[key] = (streams[key] ?? 0) + amt;
    }
  };
  const pol = [1, 2, 3];
  const boundary = [];
  let raceN = 0, lastTier = 0, raceErrs = 0;
  const savedLevel = g.level, savedIdx = g.levelIndex;
  for (let k = 0; k < ch.length; k++) {
    const tier = g.tierOf(k);
    if (tier.idx > lastTier) {
      boundary.push({ tier: tier.name, bank: g.garage.credits, entry: tier.carMin });
      g.garage.credits -= tier.carMin;
      lastTier = tier.idx;
    }
    for (const lv of ch[k].levels) {
      const rank = pol[raceN % pol.length];
      raceN++;
      try {
        g.level = lv;
        g.state = 'race';
        g.enemies.forEach((e, i) => { e.alive = true; e._wraps = 10 - (i + 1); e.trackIndex = 0; });
        g.player._wraps = 12; g.player.trackIndex = 0;
        g.playerRank = rank;
        g.player.finished = false;
        g.raceOver = false;
        g.startScore = 0; g.score = 4000;
        g.deaths = 1;
        g.contracts = [];
        // r359: resetRace zeroes the pot between real races — the staged
        // loop must too, or every race re-pays the whole accumulated pot
        // (measured: race 5 paid race 4's 2,400 CR again; CS2's 8.8x was
        // inflated by the compounding)
        g.contractCredits = 0;
        g.finishRace();
        tally();
      } catch (e) { raceErrs++; }
    }
  }
  g.level = savedLevel; g.levelIndex = savedIdx;
  const total = Object.values(streams).reduce((s, x) => s + x, 0);
  return { streams, total, boundary, races: raceN, raceErrs, bank: g.garage.credits };
});
console.log('STREAMS (78 rounds, P1/P2/P3 rotation, score 4000):');
for (const [k, v] of Object.entries(r.streams).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(14)} ${v.toLocaleString().padStart(9)}  (${(100 * v / r.total).toFixed(1)}%)`);
}
console.log(`  TOTAL          ${r.total.toLocaleString()}`);
console.log('BOUNDARIES:', JSON.stringify(r.boundary));
console.log(`final bank ${r.bank.toLocaleString()}, ${r.raceErrs} errors`);
await browser.close();
