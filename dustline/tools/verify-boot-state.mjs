/* DOES THE FIRST PAINT TELL THE TRUTH, AND IS A TAP A TAP OR A FREEZE?
 *
 * Two failures from IGNITE RALLY, which on inspection are one failure:
 *
 *   BUGS.md #5 — the START button read "START RACE", unblocked, on five worlds
 *   that refused to start. `_syncStartButton()` (`src/main.js:1813`) ran on a
 *   level pick, a car pick, an upgrade and a mode switch and NEVER ON BOOT, so
 *   the button was only correct after you had already pressed it once. Its own
 *   doc comment said the opposite was intended: "A button that looks armed and
 *   then refuses is worse than one that tells you first." COORDINATION.md
 *   records the same shape again at r153: "`_syncStartButton()` never ran on
 *   boot, so a fresh page load painted a stale button."
 *
 *   r152 — picking a track ran a full synchronous world build inside the click
 *   handler. The menu froze before the new highlight had painted; the owner
 *   photographed a tap on WORLD EDITOR with the track list still fully visible
 *   and said "the game is freezing". The fix (`_pickLevel`, `src/main.js:2495`)
 *   was not a faster build: it was PAINT FIRST, BUILD AFTER — move the
 *   highlight, raise `#build-veil`, and let the browser paint both before the
 *   blocking work starts.
 *
 * The class both belong to: STATE PAINTED ONLY ON INTERACTION, NEVER ON FIRST
 * PAINT, and LONG SYNCHRONOUS WORK ON THE MAIN THREAD WITH NOTHING SAID ABOUT
 * IT. The owner's summary is "I keep on debugging the game non stop for things
 * that can be obviously working" — a screen that has not been told what it is
 * showing is exactly that kind of thing.
 *
 * WHY A SCREENCAST AND NOT A DOM READ. The obvious instrument — read the DOM
 * inside a requestAnimationFrame callback — cannot answer this question. A rAF
 * callback runs at the START of a rendering opportunity, so what it reads is
 * neither the pixels of the last composited frame (a task may have mutated the
 * DOM since) nor the pixels of the next one (later callbacks in the same frame
 * may mutate it again). The first version of this tool "found" an empty HUD
 * that was never on screen for that reason. So the frames here are the real
 * composited frames, taken with CDP `Page.startScreencast`, decoded with the
 * repo's own `tools/png.mjs`. A screencast frame arrives only when the screen
 * CHANGES, which makes the gaps between them the exact intervals during which
 * the picture was frozen — and that measurement does not care how fast the
 * rasteriser is.
 *
 * WHAT THE RASTERISER DOES AND DOES NOT AFFECT. Headless SwiftShader compiles
 * shaders in seconds, so every absolute duration below is inflated and is
 * quoted as an upper bound, never as "what a phone does" (COORDINATION.md:
 * MEASURE FIXED-STEP OR MEASURE NOTHING — the same trap, one layer up). The
 * two things it cannot inflate are used as the real assertions: the ORDER of
 * events, and the fact that acknowledging a tap is a DOM repaint with no GL in
 * it, which costs single-digit milliseconds on any rasteriser including this
 * one. That is what makes a 200 ms budget safe to state here.
 *
 * THIS CHECK IS RED THE DAY IT LANDS, deliberately, the way
 * `tests/test-field-stalls.mjs` is in v1 ("stays RED ... as the definition of
 * done", COORDINATION.md). Five of its lines fail on the build it was written
 * against, and all five are one defect with one fix — the r152 fix. Proved by
 * mutation: applying r152's shape to the shipped bundle (put a line up, yield
 * two frames, then build; keep the cover until the world is drawn; fill the HUD
 * when it is built) turned all five green and moved the tap from 3055 ms to
 * 14 ms, with nothing else in the run changing. The sixth, the editor's double
 * build, is separate and is named where it is checked.
 *
 *   npx vite build                       # the tool serves ../V2 itself
 *   node tools/verify-boot-state.mjs
 *   node tools/verify-boot-state.mjs --frames   # every composited frame, timed
 *
 * DUSTLINE_ROOT=<dir> serves a different build. That exists so this check can
 * be pointed at a DELIBERATELY BROKEN copy of the bundle and watched to go red;
 * a check that has never failed is not known to work.
 */
