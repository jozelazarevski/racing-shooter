/* PICKING A TRACK IS A TAP, NOT A FREEZE.
 *
 * "Selecting tracks is buggy and lagging." — the card click handler ran
 * swapLevel, a full synchronous world build measured at 5–13 s per pick under
 * software GL: the menu froze before the tapped card had even highlighted,
 * taps made during the freeze replayed against a rebuilt list, and each one
 * bought ANOTHER full build. On top of that, every pick repainted all ~60
 * cards, snapping the menu scroll to the top and growing the lazy-preview
 * set by a listful of detached nodes.
 *
 * The contract now: the tap paints the highlight and the BUILDING veil at
 * once; the build itself is deferred and COALESCED, so browsing taps cost
 * one build of the last card picked; and anything that needs the world to be
 * real — the start button above all — flushes the pending pick first.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const out = {};
  let swaps = 0;
  const origSwap = g.swapLevel.bind(g);
  g.swapLevel = (...a) => { swaps++; return origSwap(...a); };

  const chips = () => [...document.querySelectorAll('.level-chip[data-lvid]:not(.locked)')];
  out.cards = chips().length;
  out.lazyBefore = g.__lazyShots ? g.__lazyShots.size : -1;

  // ---- 1. one tap: instant feedback, deferred build -----------------------
  const target = chips().find((c) => +c.dataset.lvid !== g.level.id);
  const t0 = performance.now();
  target.click();
  out.tapMs = +(performance.now() - t0).toFixed(1);
  const veil = document.getElementById('build-veil');
  out.veilOn = veil.classList.contains('on');
  out.veilNames = /BUILDING/.test(veil.textContent);
  out.highlightMoved = target.classList.contains('current');
  out.builtInHandler = g.level.id === +target.dataset.lvid;   // must be false
  await new Promise((res) => {
    const iv = setInterval(() => {
      if (g.level.id === +target.dataset.lvid && !g._pendingPick) { clearInterval(iv); res(); }
    }, 100);
  });
  out.builtAfter = true;
  out.veilOff = !veil.classList.contains('on');
  out.singleSwaps = swaps;

  // ---- 2. browsing: four taps in the window, ONE build --------------------
  swaps = 0;
  const four = chips().filter((c) => +c.dataset.lvid !== g.level.id).slice(0, 4);
  for (const c of four) c.click();
  const last = four[four.length - 1];
  await new Promise((res) => {
    const iv = setInterval(() => {
      if (!g._pendingPick && !g._pickTimer) { clearInterval(iv); res(); }
    }, 100);
  });
  out.rapidSwaps = swaps;
  out.rapidLanded = g.level.id === +last.dataset.lvid;
  out.oneCurrent = document.querySelectorAll('.level-chip.current').length;

  // ---- 3. tap then START inside the window: the flush races the pick ------
  swaps = 0;
  const next = chips().find((c) => +c.dataset.lvid !== g.level.id);
  next.click();
  g.startRace();
  out.startBuilt = g.level.id === +next.dataset.lvid;
  out.startState = g.state;
  g.state = 'title';
  document.getElementById('touch-ui')?.classList?.remove('on');

  // ---- 4. repaints do not leak watchers -----------------------------------
  for (let k = 0; k < 4; k++) g._renderLevelCards();
  out.lazyAfter = g.__lazyShots ? g.__lazyShots.size : -1;
  return out;
});

console.log(`--- ${R.cards} cards ---`);
ok(R.tapMs < 100, 'the tap handler returns in a frame, not seconds', `${R.tapMs} ms`);
ok(R.veilOn && R.veilNames, 'the BUILDING veil is up before the freeze');
ok(R.highlightMoved, 'the highlight moves with the tap');
ok(!R.builtInHandler, 'the world build does NOT run inside the click handler');
ok(R.builtAfter && R.singleSwaps === 1, 'and the picked world lands right after',
  `${R.singleSwaps} builds`);
ok(R.veilOff, 'the veil comes down when the build lands');
ok(R.rapidSwaps === 1, 'four browsing taps coalesce into ONE build', `${R.rapidSwaps}`);
ok(R.rapidLanded, 'and the LAST card tapped is the one that builds');
ok(R.oneCurrent === 1, 'exactly one card wears the highlight', R.oneCurrent);
ok(R.startBuilt && R.startState === 'countdown',
  'START inside the window flushes the pick — you race the world you tapped');
ok(R.lazyAfter === R.lazyBefore,
  'repainting the list four times leaks no preview watchers',
  `${R.lazyBefore} -> ${R.lazyAfter}`);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
