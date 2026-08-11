/* CAN YOU ACTUALLY DRIVE THIS ON A PHONE?
 *
 * dustline had no touch input at all: `core/input.ts` was keyboard and gamepad,
 * so on a phone the car did not move. The controls have now been ported from
 * IGNITE RALLY, and the question this file exists to answer is not "was the
 * code written" but "does a thumb move the car" — because those are different
 * questions and only one of them is the one the owner asks when they pick up
 * their phone.
 *
 * So nothing here reads source. It loads the BUILT bundle in an emulated
 * portrait phone with a real touch screen, dispatches real touch events at the
 * steering pad through the DevTools input domain — the same path a finger
 * takes, not a synthesised DOM event object — and then measures where the car
 * ended up.
 *
 * FOUR THINGS ARE ASSERTED, in the order they can fail on a real phone:
 *
 *   1. THE CONTROLS ARE THERE, and only there. A coarse pointer gets the
 *      overlay and a bound joystick; a desktop gets neither — not a hidden
 *      overlay, not a listener — and its keyboard still drives.
 *   2. YOU CAN HIT THEM. Every press target at least 44 CSS px on its smaller
 *      axis, nothing overlapping anything else, nothing off screen, and
 *      nothing under an iPhone's notch or home indicator. Both control
 *      schemes, four screens.
 *   3. THE CAR DRIVES. The one that matters. A thumb at full deflection has to
 *      move the car a real distance, and a thumb held to one side has to turn
 *      it the way the keyboard turns it.
 *   4. AND THE PAGE STAYS PUT while you do it — no scroll, no zoom, no
 *      rubber-band. A steering drag that pans the page is not a steering drag.
 *
 * MEASURED FIXED-STEP, WHICH IS THE ONLY KIND OF MEASURING THERE IS HERE.
 * COORDINATION.md, learned the hard way: headless SwiftShader runs these
 * worlds at a few fps with dt capped, so a wall-clock probe runs the
 * simulation at roughly one-eighth speed and every wall-clock observation is
 * an artifact. This tool stops the render loop outright (`__dust.loop.stop()`)
 * and then advances the world only through `__dust.fastForward(n)`, which
 * steps FIXED_DT. After that the numbers below are frame-rate-free: the same
 * 240 ticks on a fast machine and a slow one are the same two seconds of car.
 *
 * THE NEGATIVE CONTROL IS PART OF THE CHECK. An idle run — same reset, same
 * 240 ticks, no thumb — has to leave the car where it was. Without it, "the
 * car moved 17 m" is equally good evidence for a slope.
 *
 *   npx vite build
 *   node tools/verify-mobile.mjs
 *   node tools/verify-mobile.mjs --table    # every control, every screen
 *
 *   DIST=/some/other/dist BASE=http://localhost:8914/ node tools/verify-mobile.mjs
 *     — point it at a different build, which is how the drive assertion was
 *       proven to go red (see the mutation note at the bottom of this file).
 */
import { chromium } from 'playwright-core';
import { ensureServer } from './serve.mjs';

const TABLE = process.argv.includes('--table');

const BASE = process.env.BASE || 'http://localhost:8913/';
const DIST = process.env.DIST || '../play-dustline';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// Any track would do for a drive test; this one is the flat proving ground,
// which is the one place a "did it move" measurement cannot be confounded by
// a hill. Overridable so a suspicious track can be driven the same way.
const TRACK = process.env.TRACK || 'proving-ground';

/* ---- what a phone is, for this check -------------------------------------
 * Real screens, because the layout has media queries at 360 px and 520 px of
 * height and an untested branch is an unmeasured one. */
const SCREENS = [
  { name: 'iPhone 14/15 portrait', w: 390, h: 844, sa: { t: 59, r: 0, b: 34, l: 0 } },
  { name: 'Android portrait', w: 360, h: 800, sa: { t: 24, r: 0, b: 24, l: 0 } },
  { name: 'iPhone SE portrait', w: 320, h: 568, sa: { t: 20, r: 0, b: 0, l: 0 } },
  { name: 'iPhone landscape', w: 844, h: 390, sa: { t: 0, r: 59, b: 21, l: 59 } },
];
/* The insets above are the real ones a browser reports through
 * `env(safe-area-inset-*)`: 59 px for a Dynamic Island / notch under the
 * status bar, 34 px for the home indicator, 21 px for the same indicator
 * lying down, 59 px for the notch side in landscape (applied to BOTH sides
 * here, because which side the notch lands on depends on which way the phone
 * was turned and a control may not depend on that). A 320×568 SE has neither,
 * only a 20 px status bar, and an Android's are the status and gesture bars.
 * Headless Chromium reports all of them as 0, so the check sets them itself —
 * which is the only way to find out whether the CSS pays them back. */