import { chromium } from 'playwright-core';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve as resolvePath } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureServer } from './serve.mjs';
import { decode } from './png.mjs';

const BASE = process.env.BASE || 'http://localhost:8909/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ROOT = process.env.DUSTLINE_ROOT || '../V2';
const DUMP = process.argv.includes('--frames');

/* ---- the two numbers, and where they come from -----------------------------
 *
 * TAP_BUDGET_MS — how long the screen may stay unchanged after a tap on a
 * track card. 200 ms is Chrome's own "good" boundary for Interaction to Next
 * Paint: past it a tap stops reading as the page working and starts reading as
 * the page having hung, which is the sentence the owner actually wrote ("the
 * game is freezing"). It is not a number to tune against the build, because
 * nothing in a correct implementation lands near it: acknowledging a tap is a
 * DOM repaint — remove the picker, raise a veil — with no GL work in it, which
 * is single-digit milliseconds even under SwiftShader. A build that misses
 * this budget is not slow, it is doing the world build on the tap's own task.
 * For scale the run prints the cost of ONE world build measured in the same
 * browser: the editor's `preview.lastBuildMs`, which is the CHEAPEST thing in
 * the codebase resembling what a track pick does — no Rapier colliders, no
 * PMREM environment bake, no racing line, no vehicles — and it already spends
 * most of the budget on its own. The build cannot be made to fit; it has to be
 * moved off the input's task, exactly as v1 r152 did.
 *
 * BLANK_PCT — how much of a composited frame may be exactly rgb(0,0,0) before
 * the screen counts as blank. Nothing this app draws is pure black: the page
 * background is #0d0f12, the picker's gradient bottoms out at #0a0c10, every
 * world clears to its own sky, and the loading screen is dark grey. Over a
 * dozen boots of DUSTBOWL LOOP on this rasteriser the worst frame the app
 * legitimately drew was 15 % pure black (a first world frame with dark scenery
 * in the corners) and the frames where the canvas had presented nothing at all
 * measured 82 % to 96 %. 50 % sits in the empty middle of that gap, with both
 * edges measured rather than guessed. It is used as corroborating evidence
 * rather than as an assertion — see check 4 for why. */
const TAP_BUDGET_MS = 200;
const BLANK_PCT = 50;

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

const SHOTS = mkdtempSync(join(tmpdir(), 'dustline-boot-'));

// A tool that dies with a stack trace has not reported anything, and the shape
// of failure this check exists for — a control that is not where the model says
// it is — is exactly the shape that makes a query for it return null. So an
// unexpected throw is reported as a failure in the same format as every other
// line and the exit code still means what it says.
for (const ev of ['uncaughtException', 'unhandledRejection']) {
  process.on(ev, (e) => {
    check(false, 'the check itself ran to completion', String(e?.message ?? e).split('\n')[0]);
    console.log(`\n${fails} FAILED`);
    process.exit(1);
  });
}

/** Records what was actually on screen, and when.
 *
 *  Chrome emits a screencast frame when the composited picture changes, so the
 *  list this collects is "every different thing the user saw", each stamped
 *  with a wall-clock time that lines up with `performance.timeOrigin +
 *  performance.now()` inside the page. */
class Screen {
  constructor(cdp, tag) { this.cdp = cdp; this.tag = tag; this.frames = []; this.n = 0; }

