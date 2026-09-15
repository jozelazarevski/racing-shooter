/* CLAUDE.md v1.2 §3.5 / Q16 — ZERO wayfinding overlays, asserted at the
 * render pass, not by pixel diff.
 *
 * The r297 yellow centreline and the yellow rival arrows are ERASED with no
 * replacement: no ribbon mesh in the scene graph, no gate arrow, no rival
 * arrows, no WRONG WAY banner — on OR off the course. The course polyline
 * survives as data (the route still gates, returns and logs; test-route and
 * test-patch13 own those laws). The one arrow allowed to exist is a missile
 * threat warning, which is combat information, not guidance.
 *
 *   node tests/test-overlays.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg, extra); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
const errors = [];
p.on('pageerror', (e) => errors.push(String(e.message)));
await p.goto(`${BASE}/?level=4&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
  undefined, { timeout: 180000 });

const R = await p.evaluate(async () => {
  const g = window.__game;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
    get elapsedTime() { return elapsed; } };
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g._frameBody(); }

  // the scene graph holds no line: nothing named like a ribbon, and no
  // mesh drawing the course polyline
  let ribbons = 0;
  g.scene.traverse((o) => { if (/route-ribbon|course-line/i.test(o.name ?? '')) ribbons++; });
  const routeHasRibbon = !!g.route?.ribbon;

  // ON the course: no arrows of any kind while racing normally
  g._frameBody();
  const countArrows = () => [...document.querySelectorAll('#edge-arrows .earrow, .gatearrow')]
    .filter((a) => a.style.display !== 'none').length;
  const onCourse = countArrows();

  // OFF the course, wrong way, mid-grace — the loudest the old overlays
  // ever got. Strand the player far off the line, facing backwards, with
  // the missed-gate clock running, and hold there for 2 s of frames.
  const pl = g.player, t = g.track, N = t.center.length;
  const c = t.center[(pl.trackIndex + 60) % N], n = t.nrm[(pl.trackIndex + 60) % N];
  pl.pos.set(c.x + n.x * 40, c.y + 2, c.z + n.z * 40);
  pl.heading += Math.PI;                       // wrong way
  pl.vel.set(0, 0, 0);
  let worst = 0;
  for (let f = 0; f < 120; f++) { g._frameBody(); worst = Math.max(worst, countArrows()); }
  const banner = document.getElementById('wrong-way');
  const feedTexts = [...document.querySelectorAll('#feed .feed-msg, #danger-lane .dmsg, #center-msg')]
    .map((e) => e.textContent).join(' | ');

  return { ribbons, routeHasRibbon, onCourse, offCourseWorst: worst,
    bannerExists: !!banner, feedTexts,
    routeAlive: (g.route?.gates?.length ?? 0) > 0 };
});

ok(R.ribbons === 0 && !R.routeHasRibbon,
  'Q16: no course-line mesh exists in the scene graph — data only',
  `${R.ribbons} ribbon nodes, route.ribbon=${R.routeHasRibbon}`);
ok(R.onCourse === 0, 'Q16: racing on the line renders zero arrows', `${R.onCourse}`);
ok(R.offCourseWorst === 0,
  'Q16: off course, wrong way, mid-grace — still zero overlays',
  `worst frame showed ${R.offCourseWorst} arrows`);
ok(!R.bannerExists, 'the WRONG WAY banner element no longer exists');
ok(!/WRONG WAY|OFF THE COURSE|TURN BACK|CHECKPOINT/.test(R.feedTexts),
  'no lane carries a scolding', R.feedTexts ? `saw: "${R.feedTexts.slice(0, 80)}"` : '');
ok(R.routeAlive, 'the route survives as data — gates still exist for the race');
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
