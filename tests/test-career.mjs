/* r317 — CAREER MODE, phase C1-C3 (owner: "think about creating a career
 * mode"). Every chapter is a championship season; the seven named drivers
 * score points from the real finishing order; podium the season and the
 * next chapter opens beside the star door.
 *
 *   K1  a finished round writes the season record: 8 scorers, rally points,
 *       the winner on 25 and the player's slot at their real rank
 *   K2  replaying a round keeps the BEST record, never the latest
 *   K3  the table always lists YOU and sorts by points
 *   K4  the podium door: a swept chapter with the player on the season
 *       podium opens the next chapter with zero stars banked
 *   K5  the drivers have NAMES (no anonymous machine on the table), and
 *       none of them is a real-world name (§11.10 spirit)
 *   K6  the results card carries the standings board
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=1&go=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // stage a finish without driving 90 s: park the field in a known order and
  // let finishRace() read it — rank comes from playerRank, rivals from
  // progress, which is exactly what the real flag sees
  const stage = (rank, order) => {
    g.state = 'race';
    g.enemies.forEach((e, i) => { e.alive = true; e.progress = 10 - order[i]; });
    g.playerRank = rank;
    g.player.finished = false;
    g.raceOver = false;
    g.finishRace();
  };
  // round 1: player P4, rivals in slot order
  stage(4, [1, 2, 3, 4, 5, 6, 7]);
  const k = g.chapterOf(g.level.id);
  const rec1 = JSON.parse(JSON.stringify(g.career.seasons?.[k]?.[g.level.id] ?? null));
  const table1 = g.seasonTable(k);
  // round 1 replayed WORSE (P6): the record must not move
  stage(6, [1, 2, 3, 4, 5, 6, 7]);
  const rec2 = JSON.parse(JSON.stringify(g.career.seasons[k][g.level.id]));
  // ...and replayed BETTER (P1): it must
  stage(1, [1, 2, 3, 4, 5, 6, 7]);
  const rec3 = JSON.parse(JSON.stringify(g.career.seasons[k][g.level.id]));
  // K4: sweep the chapter at P1 with zero stars, ask the door
  const ch = g.chapters()[k];
  for (const lv of ch.levels) {
    g.career.seasons[k][lv.id] = { you: 25, place: 1,
      drivers: { 'R. VOSS': 18, 'K. MARIC': 15, 'T. OKADA': 12, 'A. LINDQVIST': 10,
        'S. FERRO': 8, 'J. DUARTE': 6, 'E. KOVACS': 4 } };
  }
  const starsBanked = g.chapterStars(k);
  // zero the star record so ONLY the podium door can answer
  const finishedStash = g.career.finished;
  g.career.finished = {};
  const doorOpen = g.isChapterOpen(k + 1);
  g.career.finished = finishedStash;
  const board = document.getElementById('season-board');
  return {
    rec1, rec2, rec3,
    table1: table1.slice(0, 8),
    names: g.enemies.map((e) => e.driverName),
    doorOpen, starsBanked,
    boardText: board ? board.textContent.slice(0, 120) : null,
  };
});

const winnerPts = Math.max(...Object.values(r.rec1?.drivers ?? { x: 0 }));
check('K1  a round writes 8 scorers with the winner on 25',
  r.rec1 && Object.keys(r.rec1.drivers).length === 7 && winnerPts === 25 && r.rec1.you === 12,
  `you ${r.rec1?.you} (P${r.rec1?.place}), drivers ${Object.keys(r.rec1?.drivers ?? {}).length}, top ${winnerPts}`);
check('K2  a worse replay never moves the record', r.rec2?.you === r.rec1?.you,
  `P4 gave ${r.rec1?.you}, the P6 replay left ${r.rec2?.you}`);
check('K2  a better replay does', r.rec3?.you === 25, `P1 replay banked ${r.rec3?.you}`);
check('K3  the table lists YOU and sorts by points',
  r.table1.some(([n]) => n === 'YOU')
    && r.table1.every(([, pts], i) => i === 0 || pts <= r.table1[i - 1][1]),
  r.table1.map(([n, pts]) => `${n}:${pts}`).join(' '));
check('K4  the podium door opens the next chapter with zero stars banked',
  r.doorOpen === true, `door ${r.doorOpen}`);
check('K5  every rival is a NAMED driver',
  r.names.every((n) => n && n.includes('.')), r.names.join(', '));
check('K5  no real-world racing names on the grid',
  !r.names.some((n) => /senna|loeb|schumacher|hamilton|verstappen|ogier|mcrae|block/i.test(n)),
  r.names.join(', '));
check('K6  the results card carries the standings board',
  (r.boardText ?? '').includes('CHAMPIONSHIP'), r.boardText ?? 'no board');
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe season is on');
process.exit(fail ? 1 : 0);
