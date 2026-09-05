/* THE LAP COUNT BELONGS TO THE WORLD, NOT TO THE PAGE LOAD.
 *
 * Reported as a photograph of the HUD reading LAP 1/1 on a circuit that races
 * three: "I see lap 1/1. Why?"
 *
 * `lapsTotal` was set in the Game constructor and nowhere else, so it
 * described whichever world the page happened to BOOT on for the rest of the
 * session. FURKA RIDGE is the one point-to-point stage and the only world
 * declaring `laps: 1` — boot there, then swap to anything, and the whole
 * campaign quietly became one lap. Every route into a world swaps in place
 * (the r152 picker, "next level" off the results screen, the menu), so this
 * was reachable from ordinary play, and it cuts a three-lap race to a third.
 *
 * The reverse is just as wrong and this checks it too: boot on a circuit,
 * swap to FURKA, and a point-to-point stage would ask for three laps of a
 * road that does not loop.
 *
 * Checked BOTH in the model and on the HUD, because they fail separately: the
 * number the game races by is `g.lapsTotal`, and the number the player is
 * looking at is the DOM, which is only repainted while racing.
 *
 *   node tests/test-lap-count.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const DEFAULT_LAPS = 3;

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg, extra); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(300000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));

// BOOT ON THE ODD ONE OUT. Booting on a 3-lap world hides the bug entirely.
await page.goto(`${BASE}/?level=21&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 120000 });

// ---- 1. the model tracks the world across every swap ------------------------
const swaps = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [{ name: g.level.name, declared: g.level.laps ?? 3, got: g.lapsTotal }];
  // away from the 1-lap stage, back to it, and away again — a stuck value
  // looks correct on any single leg of that
  for (const id of [1, 21, 38, 6]) {
    g.state = 'title'; g.editScene = null;
    g.swapLevel(LEVELS.find((x) => x.id === id), true, null);
    out.push({ name: g.level.name, declared: g.level.laps ?? 3, got: g.lapsTotal });
  }
  return out;
});
const wrong = swaps.filter((s) => s.declared !== s.got);
ok(wrong.length === 0,
  `every world races the lap count it declares (${swaps.length} swaps from a 1-lap boot)`,
  wrong.map((s) => `${s.name} wants ${s.declared} got ${s.got}`).join(', '));

// ---- 2. and the HUD shows it, in a real race --------------------------------
// The DOM is only repainted while racing, so the model being right does not
// prove the player sees it.
const hud = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.state = 'title'; g.editScene = null;
  g.swapLevel(LEVELS.find((x) => x.id === 1), true, null);   // PINE VALLEY, 3 laps
  g.resetRace();
  g.startRace();
  g.countdown = 0.01;
  await new Promise((r) => setTimeout(r, 1500));
  return { world: g.level.name, lapsTotal: g.lapsTotal, state: g.state,
    domTotal: document.getElementById('laps-total')?.textContent,
    domLap: document.getElementById('lap')?.textContent };
});
ok(hud.domTotal === String(DEFAULT_LAPS),
  `the HUD reads LAP n/${DEFAULT_LAPS} on ${hud.world} after a swap from the 1-lap stage`,
  `showed ${hud.domLap}/${hud.domTotal}, model ${hud.lapsTotal}, state ${hud.state}`);

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