// Apple's HIG says 44 pt, Android's Material says 48 dp; 44 is the floor both
// agree is a fingertip. Below it the press lands next to the button.
const MIN_TARGET = 44;

/* How much of a control an inset band may cover before it counts as being
 * under the notch. NOT ZERO, and the reason is verify-physics.mjs's reason:
 * a check that flags a one-pixel graze of a bounding box spends its life
 * crying wolf and gets switched off. What is measured is the FRACTION OF THE
 * CONTROL the band eats, so a button half under the home indicator is a
 * failure at 50% and a round ring whose bbox corner touches the line by a
 * pixel is 0.8% and is not. A tenth is where a rim visibly clips and a label
 * starts losing letters. The worst measured intrusion is printed either way,
 * so a drift from 0.8% to 9% is visible before it is a failure. */
const MAX_INSET_COVER = 0.10;

/* ---- how long a drive is, in ticks --------------------------------------- */
const HZ = 120;                 // core/loop.ts FIXED_HZ; fastForward steps 1/120
const DRIVE_TICKS = 2 * HZ;     // 2.0 s of car, long enough to leave the grid
const SETTLE_TICKS = HZ / 2;    // 0.5 s to drop onto the terrain after a reset
const COUNTDOWN_TICKS = 4 * HZ; // data/race.json countdownSec is 3; a second spare

// A car that cannot beat walking pace with the throttle wide open is not
// drivable — 5 m in 2 s is 9 km/h. The bar is deliberately far under what a
// working build does (17.3 m, 57 km/h on the proving ground) so that it fails
// only when the thumb is not reaching the simulation at all, which is the
// defect it is here to catch.
const MIN_DRIVE_M = 5.0;
// The same run with no thumb on the glass. Rapier settles a suspension by a
// few centimetres; 0.5 m is that and nothing else.
const MAX_IDLE_M = 0.5;
// Two seconds of held lock turns this car 46°. 10° is "the steering is
// connected", not "the steering is good".
const MIN_YAW_DEG = 10;

const stopServer = await ensureServer(BASE, DIST);

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

// ---------------------------------------------------------------------------
// the phone
// ---------------------------------------------------------------------------
const phone = await browser.newContext({
  viewport: { width: SCREENS[0].w, height: SCREENS[0].h },
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true,
});
const page = await phone.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.split('\n')[0]));

// `?track=` skips the picker, which is what makes this deterministic: the
// controls come up as soon as the track resolves, and no tap on a card stands
// between the tool and the car. (That the picker is reachable and scrollable
// on a phone is a separate concern and not this file's.)
await page.goto(`${BASE}index.html?track=${TRACK}&nopost`, { waitUntil: 'load' });

// The touch controls are built after `chooseTrack()` resolves and the world is
// up, so waiting for the game's own hook is also waiting for them.
let booted = true;
try {
  await page.waitForFunction(() => window.__dust, null, { timeout: 120000 });
} catch {
  booted = false;
}
check(booted, 'the built bundle boots on a phone-sized touch device',
  booted ? `${DIST} at ${SCREENS[0].w}×${SCREENS[0].h}` : 'no window.__dust after 120 s — nothing below could be measured');
if (!booted) {
  console.log(`\n${fails} FAILED`);
  await browser.close();
  await stopServer?.();
  process.exit(1);
}

const cdp = await phone.newCDPSession(page);
/** A real touch, down the same pipe a finger uses. Playwright's own
 *  `page.touchscreen` cannot hold a drag across several moves. */
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', {
  type,
  touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1, radiusX: 12, radiusY: 12, force: 1 }],
});

// ---------------------------------------------------------------------------
// 1. the controls exist on a touch device
// ---------------------------------------------------------------------------
const up = await page.evaluate(() => {
  const de = document.documentElement;
  const ui = document.getElementById('touch-ui');
  return {
    coarse: matchMedia('(pointer: coarse)').matches,
    touchClass: de.classList.contains('touch'),
    markup: !!ui,
    on: !!ui && ui.classList.contains('on'),
    display: ui ? getComputedStyle(ui).display : 'no #touch-ui',
    // The joystick's re-place hook is null until bindJoystick has run, so this
    // is the difference between markup on the page and a pad wired to the car.
    bound: !!window.__dust.input.resetJoystick,
    speedo: !!document.getElementById('speedo'),
  };
});
check(up.coarse && up.touchClass,
  'an emulated phone reports a coarse pointer and gets the touch stylesheet',
  `(pointer: coarse) = ${up.coarse}, html.touch = ${up.touchClass}`);
