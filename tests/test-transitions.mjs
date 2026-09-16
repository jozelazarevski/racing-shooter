// Every screen transition must happen IN PLACE.
//
// A full page reload throws away the module graph, the WebGL context, every
// compiled shader and the whole world, to change what is usually one boolean.
// On a phone that is a second of white screen each time. This suite stamps a
// sentinel on `window` at boot and fails any transition that loses it — that
// is the only reliable proof the document was never replaced.
import { chromium } from 'playwright-core';

const B = 'http://127.0.0.1:8901/index.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 412, height: 800 }, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

let pass = 0, fail = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
  ok ? pass++ : fail++;
};

const boot = async (q = '?level=3&unlockall=1') => {
  await page.goto(B + q, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__game && window.__game.track, undefined, { timeout: 180000 });
  await page.evaluate(() => { window.__sentinel = 'alive'; });
};
const alive = () => page.evaluate(() => window.__sentinel === 'alive');
const settle = (ms = 700) => page.waitForTimeout(ms);

// ---- mode chips: RACE <-> FREE ROAM <-> MISSIONS, all from the menu
await boot();
await page.evaluate(() => document.getElementById('tab-btn-mode').click());
for (const mode of ['roam', 'missions', 'race']) {
  await page.evaluate((m) => {
    [...document.querySelectorAll('#mode-select .mode-chip')].find((c) => c.dataset.mode === m).click();
  }, mode);
  await settle();
  const st = await page.evaluate(() => ({
    alive: window.__sentinel === 'alive',
    mode: window.__game.missionMode ? 'missions' : window.__game.freeRoam ? 'roam' : 'race',
    url: location.search,
    chip: document.querySelector('#mode-select .mode-chip.current')?.dataset.mode,
    start: document.getElementById('start-btn').textContent,
    hostiles: window.__game.hostiles.length,
  }));
  check(st.alive && st.mode === mode && st.chip === mode,
    `mode -> ${mode} without a reload`, JSON.stringify(st));
}

// ---- race -> pause -> exit to menu
await boot();
await page.evaluate(() => { document.getElementById('start-btn').click(); window.__game.countdown = 0.01; });
await settle(1500);
check(await page.evaluate(() => window.__game.state === 'race'), 'race started');
await page.evaluate(() => { window.__game.togglePause(); document.getElementById('pm-exit').click(); });
await settle();
check(await alive(), 'pause > EXIT returns to the menu without a reload',
  JSON.stringify(await page.evaluate(() => ({
    state: window.__game.state,
    menuVisible: !document.getElementById('title-screen').classList.contains('hidden'),
    hudHidden: !document.getElementById('hud').classList.contains('on'),
  }))));

// ---- results -> BACK TO GARAGE
await boot();
await page.evaluate(() => { document.getElementById('start-btn').click(); window.__game.countdown = 0.01; });
await settle(1200);
await page.evaluate(() => { window.__game.finishRace(); });
await settle(1200);
await page.evaluate(() => document.getElementById('garage-btn').click());
// deliberately longer than the podium's 1.6s reveal timer: leaving inside that
// window used to let the results card pop back up over the menu
await settle(2200);
{
  const st = await page.evaluate(() => ({
    alive: window.__sentinel === 'alive',
    garageTab: document.getElementById('tab-btn-garage').classList.contains('current'),
    resultsHidden: document.getElementById('results').classList.contains('hidden'),
  }));
  check(st.alive && st.garageTab && st.resultsHidden,
    'results > BACK TO GARAGE without a reload, and the podium stays gone', JSON.stringify(st));
}

// ---- results -> NEXT LEVEL
await boot();
await page.evaluate(() => { document.getElementById('start-btn').click(); window.__game.countdown = 0.01; });
await settle(1200);
const before = await page.evaluate(() => window.__game.level.id);
await page.evaluate(() => { window.__game.finishRace(); });
await settle(1200);
await page.evaluate(() => document.getElementById('next-level-btn').click());
await settle(1500);
const after = await page.evaluate(() => ({ alive: window.__sentinel === 'alive',
  id: window.__game.level.id, state: window.__game.state, url: location.search }));
check(after.alive && after.id === before + 1, 'results > NEXT LEVEL without a reload',
  JSON.stringify({ before, ...after }));

