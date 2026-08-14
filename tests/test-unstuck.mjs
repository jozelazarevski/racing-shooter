/* AN UNSTUCK BUTTON, AND IT COSTS YOU 30 SECONDS.
 *
 * Asked for: "add another button for unstuck when I am stuck; needs to reset
 * 30s after usage."
 *
 * The automatic rescue nets are deliberately slow — five seconds of HELD
 * throttle before the wedge net fires — because an idle car parked on a
 * mountainside must never be yanked off it. That is right for a car the game
 * can tell is stuck, and useless for the case the player can see and it
 * cannot: nose-in against a rock, rolled into a ditch, pointing at a wall
 * with the road behind. Hence a button.
 *
 * It fires the SAME recovery the nets fire, so a hand-called rescue can never
 * behave differently from an automatic one, and it goes on a 30 s cooldown —
 * free and instant it would simply be a faster line through every corner.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 420 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 600000 });

// the button exists and is wired to the same data-key plumbing as the rest
const wired = await page.evaluate(() => {
  const b = document.getElementById('t-unstuck');
  return { exists: !!b, key: b?.dataset.key, badge: !!document.getElementById('b-unstuck') };
});
ok(wired.exists && wired.key === 'KeyR' && wired.badge,
  'the button exists, carries a key, and has a cooldown badge', JSON.stringify(wired));

const R = await page.evaluate(async () => {
  const g = window.__game, p = g.player, t = g.track;
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  // strand the car well off the road, stationary — the shape of being stuck
  const park = async () => {
    const c = t.center[(p.trackIndex + 40) % t.N];
    const n = t.nrm[(p.trackIndex + 40) % t.N];
    p.pos.set(c.x + n.x * 34, c.y + 3, c.z + n.z * 34);
    p.vel.set(0, 0, 0); p.vy = 0;
    for (let i = 0; i < 3; i++) await frame();
  };
  const offRoad = () => Math.abs(p.lateral ?? 0);

  p.unstuckCool = 0;
  await park();
  const strandedLat = offRoad();

  // press it — one frame is enough, it is an edge-triggered request
  p._unstuckReq = true;
  for (let i = 0; i < 4; i++) await frame();
  const afterLat = offRoad();
  const coolAfter = p.unstuckCool;

  // ...and it is now spent: a second press must NOT rescue
  await park();
  const strandedAgain = offRoad();
  p._unstuckReq = true;
  for (let i = 0; i < 4; i++) await frame();
  const stillStranded = offRoad();
  const coolStill = p.unstuckCool;

  // it recharges, and once recharged it works again
  p.unstuckCool = 0;
  p._unstuckReq = true;
  for (let i = 0; i < 4; i++) await frame();
  const rescuedAgain = offRoad();

  return { strandedLat, afterLat, coolAfter, strandedAgain, stillStranded, coolStill, rescuedAgain };
});

console.log(`  stranded ${R.strandedLat.toFixed(1)} u off the road → ${R.afterLat.toFixed(1)} u after the call`);

ok(R.strandedLat > 20, 'setup: the car really was stranded well off the road',
  `${R.strandedLat.toFixed(1)} u`);
ok(R.afterLat < 3, 'pressing it puts the car back on the road', `${R.afterLat.toFixed(1)} u`);
ok(Math.abs(R.coolAfter - 30) < 1.5, 'and starts a 30 s cooldown', `${R.coolAfter.toFixed(1)} s`);
ok(R.strandedAgain > 20 && R.stillStranded > 20,
  'a second press while recharging does NOT rescue — the cooldown is real',
  `${R.stillStranded.toFixed(1)} u`);
ok(R.coolStill > 0 && R.coolStill <= 30,
  'and a refused press does not top the cooldown back up', `${R.coolStill.toFixed(1)} s`);
ok(R.rescuedAgain < 3, 'once recharged it works again', `${R.rescuedAgain.toFixed(1)} u`);

// a fresh race hands it back
const fresh = await page.evaluate(() => {
  const g = window.__game;
  g.player.unstuckCool = 30;
  g.startRace?.();
  return g.player.unstuckCool;
});
ok(fresh === 0, 'every race starts with the rescue in hand', `${fresh}`);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join('\n'));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
