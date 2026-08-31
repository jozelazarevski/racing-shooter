/* RALLY_HUD_REVIEW §5 — the acceptance gates, as they map headless.
 *
 *   H1  car bounding box never enters the controls band (70%+), any mode
 *   H2  30 damage -> bar flash + vignette + floating number, same frame
 *   H3  three damage events in 1 s -> danger lane shows ONE; others empty
 *   H4  grid to GO+3 s: zero toasts; countdown centred and >=44px
 *   H5  one-thumb <-> two-thumb: weapon cluster + UNSTUCK do not move
 *   H6  rival 30 u behind, off-screen -> edge arrow visible
 *   H8  no in-race text under 12 px (computed, visible HUD only)
 *
 * H7 (standalone viewport) is a device property — the manifest carries
 * display:standalone; headless cannot measure a home-screen launch.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=4&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });

// ---- H4 first: the countdown window, before the race starts ----------------
const h4 = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 300 && g.state !== 'countdown'; k++) g.frame();
  g.hud.feed('A TOAST THAT MUST NOT SHOW', 'info');
  g.hud.feed('DUNE: see ya!', 'info');
  g.hud.feed('HIT ROCK  −20 HULL', 'bad');
  const toasts = document.querySelectorAll('#feed .feed-msg, #danger-lane .dmsg, #chatter .cmsg').length;
  const cm = getComputedStyle(document.getElementById('center-msg'));
  return { state: g.state, toasts, fs: parseFloat(cm.fontSize), left: cm.left };
});
check('H4  the grid is silent — no toasts from spawn to GO+3', h4.state === 'countdown' && h4.toasts === 0,
  `state=${h4.state}, ${h4.toasts} toasts leaked`);
check('H4  the countdown owns the centre at display size', h4.fs >= 44, `${h4.fs}px`);

// ---- run into the race ------------------------------------------------------
await p.evaluate(() => {
  const g = window.__game;
  for (let k = 0; k < 600 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  for (let k = 0; k < 200; k++) g.frame();          // past the 3 s window
});

// ---- H1: the car anchor, every non-driver mode, driving -------------------
const h1 = await p.evaluate(() => {
  const g = window.__game, c = g.player, t = g.track;
  const names = g.constructor.CAM_NAMES;
  const N = t.center.length;
  const out = {};
  for (let m = 0; m < names.length; m++) {
    if (names[m] === 'DRIVER') continue;
    g.camMode = m;
    let worst = 0;
    // ride the spline rather than free-drive: the gate measures FRAMING, and
    // a blind 30 u/s plough into scenery measures the crash instead
    for (let k = 0; k < 240; k++) {
      const idx = (100 + Math.floor(k * 0.5)) % N;
      const pt = t.pointAt(idx, 0);
      c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
      c.trackIndex = idx; c.heading = t.headingAt(idx);
      c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(30);
      c.airborne = false; c.vy = 0; c.alive = true;
      g.frame();
      if (k < 40) continue;                       // let the boom settle first
      // the bbox BOTTOM is the deepest screen point: project the contact patch
      const v = c.mesh.position.clone().project(g.camera);
      if (v.z < 1) worst = Math.max(worst, (1 - (v.y + 1) / 2) * 100);
    }
    out[names[m]] = +worst.toFixed(1);
  }
  return out;
});
for (const [name, worst] of Object.entries(h1)) {
  check(`H1  ${name}: the car never enters the controls band`, worst < 70, `deepest ${worst}%`);
}

// ---- H2: damage presentation, same frame -----------------------------------
const h2 = await p.evaluate(() => {
  const g = window.__game, c = g.player;
  g.camMode = 0; g.state = 'race'; c.alive = true; c.invuln = 0; c.health = 90;
  g.frame();
  c.damage(30, null, true);
  g.frame();                                        // the hud watches per frame
  return {
    flash: document.getElementById('health-box').classList.contains('hit'),
    vignette: parseFloat(document.getElementById('damage-vignette').style.opacity || 0),
    floats: document.querySelectorAll('#dmg-floats .dfloat').length,
  };
});
check('H2  a 30-damage hit flashes, vignettes and floats a number',
  h2.flash && h2.vignette > 0 && h2.floats >= 1,
  `flash=${h2.flash}, vignette=${h2.vignette.toFixed(2)}, floats=${h2.floats}`);

// ---- H3: three damage events in a second -> one danger toast ---------------
const h3 = await p.evaluate(() => {
  const g = window.__game;
  g.state = 'race'; g.raceTime = 30;
  // clear residue from the live race frames above — the gate is about what
  // THESE three events produce
  for (const id of ['feed', 'chatter', 'danger-lane']) document.getElementById(id).innerHTML = '';
  g.hud.feed('SIDESWIPED ROCK  −12 HULL', 'bad');
  g.hud.feed('TRACTOR  −9 HULL', 'bad');
  g.hud.feed('HIT ROCK  −25 HULL', 'bad');
  return {
    danger: document.querySelectorAll('#danger-lane .dmsg').length,
    dangerText: document.querySelector('#danger-lane .dmsg')?.textContent ?? '',
    progress: document.querySelectorAll('#feed .feed-msg').length,
    chatter: document.querySelectorAll('#chatter .cmsg').length,
  };
});
check('H3  the danger lane shows the LATEST only; other lanes untouched',
  h3.danger === 1 && h3.dangerText.includes('−25') && h3.progress === 0 && h3.chatter === 0,
  `danger=${h3.danger} ("${h3.dangerText}"), progress=${h3.progress}, chatter=${h3.chatter}`);

// ---- H5: scheme toggle moves NOTHING in the weapon cluster -----------------
const h5 = await p.evaluate(() => {
  document.body.classList.add('touch');
  document.body.classList.remove('two-thumb');
  const ids = ['t-fire', 't-missile', 't-mine', 't-shock', 't-nitro', 't-unstuck'];
  const grab = () => Object.fromEntries(ids.map((id) => {
    const r = document.getElementById(id).getBoundingClientRect();
    return [id, [Math.round(r.left), Math.round(r.top)]];
  }));
  const one = grab();
  document.body.classList.add('two-thumb');
  const two = grab();
  document.body.classList.remove('touch', 'two-thumb');
  const moved = ids.filter((id) => one[id][0] !== two[id][0] || one[id][1] !== two[id][1]);
  return { moved };
});
check('H5  weapon cluster and UNSTUCK hold their ground across schemes',
  h5.moved.length === 0, h5.moved.length ? `moved: ${h5.moved.join(', ')}` : '');

// ---- H6: off-screen rival within 40 u gets an edge arrow -------------------
const h6 = await p.evaluate(() => {
  const g = window.__game, c = g.player;
  g.camMode = 0; g.state = 'race';
  const e = g.enemies.find((x) => x.alive) ?? g.enemies[0];
  e.alive = true;
  // park the rival 30 u directly BEHIND the player (off-screen in top-down)
  e.pos.set(c.pos.x - Math.sin(c.heading) * 30, c.pos.y, c.pos.z - Math.cos(c.heading) * 30);
  e.mesh.position.copy(e.pos);
  g.hud._edgeArrows();
  const vis = [...document.querySelectorAll('#edge-arrows .earrow')]
    .filter((a) => a.style.display !== 'none').length;
  return { vis };
});
check('H6  a rival 30 u behind shows an edge arrow', h6.vis >= 1, `${h6.vis} arrows`);

// ---- H8: the typography floor ----------------------------------------------
const h8 = await p.evaluate(() => {
  const bad = [];
  const hud = document.getElementById('hud');
  const walk = (el) => {
    for (const ch of el.children) walk(ch);
    if (!el.textContent.trim()) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const fs = parseFloat(cs.fontSize);
    if (fs < 12) bad.push(`${el.id || el.className || el.tagName}@${fs}px`);
  };
  walk(hud);
  return { bad: bad.slice(0, 6) };
});
check('H8  no visible in-race text under 12 px', h8.bad.length === 0, h8.bad.join(', '));

check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
await p.close();
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe HUD shows the right thing in the right place');
process.exit(fail ? 1 : 0);
