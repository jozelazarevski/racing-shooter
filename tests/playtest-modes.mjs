// MODES + HAZARDS PLAYTEST: free roam loop, pause menu, live hazards firing
// during a real race, and mobile touch controls.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const bugs = [], ok = [];
const check = (n, pass, d = '') => { (pass ? ok : bugs).push(`${n} :: ${d}`); console.log(`${pass ? 'PASS' : 'BUG '}  ${n}  ${d}`); };

const race = async (q) => {
  const page = await b.newPage({ viewport: { width: 820, height: 540 } });
  // EVERY OTHER CALL IN THIS FILE CARRIES A GENEROUS EXPLICIT TIMEOUT; the
  // clicks did not, so they used Playwright's 30 s default and this suite died
  // on `#start-btn` before it ever reached the free-roam assertions. It is not
  // a slow click — the log shows the button visible, enabled and stable and the
  // action begun — it is the main thread building a world at the ~1.28 fps this
  // game renders under swiftshader, with roam's own furniture on top of it.
  page.setDefaultTimeout(180000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://localhost:8901/${q}`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(() => window.__game, null, { timeout: 30000 });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 25000 });
  return { page, errors };
};

// ---------- live hazards must actually fire while racing ----------
for (const [lvl, what] of [[10, 'rockfall'], [14, 'burning treefall'], [15, 'icicles']]) {
  const { page, errors } = await race(`?level=${lvl}&unlockall=1`);
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    // Icicles SHATTER on landing and are spliced out in the same frame, so
    // `fallers.filter(landed)` can never observe them — count the impact
    // splinter burst instead, which every faller kind fires when it lands.
    let shatters = 0;
    const sp = g.particles.splinters.bind(g.particles);
    g.particles.splinters = (...a) => { shatters++; return sp(...a); };
    const rail = setInterval(() => {
      if (g.state !== 'race') return;
      const next = (p.trackIndex + 4) % t.N;
      const c = t.pointAt(next, 0);
      p.heading = t.headingAt(next);
      p.pos.x = c.x; p.pos.z = c.z;
      p.vel.copy(p.forward).multiplyScalar(34);
    }, 45);
    // GAME TIME, NOT WALL CLOCK. This loop used to be 70 x 400 ms of wall clock,
    // which at the ~1.28 fps this game renders under swiftshader is a second or
    // two of GAME time — against a hazard whose `period` is 6. Whether an icicle
    // had landed yet was therefore a coin flip, and it flipped: two runs of the
    // SAME code 20 minutes apart reported landed 1 (pass) and landed 0 (fail).
    // The other two worlds passed for the same accidental reason, not a better
    // one. `_updateWorldHazards` both spawns fallers and lands them, so it is
    // driven directly for 120 simulated seconds — twenty of the longest period
    // on the roster — and the rail moves the player in the SAME loop so spawn
    // placement still tracks a moving car. Same trap as the chopper check below.
    clearInterval(rail);
    let spawned = 0, landed = 0, simT = 0;
    for (let k = 0; k < 60 * 120; k++) {
      const next = (p.trackIndex + 4) % t.N;
      const c = t.pointAt(next, 0);
      p.heading = t.headingAt(next);
      p.pos.x = c.x; p.pos.z = c.z;
      p.vel.copy(p.forward).multiplyScalar(34);
      p.trackIndex = next;
      simT += 1 / 60;
      g._updateWorldHazards(1 / 60, simT);
      spawned = Math.max(spawned, g.fallers.length);
      landed += g.fallers.filter((f) => f.landed && !f._counted && (f._counted = 1)).length;
      if (spawned > 0 && (landed > 0 || shatters > 0)) break;
    }
    return { spawned, landed: landed || shatters, period: t.T.fallHazard?.period };
  });
  check(`L${lvl} ${what} spawns and lands during a race`, r.spawned > 0 && r.landed > 0, JSON.stringify(r));
  check(`L${lvl} no errors`, errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}

// ---------- avalanche chase fires on the final lap ----------
{
  const { page, errors } = await race('?level=16&unlockall=1');
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    p.lap = g.lapsTotal;
    let banner = '';
    const cm = g.hud.centerMsg.bind(g.hud);
    g.hud.centerMsg = (m) => { if (/AVALANCHE/i.test(m)) banner = m; cm(m); };
    for (let w = 0; w < 25 && !g.chaseWall; w++) await new Promise(r2 => setTimeout(r2, 200));
    const sp0 = g.chaseWall?.speed ?? 0;
    await new Promise(r2 => setTimeout(r2, 2500));
    return { released: !!g.chaseWall, banner, accel: (g.chaseWall?.speed ?? 0) > sp0 };
  });
  check('L16 avalanche releases on the final lap with a banner', r.released && /AVALANCHE/.test(r.banner), JSON.stringify(r));
  check('L16 avalanche accelerates', r.accel);
  check('L16 no errors', errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}