  async start() {
    this.cdp.on('Page.screencastFrame', async (f) => {
      const path = join(SHOTS, `${this.tag}-${String(this.n++).padStart(3, '0')}.png`);
      writeFileSync(path, Buffer.from(f.data, 'base64'));
      this.frames.push({ t: f.metadata.timestamp * 1000, path });
      try { await this.cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch { /* gone */ }
    });
    // 400 px wide is plenty to tell a black screen from a world and keeps the
    // capture cheap enough not to perturb what it is measuring.
    await this.cdp.send('Page.startScreencast',
      { format: 'png', maxWidth: 400, maxHeight: 280, everyNthFrame: 1 });
  }

  async stop() { await this.cdp.send('Page.stopScreencast').catch(() => {}); }

  /** Frames from `since` (wall ms) onward, each with the share of it that is
   *  exactly black and how many distinct coarse colours are in it. */
  analyse(since = 0) {
    return this.frames.filter((f) => f.t >= since).map((f) => {
      const { w, h, ch, px } = decode(f.path);
      const seen = new Set();
      let black = 0;
      for (let q = 0; q < w * h; q++) {
        const o = q * ch;
        if (px[o] === 0 && px[o + 1] === 0 && px[o + 2] === 0) black++;
        seen.add(((px[o] >> 4) << 8) | ((px[o + 1] >> 4) << 4) | (px[o + 2] >> 4));
      }
      return { t: f.t, blackPct: (100 * black) / (w * h), colours: seen.size, path: f.path };
    });
  }
}

/* Runs before any module of the app does. Two jobs: count animation frames so
 * we can ask whether the browser was ever GIVEN a chance to paint between a tap
 * and the work it starts, and sample the editor's status bar, which is a piece
 * of derived state whose transitions say how many times the world was built. */
const INIT = `
window.__boot = { frames: [], stBuild: [] };
const tick = () => {
  window.__boot.frames.push({
    t: performance.timeOrigin + performance.now(),
    dust: !!window.__dust,
    // three counts every renderer.render() call here, so this is not zero when
    // the loop first runs — the environment bake has already used it. What
    // matters is whether it has MOVED since the world appeared.
    renders: window.__dust?.renderer?.info?.render?.frame ?? -1,
    // anything still standing between the player and an undrawn canvas
    cover: !!document.getElementById('boot') || !!document.getElementById('tsel'),
    hud: !!document.getElementById('race-hud'),
    hudText: (document.getElementById('race-hud')?.textContent ?? '').trim(),
  });
  const sb = document.getElementById('stBuild');
  if (sb) {
    const v = sb.textContent;
    const log = window.__boot.stBuild;
    if (!log.length || log[log.length - 1] !== v) log.push(v);
  }
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);
`;

const stopServer = await ensureServer(BASE, ROOT);
const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

/** A cold boot: fresh context means an empty HTTP cache and empty localStorage,
 *  which is the state the complaint is always about — "a fresh page load". */
async function coldBoot(tag, path, { seed = null, viewport = { width: 1000, height: 700 } } = {}) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 120)}`); });
  if (seed) {
    // localStorage belongs to an origin, so the page has to be ON the origin
    // before anything can be written into it. Any URL the server answers will
    // do; this one is deliberately not part of the app.
    await page.goto(`${BASE}__seed`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.evaluate(([k, v]) => { for (let i = 0; i < k.length; i++) localStorage.setItem(k[i], v[i]); },
      [Object.keys(seed), Object.values(seed)]);
  }
  const cdp = await ctx.newCDPSession(page);
  const screen = new Screen(cdp, tag);
  await screen.start();
  await page.goto(BASE + path, { waitUntil: 'load' });
  const loadAt = await page.evaluate(() =>
    performance.timeOrigin + performance.getEntriesByType('navigation')[0].loadEventEnd);
  return { ctx, page, screen, errors, loadAt };
}

const dump = (label, rows) => {
  if (!DUMP) return;
  console.log(`\n  ${label}`);
  for (const r of rows) console.log(`    +${(r.t - rows[0].t).toFixed(0).padStart(6)} ms  ${r.blackPct.toFixed(1).padStart(5)}% black  ${r.path}`);
  console.log('');
};

// =============================================================================
// 1. THE PAGE SAYS SOMETHING BEFORE ANY MODULE RUNS
// =============================================================================
//
// `index.html` pulls a 2.1 MB module bundle and then waits on `RAPIER.init()`.
// Everything the app draws comes after that, so whatever the static body holds
// IS the first paint. If it holds nothing, the game opens black and stays black
// for as long as the network and the parser take, with no way for a player to
// tell that from a crash.
{
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const body = html.slice(html.indexOf('<body'), html.indexOf('</body>'));
  const text = body
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // the on-screen driving controls are `display:none` until a module turns
    // them on, so their labels are not something anybody sees on first paint
    // and must not be allowed to satisfy this check
    .replace(/<div id="touch-ui"[\s\S]*$/, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  check(text.length > 0,
    'index.html paints a word before a single module has run',
    text ? `"${text.slice(0, 48)}"` : 'the static body is empty — a fresh load opens black');
}

// =============================================================================
// 2-8. THE GAME, BARE URL, COLD: THE PICKER, THE TAP, AND WHAT FOLLOWS IT
// =============================================================================
const g = await coldBoot('game', 'index.html');
await g.page.waitForSelector('#tsel .card', { timeout: 90000 });

// ---- 2. the picker is CORRECT the first time it is painted -------------------
//
// This is BUGS.md #5's exact question asked of dustline: is the highlighted
// card the one the model says, on a load where nothing has been clicked yet?
const picker = await g.page.evaluate(() => {
  const cards = [...document.querySelectorAll('#tsel .card')];
  return {
    n: cards.length,
    sel: cards.filter((c) => c.classList.contains('sel')).length,
    selIdx: cards.findIndex((c) => c.classList.contains('sel')),
    selName: cards.find((c) => c.classList.contains('sel'))?.querySelector('b')?.textContent ?? null,
    focused: document.activeElement === cards.find((c) => c.classList.contains('sel')),
    outlines: cards.map((c) => (c.querySelector('path')?.getAttribute('d') || '').length),
    kms: cards.map((c) => parseFloat(c.querySelector('.meta span')?.textContent ?? '0')),
  };
});
check(picker.n > 0 && picker.sel === 1 && picker.focused && picker.selIdx === 0,
  'the picker paints exactly one selection, focused, with nothing clicked yet',
  `${picker.n} cards, "${picker.selName}" selected at index ${picker.selIdx}`);
// A card is a claim about a track. An outline that is a stub, or 0.00 km, is a
// card that says "a track" without saying which — the same failure as a button
// whose label was never derived.
check(picker.outlines.every((d) => d > 40) && picker.kms.every((k) => k > 0.05),
  'every card draws its own road and its own lap length',
  `outlines ${Math.min(...picker.outlines)}–${Math.max(...picker.outlines)} chars, `
  + `${picker.kms.map((k) => k.toFixed(2)).join(' / ')} km`);

// ---- 3. THE TAP ------------------------------------------------------------
const beforeTap = g.screen.frames.length;
const tap = await g.page.evaluate(() => {
  // Falls back to the first card so that a picker with NO selection — the
  // failure the check above exists for — still gets tapped and still gets
  // measured, instead of taking the whole tool down with it.
  const card = document.querySelector('#tsel .card.sel') ?? document.querySelector('#tsel .card');
  const t = performance.timeOrigin + performance.now();
  card.click();
  return { t, after: performance.timeOrigin + performance.now() };
});
await g.page.waitForFunction(() => window.__dust, null, { timeout: 240000 });
// let the world actually reach the screen before judging what was on it
await g.page.waitForTimeout(8000);
await g.screen.stop();

const shown = g.screen.analyse(g.loadAt);
dump('game, bare URL, cold', shown);
const afterTap = shown.filter((f) => f.t > tap.t);
const firstChange = afterTap[0];
const frozenMs = firstChange ? firstChange.t - tap.t : Infinity;

check(frozenMs <= TAP_BUDGET_MS,
  `tapping a track changes the screen within ${TAP_BUDGET_MS} ms`,
  !Number.isFinite(frozenMs)
    ? 'the screen never changed after the tap'
    : frozenMs <= TAP_BUDGET_MS
      ? `the picture answered in ${frozenMs.toFixed(0)} ms`
      : `the picture did not change for ${frozenMs.toFixed(0)} ms after the tap. The click handler `
        + `itself returned in ${(tap.after - tap.t).toFixed(1)} ms, so nothing in the HANDLER is slow — `
        + 'the wait is `boot()` resuming from `await chooseTrack()` in a microtask and building the '
        + 'whole world before the browser is allowed to paint');

// The rasteriser-free companion to the check above, and the one that says what
// to DO: did the browser get a single chance to paint between the tap and the
// world existing? v1 r152 buys that chance with a 180 ms timer after raising
// its veil. Here `pick()` (src/ui/trackSelect.ts:104) removes the picker and
// resolves the promise, and an awaited promise resumes in a MICROTASK — which
// runs before the browser is allowed to paint — so the whole of `boot()`'s
// world build — the whole body of `boot()` in src/main.ts, from `buildRenderer`
// to `loop.start()` — is still the click's own task.
const frames = await g.page.evaluate(() => window.__boot.frames);
const firstAfterTap = frames.find((f) => f.t > tap.t);
check(!!firstAfterTap && !firstAfterTap.dust,
  'the browser is given a frame to paint between the tap and the world build',
  firstAfterTap
    ? (firstAfterTap.dust
      ? 'the first animation frame after the tap already had a finished world in it — '
        + 'nothing was painted in between'
      : `${(firstAfterTap.t - tap.t).toFixed(0)} ms to the next frame, world not yet built`)
    : 'no animation frame ran at all after the tap');

// ---- 4. nothing is taken off the screen before there is something to put in
//         its place ----------------------------------------------------------
//
// "no blank canvas where a world should be", checked at its CAUSE rather than
// at its symptom. The symptom is a pure-black frame: a WebGL canvas that has
// presented a cleared image and nothing else, which this app never draws on
// purpose (see BLANK_PCT). But whether that frame reaches the screen depends on
// when the driver finishes linking shaders — it appeared in some runs of this
// tool and not others, and a check that flips on the rasteriser's mood is not
// a check. The cause does not flip: `pick()` (src/ui/trackSelect.ts:105) takes
// the picker away, and the loop's first render is a whole task later, so there
// is a frame with the picker gone and nothing yet drawn. If nothing is ever
// removed before the first world frame, no such gap can exist however slow the
// driver is. The pixels are still measured, and reported as corroboration.
const bornAt = frames.find((f) => f.dust);
const gap = bornAt && frames.find((f) => f.dust && !f.cover && f.renders === bornAt.renders);
const worstBlack = Math.max(...shown.map((f) => f.blackPct));
const blanks = shown.filter((f) => f.blackPct > BLANK_PCT);
check(!gap,
  'nothing is taken off the screen before there is a world to put in its place',
  (gap
    ? `at +${(gap.t - tap.t).toFixed(0)} ms the picker was gone, the world object existed and the `
      + 'render loop had not drawn a frame — there is nothing on the page at that moment'
    : 'a cover stayed up until the first world frame')
  + `. Pixels this run: worst frame ${worstBlack.toFixed(1)}% pure black`
  + (blanks.length ? `, ${blanks.length} of ${shown.length} frames over the ${BLANK_PCT}% line` : ''));

// ...and the world does eventually arrive. Cheap, and it is the one thing every
// check above would still pass if the renderer drew nothing at all.
const last = shown[shown.length - 1];
check(!!last && last.blackPct < BLANK_PCT && last.colours > 40,
  'the world is on the screen when the boot is over',
  last ? `${last.colours} distinct colours, ${last.blackPct.toFixed(1)}% pure black` : 'no frames captured');

// ---- 5. the HUD is not in the page before its model has filled it -----------
//
// BUGS.md #5's shape, in dustline. `RaceHUD`'s constructor (src/ui/hud.ts:24)
// appends `#race-hud`, `#race-standings` and `#countdown` to the body with no
// text in them; the only thing that ever fills them is `hud.update(director)`
// inside the render callback (src/main.ts:225), which cannot run until the
// loop's first animation frame. v1's fix for the same shape was one line —
// "Paint the start button ONCE ON BOOT" (src/main.js:1251) — and the same
// applies here: one `update()` in the constructor, or build the DOM hidden.
//
// THIS IS A DOM OBSERVATION, NOT A PIXEL ONE. It says the empty boxes existed
// in a frame's DOM; whether that frame reached the screen depends on what else
// ran in it. It is gated anyway because the window is not small — on this
// machine the loop's first render takes seconds, and check 4 above shows what
// is on screen while it does.
const emptyHud = frames.find((f) => f.hud && f.hudText === '');
check(!emptyHud,
  'the race HUD is never in the page with nothing in it',
  emptyHud
    ? `#race-hud existed with empty position/lap/time ${(emptyHud.t - tap.t).toFixed(0)} ms after the tap`
    : 'filled by the frame it first appears in');