check(up.markup && up.on && up.display !== 'none' && up.bound,
  'the on-screen controls are built, shown and bound to the input system',
  up.bound && up.on ? `#touch-ui.on display:${up.display}, joystick bound, #speedo ${up.speedo ? 'present' : 'MISSING'}`
    : !up.markup ? '#touch-ui is not in index.html'
      : !up.bound
        ? 'the markup is on the page but nothing bound it: main.ts never calls initTouchControls(input) — '
          + "add `import { initTouchControls } from './ui/touch'`, "
          + '`const touch = initTouchControls(input);` after `new Input()`, and '
          + '`touch?.update(playerCtrl.speedKmh, playerCtrl.nitroActive);` next to hud.update'
        : `#touch-ui never got .on (display:${up.display})`);

// ---------------------------------------------------------------------------
// 2. and you can hit them — every screen, both schemes
// ---------------------------------------------------------------------------
//
// The pad is measured as two different things on purpose: #joy-zone is the
// capture area (a press anywhere in it starts a steer, so it is what must not
// collide with a button) and #joy-base is the ring you aim at (so it is what
// must be big enough, on screen, and clear of the notch). The ring is placed
// by JS from the zone's measured bounds, not by CSS, which is exactly why it
// has to be measured after every resize rather than reasoned about.
//
// #speedo is a READOUT, not a target: it has pointer-events:none, and it sits
// inside the pad's capture zone at every portrait size. That is deliberate —
// the alternative is a dead patch in the middle of the steering pad — so it is
// held to "on screen and clear of the insets" and excluded from the overlap
// rule, which is about two PRESSES being ambiguous.
const layout = async (screen, scheme) => page.evaluate(({ sa, scheme }) => {
  const de = document.documentElement;
  // Headless reports env(safe-area-inset-*) as 0. Setting the variables the
  // stylesheet reads is the only way to ask "does this layout pay the notch
  // back", and an inline style on :root beats the rule that defines them.
  for (const [k, v] of Object.entries(sa)) de.style.setProperty(`--sa-${k}`, `${v}px`);
  de.getBoundingClientRect(); // force the reflow before we measure it

  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { id: el.id, x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  };
  const vis = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getBoundingClientRect().width > 0;
  };
  const btns = Array.from(document.querySelectorAll('#touch-ui .tbtn')).filter(vis);
  return {
    scheme,
    zone: box(document.getElementById('joy-zone')),
    ring: box(document.getElementById('joy-base')),
    // enabled buttons are press targets; a disabled one is drawn but
    // pointer-events:none, so it is checked for placement and not for size
    targets: btns.filter((b) => !b.hasAttribute('disabled')).map(box),
    drawn: btns.map(box),
    gauge: box(document.getElementById('speedo')),
    vw: innerWidth, vh: innerHeight,
  };
}, { sa: screen.sa, scheme });

const overlap = (a, b) => {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return ox > 0.5 && oy > 0.5 ? `${a.id}∩${b.id} ${ox.toFixed(0)}×${oy.toFixed(0)}px` : null;
};
const inside = (r, x0, y0, x1, y1) =>
  r.x >= x0 - 0.5 && r.y >= y0 - 0.5 && r.x + r.w <= x1 + 0.5 && r.y + r.h <= y1 + 0.5;
/** Fraction of `r` lying outside the box — i.e. eaten by an inset band. */
const covered = (r, x0, y0, x1, y1) => {
  const ix = Math.max(0, Math.min(r.x + r.w, x1) - Math.max(r.x, x0));
  const iy = Math.max(0, Math.min(r.y + r.h, y1) - Math.max(r.y, y0));
  return 1 - (ix * iy) / (r.w * r.h);
};

