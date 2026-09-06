import { chromium } from 'playwright-core';
const URL = process.env.URL ?? 'https://jozelazarevski.github.io/racing-shooter/';
const OUT = '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 430, height: 932 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(URL, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const g = window.__game;
  // what the player sees: TRACKS tab, timeline (chapter index), then the
  // chapter that holds world 23
  document.getElementById('tab-btn-tracks')?.click();
  g.tracksView = 'timeline';
  const { LEVELS } = await import('./src/track.js');
  const lv = LEVELS.find((l) => l.id === 23);
  const k = g.chapterOf(23);
  const ch = g.chapters()[k];
  g._chapterIn = ch?.n;
  g._renderLevelCards();
  await new Promise((res) => setTimeout(res, 300));
  const cards = [...document.querySelectorAll('#level-select .level-card, #level-select [data-lv], #level-select button')]
    .map((c) => c.textContent?.replace(/\s+/g, ' ').slice(0, 40));
  const serpCard = cards.filter((t) => /SERPENT/i.test(t));
  return { lvName: lv?.name, chapter: ch?.name, chapterOpen: g.isChapterOpen(k),
    unlocked: g.isLevelUnlocked(23),
    cardCount: cards.length, serpCard, sample: cards.slice(0, 10) };
});
console.log(JSON.stringify(r, null, 1));
console.log('errors', errs.slice(0, 3));
await p.screenshot({ path: `${OUT}/menu23.png`, timeout: 90000 });
await browser.close();
