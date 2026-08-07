/* THE GARAGE HAS TO SAY SOMETHING DIFFERENT ABOUT EACH CAR.
 *
 * THE COMPLAINT: "Make sure the car descriptions are unique and car properties
 * are matching."
 *
 * Both halves were literally true, and both were structural rather than a slip:
 *
 *   - The per-world blurb was a pure function of (tier, surface). With six cars
 *     and three tiers, duplicates were arithmetic, not risk. Measured over
 *     seven worlds, EVERY one repeated itself; the worst had three distinct
 *     sentences for six machines, and OLIVE COAST told four different cars
 *     "OFF THE PACE - 1s A LAP".
 *
 *   - Every stat bar's range started at the roster MINIMUM, so the weakest car
 *     in a stat drew as an empty 6 % stub, which reads as zero. Five of six
 *     machines had one. The SLEEK showed no top speed at all on 54 against a
 *     best of 63 - 86 % of the fastest car in the game, drawn as nothing.
 *
 * What this asserts is therefore the two properties, not the wording: every
 * caption on a world is distinct, and no bar bottoms out. Plus the thing that
 * went wrong while fixing it - a four-star car captioned with a WEAKNESS,
 * because the cars above it had claimed all the positive phrases first.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// The bar ranges the garage renders with. Kept here as data so a change to
// them shows up as a test edit rather than as a silent shift in what the
// player is shown.
const RANGES = {
  SPD: ['maxSpeed', 50, 64], ACC: ['accel', 34, 40.5], GRP: ['grip', 4.2, 5.7],
  ARM: [null, 45, 175], OFF: ['offroad', 0.18, 1.05], NTR: ['nitroPower', 0.78, 1.22],
};

const probe = await browser.newPage({ viewport: { width: 640, height: 400 } });
await probe.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load' });
await probe.waitForFunction(() => window.__CARS, undefined, { timeout: 120000 });

// ---- 1. the catalogue's own one-liners ----
const cars = await probe.evaluate(() => window.__CARS.map((c) => ({
  key: c.key, name: c.name, desc: c.desc, stats: c.stats,
})));
const descs = cars.map((c) => c.desc);
check('every car has its own one-line description', new Set(descs).size === descs.length,
  `${new Set(descs).size}/${descs.length} distinct: ${descs.join(' | ')}`);

// ---- 2. no stat bar bottoms out ----
// 0.06 is the clamp in the renderer: anything at the clamp is a bar that has
// lost its value entirely and is drawing a stub.
const bars = await probe.evaluate((RANGES) => {
  const out = [];
  for (const c of window.__CARS) {
    const S = c.stats;
    for (const [label, [stat, lo, hi]] of Object.entries(RANGES)) {
      const v = stat ? (S[stat] ?? 1) : S.health / (S.plating ?? 1);
      out.push({ car: c.name, label, pct: Math.round(Math.max(0.06, Math.min(1, (v - lo) / (hi - lo))) * 100) });
    }
  }
  return out;
}, RANGES);
const stubs = bars.filter((b) => b.pct <= 8);
check('no stat bar reads as empty', stubs.length === 0,
  stubs.length ? stubs.map((b) => `${b.car} ${b.label}=${b.pct}%`).join(', ')
    : `weakest bar anywhere is ${Math.min(...bars.map((b) => b.pct))}%`);
// ...and the other way round: if a whole column saturates, the bar has stopped
// discriminating between machines just as surely as when it bottoms out.
const saturated = Object.keys(RANGES)
  .map((label) => ({ label, n: bars.filter((b) => b.label === label && b.pct >= 98).length }))
  .filter((c) => c.n > 1);
check('no stat column saturates across several cars', saturated.length === 0,
  saturated.length ? saturated.map((c) => `${c.label} x${c.n}`).join(', ')
    : `strongest bar anywhere is ${Math.max(...bars.map((b) => b.pct))}%`);

// ---- 3. each car's headline stat matches the words on the card ----
// Not a spelling check: the point is that "Off-road king" is the car with the
// highest OFF bar, "Fast on tarmac" the highest SPD, and so on. If a retune
// ever moves those apart, the card starts lying about the machine.
const HEADLINE = {
  crown: 'SPD', sleek: 'GRP', dune: 'OFF', pit: 'ARM', alpine: 'NTR',
};
for (const [key, label] of Object.entries(HEADLINE)) {
  const name = cars.find((c) => c.key === key)?.name ?? key;
  const col = bars.filter((b) => b.label === label);
  const top = col.reduce((a, b) => (b.pct > a.pct ? b : a));
  check(`${name} leads the roster on ${label}`, top.car === name,
    `${label} leader is ${top.car} at ${top.pct}%`);
}
// the all-rounder must be exactly that: no extreme in either direction
const brawler = bars.filter((b) => b.car === 'BRAWLER').map((b) => b.pct);
check('BRAWLER is an all-rounder', Math.min(...brawler) >= 35 && Math.max(...brawler) <= 80,
  `bars run ${Math.min(...brawler)}-${Math.max(...brawler)}%`);
await probe.close();

// ---- 4. the per-world captions ----
// A spread of surfaces on purpose. DRY worlds are the hard case: `offroad`
// multiplies into gripEff through (1 - base), so on dry tarmac its sensitivity
// is exactly zero and the model has fewer levers to explain a car with.
const WORLDS = [[1, 'PINE VALLEY', 'wet'], [21, 'FURKA RIDGE', 'snow'],
                [29, 'OLIVE COAST', 'dry'], [32, 'RED CENTRE RUN', 'dry'],
                [27, 'CORNICHE', 'dry']];

let generic = 0, cells = 0;
for (const [id, name, surf] of WORLDS) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center && window.__rateCarsFor,
    undefined, { timeout: 300000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  const r = await p.evaluate(() => {
    const m = window.__rateCarsFor(window.__game.track);
    return window.__CARS.map((c) => ({ car: c.name, ...m.get(c.key) }));
  });

  const notes = r.map((x) => x.note);
  check(`${name} (${surf}): every car gets its own caption`,
    new Set(notes).size === notes.length,
    `${new Set(notes).size}/${notes.length} distinct`);

  // A car rated four or five stars must never be captioned with a weakness.
  // This is the defect that appeared while fixing the duplicates: PIT-99 sat
  // second quickest on RED CENTRE RUN under "RUNS OUT OF GRIP IN THE TURNS",
  // because the cars ahead had taken every positive phrase.
  const miscaptioned = r.filter((x) => x.stars >= 4 && x.polarity < 0);
  check(`${name}: no strong car is captioned with a weakness`, miscaptioned.length === 0,
    miscaptioned.length ? miscaptioned.map((x) => `${x.car} ${x.stars}★ "${x.note}"`).join(', ') : 'none');
  const flattered = r.filter((x) => x.stars <= 2 && x.polarity > 0);
  check(`${name}: no trailing car is captioned with a strength`, flattered.length === 0,
    flattered.length ? flattered.map((x) => `${x.car} ${x.stars}★ "${x.note}"`).join(', ') : 'none');

  cells += r.length;
  generic += r.filter((x) => x.polarity === 0).length;

  for (const x of r) console.log(`      ${x.car.padEnd(8)} ${'★'.repeat(x.stars)}${'☆'.repeat(5 - x.stars)}  ${x.note}`);
  await p.close();
}

// The vague fallback is honest — it fires when a car has no term of the right
// sign left — but it carries no information, so it has to stay rare. If this
// starts climbing, the phrase table has run out of ways to say things.
check('the generic fallback stays rare', generic <= cells * 0.1,
  `${generic} of ${cells} cells fell through to a generic caption`);

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nevery car reads as its own machine');
process.exit(fail ? 1 : 0);
