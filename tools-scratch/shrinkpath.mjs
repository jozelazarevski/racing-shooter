/* THE SHRINK-TO-FIT BRANCH, ON PURPOSE.
 *
 * `_buildMassif`'s "eight passes could not find room" path almost never runs on
 * the shipped roster, which is exactly why it is where a mistake hides: r278
 * put the new scale in a `const k` that shadowed the instance loop's counter,
 * and scaled a `const h`. Neither shows up unless the branch executes.
 *
 * Point this at a tree whose massif spec makes the branch unavoidable (cones
 * planted ON the road, taller than they are wide) and it checks three things:
 * the build raises no error, whatever survives keeps a mountain's proportions,
 * and nothing was written to a fractional instance index.
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
  const rows = cones.map((s) => ({ w: +(s.r / 0.48).toFixed(0), h: +s.h.toFixed(0),
    asp: +(s.h / (s.r / 0.48)).toFixed(2) }));
  return { want: t.T.massif.count, drawn: mesh ? mesh.count : -1, kept: rows.length, rows };
});
console.log(JSON.stringify(r, null, 1));
const fat = r.rows.filter((o) => o.asp > 2);
const bad = errs.length || r.drawn !== r.want || fat.length;
if (errs.length) console.log('errors:', errs.slice(0, 3));
if (fat.length) console.log('needles:', fat);
console.log(bad ? 'FAIL: the shrink branch is not clean' : 'PASS: shrink branch builds, no needles');
await b.close();
process.exit(bad ? 1 : 0);