check(g.errors.length === 0, 'no page errors booting the game', g.errors.slice(0, 3).join(' | '));
await g.ctx.close();

// =============================================================================
// 6. A SAVED TRACK IS HONOURED ON A FRESH LOAD, WITH NOTHING CLICKED
// =============================================================================
//
// The half of BUGS.md #5 that only a SECOND boot can find. `lastSavedId()`
// exists precisely so the picker opens on the track you just made; if the
// selection were painted from an event handler rather than derived at build
// time, this is the load that would show a stale default and the cold boot
// above would not.
//
// TWO tracks are seeded and the SECOND one is the one last saved, on purpose.
// With one, "your tracks sort first" and "the picker read lastSavedId" produce
// the same answer, and the check would pass on a build that had never read the
// note at all — which is exactly the bug being guarded against, since
// `lastSavedId` spent its whole life "WRITTEN AND NEVER READ"
// (src/tracks/registry.ts:38).
{
  const base = JSON.parse(readFileSync('src/data/tracks/dustbowl.json', 'utf8'));
  const older = { ...base, id: 'boot-probe-older', name: 'SAVED A WHILE AGO' };
  const newer = { ...base, id: 'boot-probe-newer', name: 'SAVED JUST NOW' };
  const s = await coldBoot('seeded', 'index.html', {
    seed: {
      'dustline.tracks.v1': JSON.stringify([older, newer]),
      'dustline.tracks.last': 'boot-probe-newer',
    },
  });
  await s.page.waitForSelector('#tsel .card', { timeout: 90000 });
  await s.screen.stop();
  const got = await s.page.evaluate(() => {
    const cards = [...document.querySelectorAll('#tsel .card')];
    const sel = cards.find((c) => c.classList.contains('sel'));
    return {
      order: cards.map((c) => c.querySelector('b')?.textContent),
      selName: sel?.querySelector('b')?.textContent ?? null,
      selIdx: cards.indexOf(sel),
      mineFirst: cards.slice(0, 2).every((c) => !!c.querySelector('.mine')),
      focused: document.activeElement === sel,
    };
  });
  check(got.selName === 'SAVED JUST NOW' && got.mineFirst && got.focused,
    'the track you saved last is the one selected on the next fresh load',
    `your two tracks are on top, "${got.selName}" selected at index ${got.selIdx} `
    + `of [${got.order.join(', ')}]`);
  await s.ctx.close();
}

