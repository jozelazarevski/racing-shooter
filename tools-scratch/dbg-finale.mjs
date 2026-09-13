/* CP2 probe — finales, trophies, doors, migration.
 *   A: fresh profile — chapter 0's last world is locked as a FINALE while
 *      earlier worlds are open; its card names its own door.
 *   B: floor — racing every non-finale world of ch0 opens the finale (CS1).
 *   C: trophy door — trophies[0] opens chapter 1 regardless of stars.
 *   D: careerObjective rungs 0a/0b and after-trophy.
 *   E: garage trophy shelf renders.
 *   F: migration — a saved seasonHistory podium grants the trophy on load.
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
  const c0 = g.chapters()[0];
  const fin = g.finaleOf(0);
  out.finale = fin?.name;
  out.finIsLast = c0.levels[c0.levels.length - 1] === fin;
  out.finLockedFresh = !g.isLevelUnlocked(fin.id);
  out.othersOpen = c0.levels.slice(0, -1).every((l) => g.isLevelUnlocked(l.id));
  out.objFresh = g.careerObjective();
  // card line for the shut finale
  g._renderLevelCards?.();
  const finCard = document.querySelector(`[data-lvid="${fin.id}"]`);
  out.finCardBest = finCard?.querySelector('.wc-best')?.textContent ?? null;
  out.finCardName = finCard?.querySelector('.wc-name')?.textContent ?? null;
  // B: floor — race every non-finale world
  for (const l of c0.levels.slice(0, -1)) {
    g.career.finished[l.id] = { place: 6, stars: 1 };
  }
  out.finOpenAfterFloor = g.isFinaleOpen(0) && g.isLevelUnlocked(fin.id);
  out.objFinaleOpen = g.careerObjective();
  // C: trophy door
  out.ch1ShutStill = !g.isChapterOpen(1);
  (g.career.trophies ??= {})[0] = { at: Date.now(), car: 'starter', place: 2 };
  out.ch1OpenOnTrophy = g.isChapterOpen(1);
  out.objAfterTrophy = g.careerObjective();
  // E: shelf
  g.renderGarage?.();
  const bays = document.getElementById('garage-bays');
  out.shelf = bays ? (bays.textContent.match(/🏆 TROPHY SHELF[^🔩]*/)?.[0]?.slice(0, 80) ?? null) : 'no host';
  // F: migration — write a save with history but no trophies, reload reads it
  const cr = JSON.parse(JSON.stringify(g.career));
  delete cr.trophies;
  cr.seasonHistory = [{ k: 0, name: c0.name, pos: 3, pts: 90, champion: 'R. VOSS', when: 1 }];
  localStorage.setItem(g._pkey('career'), JSON.stringify(cr));
  return out;
});
await p.reload({ waitUntil: 'load' });
await p.waitForFunction(() => window.__game, undefined, { timeout: 300000 });
const r2 = await p.evaluate(() => {
  const g = window.__game;
  return { migrated: g.career.trophies?.[0] ?? null, ch1Open: g.isChapterOpen(1) };
});
console.log(JSON.stringify({ ...r, ...r2 }, null, 2));
console.log('pageerrors:', errs.length, errs.slice(0, 3));
await browser.close();
