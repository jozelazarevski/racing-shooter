/* DOES THE CANNON SHOOT WHERE THE SEAT IS LOOKING?
 *
 * Reported as "the cannon and the place where it's being shot from are
 * different". Measures the ANGLE between the tracer's launch direction and the
 * camera's own heading, in the seat and in a chase view, while the car is
 * SLIDING — because the two only diverge through the slip angle, and a car
 * driving straight would show 0 either way and prove nothing.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', (e) => errs.push(String(e.message)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });

const r = await p.evaluate(async () => {
  const g = window.__game, pl = g.player;
  g.startRace?.();
  const frame = () => new Promise((r2) => requestAnimationFrame(r2));
  const out = [];
  for (const seat of [true, false]) {
    g.setDriverView(seat);
    for (let k = 0; k < 8; k++) await frame();
    // FORCE A SLIP ANGLE: point the car one way, move it another. That is the
    // whole reason the two headings differ, and a straight line hides it.
    const h = pl.heading;
    pl.vel.set(Math.sin(h + 0.5) * 34, 0, Math.cos(h + 0.5) * 34);
    for (let k = 0; k < 6; k++) await frame();
    const before = g.weapons.bullets.filter((x) => x.active).length;
    g.weapons.fireBullet(pl, 5, 0);          // zero spread: no random term
    const fired = g.weapons.bullets.filter((x) => x.active);
    const bl = fired[fired.length - 1] ?? g.weapons.bullets[(g.weapons.head - 1 + 220) % 220];
    // camera heading, horizontal
    const dx = g.camLook.x - g.camPos.x, dz = g.camLook.z - g.camPos.z;
    const camH = Math.atan2(dx, dz);
    // bullet heading, with the car's own velocity carry removed — fireBullet
    // adds 0.6 * car.vel, which is real ballistics and not an aiming error
    const bx = bl.vel.x - pl.vel.x * 0.6, bz = bl.vel.z - pl.vel.z * 0.6;
    const bulH = Math.atan2(bx, bz);
    const carH = Math.atan2(pl.forward.x, pl.forward.z);
    const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
    out.push({
      seat,
      camVsBullet: +(Math.abs(wrap(camH - bulH)) * 180 / Math.PI).toFixed(2),
      camVsCar: +(Math.abs(wrap(camH - carH)) * 180 / Math.PI).toFixed(2),
      // THE DIRECT QUESTION for the chase case. Asserting "the bullet does NOT
      // follow the camera" is not testable when the chase camera happens to be
      // pointed along the car anyway (measured: 0.39 deg apart), because then
      // both rules predict the same shot. Bullet-vs-CAR discriminates always.
      bulletVsCar: +(Math.abs(wrap(bulH - carH)) * 180 / Math.PI).toFixed(2),
      slip: +(Math.abs(wrap(Math.atan2(pl.vel.x, pl.vel.z) - carH)) * 180 / Math.PI).toFixed(1),
      muzzleY: +(bl.pos.y - pl.pos.y).toFixed(2), eyeY: +(g.camPos.y - pl.pos.y).toFixed(2),
    });
    pl.vel.set(Math.sin(h) * 30, 0, Math.cos(h) * 30);
    for (let k = 0; k < 6; k++) await frame();
  }
  return out;
});

let fail = 0;
const ok = (n, c, d = '') => { if (!c) fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
for (const q of r) {
  console.log(`${q.seat ? 'SEAT ' : 'CHASE'}  slip ${q.slip}deg | cam-vs-bullet ${q.camVsBullet}deg`
    + ` | cam-vs-car ${q.camVsCar}deg | bullet-vs-CAR ${q.bulletVsCar}deg`
    + ` | muzzle ${q.muzzleY} u, eye ${q.eyeY} u above the car`);
}
const seat = r.find((q) => q.seat), chase = r.find((q) => !q.seat);
ok('the slide really was a slide — otherwise nothing below discriminates',
  seat.slip > 10 && chase.slip > 10, `seat ${seat.slip}deg, chase ${chase.slip}deg`);
ok('IN THE SEAT the cannon fires where the camera looks', seat.camVsBullet < 1.0,
  `${seat.camVsBullet}deg off`);
ok('and the camera genuinely was NOT pointed along the car (else this is vacuous)',
  seat.camVsCar > 3, `${seat.camVsCar}deg between camera and car`);
ok('CHASE still fires along the CAR — the shot is unchanged outside the seat',
  chase.bulletVsCar < 1.0, `bullet is ${chase.bulletVsCar}deg off the car`);
ok('and in the SEAT the shot leaves the car heading by the camera\'s own offset',
  Math.abs(seat.bulletVsCar - seat.camVsCar) < 1.0,
  `bullet-vs-car ${seat.bulletVsCar}deg against camera-vs-car ${seat.camVsCar}deg`);
ok('no page errors', errs.length === 0, errs[0] ?? '');
await b.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe cannon and the view agree in the seat');
process.exit(fail ? 1 : 0);