// =============================================================================
// 7. THE OTHER ENTRY POINT: A LINK THAT NAMES A TRACK
// =============================================================================
//
// `?track=` skips the picker, so `boot()` runs its world build straight after
// `RAPIER.init()` resolves. Nothing here is a tap, so the tap budget does not
// apply — but the same blank-screen rule does, and this path has one more way
// to fail: `src/main.ts:74` removes the "LOADING PHYSICS…" node BEFORE the
// build starts rather than after the world is drawn, which is the opposite of
// what the comment two lines above it argues for ("leaving it up behind the
// overlay means it is still there if the picker ever fails to paint").
{
  const d = await coldBoot('named', 'index.html?track=dustbowl');
  await d.page.waitForFunction(() => window.__dust, null, { timeout: 240000 });
  await d.page.waitForTimeout(8000);
  await d.screen.stop();
  const rows = d.screen.analyse(d.loadAt);
  dump('game, ?track=dustbowl, cold', rows);
  const ticks = await d.page.evaluate(() => window.__boot.frames);
  const firstDust = ticks.find((f) => f.dust);
  const hole = firstDust && ticks.find((f) => f.dust && !f.cover && f.renders === firstDust.renders);
  const blank = rows.filter((f) => f.blackPct > BLANK_PCT);
  check(!hole,
    'a link that names a track keeps its loading line up until the world is drawn',
    (hole
      ? `"LOADING PHYSICS…" was already removed ${(hole.t - d.loadAt).toFixed(0)} ms after load, with the `
        + 'render loop yet to draw its first frame'
      : 'the cover outlived the build')
    + `. Pixels this run: worst frame ${Math.max(...rows.map((f) => f.blackPct)).toFixed(1)}% pure black`
    + (blank.length ? `, ${blank.length} of ${rows.length} frames blank` : ''));
  check(d.errors.length === 0, 'no page errors on the named-track path', d.errors.slice(0, 3).join(' | '));
  await d.ctx.close();
}