const tooSmall = [], collisions = [], offScreen = [], inNotch = [], ringLoose = [];
let worstInset = { frac: 0, what: 'nothing' };
const rows = [];
for (const screen of SCREENS) {
  await page.setViewportSize({ width: screen.w, height: screen.h });
  for (const scheme of ['1 THUMB', '2 THUMB']) {
    // The scheme is changed the way a player changes it — by pressing the
    // button — so this also measures that the button works through touch.
    const want2 = scheme === '2 THUMB';
    const now2 = await page.evaluate(() => document.documentElement.classList.contains('thumbs2'));
    if (now2 !== want2) await page.locator('#t-thumbs').tap();
    const L = await layout(screen, scheme);
    const where = `${screen.name} ${screen.w}×${screen.h} ${scheme}`;
    rows.push({ where, L });

    // the pad's ring plus every enabled button has to be a fingertip across
    for (const t of [L.ring, ...L.targets]) {
      if (Math.min(t.w, t.h) < MIN_TARGET) tooSmall.push(`${where} ${t.id} ${t.w}×${t.h}`);
    }
    // nothing drawn may leave the screen
    for (const t of [L.ring, ...L.drawn, L.gauge]) {
      if (!inside(t, 0, 0, L.vw, L.vh)) offScreen.push(`${where} ${t.id} at ${t.x},${t.y} ${t.w}×${t.h}`);
    }
    // no two presses may be ambiguous: the pad's capture zone against every
    // button, and the buttons against each other
    const press = [{ ...L.zone }, ...L.drawn];
    for (let i = 0; i < press.length; i++) {
      for (let j = i + 1; j < press.length; j++) {
        const o = overlap(press[i], press[j]);
        if (o) collisions.push(`${where} ${o}`);
      }
    }
    // and nothing you must see or press may sit under the notch or the home
    // indicator (the capture zone may — it is invisible, and the pad floats to
    // wherever the thumb actually lands)
    for (const t of [L.ring, ...L.drawn, L.gauge]) {
      const eaten = covered(t, screen.sa.l, screen.sa.t, L.vw - screen.sa.r, L.vh - screen.sa.b);
      if (eaten > worstInset.frac) worstInset = { frac: eaten, what: `${where} ${t.id}` };
      if (eaten > MAX_INSET_COVER) {
        inNotch.push(`${where} ${t.id} ${(eaten * 100).toFixed(0)}% under the band, at ${t.x},${t.y} ${t.w}×${t.h}`);
      }
    }
    // the resting ring is positioned in script from the zone's bounds; if a
    // resize left it hanging outside its own capture area, pressing it would
    // do nothing at all
    if (!inside(L.ring, L.zone.x, L.zone.y, L.zone.x + L.zone.w, L.zone.y + L.zone.h)) {
      ringLoose.push(`${where} ring ${L.ring.x},${L.ring.y} vs zone ${L.zone.x},${L.zone.y} ${L.zone.w}×${L.zone.h}`);
    }
  }
}
// back to the scheme and the screen the drive is measured on
if (await page.evaluate(() => document.documentElement.classList.contains('thumbs2'))) {
  await page.locator('#t-thumbs').tap();
}
await page.setViewportSize({ width: SCREENS[0].w, height: SCREENS[0].h });
await page.evaluate(() => {
  for (const k of ['t', 'r', 'b', 'l']) document.documentElement.style.removeProperty(`--sa-${k}`);
});

if (TABLE) {
  // Coordinates as measured WITH that screen's safe-area insets applied, which
  // is where the control sits on the phone rather than where the CSS would put
  // it on a rectangle: on a 390×844 that moves the top-left rail down by 59 px.
  console.log('\nscreen / scheme'.padEnd(42) + 'control'.padEnd(11) + 'x,y (insets applied)'.padEnd(14) + 'w×h');
  console.log('-'.repeat(88));
  for (const { where, L } of rows) {
    for (const t of [L.zone, L.ring, ...L.drawn, L.gauge]) {
      console.log(where.padEnd(42) + t.id.padEnd(11) + `${t.x},${t.y}`.padEnd(14) + `${t.w}×${t.h}`);
    }
  }
  console.log('');
}

const layouts = SCREENS.length * 2;
check(tooSmall.length === 0,
  `every press target is at least ${MIN_TARGET} CSS px on its smaller axis (${layouts} layouts)`,
  tooSmall.join(' | '));
check(collisions.length === 0,
  'no two press targets overlap, on any screen, in either scheme',
  collisions.length
    ? `${collisions.join(' | ')} — a button inside the pad's capture zone is a hole in the steering`
    : `${layouts} layouts`);
check(offScreen.length === 0, 'nothing drawn falls off the screen', offScreen.join(' | '));
check(inNotch.length === 0,
  `no control loses more than ${MAX_INSET_COVER * 100}% of itself to a notch or a home indicator`,
  inNotch.length ? inNotch.join(' | ')
    : `worst intrusion ${(worstInset.frac * 100).toFixed(1)}% (${worstInset.what})`);
check(ringLoose.length === 0,
  "the pad's resting ring stays inside its own capture zone after every resize",
  ringLoose.join(' | '));

