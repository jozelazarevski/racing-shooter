/* THE 📷 CYCLE MUST REACH THE SEAT — it is the only on-screen route now.
 * "Remove the eye and integrate the switch as part of the camera." So the
 * driver's view has to be reachable by pressing the REAL button, and the HUD
 * must be down to two icon buttons with the eye gone from the DOM entirely. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true });
p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', (e) => errs.push(String(e.message)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
await p.evaluate(() => window.__game.startRace?.());

let fail = 0;
const ok = (n, c, d = '') => { if (!c) fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

ok('the 👁 button is gone from the DOM', await p.evaluate(() => !document.getElementById('view-btn')));
ok('📷 and ⏸ are both still there', await p.evaluate(() =>
  !!document.getElementById('cam-btn') && !!document.getElementById('pause-btn')));

// PRESS THE REAL BUTTON, as many times as there are modes, and record the names.
const seen = await p.evaluate(async () => {
  const g = window.__game, names = [];
  for (let i = 0; i < 8; i++) {
    document.getElementById('cam-btn').click();
    await new Promise((r) => requestAnimationFrame(r));
    names.push({ i: g.camMode, driver: g.camMode === g.constructor.DRIVER_MODE });
  }
  return names;
});
const hitDriver = seen.findIndex((s) => s.driver);
ok('cycling 📷 reaches the driver\'s view', hitDriver >= 0,
  hitDriver >= 0 ? `after ${hitDriver + 1} presses` : `never reached in ${seen.length}`);
ok('and cycling past it comes back out', seen.filter((s) => s.driver).length >= 1
  && seen.some((s) => !s.driver), `${seen.filter((s) => s.driver).length} of ${seen.length} presses were the seat`);

// the two buttons must not collide now pause has moved back up
const boxes = await p.evaluate(() => ['cam-btn', 'pause-btn'].map((id) => {
  const r = document.getElementById(id).getBoundingClientRect();
  return { id, t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right) };
}));
const [a, c] = boxes;
const gap = Math.min(a.b, c.b) - Math.max(a.t, c.t);
ok('📷 and ⏸ do not overlap', gap <= 2, `vertical overlap ${gap}px  ${JSON.stringify(boxes)}`);
ok('no page errors', errs.length === 0, errs[0] ?? '');
await b.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe camera button carries the seat');
process.exit(fail ? 1 : 0);