// =============================================================================
// 8. EVERY CONTROL THE PAGE DECLARES IS ACTUALLY WIRED
// =============================================================================
//
// The static half first, because it is the cheap one and it is general: a UI
// module nobody imports is a user interface that is not there. `index.html`
// ships the whole phone control set — steering pad, DRIFT, NITRO, RESET, the
// thumb-scheme toggle, the speedometer — and `src/ui/touch.ts` is the module
// that brings them to life by adding `.on` to `#touch-ui`. If nothing imports
// it, the markup and its 200 lines of CSS still paint a phone layout and no
// finger can drive the car.
{
  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.ts')) files.push(p);
    }
  };
  walk('src');
  const imported = new Set();
  for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(/(?:from|import)\s*\(?\s*'(\.[^']+)'/g)) {
      imported.add(resolvePath(dirname(f), m[1]).replace(/\.ts$/, ''));
    }
  }
  const orphans = readdirSync('src/ui')
    .filter((f) => f.endsWith('.ts'))
    .map((f) => join('src/ui', f))
    .filter((p) => !imported.has(resolvePath(p).replace(/\.ts$/, '')))
    .map((p) => `${p} (exports ${[...readFileSync(p, 'utf8').matchAll(/export function (\w+)/g)].map((m) => m[1]).join(', ') || 'nothing callable'})`);
  check(orphans.length === 0,
    'every module in src/ui/ is imported by something that runs',
    orphans.join(' | '));
}

