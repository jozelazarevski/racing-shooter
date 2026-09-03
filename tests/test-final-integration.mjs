// LEAD FINAL INTEGRATION — full-game wiring checks for this round.
// Physics/AI internals already verified in depth by Agent B; this validates
// the assembled game: finish flow, elevation, steering setting, weather,
// angry AI presence, mode-from-URL fix, mobile UI, and EVERY level in the
// roster boots and races — the loop reads window.__LEVELS, so it grew from 5
// to 67 with the roster while this line still said 5. A header that states a
// count it does not compute is the same defect as a gate that does.
import { chromium } from 'playwright-core';

const LAUNCH = { executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
// BASE, so this can be pointed at a pristine baseline on another port. It
// hardcoded localhost:8901 in seven places — the fourth file in this suite with
// that defect, and HANDOVER lists it as a trap precisely because a gate you
// cannot baseline cannot tell a regression from a pre-existing failure.
const BASE = process.env.BASE ?? 'http://localhost:8901';
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

const browser = await chromium.launch(LAUNCH);

// ---------- 1. Fresh visit ALWAYS races even with stale roam storage ----------
{
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 120000 });
  await page.evaluate(() => { localStorage.setItem('ir-mode', 'roam'); }); // stale legacy key
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 120000 });
  const roam = await page.evaluate(() => window.__game.freeRoam);
  check('fresh visit ignores stale roam storage', roam === false, `freeRoam=${roam}`);
  // (#63 repair: the board opens on the CHAPTER INDEX now — one card per
  // chapter, no world cards until a room is entered; test-ladder owns the
  // full law, this asserts the index rendered)
  const chips = await page.evaluate(() => ({
    steer: document.querySelectorAll('#steer-select .diff-chip').length,
    chapters: document.querySelectorAll('#level-select .chapter-card').length,
    want: window.__game.chapters().length,
    roster: (window.__LEVELS || []).length,
  }));
  check('title UI renders (3 steer, one card per chapter)',
    chips.steer === 3 && chips.roster > 0 && chips.chapters === chips.want, JSON.stringify(chips));
  check('no page errors on boot', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

// ---------- 2. SHARP steering setting flows into player.steerSense ----------
{
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 120000 });
  await page.evaluate(() => {
    [...document.querySelectorAll('#steer-select .diff-chip')].find(c => /SHARP/i.test(c.textContent)).click();
  });
  await page.click('#start-btn');
  await page.waitForFunction(() => ['countdown', 'race'].includes(window.__game.state), null, { timeout: 60000 });
  const sense = await page.evaluate(() => window.__game.player.steerSense);
  check('SHARP chip -> steerSense 1.25', Math.abs(sense - 1.25) < 1e-6, `steerSense=${sense}`);
  const stored = await page.evaluate(() => localStorage.getItem('ir-steer'));
  check('steer setting persisted', stored === 'sharp', `ir-steer=${stored}`);
  await page.close();
}