// ---------- free roam loop: stars, choppers, credit banking ----------
{
  const { page, errors } = await race('?level=1&mode=roam&unlockall=1');
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    const out = { roam: g.freeRoam, stars: g.roamStars?.length ?? 0, lapsHidden: true };
    // collect one star by driving to it
    const s = g.roamStars[0];
    p.pos.set(s.x - 5, s.y + 0.4, s.z); p.y = p.pos.y;
    p.heading = Math.PI / 2;
    const iv = setInterval(() => { p.vel.set(12, 0, 0); }, 90);
    for (let w = 0; w < 25 && !s.got; w++) await new Promise(r2 => setTimeout(r2, 180));
    clearInterval(iv);
    out.starGot = s.got === true;
    // FREE ROAM NO LONGER FIGHTS ANYTHING. The 40 s gunship timer and the 45 s
    // raider timer were both gated on `freeRoam && !missionMode` — plain roam —
    // and both were removed when roam became exploration and destruction-scoring
    // ("remove the enemies from free roam").
    //
    // WALL-CLOCK WAITING CANNOT PROVE AN ABSENCE HERE. The old form waited 25 x
    // 250 ms for a spawn; at the ~1.28 fps this game renders under swiftshader
    // that is barely a dozen frames of GAME time, so it would have reported
    // "no choppers" against the old code too, and passed the new code for the
    // wrong reason. Game time is driven directly instead: ten simulated
    // minutes of both spawners, during which nothing may appear.
    g.chopperTimer = 0;
    for (let k = 0; k < 60 * 600; k++) { g._updateChoppers(1 / 60); g._updateHostiles(1 / 60); }
    out.choppers = g.choppers.length;
    out.hostiles = g.hostiles.length;
    // banking credits on exit
    const cr0 = g.garage.credits;
    g.score = 800;
    g.bankRoamCredits?.();
    out.banked = g.garage.credits - cr0;
    return out;
  });
  check('free roam active with 12 treasure stars', r.roam && r.stars === 12, JSON.stringify({ roam: r.roam, stars: r.stars }));
  check('star collectable by driving', r.starGot);
  check('free roam spawns no enemies at all', r.choppers === 0 && r.hostiles === 0,
    `${r.choppers} choppers, ${r.hostiles} hostiles after 10 simulated minutes`);
  check('roam score banks into credits on exit', r.banked > 0, `+${r.banked}`);
  check('roam no errors', errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}

// ---------- pause menu ----------
{
  const { page, errors } = await race('?level=1&unlockall=1');
  const r = await page.evaluate(async () => {
    const g = window.__game;
    g.togglePause();
    await new Promise(r2 => setTimeout(r2, 300));
    const paused = g.state === 'paused' && !document.getElementById('pause-menu').classList.contains('hidden');
    document.getElementById('pm-resume').click();
    await new Promise(r2 => setTimeout(r2, 300));
    const resumed = g.state === 'race' && document.getElementById('pause-menu').classList.contains('hidden');
    // camera cycle from the pause menu
    const cam0 = g.camMode;
    document.getElementById('pm-camera').click();
    return { paused, resumed, camCycled: g.camMode !== cam0 };
  });
  check('pause menu opens and resumes', r.paused && r.resumed, JSON.stringify(r));
  check('pause menu cycles the camera', r.camCycled);
  check('pause no errors', errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}

// ---------- mobile touch controls actually drive the car ----------
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.setDefaultTimeout(180000);          // see the note in `race()`
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(() => window.__game, null, { timeout: 30000 });
  await page.tap('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 25000 });
  const jr = await page.evaluate(() => document.getElementById('joy-zone').getBoundingClientRect().toJSON());
  const cx = jr.x + jr.width / 2, cy = jr.y + jr.height / 2;
  await page.touchscreen.tap(cx, cy);
  // drag up = throttle
  await page.evaluate(async ([x, y]) => {
    const z = document.getElementById('joy-zone');
    const mk = (t, cx2, cy2) => z.dispatchEvent(new TouchEvent(t, { bubbles: true, cancelable: true,
      touches: t === 'touchend' ? [] : [new Touch({ identifier: 1, target: z, clientX: cx2, clientY: cy2 })],
      changedTouches: [new Touch({ identifier: 1, target: z, clientX: cx2, clientY: cy2 })] }));
    mk('touchstart', x, y);
    for (let k = 0; k < 30; k++) { mk('touchmove', x, y - 60); await new Promise(r => setTimeout(r, 60)); }
  }, [cx, cy]);
  const moved = await page.evaluate(() => ({ sp: Math.hypot(window.__game.player.vel.x, window.__game.player.vel.z), thr: window.__game.input.throttle }));
  check('mobile joystick applies throttle and moves the car', moved.sp > 3, JSON.stringify({ speed: +moved.sp.toFixed(1) }));
  check('mobile no errors', errors.length === 0, errors.slice(0, 2).join('|'));
  await ctx.close();
}

await b.close();
console.log(`\n==== ${ok.length} PASSED / ${bugs.length} BUGS ====`);
for (const x of bugs) console.log('BUG:', x);
