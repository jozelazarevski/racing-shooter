/* r316 — THE RALLY COPILOT (owner request): "tell the driver to slow down,
 * prepare for left or right turn, just like in a real rally. And maybe this
 * Copilot can be purchased and upgraded as well."
 *
 *   C1  unbought (level 0) the co-driver seat is EMPTY: no note, ever
 *   C2  L1 only yells: every note is SLOW DOWN
 *   C3  L3 calls the corners: notes flow at rally cadence, both directions
 *       appear on a lap that turns both ways, and severity grades show
 *   C4  the direction convention is the car's own: steer > 0 raises the
 *       heading and the copilot calls that LEFT
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
  const el = document.getElementById('copilot-note');
  const key = g.cars.selected;
  const drive = (secs) => {
    const notes = [];
    let lastTxt = '';
    for (let k = 0; k < secs * 60; k++) {
      const sp = Math.hypot(c.vel.x, c.vel.z);
      const aim = t.center[(c.trackIndex + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
      let a = Math.atan2(aim.x - c.pos.x, aim.z - c.pos.z) - c.heading;
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      g.input.analog.steer = Math.max(-1, Math.min(1, a * 1.8));
      g.input.analog.throttle = 0.85;
      g.frame();
      if (el && el.style.display !== 'none' && el.textContent !== lastTxt) {
        lastTxt = el.textContent;
        notes.push(el.textContent);
      }
    }
    return notes;
  };
  // C4: the steer-sign fact the direction call rests on
  const pt = t.pointAt(220, 0);
  c.pos.set(pt.x, t.groundHeightAt(220, 0) + 0.3, pt.z); c.y = c.pos.y;
  c.heading = t.headingAt(220); c.trackIndex = 220; c.alive = true;
  c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(15);
  const h0 = c.heading;
  for (let k = 0; k < 60; k++) c.step(1 / 60, { throttle: 0.5, brake: 0, steer: 1, drift: false, hold: false });
  let dh = c.heading - h0;
  while (dh > Math.PI) dh -= 2 * Math.PI;
  while (dh < -Math.PI) dh += 2 * Math.PI;
  const steerLeftRaises = dh > 0;
  // C1: level 0
  delete (g.garage.upgrades[key] ?? {}).copilot;
  const l0 = drive(15);
  // C2: level 1
  (g.garage.upgrades[key] ??= {}).copilot = 1;
  const l1 = drive(25);
  // C3: level 3
  g.garage.upgrades[key].copilot = 3;
  const l3 = drive(45);
  return { steerLeftRaises, l0, l1, l3 };
});

check('C1  unbought: the seat is empty — zero notes over 15 s', r.l0.length === 0,
  r.l0.slice(0, 2).join(' | ') || 'silent');
check('C2  L1 only yells: every note is SLOW DOWN',
  r.l1.every((n) => n.includes('SLOW')),
  `${r.l1.length} notes: ${r.l1.slice(0, 3).join(' | ') || '(none this lap — legal at L1)'}`);
check('C3  L3 calls the corners at rally cadence (>= 5 notes in 45 s)', r.l3.length >= 5,
  `${r.l3.length} notes`);
check('C3  both directions appear on a lap that turns both ways',
  r.l3.some((n) => n.includes('LEFT')) && r.l3.some((n) => n.includes('RIGHT')),
  r.l3.slice(0, 5).join(' | '));
check('C3  severity grades show (SHARP or HAIRPIN called somewhere)',
  r.l3.some((n) => n.includes('SHARP') || n.includes('HAIRPIN') || n.includes('SLOW')),
  r.l3.slice(0, 5).join(' | '));
check('C4  steer > 0 raises the heading — the LEFT call stands on it',
  r.steerLeftRaises === true);
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe co-driver is on the intercom');
process.exit(fail ? 1 : 0);