// ---------- 3. Full race finishes (rail) + FINAL LAP banner + elevation ----------
{
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 120000 });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 60000 });
  // #63 repair, round 3: the old rail was a real-time setInterval racing the
  // page's frame loop — measured ~2 fps under swiftshader on a 2x world, so
  // the interval fired 15 times per frame against a STALE trackIndex and the
  // car sat pinned at the start line (checkLap saw f ≈ 0 on every frame,
  // zero checkpoint windows armed, lap never counted). Every modern suite
  // here drives DETERMINISTIC frames instead — warp, seat, pay the gate
  // debt, g.frame(), repeat — so the game's own loop sweeps the car through
  // the checkpoint windows in order at any wall-clock speed.
  const info = await page.evaluate(async () => {
    const g = window.__game, t = g.track, p = g.player;
    const N = t.N ?? t.center.length;
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    let maxY = 0, sawFinalLap = false, pitchSeen = 0, finished = false;
    const cm = g.hud.centerMsg.bind(g.hud);
    g.hud.centerMsg = (m) => { if (/FINAL LAP/i.test(m)) sawFinalLap = true; cm(m); };
    const resultsShown = () => {
      const r = document.getElementById('results');
      const cs = getComputedStyle(r);
      // the panel must ACTUALLY render — class checks alone missed a CSS
      // rule that kept it display:none forever (the stuck-after-finish bug)
      return !r.classList.contains('hidden') && cs.display !== 'none'
        && cs.visibility === 'visible' && parseFloat(cs.opacity) > 0.05
        && r.getBoundingClientRect().width > 100;
    };
    const CAP = (g.lapsTotal + 1) * N + 3000;
    for (let k = 0; k < CAP && !finished; k++) {
      if (g.state === 'race') {
        const next = (p.trackIndex + 3) % N;
        const c = t.pointAt(next, 0);
        p.heading = t.headingAt(next);
        p.pos.x = c.x; p.pos.z = c.z;
        p.pos.y = c.y + 0.4; p.y = c.y + 0.4; p.vy = 0; p.airborne = false;
        p.vel.copy(p.forward).multiplyScalar(45);
        p.invuln = 9; p._voidT = 0; p._lostT = 0; p._wedgeT = 0;
        if (g.route?.gates?.length) {
          let best = g.route.gates[0], bd = 1e9;
          for (const gt of g.route.gates) {
            const d = (gt.si - next + N) % N;
            if (d < bd) { bd = d; best = gt; }
          }
          p._nextGate = best.id;
          g._gateMissT = 0;
        }
      }
      g.frame();
      maxY = Math.max(maxY, Math.abs(p.pos.y));
      if (Math.abs(p.mesh.rotation.x) > 0.02) pitchSeen++;
      // the results card opens on a real-time setTimeout (1.6-2.6 s after the
      // flag) — once the race ends, yield to the wall clock instead of
      // spinning frames
      if (g.state !== 'race' && g.state !== 'countdown') {
        for (let w = 0; w < 100 && !finished; w++) {
          await new Promise((r2) => setTimeout(r2, 100));
          finished = resultsShown();
        }
        break;
      }
    }
    return { maxY: +maxY.toFixed(2), finalLap: sawFinalLap, pitchFrames: pitchSeen, finished };
  });
  const finished = info.finished;
  check('race finishes -> results screen', finished);
  check('FINAL LAP banner shown', info.finalLap);
  check('elevation ridden during lap (|y| max > 3)', info.maxY > 3, `maxY=${info.maxY}`);
  check('car pitches on grades', info.pitchFrames > 20, `pitchFrames=${info.pitchFrames}`);
  check('no page errors during race', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

// ---------- 4. Weather ambient on FROST PEAK + HARD AI anger signals ----------
{
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${BASE}/?level=3&unlockall=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 120000 });
  await page.evaluate(() => { localStorage.setItem('ir-diff', 'hard'); });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 120000 });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 60000 });
  const wx = await page.evaluate(() => ({
    level: window.__game.level.name,
    weather: window.__game.track.theme?.weather?.type || null,
    hasAmbient: typeof window.__game.particles.ambient === 'function',
    diff: window.__game.difficulty.id,
  }));
  check('FROST PEAK loaded with snow weather', /FROST/i.test(wx.level) && wx.weather === 'snow', JSON.stringify(wx));
  check('particles.ambient exists', wx.hasAmbient);
  check('difficulty=hard applied', wx.diff === 'hard');
  // pool head should advance while parked (ambient snow keeps spawning)
  const anger = await page.evaluate(async () => {
    const g = window.__game;
    g.__sawSlam = false;
    const feed = g.hud.feed?.bind(g.hud);
    if (feed) g.hud.feed = (m, k) => { if (/SLAM|RAM|MISSILE/i.test(m)) g.__sawSlam = true; feed(m, k); };
    g.player.vel.set(0, 0, 0);
    const hp0 = g.player.health;
    const head0 = g.particles.head;
    await new Promise(r => setTimeout(r, 20000));
    return { hp0, hp1: g.player.health, headDelta: g.particles.head - head0 + (g.particles.head < head0 ? 6000 : 0), slam: g.__sawSlam };
  });
  // #63 repair: the law is that the pool ADVANCES while parked — 181 in 20 s
  // proves it; the old 200 budget was a pre-2x spawn-rate guess
  check('particle pool active (ambient weather spawning)', anger.headDelta > 120, `headDelta=${anger.headDelta}`);
  check('hard AI attacks a parked player within 20s', anger.hp1 < anger.hp0 || anger.slam, JSON.stringify(anger));
  check('no page errors (frost/hard)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

// ---------- 5. Every roster level boots into race without errors ----------
{
  const probe = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await probe.goto(`${BASE}/`, { waitUntil: 'load' });
  await probe.waitForFunction(() => window.__LEVELS, null, { timeout: 120000 });
  const ids = await probe.evaluate(() => window.__LEVELS.map(l => l.id));
  await probe.close();
  for (const lvl of ids) {
    const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${BASE}/?level=${lvl}&unlockall=1`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__game, null, { timeout: 120000 });
    await page.click('#start-btn');
    await page.waitForFunction(() => ['countdown', 'race'].includes(window.__game.state), null, { timeout: 60000 });
    await page.evaluate(() => { window.__game.countdown = 0.01; });
    await page.waitForTimeout(3500);
    const st = await page.evaluate(() => ({
      state: window.__game.state,
      name: window.__game.level.name,
      y: +window.__game.player.pos.y.toFixed(2),
    }));
    check(`level ${lvl} (${st.name}) boots and races`, st.state === 'race' && errors.length === 0,
      `state=${st.state} y=${st.y} err=${errors.slice(0, 2).join('|')}`);
    await page.close();
  }
}

// ---------- 6. Mobile portrait smoke ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 120000 });
  await page.tap('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 60000 });
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => {
    const ui = document.getElementById('touch-ui');
    const jr = document.getElementById('joy-zone').getBoundingClientRect();
    const fr = document.getElementById('t-fire').getBoundingClientRect();
    return {
      uiOn: ui.classList.contains('on'),
      joyArea: Math.round(jr.width * jr.height),
      fireW: Math.round(fr.width),
    };
  });
  check('mobile touch UI enabled in race', m.uiOn === true);
  check('joystick zone has real area', m.joyArea > 10000, `area=${m.joyArea}`);
  check('fire button present', m.fireW > 20, `fireW=${m.fireW}`);
  check('no page errors (mobile)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close();
const fails = results.filter(r => !r.ok);
console.log(`\n==== ${results.length - fails.length}/${results.length} PASSED ====`);
if (fails.length) { console.log('FAILURES:', JSON.stringify(fails, null, 1)); process.exit(1); }