// ---------------------------------------------------------------------------
// 3. THE CAR ACTUALLY DRIVES
// ---------------------------------------------------------------------------
//
// Everything above is dressing. This is the check.
await page.evaluate(() => {
  const d = window.__dust;
  // Kill the render loop: from here the ONLY thing that advances the world is
  // fastForward, so the numbers are counts of fixed steps and not of frames a
  // software rasteriser happened to manage.
  d.loop.stop();
  // Pin the three AI cars on the grid. They share it with the player, and a
  // rival that pulls away — or does not — changes what the player's own
  // 2 seconds look like: the same thumb drag measured 14.6 m with the field
  // live and 17.3 m without it. The question here is what the THUMB does, so
  // the other cars are held still and the player drives forward out of the
  // grid, away from all three. It also stops this check drifting every time
  // somebody in another lane tunes `ai/driver.ts`.
  const PARKED = {
    throttle: 0, brake: 0, steer: 0, handbrake: true, nitro: false,
    fire: false, rearFire: false, lookBack: false, reset: false, usingGamepad: false,
  };
  for (const r of d.racers) if (r.driver) r.driver.update = () => PARKED;
  window.__mob = {
    // Put the car back on its grid slot exactly the way main.ts places it, so
    // every scenario starts from the same state and the distances compare.
    reset() {
      const slot = d.director.gridSlot(0);
      const b = d.car.body;
      b.setTranslation({ x: slot.x, y: d.terrain.heightAt(slot.x, slot.z) + 1.0, z: slot.z }, true);
      b.setRotation({ x: 0, y: Math.sin(slot.heading / 2), z: 0, w: Math.cos(slot.heading / 2) }, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      b.setAngvel({ x: 0, y: 0, z: 0 }, true);
    },
    pose() {
      const t = d.car.body.translation(), q = d.car.body.rotation();
      return { x: t.x, z: t.z, yaw: Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z)) };
    },
  };
});
const ff = (n) => page.evaluate((k) => window.__dust.fastForward(k), n);

// The player's input is ignored until the lights go out (main.ts feeds IDLE
// during the countdown), so the countdown is stepped away first.
await ff(COUNTDOWN_TICKS);
const raceState = await page.evaluate(() => window.__dust.director.state);

