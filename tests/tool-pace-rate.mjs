/* RE-RATE THE CAR CATALOGUE AGAINST A GEOMETRY DUMP, INSTANTLY.
 *
 * Companion to tool-pace-dump.mjs. `paceEstimate` is reproduced here VERBATIM
 * from main.js — if that function changes, this copy has to change with it, and
 * `tests/test-affinity.mjs` remains the in-engine check that they agree.
 *
 * The question it answers is the one test-affinity fails on: which car is the
 * quickest on each world, and is any machine you can PAY for never the answer
 * anywhere? A car nobody should ever buy is a hole in the garage.
 *
 *   node tests/tool-pace-rate.mjs pace-dump.json
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DUMP = process.argv[2] ?? 'pace-dump.json';

/** Verbatim from main.js paceEstimate, driven off a dumped segment profile. */
export function lapSeconds(stats, world) {
  const S = stats;
  const GRADE = 16, DOWNHILL_CAP = 1.18, SLIDE = 4.0;
  const surf = world.surface;
  const base = surf === 'snow' ? 0.55 : surf === 'wet' ? 0.78 : 1;
  const gripEff = S.grip * (base + (1 - base) * 0.62 * S.offroad);
  const steerRate = 2.7, steerTaper = 0.26;
  let t = 0;
  for (const [ds, k, slope] of world.seg) {
    let vCap = S.maxSpeed;
    if (slope > 0) vCap = Math.max(S.maxSpeed * 0.55, S.maxSpeed - (GRADE * slope) / 0.55);
    else if (slope < 0) vCap = Math.min(S.maxSpeed * DOWNHILL_CAP, S.maxSpeed + (GRADE * -slope) / 0.55);
    const vYaw = k > 1e-5 ? steerRate * (1 - steerTaper) / k : Infinity;
    const vGrip = k > 1e-5 ? Math.sqrt(SLIDE * gripEff / k) : Infinity;
    t += ds / Math.max(4, Math.min(vCap, vYaw, vGrip));
  }
  return t;
}

export function rate(cars, worlds) {
  const wins = new Map();
  const rows = [];
  for (const w of worlds) {
    const order = cars.map((c) => ({ key: c.key, s: lapSeconds(c.stats, w) }))
      .sort((a, b) => a.s - b.s);
    wins.set(order[0].key, (wins.get(order[0].key) ?? 0) + 1);
    rows.push({ world: w.name, surface: w.surface ?? 'dry', order,
      spread: order[order.length - 1].s - order[0].s });
  }
  return { wins, rows };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { worlds } = JSON.parse(readFileSync(DUMP, 'utf8'));
  const { CARS } = await import('./tool-pace-cars.mjs');
  const { wins, rows } = rate(CARS, worlds);
  for (const r of rows) {
    console.log(`${r.world.padEnd(20)} ${String(r.surface).padEnd(5)} `
      + `${r.order.slice(0, 3).map((o) => `${o.key}:${o.s.toFixed(1)}`).join('  ')}`
      + `   spread ${r.spread.toFixed(1)}s`);
  }
  console.log('\nwins:', [...wins].map(([k, n]) => `${k}x${n}`).join(' '));
  const never = CARS.filter((c) => !wins.has(c.key)).map((c) => c.key);
  console.log('never the quickest:', never.length ? never.join(', ') : '(none)');
  const paidNever = never.filter((k) => k !== 'brawler');
  console.log(paidNever.length
    ? `FAIL — you can pay for these and they are never the answer: ${paidNever.join(', ')}`
    : 'OK — every machine you can buy is the quickest somewhere');
}