// ---- track pick from the menu
await boot();
await page.evaluate(() => {
  [...document.querySelectorAll('.level-chip')].find((c) => c.textContent.includes('DUST CANYON')).click();
});
await settle(1200);
check(await alive(), 'track pick without a reload',
  JSON.stringify(await page.evaluate(() => ({ lvl: window.__game.level.name, url: location.search }))));

// ---- profile switch (create a second driver, then swap between them)
await boot();
await page.evaluate(() => {
  document.getElementById('tab-btn-settings').click();
  document.getElementById('profile-name-input').value = 'TESTER';
  document.getElementById('profile-create-btn').click();
});
await settle(1200);
const made = await page.evaluate(() => ({ alive: window.__sentinel === 'alive',
  name: window.__game.profile.name, n: window.__game.profiles.list.length }));
check(made.alive && made.name === 'TESTER', 'profile CREATE without a reload', JSON.stringify(made));
await page.evaluate(() => {
  const other = window.__game.profiles.list.find((p) => p.id !== window.__game.profile.id);
  window.__game._switchProfile(other.id);
});
await settle(1200);
const swapped = await page.evaluate(() => ({ alive: window.__sentinel === 'alive',
  name: window.__game.profile.name }));
check(swapped.alive && swapped.name !== 'TESTER', 'profile SWITCH without a reload', JSON.stringify(swapped));

// ---- the joystick sensitivity slider actually moves the steer output
await boot();
const joy = await page.evaluate(async () => {
  const g = window.__game;
  const zone = document.getElementById('joy-zone');
  const r = zone.getBoundingClientRect();
  const x0 = r.left + r.width * 0.35, y0 = r.top + r.height * 0.6;
  const fire = (type, x, y) => zone.dispatchEvent(new TouchEvent(type, {
    bubbles: true, cancelable: true,
    changedTouches: [new Touch({ identifier: 1, target: zone, clientX: x, clientY: y })],
  }));
  const at = (pct) => {
    const s = document.getElementById('joy-sens');
    s.value = String(pct);
    s.dispatchEvent(new Event('input', { bubbles: true }));
    fire('touchstart', x0, y0);
    fire('touchmove', x0 + 31, y0);
    const v = Math.abs(g.input.analog.steer);
    fire('touchend', x0, y0);
    return +v.toFixed(3);
  };
  return { rowShown: document.getElementById('joy-row').classList.contains('on'),
    low: at(50), mid: at(100), high: at(180), sens: g.input.joySens };
});
check(joy.low < joy.mid && joy.mid < joy.high,
  'joystick slider changes steer output monotonically', JSON.stringify(joy));

// persistence across a real reload
await page.evaluate(() => {
  const s = document.getElementById('joy-sens');
  s.value = '70';
  s.dispatchEvent(new Event('input', { bubbles: true }));
  s.dispatchEvent(new Event('change', { bubbles: true }));
});
await boot();
const kept = await page.evaluate(() => ({ stored: localStorage.getItem('ir-joysens'),
  slider: document.getElementById('joy-sens').value, sens: window.__game.input.joySens }));
check(kept.stored === '70' && kept.slider === '70' && Math.abs(kept.sens - 0.7) < 1e-6,
  'joystick sensitivity persists', JSON.stringify(kept));

// ---- cycling the modes must not accumulate anything.
// The world layer survives a mode switch (only a level swap tears it down), so
// every mode-scoped object has to be removed by hand. And the LIGHT COUNT must
// never move: it is part of every material's shader cache key, so a stray light
// makes three recompile the entire scene — that was one of the freezes.
await boot();
{
  const st = await page.evaluate(async () => {
    const g = window.__game;
    const snap = () => {
      let lights = 0;
      g.scene.traverse((o) => { if (o.isLight) lights++; });
      return { world: g.worldLayer.children.length, lights, hostiles: g.hostiles.length,
        stars: g.roamStars?.length ?? 0 };
    };
    const before = snap();
    for (let i = 0; i < 12; i++) for (const m of ['roam', 'missions', 'race']) g.setMode(m);
    return { before, after: snap() };
  });
  check(st.before.world === st.after.world && st.before.lights === st.after.lights
    && st.after.hostiles === 0 && st.after.stars === 0,
  '36 mode switches leave the world exactly as they found it', JSON.stringify(st));
}

check(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
console.log(`\n==== ${pass}/${pass + fail} PASSED ====`);
await b.close();
process.exit(fail ? 1 : 0);
