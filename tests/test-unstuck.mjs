/* AN UNSTUCK BUTTON, AND IT IS FREE.
 *
 * History, because the law reversed and the reversal is the point. The button
 * was asked for with a 30 s cooldown ("needs to reset 30s after usage"), and
 * r173 added a per-race charge on top so a long stage could not farm it. The
 * CORRIDOR refactor (§10) deletes the whole economy: a reset puts you BACK on
 * the line, not forward past anything, so there is nothing left to farm and
 * nothing worth rationing. What remains is a 1.5 s re-arm
 * (playerResetDelayS) so a held key cannot machine-gun the teleport.
 *
 * The acceptance is R11, verbatim: "Press RESET 20 times in a row → 20
 * returns, no counter decrements, ~1.5 s delay each." And §8 deletes the
 * UNSTUCK/RECOVERED toasts — the reset is the feedback — so this suite
 * counts telemetry `unstuck` events, never feed text.
 *
 *   node tests/test-unstuck.mjs
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
  'the button exists, carries a key, and has a re-arm badge', JSON.stringify(wired));

const R = await page.evaluate(async () => {
  const g = window.__game, p = g.player, t = g.track;
  // fixed step, no rendering — wall-clock frames would make the twenty-press
  // ladder a thirty-second test and a flaky one
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
    get elapsedTime() { return elapsed; } };

  let rescues = 0;
  const realLog = g.telemetry.log.bind(g.telemetry);
  g.telemetry.log = (kind, data) => { if (kind === 'unstuck') rescues++; return realLog(kind, data); };

  const frames = (n) => { for (let i = 0; i < n; i++) g._frameBody(); };
  // strand the car well off the road, stationary — the shape of being stuck
  const park = () => {
    const c = t.center[(p.trackIndex + 40) % t.N];
    const n = t.nrm[(p.trackIndex + 40) % t.N];
    p.pos.set(c.x + n.x * 34, c.y + 3, c.z + n.z * 34);
    p.vel.set(0, 0, 0); p.vy = 0;
    p._wedgeT = 0; p._lostT = 0; p._cliffT = 0;
    frames(3);
  };
  const offRoad = () => Math.abs(p.lateral ?? 0);

  p.unstuckCool = 0;
  park();
  const strandedLat = offRoad();

  // press it — one frame is enough, it is an edge-triggered request
  p._unstuckReq = true;
  frames(4);
  const afterLat = offRoad();
  const coolAfter = p.unstuckCool;
  const sosAfter = p.sos;   // the ration is dead: nothing may decrement

  // ...a press DURING the re-arm does nothing (the machine-gun guard)
  park();
  const strandedAgain = offRoad();
  p._unstuckReq = true;
  frames(4);
  const stillStranded = offRoad();
  const coolStill = p.unstuckCool;

  // ...and once the 1.5 s re-arm lapses it simply works again — no charge,
  // no counter, nothing to hand back. sos is forced to 0 to prove the old
  // ration is not consulted.
  p.sos = 0;
  frames(95);               // ~1.58 game-seconds
  p._unstuckReq = true;
  frames(4);
  const rescuedAgain = offRoad();

  // R11: twenty consecutive resets, ~1.5 s apart, all honoured
  let returns = 0;
  for (let k = 0; k < 20; k++) {
    park();
    const before = rescues;
    frames(95);             // let the previous re-arm lapse
    p._unstuckReq = true;
    frames(4);
    if (rescues > before && offRoad() < 3) returns++;
  }

  return { strandedLat, afterLat, coolAfter, sosAfter, strandedAgain,
    stillStranded, coolStill, rescuedAgain, returns, rescues };
});

console.log(`  stranded ${R.strandedLat.toFixed(1)} u off the road → ${R.afterLat.toFixed(1)} u after the call`);

ok(R.strandedLat > 20, 'setup: the car really was stranded well off the road',
  `${R.strandedLat.toFixed(1)} u`);
ok(R.afterLat < 3, 'pressing it puts the car back on the road', `${R.afterLat.toFixed(1)} u`);
ok(R.coolAfter > 0.5 && R.coolAfter <= 1.6,
  'and starts the 1.5 s re-arm — not the old 30 s ration', `${R.coolAfter.toFixed(2)} s`);
ok(R.sosAfter === undefined || R.sosAfter >= 1,
  'no counter decrements — the rescue is free (§10)', `sos=${R.sosAfter}`);
ok(R.strandedAgain > 20 && R.stillStranded > 20,
  'a press during the re-arm does NOT rescue — the delay is real',
  `${R.stillStranded.toFixed(1)} u`);
ok(R.coolStill > 0 && R.coolStill <= 1.6,
  'and a refused press does not top the re-arm back up', `${R.coolStill.toFixed(2)} s`);
ok(R.rescuedAgain < 3,
  'once re-armed it works again with NO charge in hand — unlimited, as §10 says',
  `${R.rescuedAgain.toFixed(1)} u with sos=0`);
ok(R.returns === 20,
  'R11: press RESET 20 times in a row → 20 returns, ~1.5 s delay each',
  `${R.returns}/20 honoured (${R.rescues} unstuck events total)`);

// a fresh race still hands the button back armed
const fresh = await page.evaluate(() => {
  const g = window.__game;
  g.player.unstuckCool = 1.5;
  g.startRace?.();
  return { cool: g.player.unstuckCool };
});
ok(fresh.cool === 0, 'every race starts with the rescue armed', JSON.stringify(fresh));
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join('\n'));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
