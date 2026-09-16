/* CP1 render probe — the signpost on all three surfaces.
 *   A: fresh profile (no unlockall) — tracks tab has #career-signpost with a
 *      ▸ sentence; the CURRENT chapter card carries the same line.
 *   B: careerObjective() ladder sanity across synthetic career states.
 *   C: results board — _renderSeasonBoard appends the NEXT line.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 900, height: 640 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.goto(`${BASE}/?fresh=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game, undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game;
  const out = {};
  // A: tracks tab render
  g._renderLevelCards?.();
  const sp = document.getElementById('career-signpost');
  out.signpost = sp ? sp.textContent : null;
  const hereCard = document.querySelector('.chapter-card.here');
  out.hereCardHasLine = hereCard ? hereCard.innerHTML.includes('▸') : null;
  out.cardCount = document.querySelectorAll('.chapter-card').length;
  // B: ladder sanity — synthetic states on the live game
  const states = [];
  const obj0 = g.careerObjective();
  states.push(['fresh', obj0]);
  // fake: all rounds of chapter 0 raced, no podium → rung 3 or gate
  const ch = g.chapters();
  const c0 = ch[0];
  g.career.seasons = g.career.seasons ?? {};
  g.career.seasons[0] = {};
  for (const l of c0.levels) {
    g.career.seasons[0][l.id] = { place: 5, pts: 4 };
    g.career.finished[l.id] = g.career.finished[l.id] ?? { time: 100, place: 5 };
  }
  states.push(['ch0 raced out P5s', g.careerObjective()]);
  // fake: podium every round → seasonPodium true, chapter 2 opens
  for (const l of c0.levels) g.career.seasons[0][l.id] = { place: 1, pts: 25 };
  for (const l of c0.levels) g.career.finished[l.id] = { time: 60, place: 1 };
  states.push(['ch0 swept P1s', g.careerObjective()]);
  out.states = states;
  // freeRoam guard
  const fr = g.freeRoam; g.freeRoam = true;
  out.freeRoamNull = g.careerObjective() === null;
  g.freeRoam = fr;
  // C: season board line
  let host = document.getElementById('credit-breakdown');
  out.boardHost = !!host;
  if (host) {
    g._renderSeasonBoard(0, 1);
    const box = document.getElementById('season-board');
    out.boardNext = box ? (box.innerHTML.match(/▸ NEXT: [^<]*/)?.[0] ?? null) : null;
  }
  return out;
});
console.log(JSON.stringify(r, null, 2));
console.log('pageerrors:', errs.length, errs.slice(0, 3));
await browser.close();
