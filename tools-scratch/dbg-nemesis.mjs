/* CP4 probe — the nemesis thread.
 *   A: mapping — 13 chapters name a driver, all seven feature, VOSS on WORKS
 *   B: the lease — in a chapter-0 race the pressure rival IS T. OKADA
 *   C: the strip — the chapter room's season strip names the nemesis
 *   D: the beat — a completed season records nem; champion card line says
 *      TOOK THE TITLE FROM <name>
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 640 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.goto(`${BASE}/?level=1&go=1&fresh=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const r = await p.evaluate(async () => {
  const g = window.__game;
  const out = {};
  // A: mapping
  const names = [];
  for (let k = 0; k < 13; k++) names.push(g.nemesisOf(k)?.name ?? '??');
  out.map = names;
  out.allSeven = new Set(names).size === 7;
  out.worksVoss = names[11] === 'R. VOSS' && names[12] === 'R. VOSS';
  // B: the lease
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.resetRace(); g.startRace?.();
  const f = () => new Promise((r2) => requestAnimationFrame(r2));
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; await f(); }
  g.raceTime = 20;
  for (let k = 0; k < 90; k++) g.frame();
  out.lease = g._pressureRival ? (g._pressureRival.driverName ?? g._pressureRival.name) : null;
  out.wantLease = g.nemesisOf(g.chapterOf(g.level.id))?.name;
  // C: the strip
  g.tracksView = 'timeline';
  g._chapterIn = g.chapters()[0].n;
  g._renderLevelCards();
  const strip = document.querySelector('#level-select .season-strip');
  out.stripNem = strip ? /🎯 ([A-Z]\. [A-Z]+)/.exec(strip.textContent)?.[1] ?? null : 'no strip';
  // D: the beat — complete chapter 0's season as champion
  const k0 = 0, ch = g.chapters()[k0];
  g.career.seasons = { 0: {} };
  for (const lv of ch.levels) {
    g.career.seasons[0][lv.id] = { you: 25, place: 1,
      drivers: { 'R. VOSS': 18, 'K. MARIC': 15, 'T. OKADA': 12, 'A. LINDQVIST': 10,
        'S. FERRO': 8, 'J. DUARTE': 6, 'E. KOVACS': 4 } };
  }
  delete g.career.seasons[0]._prizePaid;
  g.career.seasonHistory = [];
  g.playerRank = 1; g.player._wraps = 4; g.player.trackIndex = 0;
  g.enemies.forEach((e, i) => { e.alive = true; e._wraps = 3; e.trackIndex = 100 - i * 10; });
  g._recordSeasonRound(1);
  out.histNem = g.career.seasonHistory[0]?.nem ?? null;
  out.histPos = g.career.seasonHistory[0]?.pos;
  g._chapterIn = null;
  g._renderLevelCards();
  const card0 = document.querySelector('.chapter-card');
  out.cardLine = /TOOK THE TITLE FROM [A-Z]\. [A-Z]+/.exec(card0?.textContent ?? '')?.[0] ?? null;
  return out;
});
console.log(JSON.stringify(r, null, 2));
console.log('pageerrors:', errs.length, errs.slice(0, 3));
await browser.close();
