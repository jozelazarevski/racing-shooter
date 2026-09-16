// Tracks must genuinely suit some cars and punish others, and the menu must
// tell the truth about which.
//
// A note on method, because the first attempt at this was wrong. I began by
// simulating laps with an autopilot and ranking the cars by lap time. Two
// different autopilots produced OPPOSITE rankings on the same world — one put
// the DUNE first at FROST PEAK, the other put it last, and five worlds DNF'd
// entirely. A crude driver's lap time measures the driver. So the rating is now
// a driver-free calculation from the physics constants (paceEstimate), and this
// suite checks the properties that calculation must have.
import { chromium } from 'playwright-core';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 480, height: 360 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

let pass = 0, fail = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
  ok ? pass++ : fail++;
};
const boot = async (lvl) => {
  await page.goto(`http://127.0.0.1:8901/index.html?level=${lvl}&unlockall=1`,
    { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__game && window.__game.track, undefined, { timeout: 180000 });
};

// ---- 1. the world-character tags still match the real geometry
const drift = [];
for (let lvl = 1; lvl <= 21; lvl++) {
  await boot(lvl);
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track;
    const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
    let kSum = 0, straight = 0, gradeSum = 0;
    for (let i = 0; i < t.N; i++) {
      const j = (i + 3) % t.N;
      const a = t.center[i], c = t.center[j];
      const ds = Math.hypot(c.x - a.x, c.z - a.z) || 1;
      const k = Math.abs(wrap(t.headingAt(j) - t.headingAt(i))) / ds;
      kSum += k;
      if (k < 0.004) straight++;
      gradeSum += Math.abs(c.y - a.y) / ds;
    }
    const surf = t.T?.surface ?? 'dry';
    const B = window.__DEMAND_BOUNDS;   // read from the game, never re-typed here
    const n = (v, [lo, hi]) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
    return { lvl: g.level.id, name: g.level.name,
      live: {
        loose: surf === 'snow' ? 1 : surf === 'wet' ? 0.55 : 0.12,
        twist: n(kSum / t.N, B.twist),
        fast: n(100 * straight / t.N, B.fast),
        climb: n(100 * gradeSum / t.N, B.climb),
      },
      baked: window.__DEMANDS?.[g.level.id] ?? null };
  });
  if (!r.baked) { drift.push(`${r.name}: no entry`); continue; }
  for (const k of ['loose', 'twist', 'fast', 'climb']) {
    if (Math.abs(r.live[k] - r.baked[k]) > 0.12) {
      drift.push(`${r.name}.${k} live=${r.live[k].toFixed(2)} table=${r.baked[k].toFixed(2)}`);
    }
  }
}
check(drift.length === 0, 'world-character table still matches the real geometry',
  drift.slice(0, 6).join(' | '));

// ---- 2. the rating is DETERMINISTIC (it must not depend on a driver at all)
await boot(3);
const twice = await page.evaluate(() => {
  const a = [...window.__rateCarsFor(window.__game.track)].map(([k, v]) => `${k}:${v.seconds.toFixed(4)}`);
  const b2 = [...window.__rateCarsFor(window.__game.track)].map(([k, v]) => `${k}:${v.seconds.toFixed(4)}`);
  return { a: a.join(','), b: b2.join(',') };
});
check(twice.a === twice.b, 'the rating is deterministic', twice.a);

// ---- 3. it separates the cars, and differently on different worlds
const seen = [];
for (const lvl of [3, 13, 8, 17, 19, 2]) {
  await boot(lvl);
  const r = await page.evaluate(() => {
    const g = window.__game;
    const m = window.__rateCarsFor(g.track);
    const rows = [...m].sort((a, c) => a[1].seconds - c[1].seconds);
    return { name: g.level.name, surface: g.track.T?.surface ?? 'dry',
      order: rows.map(([k]) => k),
      spread: +(rows.at(-1)[1].seconds - rows[0][1].seconds).toFixed(1),
      top: rows[0][0], grip: Object.fromEntries(rows.map(([k, v]) => [k, v.stars])) };
  });
  console.log(`      ${r.name.padEnd(22)} [${r.surface}] ${r.order.join(' > ')}  spread ${r.spread}s`);
  seen.push(r);
}
check(new Set(seen.map((s) => s.order.join())).size > 1,
  'different worlds rank the machines differently',
  seen.map((s) => `${s.name}=${s.top}`).join(', '));