// ...and the runtime half, because "imported" is not "working".
{
  const t = await coldBoot('touch', 'index.html?track=dustbowl&touch=1',
    { viewport: { width: 420, height: 820 } });
  await t.page.waitForFunction(() => window.__dust, null, { timeout: 240000 });
  await t.page.waitForTimeout(4000);
  await t.screen.stop();
  const controls = await t.page.evaluate(() => {
    const ui = document.getElementById('touch-ui');
    const drift = document.getElementById('t-drift');
    const r = drift?.getBoundingClientRect();
    const hit = r && r.width
      ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      : null;
    const sp = document.getElementById('speedo');
    let ink = 0;
    if (sp) {
      const d = sp.getContext('2d').getImageData(0, 0, sp.width, sp.height).data;
      for (let i = 3; i < d.length; i += 4 * 37) if (d[i] > 8) ink++;
    }
    return {
      phoneLayout: document.documentElement.classList.contains('touch'),
      present: !!ui,
      display: ui ? getComputedStyle(ui).display : null,
      on: ui?.classList.contains('on') ?? null,
      driftReachable: !!hit && (hit === drift || drift?.contains(hit)),
      ink,
    };
  });
  check(!controls.phoneLayout || (controls.display !== 'none' && controls.driftReachable && controls.ink > 0),
    'a touch device gets the controls the page is styled for',
    `html.touch=${controls.phoneLayout}, #touch-ui display=${controls.display}, `
    + `.on=${controls.on}, DRIFT reachable=${controls.driftReachable}, speedo ink=${controls.ink}`);
  await t.ctx.close();
}

