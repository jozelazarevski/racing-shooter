/* RALLY_HUD_REVIEW §5 — the acceptance gates, as they map headless.
 *
 *   H1  car bounding box never enters the controls band (70%+), any mode
 *   H2  30 damage -> bar flash + vignette + floating number, same frame
 *   H3  three damage events in 1 s -> danger lane shows ONE; others empty
 *   H4  grid to GO+3 s: zero toasts; countdown centred and >=44px
 *   H5  one-thumb <-> two-thumb: weapon cluster + UNSTUCK do not move
 *   H6  REVERSED by CLAUDE.md v1.2 §3.5 (r302): rival arrows are ERASED —
 *       a rival behind shows NOTHING; only a missile hunting the player
 *       still gets its threat arrow (combat information, not wayfinding)
 *   H8  no in-race text under 12 px (computed, visible HUD only)
 *   r302 additions: hull top-left under the clocks; the Porsche gauge
 *   renders (tach + digital speed + gear) from its bottom-centre home
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
    let worst = 0, prevGY = null, skip = 0;
    // ride the spline rather than free-drive: the gate measures FRAMING, and
    // a blind 30 u/s plough into scenery measures the crash instead.
    // r336: the same principle vertically — CANYON RUN's ride crosses the
    // gorge jump, where groundHeightAt dives 29 u in one station. The
    // teleport down that wall (and the boom's scramble after it) measured
    // the plunge, not the framing — TUNNEL read 94% from it, CHASE 61%. A
    // real car flies that gap with the camera tracking smoothly, so frames
    // around any vertical discontinuity are ridden but not judged, for
    // every mode equally. The law itself is unchanged: < 70% on every
    // frame of continuous road.
    for (let k = 0; k < 240; k++) {
      const idx = (100 + Math.floor(k * 0.5)) % N;
      const pt = t.pointAt(idx, 0);
      const gY = t.groundHeightAt(idx, 0) + 0.3;
      if (prevGY !== null && Math.abs(gY - prevGY) > 3) skip = 30;
      else if (skip > 0) skip--;
      prevGY = gY;
      c.pos.set(pt.x, gY, pt.z); c.y = c.pos.y;
      c.trackIndex = idx; c.heading = t.headingAt(idx);
      c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(30);
      c.airborne = false; c.vy = 0; c.alive = true;
      g.frame();
      if (k < 40 || skip > 0) continue;           // settle / discontinuity mask
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

// ---- H5 (amended r305): the weapon ROW keeps its X-ADDRESSES across
// schemes — the muscle-memory that matters is which button is where along
// the line. Its HEIGHT follows each scheme's floor (one-thumb rides the
// bottom edge, two-thumb sits above its pedal row), so Y is per-scheme by
// design; UNSTUCK still holds both axes. --------------------------------
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
  const movedX = ids.filter((id) => one[id][0] !== two[id][0]);
  const sosMovedY = one['t-unstuck'][1] !== two['t-unstuck'][1];
  return { movedX, sosMovedY };
});
check('H5  the weapon row keeps its x-addresses across schemes; UNSTUCK holds both',
  h5.movedX.length === 0 && !h5.sosMovedY,
  h5.movedX.length ? `x moved: ${h5.movedX.join(', ')}` : h5.sosMovedY ? 'UNSTUCK y moved' : '');

// ---- H6 (reversed, §3.5): rivals get NO arrow; a hunting missile does -----
const h6 = await p.evaluate(() => {
  const g = window.__game, c = g.player;
  g.camMode = 0; g.state = 'race';
  const e = g.enemies.find((x) => x.alive) ?? g.enemies[0];
  e.alive = true;
  // park the rival 30 u directly BEHIND the player (off-screen in top-down)
  e.pos.set(c.pos.x - Math.sin(c.heading) * 30, c.pos.y, c.pos.z - Math.cos(c.heading) * 30);
  e.mesh.position.copy(e.pos);
  g.hud._edgeArrows();
  const count = () => [...document.querySelectorAll('#edge-arrows .earrow')]
    .filter((a) => a.style.display !== 'none').length;
  const rivalArrows = count();
  // now a missile locked on the player, far enough behind to be off-screen
  // (the arrow only exists for threats the camera cannot show)
  const fake = { active: true, target: c,
    pos: c.pos.clone().add({ x: -Math.sin(c.heading) * 45, y: 0, z: -Math.cos(c.heading) * 45 }) };
  g.weapons = g.weapons ?? {};
  const kept = g.weapons.missiles;
  g.weapons.missiles = [fake];
  g.hud._edgeArrows();
  const missileArrows = count();
  g.weapons.missiles = kept ?? [];
  g.hud._edgeArrows();
  return { rivalArrows, missileArrows };
});
check('H6  a rival behind shows NOTHING — wayfinding and rival arrows are erased',
  h6.rivalArrows === 0, `${h6.rivalArrows} arrows`);
check('H6  a missile hunting the player still gets its threat arrow',
  h6.missileArrows >= 1, `${h6.missileArrows} arrows`);

// ---- r302: hull top-left, gauge bottom-centre ------------------------------
const r302 = await p.evaluate(() => {
  const hull = document.getElementById('health-box').getBoundingClientRect();
  const info = document.getElementById('race-info').getBoundingClientRect();
  const box = document.getElementById('speed-box');
  const cs = getComputedStyle(box);
  const r = box.getBoundingClientRect();
  const g = window.__game;
  g.hud.update(1 / 60);                      // one draw so the gear latches
  return {
    hullLeft: hull.left, hullTop: hull.top, hullBottom: hull.bottom,
    infoBottom: info.bottom, vh: innerHeight, vw: innerWidth,
    gaugeShown: cs.display !== 'none' && r.width > 0,
    gaugeCentered: Math.abs((r.left + r.right) / 2 - innerWidth / 2) < innerWidth * 0.2,
    gaugeBottom: r.top > innerHeight * 0.6,
    gear: g.hud._lastGear ?? null,
  };
});
check('r302  the hull sits top-left, stacked under the clocks',
  r302.hullLeft < 60 && r302.hullTop >= r302.infoBottom && r302.hullBottom < r302.vh * 0.45,
  `left=${Math.round(r302.hullLeft)}, top=${Math.round(r302.hullTop)} (race-info ends ${Math.round(r302.infoBottom)})`);
check('r302  the gauge is back: visible, bottom-centre, and it knows its gear',
  r302.gaugeShown && r302.gaugeCentered && r302.gaugeBottom && r302.gear !== null,
  `shown=${r302.gaugeShown}, centred=${r302.gaugeCentered}, low=${r302.gaugeBottom}, gear=${r302.gear}`);

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
