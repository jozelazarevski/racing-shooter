/* THE SHRINK-TO-FIT BRANCH, ON PURPOSE.
 *
 * `_buildMassif`'s "eight passes could not find room" path almost never runs on
 * the shipped roster, which is exactly why it is where a mistake hides: r278
 * put the new scale in a `const k` that shadowed the instance loop's counter,
 * and scaled a `const h`. Neither shows up unless the branch executes.
 *
 * Point this at a tree whose massif spec makes the branch unavoidable and it
 * checks four things: the branch ACTUALLY RAN, the build raised no error, every
 * instance was written, and whatever survives keeps a mountain's proportions.
 *
 * THE FIRST CUT PASSED WITHOUT TESTING ANYTHING, which is the whole reason the
 * first check exists. Planting the cones at r 40-60 with w 400 is not enough:
 * the walk simply pushes them outward THROUGH the lap and out the far side,
 * where the clearance is satisfied and the shrink never runs. They came back at
 * the requested 400 x 400 and the probe said PASS. To force the branch the
 * clearance has to be unsatisfiable ANYWHERE in the world - a height and width
 * in the thousands - so there is nowhere left to walk to.
 *
 * `shrank` is therefore the gate on the gate: a cone still at its requested
 * size did not go through the branch, and a run where none did is a run that
 * measured nothing.
 *
 *   PORT=8902 LEVEL=66 node shrinkpath.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8902, LV = process.env.LEVEL ?? 66;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 480 } });
p.setDefaultTimeout(600000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(`http://localhost:${PORT}/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const r = await p.evaluate(() => {
  const t = window.__game.track;
  const mesh = t.group.children.find((o) => o.name === 'massif');
  const cones = (t.solids || []).filter((s) => s.prof && s.h > 20);
  const M = t.T.massif;
  // the massif's own cones, not the skyline rings: nothing else is ever asked
  // for a base this wide
  const mine = cones.filter((s) => s.r / 0.48 <= M.w1 + 1);
  const rows = mine.map((s) => ({ w: +(s.r / 0.48).toFixed(0), h: +s.h.toFixed(0),
    asp: +(s.h / (s.r / 0.48)).toFixed(2) }));
  return { want: M.count, drawn: mesh ? mesh.count : -1,
    asked: `${M.w0}-${M.w1} wide, ${M.h0}-${M.h1} tall`,
    // anything below the smallest requested base went through the branch
    shrank: rows.filter((o) => o.w < M.w0 - 1).length, kept: rows.length, rows };
});
console.log(JSON.stringify({ ...r, rows: r.rows.slice(0, 6) }, null, 1));
const fat = r.rows.filter((o) => o.asp > 2);
const bad = errs.length || r.drawn !== r.want || fat.length || !r.shrank;
if (errs.length) console.log('errors:', errs.slice(0, 3));
if (fat.length) console.log('needles:', fat);
if (!r.shrank) console.log('the shrink branch NEVER RAN — this run measured nothing');
console.log(bad ? 'FAIL: the shrink branch is not clean'
  : `PASS: ${r.shrank} cone(s) through the shrink branch, no needles`);
await b.close();
process.exit(bad ? 1 : 0);
