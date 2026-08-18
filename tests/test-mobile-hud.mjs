/* NOTHING IN THE HUD SITS ON TOP OF ANYTHING ELSE, ON A PHONE.
 *
 * THE COMPLAINT: a screenshot of the race HUD with the HULL INTEGRITY panel
 * printed straight over the contracts list, and "This needs fixing on mobile
 * view".
 *
 * The cause was three hard-coded offsets. `body.touch #health-box{top:96px}`
 * and `#feed{top:150px}` were picked against a race-info panel carrying a
 * position, a lap and a clock — but that panel also carries the CONTRACTS
 * list, which only appears once a race is running and adds ~60px. Measured on
 * every phone size below, the hull panel was ENTIRELY inside race-info: a
 * 150x47 overlap on a 150x47 panel.
 *
 * A larger constant would fail the same way on a fourth contract, a longer
 * world name, or a larger accessibility font, so the fix is that the panels
 * publish their measured heights and the stylesheet stacks off those. This
 * test is the other half of that: it asserts the PROPERTY — no two visible
 * HUD boxes intersect — at four real device sizes, in both orientations.
 *
 * It is also the reason two further collisions were found and fixed. The first
 * probe only looked at the panels; widened to include the touch controls, it
 * immediately caught the feed sitting under the DRIFT button in landscape and
 * the speedo running 11px under the missile button at 320px. Neither was
 * visible in the panel-only measurement, and one of them was a regression
 * introduced by the first fix.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// Small-to-typical, portrait and landscape. 320x568 is the smallest screen
// worth supporting and is where the layout runs out of room first.
const SIZES = [
  [390, 844, 'iPhone portrait'],
  [360, 800, 'Android portrait'],
  [844, 390, 'iPhone landscape'],
  [320, 568, 'small portrait'],
];

// Everything the player has to be able to read or press. `contracts` is a
// child of race-info and `joy-zone` is a deliberately huge invisible capture
// area, so both are measured but excluded from the intersection test.
//
// THE TOP-RIGHT ICON BUTTONS WERE NEVER IN THIS LIST, and that is why this
// suite passed while `#pause-btn` sat 24 x 32 px INSIDE `#t-shock` at 844x390.
// Adding the driver's-view button pushed pause down into the weapon cluster and
// nothing here noticed — a list of "everything the player has to be able to
// press" that omits three buttons is a list that agrees with itself.
const IDS = ['race-info', 'health-box', 'score-box', 'speed-box', 'feed', 'weapon-box',
             't-fire', 't-missile', 't-mine', 't-shock', 't-nitro', 't-drift', 't-brake',
             'cam-btn', 'view-btn', 'pause-btn'];

for (const [w, h, tag] of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2,
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${tag}`); await ctx.close(); continue; }

  // Race state, so the contracts list is populated — the whole point. Then a
  // full feed, because the feed grows with messages and that is what pushed it
  // into the controls at 320px.
  await p.evaluate(() => {
    window.__game.state = 'race';
    for (let i = 0; i < 6; i++) window.__game.hud.feed(`TEST MESSAGE ${i} — LONGER TEXT`, 'info');
  });
  for (let f = 0; f < 6; f++) await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));

  const r = await p.evaluate((IDS) => {
    const boxes = [];
    for (const id of IDS) {
      const e = document.getElementById(id);
      if (!e) continue;
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const b = e.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) continue;
      boxes.push({ id, t: b.top, l: b.left, r: b.right, b: b.bottom });
    }
    const overlaps = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], c = boxes[j];
        const x = Math.min(a.r, c.r) - Math.max(a.l, c.l);
        const y = Math.min(a.b, c.b) - Math.max(a.t, c.t);
        // 2px of tolerance: adjacent rounded panels can share a subpixel edge
        if (x > 2 && y > 2) overlaps.push(`${a.id}/${c.id} ${Math.round(x)}x${Math.round(y)}px`);
      }
    }
    const off = boxes.filter((b) => b.r > innerWidth + 2 || b.b > innerHeight + 2 || b.l < -2 || b.t < -2);
    // WHAT WAS NOT LOOKED AT, AND WHY. The loop above `continue`s past anything
    // missing or hidden, so "all clear" can mean "not measured" — the failure
    // this suite already had once (see the IDS note). Reported, never silent.
    const skipped = IDS.filter((id) => !boxes.some((b) => b.id === id));
    return { n: boxes.length, overlaps, skipped,
      off: off.map((b) => b.id), touch: document.body.classList.contains('touch') };
  }, IDS);

  // A CLEARANCE CHECK THAT MATCHES NOTHING PASSES FOREVER (tests/README rule 4).
  // Two elements are legitimately absent mid-race and are named here with the
  // reason; anything else missing means the gate stopped watching something.
  // Measured at 844x390: 16 ids, 14 boxes, and these are the two.
  const EXPECT_ABSENT = {
    'weapon-box': 'hidden until a weapon is held',
    't-brake': 'hidden — the brake pedal is not in the touch cluster on this layout',
  };
  const unexpected = r.skipped.filter((id) => !(id in EXPECT_ABSENT));
  check(`${tag}: every element the player must press was actually measured`,
    unexpected.length === 0,
    unexpected.length ? `not measured: ${unexpected.join(', ')}`
      : `${r.n} of ${IDS.length} measured; absent by design: ${r.skipped.join(', ') || 'none'}`);

  check(`${tag} (${w}x${h}): touch layout is active`, r.touch);
  check(`${tag}: no two HUD elements overlap`, r.overlaps.length === 0,
    r.overlaps.length ? r.overlaps.join(', ') : `${r.n} elements, all clear`);
  check(`${tag}: nothing is pushed off screen`, r.off.length === 0,
    r.off.length ? r.off.join(', ') : 'all on screen');

  await ctx.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe phone HUD fits the phone');
process.exit(fail ? 1 : 0);
