/* r331 — v2.3 §6.1: THE STRIP READS PROGRESS (recording F's headline:
 * "player progress frozen at 0% on the strip for 34 s"). The dot mapping
 * was field-span-normalized, so last place rendered as a parked dot at
 * the left edge however far the car drove. Dots now read each car's own
 * lap position (trackIndex/N).
 *
 *   T1  S1b: a scripted lap sweeps the player's dot 0 -> 100%
 *   T2  rival dots move on their own during 20 s of racing
 *   T3  6.5 evidence: 30 s of road-grass-road oscillation on a DRY world
 *       emits zero wet/tyre status toasts (the recording-F WET TIRES spam)
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 800, height: 520 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=12&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const r = await p.evaluate(async () => {
  const g = window.__game, t = g.track, pl = g.player, N = t.center.length;
  g.startRace?.();
  const f = () => new Promise((r2) => requestAnimationFrame(r2));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const meLeft = () => {
    const el = document.querySelector('#progress-strip .me');
    return el ? parseFloat(el.style.left) : null;
  };
  const rivalLefts = () => [...document.querySelectorAll('#progress-strip i:not(.me)')]
    .map((el) => parseFloat(el.style.left));
  // T1: scripted lap — carry the player around the lap in 40 steps,
  // sampling the dot after each hop (the strip refreshes at 4 Hz)
  const seen = [];
  for (let s = 0; s < 40; s++) {
    const idx = Math.round((s / 40) * (N - 1));
    pl.placeAt(idx, 0, true);
    pl.invuln = 9; pl.health = pl.maxHealth;   // rivals shoot; a kill-respawn would regress the dot
    // hopping forward past the owed gate accrues the missed-gate grace
    // across hops until returnToGate yanks the dot backward — pay the debt:
    // owe the nearest gate ahead of each hop
    if (g.route?.gates?.length) {
      let best = g.route.gates[0], bd = 1e9;
      for (const gt of g.route.gates) {
        const d = (gt.si - idx + N) % N;
        if (d < bd) { bd = d; best = gt; }
      }
      pl._nextGate = best.id;
      g._gateMissT = 0;
    }
    for (let k = 0; k < 20; k++) g.frame();
    seen.push(meLeft());
  }
  let sweeps = seen[0] !== null;
  let lo = 101, hi = -1;
  for (let i = 0; i < seen.length; i++) {
    if (seen[i] === null) { sweeps = false; break; }
    lo = Math.min(lo, seen[i]); hi = Math.max(hi, seen[i]);
    if (i > 0 && seen[i] < seen[i - 1] - 4) sweeps = false;   // monotonic, strip rounding slack
  }
  const t1 = { sweeps, lo, hi, first: seen[0], last: seen[39] };
  // T2: rival dots move by themselves
  const r0 = rivalLefts();
  for (let k = 0; k < 20 * 60; k++) g.frame();
  const r1 = rivalLefts();
  let moved = 0;
  for (let i = 0; i < Math.min(r0.length, r1.length); i++) {
    if (Math.abs(r1[i] - r0[i]) >= 3) moved++;
  }
  const t2 = { rivals: r0.length, moved };
  // T3: road-grass oscillation on a dry world — count status toasts
  const feeds = [];
  const hudFeed = g.hud.feed.bind(g.hud);
  g.hud.feed = (txt, cls) => { feeds.push(String(txt)); return hudFeed(txt, cls); };
  for (let s = 0; s < 30; s++) {
    const idx = (200 + s * 7) % N;
    pl.placeAt(idx, s % 2 ? 0 : 13, true);   // alternate centreline / grass verge
    for (let k = 0; k < 60; k++) {
      g.input.analog = { steer: 0, throttle: 1, brake: 0 };
      g.frame();
    }
  }
  g.hud.feed = hudFeed;
  const wetish = feeds.filter((x) => /WET|TYRE|TIRE|GRIP|SLICK/i.test(x));
  // T4 (r338, phone report): a lit combo chip must not survive into the
  // next race's grid — _updateCombo only runs on race frames, so the DOM
  // has to be cleared by resetRace itself
  g.styleBump?.(); g.styleBump?.();
  for (let k = 0; k < 5; k++) g.frame();
  const comboEl = document.getElementById('combo');
  const litBefore = comboEl?.classList.contains('on') ?? null;
  g.resetRace();
  const litAfter = comboEl?.classList.contains('on') ?? null;
  return { t1, t2, t3: { toasts: feeds.length, wetish }, t4: { litBefore, litAfter } };
});

check('T1  S1b: a scripted lap sweeps the player dot 0 -> 100%',
  r.t1.sweeps && r.t1.lo <= 6 && r.t1.hi >= 94, JSON.stringify(r.t1));
check('T2  rival dots advance on their own progress',
  r.t2.moved >= Math.min(5, r.t2.rivals), JSON.stringify(r.t2));
check('T3  dry road-grass oscillation: zero wet/tyre toasts (6.5)',
  r.t3.wetish.length === 0, JSON.stringify(r.t3));
check('T4  a lit combo chip goes dark on the next grid (r338)',
  r.t4.litBefore === true && r.t4.litAfter === false, JSON.stringify(r.t4));
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe strip tells the truth');
