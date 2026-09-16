/* THE MENU IS RIGHT BEFORE YOU TOUCH IT.
 *
 * A fresh page load reaches the title screen through none of the handlers
 * that repaint it — no pick, no car change, no upgrade, no mode switch. Two
 * bugs lived in that gap:
 *
 *   - `_syncStartButton()` never ran on boot, so a career fallthrough or a
 *     shared link onto a tyre-mismatch world showed a stale plain button
 *     (found by the track-testing agent's sweep, BUGS.md #5).
 *   - `carFitness`'s under-tyred path returned without `pen`/`under`, so
 *     every label built from it — the start button above all — read
 *     "−undefined% GRIP" from r151 until r153.
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
// FROST PEAK: a snow stage the stock car is under-tyred for
await page.goto(`${BASE}/?level=3&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(() => {
  const g = window.__game;
  const f = g.carFitness(g.level.id);
  const btn = document.getElementById('start-btn');
  return { level: g.level.name, f,
    label: btn?.textContent?.trim(), blocked: btn?.classList?.contains('blocked') };
});

console.log(`--- boot onto ${R.level}: "${R.label}" ---`);
ok(R.f && R.f.ok === false, 'the stock car is out of the ideal window here', JSON.stringify(R.f));
ok(typeof R.f.pen === 'number' && R.f.pen > 0,
  'the under-tyred fitness carries a numeric grip price', String(R.f.pen));
ok(typeof R.f.under === 'number' && R.f.under >= 1,
  'and says how many classes short', String(R.f.under));
ok(/WRONG TYRES \(−\d+% GRIP\)/.test(R.label),
  'the start button states the price BEFORE any interaction', R.label);
ok(!R.blocked, 'and is not blocked — priced, never barred', R.label);
ok(!/undefined|NaN/.test(R.label), 'no undefined leaks into the label', R.label);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