// Not every world CAN discriminate — a wide, flat, fast circuit caps every car
// at its own top speed, and those only span 55-63. What must hold is that most
// worlds reward the choice, and that the ones built to test traction do so hard.
check(seen.filter((s) => s.spread >= 1.0).length >= Math.ceil(seen.length * 0.66),
  'most worlds make the choice of machine worth a second or more',
  seen.map((s) => `${s.name} ${s.spread}s`).join(', '));
// SNOW is the hard traction test (surface grip 0.55) and must reward the right
// machine heavily. WET is a mild 0.78 modifier — on a wide fast wet circuit the
// machine genuinely matters less, and claiming otherwise would be a lie.
check(seen.filter((s) => s.surface === 'snow').every((s) => s.spread >= 3.0),
  'snow worlds reward the right machine heavily',
  seen.filter((s) => s.surface === 'snow').map((s) => `${s.name} ${s.spread}s`).join(', '));

// ---- 4. the loose-surface trait is REAL in the integrator, not just the label.
// Same track, same input, two cars: the one with more OFF-ROAD must actually
// keep more grip on snow, and neither may gain anything on dry.
// Compare the SURFACE MULTIPLIER each car gets (measured grip ÷ its own base
// grip stat), not raw grip — the cars have different base grip by design, so
// comparing raw numbers would "prove" a difference on dry tarmac too.
for (const [lvl, surf, mustDiffer] of [[3, 'snow', true], [2, 'dry', false]]) {
  await boot(lvl);
  const g = await page.evaluate(() => {
    const g2 = window.__game;
    const read = (key) => {
      const car = window.__CARS.find((c) => c.key === key);
      g2.swapPlayerCar(car);
      g2.applyUpgrades();
      g2.__gripProbe = {};
      const t = g2.track, pl = g2.player, c = t.center[120];
      pl.pos.set(c.x, c.y + 0.6, c.z);
      pl.heading = t.headingAt(120);
      pl.vel.set(Math.sin(pl.heading) * 26, 0, Math.cos(pl.heading) * 26);
      pl.slip = 0; pl._wetT = 0; pl.landGrip = 0; pl.gripBoost = 1;
      pl.step(1 / 60, { throttle: 1, brake: 0, steer: 0.4, drift: false, hold: false });
      return +(g2.__gripProbe.grip / car.stats.grip).toFixed(3);  // surface term
    };
    return { duneMul: read('dune'), crownMul: read('crown'), surface: g2.track.T?.surface ?? 'dry' };
  });
  const differs = g.duneMul - g.crownMul > 0.05;
  check(mustDiffer ? differs : Math.abs(g.duneMul - g.crownMul) < 0.01,
    mustDiffer
      ? `on ${surf}, OFF-ROAD really buys grip in the integrator`
      : `on ${surf}, the surface term is identical for every car`,
    JSON.stringify(g));
}

// ---- 5. every machine must be the right answer SOMEWHERE. A car that is never
// the pick is a hole in the garage, and the point of the system is switching.
{
  const wins = new Map();
  for (let lvl = 1; lvl <= 21; lvl++) {
    await boot(lvl);
    const top = await page.evaluate(() => {
      const rows = [...window.__rateCarsFor(window.__game.track)]
        .sort((a, c) => a[1].seconds - c[1].seconds);
      return rows[0][0];
    });
    wins.set(top, (wins.get(top) ?? 0) + 1);
  }
  const all = await page.evaluate(() => window.__CARS.map((c) => c.key));
  const never = all.filter((k) => !wins.has(k));
  // The free starter is SUPPOSED to be beaten everywhere — that is the reason
  // to upgrade. Every machine you pay for has to be the right answer somewhere.
  check(never.length <= 1 && !never.some((k) => k !== 'brawler'),
    'every machine you can buy is the quickest somewhere',
    `wins: ${[...wins].map(([k, n]) => `${k}x${n}`).join(' ')}${never.length ? ` | never: ${never.join(',')}` : ''}`);
}

check(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
console.log(`\n==== ${pass}/${pass + fail} PASSED ====`);
await b.close();
process.exit(fail ? 1 : 0);