// =============================================================================
// 9-10. THE EDITOR
// =============================================================================
let buildMs = 0;
{
  const e = await coldBoot('editor', 'editor.html', { viewport: { width: 1400, height: 900 } });
  await e.page.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 180000 });
  await e.page.waitForTimeout(2500);
  await e.screen.stop();
  const rows = e.screen.analyse(e.loadAt);
  dump('editor.html, cold', rows);
  // The editor's shell — toolbar, palette, status bar — is static markup, so it
  // is on screen before the module that blocks the thread for its first build
  // has even parsed. That is the right shape, and this is the check that says
  // so out loud rather than leaving it to luck.
  const blank = rows.filter((f) => f.blackPct > BLANK_PCT);
  const flat = rows.filter((f) => f.colours <= 2);
  check(blank.length === 0 && flat.length === 0,
    'the editor never shows a blank screen while it builds its first world',
    blank.length || flat.length
      ? `${blank.length} blank and ${flat.length} flat of ${rows.length} frames`
      : `${rows.length} frames, worst ${Math.max(...rows.map((f) => f.blackPct)).toFixed(1)}% pure black, `
        + `fewest ${Math.min(...rows.map((f) => f.colours))} colours`);

  // The status bar is the editor's whole readout. Every field in it is derived
  // from the document, and `editor.html` ships them all as "—", so a field
  // still reading "—" once the preview exists is a field nobody computed.
  const bar = await e.page.evaluate(() => ({
    len: document.getElementById('stLen').textContent,
    pts: document.getElementById('stPts').textContent,
    tight: document.getElementById('stTight').textContent,
    props: document.getElementById('stProps').textContent,
    issues: document.getElementById('issues').textContent.trim(),
    note: document.getElementById('previewNote').textContent,
    name: document.getElementById('trackName').value,
    tabsOn: [...document.querySelectorAll('.tab')].filter((x) => x.classList.contains('on')).length,
    panel: document.getElementById('panel').children.length,
    stBuild: window.__boot.stBuild,
  }));
  check([bar.len, bar.pts, bar.tight, bar.props].every((v) => v && v !== '—')
    && bar.issues.length > 0 && bar.note.length > 0 && bar.name.length > 0
    && bar.tabsOn === 1 && bar.panel > 0,
    'the editor derives its whole readout at boot, with nothing clicked',
    `len ${bar.len}, pts ${bar.pts}, tightest ${bar.tight}, placed ${bar.props}, `
    + `"${bar.issues}", ${bar.tabsOn} tab active, ${bar.panel} panel sections`);

  // ONE BUILD, NOT TWO. `preview.rebuild(def)` runs at src/editor/main.ts:646
  // and then `changed()` on the next line calls `scheduleRebuild()`, which
  // rebuilds the identical document 220 ms later. The status bar tells on it:
  // it should go from the markup's "—" straight to a time, and instead passes
  // through "building…". A world build is the most expensive thing this page
  // does and doing it twice for an unchanged document doubles the wait for a
  // usable editor.
  const states = bar.stBuild;
  check(!states.includes('building…'),
    'the editor builds its first world once, not twice',
    `status bar went ${states.map((s) => `"${s}"`).join(' -> ')}`);

  // What one build costs, measured HERE — the scale the tap budget is read
  // against. Three in a row: the first pays for lazily-created GL resources.
  const costs = await e.page.evaluate(() => {
    const ed = window.__editor;
    const out = [];
    for (let i = 0; i < 3; i++) { ed.preview.rebuild(ed.def); out.push(+ed.preview.lastBuildMs.toFixed(0)); }
    return out;
  });
  buildMs = Math.min(...costs);
  check(e.errors.length === 0, 'no page errors booting the editor', e.errors.slice(0, 3).join(' | '));
  console.log(`\n      for scale: one world build in this browser is ${costs.join(' / ')} ms `
    + '(Terrain + scenery only — no Rapier colliders, no environment bake, no racing line, no cars), '
    + `which is ${(buildMs / TAP_BUDGET_MS).toFixed(1)}x the ${TAP_BUDGET_MS} ms tap budget for the cheapest `
    + 'part of the job alone. That is the number that says the build has to move off the tap\'s task '
    + 'rather than be optimised into it.\n');
  await e.ctx.close();
}

await browser.close();
await stopServer();
if (!DUMP) rmSync(SHOTS, { recursive: true, force: true });
else console.log(`frames kept in ${SHOTS}`);

/* WHAT THIS CHECK DOES NOT COVER, said plainly so the passes are not read as
 * more than they are:
 *
 *  - ONE TRACK, ONE VIEWPORT, ONE RASTERISER. The boot is driven on DUSTBOWL
 *    LOOP at 1000x700 under SwiftShader. A track whose build is slower, or a
 *    phone GPU, changes every duration printed here. The ORDER checks (a frame
 *    between the tap and the build; the HUD filled before it is in the page)
 *    do not depend on any of that; the two budgets do.
 *  - IT DOES NOT WATCH THE WHOLE SESSION. Only the first paint of each entry
 *    point and the first track pick. Restart, NEXT RACE, and the editor's
 *    New/Open dialogs each replace the world too and are not measured.
 *  - "NOT BLANK" IS NOT "CORRECT". Any frame under the 50 % line passes;
 *    whether it shows the RIGHT world is `tools/verify-worlds.mjs`'s question,
 *    not this one.
 *  - THE TOUCH CHECK IS ONE DEVICE SHAPE, forced with `?touch=1` at 420x820.
 *    It asks whether the controls the page declares are live and reachable —
 *    not whether a real finger can drive with them, not gesture handling, and
 *    not the two-thumb layout.
 *  - THE ORPHAN SCAN IS `src/ui/` ONLY, and it reads static import specifiers.
 *    A module imported by something that is itself dead still counts as wired.
 *  - NOTHING HERE MEASURES THE SIMULATION. Every number above is wall clock on
 *    purpose — it is about the picture, not the physics. Anything that reads
 *    the sim must be driven fixed-step (COORDINATION.md).
 */
console.log(fails ? `\n${fails} FAILED` : '\nthe first paint tells the truth');
process.exit(fails ? 1 : 0);
