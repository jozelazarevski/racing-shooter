/* r326 — THE TUNNEL CAMERA IS A CHOICE (owner: "Add camera that is when I
 * enter in the tunel as choice"). The look tunnels used to force — the
 * chase eye clamped under the bore roof, low and road-level — is now the
 * seventh CAM_MODE, selectable like any other. §6.4 stands: no automatic
 * cuts; the mode changes only when the player asks.
 *
 *   C1  the cycle has seven stops and wraps
 *   C2  TUNNEL settles low: eye within 8 u of the car's height at pace
 *       (CHASE runs ~11.5 + speed rise)
 *   C3  §6.4: crossing a real bore in CHASE never changes the mode
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 430, height: 932 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=4&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // C1: seven stops, wraps
  g.camMode = 0;
  const seq = [];
  for (let k = 0; k < 7; k++) { g.cycleCamera(); seq.push(g.camMode); }
  const wraps = seq[6] === 0 && seq[5] === 6;
  // C2: TUNNEL sits low at pace
  g.camMode = 6;
  g.input.analog.throttle = 1;
  for (let k = 0; k < 180; k++) g.frame();
  const lowDelta = +(g.camera.position.y - g.player.pos.y).toFixed(1);
  // C3: §6.4 — park INSIDE a bore in CHASE, the mode must not move
  g.input.analog.throttle = 0;
  g.camMode = 3;
  const t = g.track;
  let boreI = -1;
  for (let i = 20; i < t.center.length - 20; i += 4) {
    if (t.tunnelAt?.(t.pointAt(i, 0), i, 2)) { boreI = i; break; }
  }
  let modeMoved = false, sawBore = false;
  if (boreI >= 0) {
    g.player.placeAt(boreI + 2, 0);
    for (let k = 0; k < 90; k++) {
      g.frame();
      if (g.camMode !== 3) { modeMoved = true; break; }
      if (t.tunnelAt?.(g.player.pos, g.player.trackIndex, 2)) sawBore = true;
    }
  }
  return { seq, wraps, lowDelta, modeMoved, sawBore, boreI };
});

check('C1  seven camera stops, and the cycle wraps', r.wraps, r.seq.join(' '));
check('C2  TUNNEL settles low over the road', r.lowDelta > 2 && r.lowDelta < 8,
  `eye ${r.lowDelta} u over the car (CHASE runs ~13+)`);
check('C3  §6.4 holds: a real bore never switches the mode by itself',
  !r.modeMoved && r.sawBore, `bore crossed ${r.sawBore}, mode moved ${r.modeMoved}`);
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe tunnel is a choice now');
process.exit(fail ? 1 : 0);