// where the thumb goes: the resting ring's centre, which is where a thumb
// lands, and the drag is measured in the pad's own JOY_R = 62 px of travel
const padAt = await page.evaluate(() => {
  const b = document.getElementById('joy-base').getBoundingClientRect();
  return { cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
});
const R = 62;
const DIAG = Math.round(R * 0.707); // full deflection, 45° between steer and throttle

/** One drive, from an identical reset, under one held control. */
async function drive(name, hold) {
  await page.evaluate(() => window.__mob.reset());
  await ff(SETTLE_TICKS);
  const a = await page.evaluate(() => window.__mob.pose());
  await hold.down();
  const axes = await page.evaluate(() => ({ ...window.__dust.input.analog }));
  await ff(DRIVE_TICKS);
  const st = await page.evaluate(() => ({ ...window.__dust.input.state }));
  const b = await page.evaluate(() => window.__mob.pose());
  await hold.up();
  const rest = await page.evaluate(() => ({ ...window.__dust.input.analog }));
  let dyaw = b.yaw - a.yaw;
  while (dyaw > Math.PI) dyaw -= 2 * Math.PI;
  while (dyaw < -Math.PI) dyaw += 2 * Math.PI;
  return {
    name, axes, rest,
    steer: st.steer, throttle: st.throttle,
    dist: Math.hypot(b.x - a.x, b.z - a.z),
    yawDeg: dyaw * 180 / Math.PI,
  };
}
const pad = (dx, dy) => ({
  down: async () => {
    await touch('touchStart', padAt.cx, padAt.cy);
    await touch('touchMove', padAt.cx + dx, padAt.cy + dy);
  },
  up: () => touch('touchEnd', padAt.cx + dx, padAt.cy + dy),
});
const keys = (...codes) => ({
  down: async () => { for (const c of codes) await page.keyboard.down(c); },
  up: async () => { for (const c of codes) await page.keyboard.up(c); },
});

const straight = await drive('thumb full up', pad(0, -R));
const left = await drive('thumb up-left', pad(-DIAG, -DIAG));
const right = await drive('thumb up-right', pad(DIAG, -DIAG));
// The ground truth for "the correct direction" is not my arithmetic about
// quaternions, it is the control the owner has already driven: W+A on the
// keyboard. A thumb dragged left must turn the car the way the A key turns it.
const keyLeft = await drive('keyboard W+A', keys('w', 'a'));
// The negative control. Same reset, same 240 ticks, nothing held.
const idle = await drive('nothing held', { down: async () => {}, up: async () => {} });

console.log('');
for (const d of [straight, left, right, keyLeft, idle]) {
  console.log(`      ${d.name.padEnd(15)} steer ${d.steer.toFixed(3).padStart(6)}  throttle ${d.throttle.toFixed(3)}  `
    + `→ ${d.dist.toFixed(2)} m, ${d.yawDeg >= 0 ? '+' : ''}${d.yawDeg.toFixed(1)}° in ${DRIVE_TICKS} fixed ticks (${DRIVE_TICKS / HZ} s)`);
}
console.log('');

check(raceState === 'race', 'the countdown clears under fixed stepping so the player has control',
  `director.state = ${raceState} after ${COUNTDOWN_TICKS} ticks`);

check(straight.axes.throttle > 0.99 && Math.abs(straight.axes.steer) < 0.01,
  'a thumb dragged to full travel opens the throttle and nothing else',
  `analog = throttle ${straight.axes.throttle.toFixed(3)}, steer ${straight.axes.steer.toFixed(3)}, brake ${straight.axes.brake.toFixed(3)}`);

check(straight.dist >= MIN_DRIVE_M && idle.dist <= MAX_IDLE_M,
  `THE CAR DRIVES: a thumb on the glass moves it at least ${MIN_DRIVE_M} m in ${DRIVE_TICKS / HZ} s, and nothing else does`,
  `thumb ${straight.dist.toFixed(2)} m (${(straight.dist / (DRIVE_TICKS / HZ) * 3.6).toFixed(0)} km/h avg), `
  + `idle ${idle.dist.toFixed(2)} m (limit ${MAX_IDLE_M})`);

const sameWay = Math.sign(left.yawDeg) === Math.sign(keyLeft.yawDeg);
const opposed = Math.sign(left.yawDeg) === -Math.sign(right.yawDeg);
const turned = Math.abs(left.yawDeg) >= MIN_YAW_DEG && Math.abs(right.yawDeg) >= MIN_YAW_DEG;
check(sameWay && opposed && turned && keyLeft.dist >= MIN_DRIVE_M,
  `THE STEERING IS CONNECTED AND THE RIGHT WAY ROUND: a thumb held left turns the car the way the A key does, at least ${MIN_YAW_DEG}°`,
  `thumb-left ${left.yawDeg.toFixed(1)}°, keyboard-left ${keyLeft.yawDeg.toFixed(1)}°, thumb-right ${right.yawDeg.toFixed(1)}°`
  // A dead pad and an inverted pad are different bugs and the message has to
  // say which: sign(0) is not sign(x) either, so "opposite" would be a lie
  // about a pad that simply did nothing.
  + (!turned ? ' — the pad did not turn the car at all'
    : !sameWay ? ' — THE PAD STEERS THE OPPOSITE WAY TO THE KEYBOARD'
      : !opposed ? ' — left and right turn the car the same way' : ''));

check(straight.rest.steer === 0 && straight.rest.throttle === 0 && straight.rest.brake === 0
  && left.rest.steer === 0 && right.rest.steer === 0,
  'lifting the thumb re-centres every axis (a stuck axis is a car that drives itself)',
  `after release: ${JSON.stringify(straight.rest)}`);

// DRIFT is the one other control that matters mid-corner: it is the handbrake,
// and the handbrake is what makes the car drift.
const drift = await page.evaluate(() => {
  const b = document.getElementById('t-drift').getBoundingClientRect();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
});
await touch('touchStart', drift.x, drift.y);
await ff(2);
const held = await page.evaluate(() => ({
  handbrake: window.__dust.input.state.handbrake,
  lit: document.getElementById('t-drift').classList.contains('active'),
}));
await touch('touchEnd', drift.x, drift.y);
await ff(2);
const let_go = await page.evaluate(() => window.__dust.input.state.handbrake);
check(held.handbrake && held.lit && !let_go,
  'DRIFT reaches the simulation: pressing it pulls the handbrake and lights the button, releasing it lets go',
  `held: handbrake ${held.handbrake}, .active ${held.lit}; released: handbrake ${let_go}`);

// ---------------------------------------------------------------------------
// 4. and the page does not move while you steer
// ---------------------------------------------------------------------------
//
// `scrollY === 0` on its own proves nothing here — the document does not
// overflow, so it could not scroll if it tried. The measurement that means
// something is whether the pad's own touchmove handler called
// preventDefault(): that call is what stops the browser from turning a
// steering drag into a pan on a page that CAN scroll, and a listener
// registered `passive` would have had the call ignored. So a window listener
// downstream of the pad's reads back what the pad decided.
await page.evaluate(() => {
  window.__pd = [];
  const h = (e) => window.__pd.push({ type: e.type, prevented: e.defaultPrevented });
  addEventListener('touchstart', h);
  addEventListener('touchmove', h);
});
await touch('touchStart', padAt.cx, padAt.cy);
await touch('touchMove', padAt.cx - 30, padAt.cy - 40);
await touch('touchMove', padAt.cx - 48, padAt.cy - 55);
await touch('touchEnd', padAt.cx - 48, padAt.cy - 55);
const still = await page.evaluate(() => ({
  events: window.__pd,
  scrollY: scrollY, scrollX: scrollX,
  scale: visualViewport.scale,
  htmlTA: getComputedStyle(document.documentElement).touchAction,
  canvasTA: getComputedStyle(document.getElementById('app')).touchAction,
  uiTA: getComputedStyle(document.getElementById('touch-ui')).touchAction,
  // ui/touch.ts blocks iOS pinch-zoom, which ignores user-scalable=no
  gestureBlocked: !document.dispatchEvent(new Event('gesturestart', { cancelable: true, bubbles: true })),
  meta: document.querySelector('meta[name=viewport]')?.content ?? '',
}));
const allPrevented = still.events.length >= 3 && still.events.every((e) => e.prevented);
check(allPrevented && still.scrollY === 0 && still.scrollX === 0 && still.scale === 1,
  'a steering drag scrolls nothing and zooms nothing',
  `${still.events.length} touch events, all preventDefault()ed: ${allPrevented}; `
  + `scroll ${still.scrollX},${still.scrollY}; visual viewport scale ${still.scale}`);
check(still.canvasTA === 'none' && still.uiTA === 'none' && still.htmlTA === 'manipulation' && still.gestureBlocked,
  'the surfaces a thumb drives on opt out of browser gestures, and the document keeps only the ones the picker needs',
  `#app touch-action:${still.canvasTA}, #touch-ui:${still.uiTA}, html:${still.htmlTA} `
  + `(so the track list can still be dragged), gesturestart blocked: ${still.gestureBlocked}`);

check(errs.length === 0, 'no page errors on the phone', errs.slice(0, 3).join(' | '));

// ---------------------------------------------------------------------------
// 5. a desktop gets none of it, and still drives
// ---------------------------------------------------------------------------
const desk = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const dpage = await desk.newPage();
const derrs = [];
dpage.on('pageerror', (e) => derrs.push(e.message.split('\n')[0]));
await dpage.goto(`${BASE}index.html?track=${TRACK}&nopost`, { waitUntil: 'load' });
await dpage.waitForFunction(() => window.__dust, null, { timeout: 120000 });
const d = await dpage.evaluate(() => {
  const ui = document.getElementById('touch-ui');
  return {
    coarse: matchMedia('(pointer: coarse)').matches,
    touchClass: document.documentElement.classList.contains('touch'),
    display: ui ? getComputedStyle(ui).display : 'absent',
    bound: !!window.__dust.input.resetJoystick,
  };
});
check(!d.coarse && !d.touchClass && d.display === 'none' && !d.bound,
  'a desktop gets no thumb pads at all — no class, no visible overlay, no bound joystick',
  `(pointer: coarse) ${d.coarse}, html.touch ${d.touchClass}, #touch-ui display:${d.display}, joystick bound ${d.bound}`);

// ...and the keyboard path is untouched by any of it. The touch axes merge
// into the same InputState, so "desktop must not regress" is a measurement.
await dpage.evaluate(() => {
  const g = window.__dust;
  g.loop.stop();
  // Same freeze as the phone, and it is load-bearing here: without it this
  // measured 22.2 m and 22.6 m on two runs of the same build, because the
  // player is reset onto a grid slot a rival is by then driving through and
  // gets shoved down the road. Held still, the rivals cannot flatter it.
  const PARKED = {
    throttle: 0, brake: 0, steer: 0, handbrake: true, nitro: false,
    fire: false, rearFire: false, lookBack: false, reset: false, usingGamepad: false,
  };
  for (const r of g.racers) if (r.driver) r.driver.update = () => PARKED;
  window.__mob = {
    reset() {
      const slot = g.director.gridSlot(0);
      const b = g.car.body;
      b.setTranslation({ x: slot.x, y: g.terrain.heightAt(slot.x, slot.z) + 1.0, z: slot.z }, true);
      b.setRotation({ x: 0, y: Math.sin(slot.heading / 2), z: 0, w: Math.cos(slot.heading / 2) }, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      b.setAngvel({ x: 0, y: 0, z: 0 }, true);
    },
    pose() { const t = g.car.body.translation(); return { x: t.x, z: t.z }; },
  };
});
await dpage.evaluate((n) => window.__dust.fastForward(n), COUNTDOWN_TICKS);
await dpage.evaluate(() => window.__mob.reset());
await dpage.evaluate((n) => window.__dust.fastForward(n), SETTLE_TICKS);
const a0 = await dpage.evaluate(() => window.__mob.pose());
await dpage.keyboard.down('w');
const wThrottle = await dpage.evaluate(() => { window.__dust.input.poll(); return window.__dust.input.state.throttle; });
await dpage.evaluate((n) => window.__dust.fastForward(n), DRIVE_TICKS);
const a1 = await dpage.evaluate(() => window.__mob.pose());
await dpage.keyboard.up('w');
const deskDist = Math.hypot(a1.x - a0.x, a1.z - a0.z);
check(wThrottle === 1 && deskDist >= MIN_DRIVE_M,
  'the keyboard still drives on a desktop',
  `W → throttle ${wThrottle}, ${deskDist.toFixed(2)} m in ${DRIVE_TICKS / HZ} s`);
// The phone drove the same car, from the same grid slot, for the same 240
// ticks, on a thumb. If the touch merge in `poll()` were anything but the
// identity it claims to be when `analog` is all zeros, these two numbers would
// not be the same number. 0.25 m is 1.7% of the drive — enough slack for two
// browser contexts, far too little to hide a changed input path. Kept separate
// from the check above so that a dead pad fails THIS line and not the claim
// that a desktop keyboard works, which would still be true.
check(Math.abs(deskDist - straight.dist) < 0.25,
  'the touch merge is an identity: the key drives the car exactly as far as the thumb did',
  `keyboard ${deskDist.toFixed(2)} m vs thumb ${straight.dist.toFixed(2)} m, Δ ${Math.abs(deskDist - straight.dist).toFixed(3)} m`);
check(derrs.length === 0, 'no page errors on the desktop', derrs.slice(0, 3).join(' | '));

await browser.close();
await stopServer?.();

console.log(fails
  ? `\n${fails} FAILED`
  : `\nphone-drivable: ${straight.dist.toFixed(1)} m of car per two thumb-seconds, `
    + `${Math.abs(left.yawDeg).toFixed(0)}° of steering, and a desktop that never sees any of it`);
process.exit(fails ? 1 : 0);

/* PROVEN TO FAIL, which is the only way to know a check works.
 *
 * A check that has never been red is not known to work, so this one was made
 * to go red on purpose. The mutation was run against a COPY of this tree built
 * into a private directory with `DIST` pointed at it — nothing in the shared
 * tree was touched — and the edit was one line commented out of `ui/touch.ts`:
 *
 *   // input.bindJoystick(zone, base, knob);
 *
 * That is the smallest edit that leaves every control drawn, correctly sized,
 * correctly spaced and completely dead: the exact bug a check that only read
 * the DOM would wave through, and the exact bug that would put the owner on a
 * phone with a car that does not move.
 *
 * Rebuilt and re-run, it said (verbatim, trimmed):
 *
 *   FAIL  the on-screen controls are built, shown and bound to the input system
 *         — the markup is on the page but nothing bound it: main.ts never
 *           calls initTouchControls(input) — add ...
 *   FAIL  a thumb dragged to full travel opens the throttle and nothing else
 *         — analog = throttle 0.000, steer 0.000, brake 0.000
 *   FAIL  THE CAR DRIVES ... — thumb 0.00 m (0 km/h avg), idle 0.00 m
 *   FAIL  THE STEERING IS CONNECTED AND THE RIGHT WAY ROUND ...
 *         — thumb-left 0.0°, keyboard-left 92.8°, thumb-right 0.0°
 *           — the pad did not turn the car at all
 *   FAIL  a steering drag scrolls nothing and zooms nothing
 *         — 3 touch events, all preventDefault()ed: false
 *   FAIL  the touch merge is an identity ... — Δ 14.548 m
 *   FAIL  nothing drawn falls off the screen — joy-base at -62,258.7 ...
 *   FAIL  the pad's resting ring stays inside its own capture zone ...
 *   FAIL  no control loses more than 10% of itself to a notch ...
 *
 * Nine lines, on four screens, for one commented-out call. Three of them were
 * a surprise worth writing down: the ring's resting position is placed by
 * `bindJoystick`'s `rest()`, so an unbound pad also leaves the ring at its
 * CSS default — half of it off the left edge at x = −62. The geometry checks
 * catch the dead pad from a completely different direction than the drive
 * does, which is why they are worth their runtime.
 *
 * What stayed green is as much of the proof as what went red: DRIFT still
 * passed (`bindTouchButtons` is a separate binding, and the mutation did not
 * touch it), the 44 px and overlap rules still passed, the desktop still had
 * no thumb pads, and the desktop keyboard still drove its 14.55 m. A check
 * that goes red everywhere when you break one thing is not a check, it is an
 * alarm — this one named the thing that broke.
 *
 * The line was restored and the copy rebuilt; the tree this file lives in was
 * never modified.
 */
