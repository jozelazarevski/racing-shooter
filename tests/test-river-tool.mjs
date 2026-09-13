/* THE RIVER TOOL — the last hole in the editor, closed with the machinery the
 * game already had.
 *
 * "Add a river" was never going to be a new water system: every themed river
 * is one spline threaded through its road crossings, and everything — the bed
 * carve, the ribbon, the banks, the ford wash, the culverts — reads that one
 * curve. So the editor authors CROSSINGS, exactly the way it authors tunnels,
 * and `_buildFords` sites each request with the same eligibility rule its own
 * random picker uses (`fordFitAt` — shared, so tool and builder cannot drift).
 *
 * The two claims that matter:
 *   a world whose theme has NO river grows a real one where you asked, and
 *   a world that HAS one gets yours instead of the theme's random crossings.
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
// DUST CANYON: desert theme, no FORD_TUNE entry — the hard case
await page.goto(`${BASE}/?level=2&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor } = await import('./src/editor.js');
  const out = {};
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();
  const t = () => g.track;
  const n = t().center.length;

  out.riverBefore = !!t()._river;
  out.fordsBefore = t().fords.length;

  // two crossings, tapped through the real handler at 30% and 70% of the lap
  ed.tool = 'road';
  ed.roadMode = 'river';
  ed._roadAt(t().center[Math.round(n * 0.30)]);
  ed._roadAt(t().center[Math.round(n * 0.70)]);
  out.asked = ed.roadFeat.rivers.length;
  out.statusNames = ed.statusEl ? /river/i.test(ed.statusEl.textContent) : false;

  // a third one, then UNDO it — the stack must cover rivers like everything else
  ed._roadAt(t().center[Math.round(n * 0.5)]);
  out.askedThree = ed.roadFeat.rivers.length;
  ed._undo();
  out.afterUndo = ed.roadFeat.rivers.length;

  await new Promise((res) => ed.apply(res));
  const T = g.track;
  out.riverAfter = !!T._river;
  out.fordsAfter = T.fords.length;
  // the crossings landed near where they were asked for
  out.fordDist = ed.roadFeat.rivers.map((f) => {
    const want = Math.round(f * T.center.length) % T.center.length;
    return Math.min(...T.fords.map((fd) => T._circDist(fd.i, want)));
  });
  // the ribbon is really in the world
  let water = null;
  T.group.traverse((o) => { if (o.name === 'river-water') water = o; });
  out.ribbon = !!water;
  out.ribbonVerts = water ? water.geometry.attributes.position.count : 0;
  // and the wet band is registered for the physics (splash, grip)
  out.fordBands = T.fords.map((f) => +f.half.toFixed(1));

  // ---- a themed river gets REPLACED, not doubled --------------------------
  const { LEVELS } = await import('./src/track.js');
  ed.exit();
  g.state = 'title'; g.editScene = null;
  g.swapLevel(LEVELS.find((l) => l.id === 1), true, null);   // PINE VALLEY
  out.pineThemeFords = g.track.fords.length;
  const ed2 = new WorldEditor(g);
  g.editor = ed2;
  ed2.enter();
  ed2.tool = 'road'; ed2.roadMode = 'river';
  ed2._roadAt(g.track.center[Math.round(g.track.center.length * 0.45)]);
  await new Promise((res) => ed2.apply(res));
  out.pineAuthoredFords = g.track.fords.length;
  ed2.exit();
  g.state = 'title'; g.editScene = null;
  g.swapLevel(LEVELS.find((l) => l.id === 1), true, null);
  out.pineRestored = g.track.fords.length;
  return out;
});

console.log('\n--- DUST CANYON: a desert grows a river where you ask ---');
ok(!R.riverBefore && R.fordsBefore === 0,
  'the theme genuinely ships no river — this is the hard case', `${R.fordsBefore} fords`);
ok(R.asked === 2 && R.statusNames, 'two taps record two crossings, and the tool says so');
ok(R.askedThree === 3 && R.afterUndo === 2,
  'UNDO covers river crossings like every other edit', `${R.askedThree} -> ${R.afterUndo}`);
ok(R.riverAfter, 'APPLY builds the river — one spline, the world machinery');
ok(R.fordsAfter === 2, 'both crossings exist as real fords', R.fordsAfter);
ok(Math.max(...R.fordDist) <= 40,
  'each landed near where it was asked for',
  `${R.fordDist.join(', ')} samples off`);
ok(R.ribbon && R.ribbonVerts > 200,
  'the water ribbon is really in the world', `${R.ribbonVerts} vertices`);
ok(R.fordBands.every((h) => h >= 3 && h <= 6),
  'the wet bands are registered for the physics', R.fordBands.join(', '));

console.log('\n--- PINE VALLEY: authoring replaces the theme\'s crossings ---');
ok(R.pineThemeFords >= 2, 'the theme river is there to be replaced', R.pineThemeFords);
ok(R.pineAuthoredFords === 1,
  'one authored crossing means ONE crossing — yours, not yours plus theirs',
  R.pineAuthoredFords);
ok(R.pineRestored === R.pineThemeFords,
  'and a plain rebuild brings the shipped world back untouched', R.pineRestored);

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
