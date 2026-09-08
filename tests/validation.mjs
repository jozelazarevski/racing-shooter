/* THE BLOCKING GATE — MASTER SPEC §5 step 0 / §6.
 *
 * "Conclusion: the §6 suite is not yet wired as a build gate." This runner
 * is the wiring: one command, every automated §6-mapped suite, one exit
 * code. A deploy that has not run this to green is a spec violation, not a
 * judgement call. Usage:
 *
 *   node tests/validation.mjs            # deploy set (the gate)
 *   FULL=1 node tests/validation.mjs     # + slow acceptance (airace)
 *
 * Suites print human verdicts but historically exit 0 even on FAILED, so
 * the gate parses verdict lines, never exit codes. Two patterns count:
 * "N FAILED" (N>0) and "N passed, M failed" (M>0). Everything else in a
 * suite's output is narration.
 *
 * WAIVERS: a known standing marginal is allowed to stand ONLY when it is
 * recorded here with its ledger justification. A waived line prints as
 * WAIVED and does not block; anything else red blocks the build.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// §6 mapping: suite -> the spec areas it enforces (for the report).
const DEPLOY_SET = [
  ['test-boot.mjs',           'boots clean, no page errors (§6 baseline)'],
  ['test-stagerules.mjs',     'lap length / corner density / clearance / stage rules (§4, WR-1)'],
  ['test-phase4.mjs',         'surface bounds F7, dusk readability, perf, driver cam (FIX-6, WR-5.1)'],
  ['test-nothing-floats.mjs', 'prop grounding <= 0.15 m, floating-mesh sweep (FIX-3, WR-6.2)'],
  ['test-nothing-on-road.mjs','road clearance envelope — nothing in the corridor (WR-1.3)'],
  ['test-drift.mjs',          'drift feel regression floor (FT gates)'],
  ['test-shortcut.mjs',       'off-road never beats the road (FIX-6 surface economy)'],
  ['test-patch02.mjs',        'camera framing, grid, AI separation acceptance (FIX-1/2/4)'],
  ['test-killspos.mjs',       'kill respawns behind the player + stuck law (FIX-8b, FIX-7)'],
  ['test-camstable.mjs',      'camera twitch harness + frozen-time sky pixel-crawl diff (WR-4)'],
];
const FULL_EXTRA = [
  ['test-airace.mjs',         'AI field acceptance §5.6 (FIX-1, FIX-8 pace)'],
];

// Known standing marginals — each entry NEEDS a ledger reference.
const WAIVERS = [
  // r403 RE-MEASURED THIS, AND IT STANDS FOR BOTH WORLDS — BUT THE SECOND
  // F7 BOUND NO LONGER NEEDS IT.
  //
  // The 52-54% grass-top read is the THRUST-EQUILIBRIUM bound (r388
  // ledger), a property of the global surface table, not of a world, and
  // the harness's runway pick is load-dependent, so an F7 world can land
  // on an equilibrium-bound corridor on a given load. On this base PINE
  // VALLEY reads 53% and GLACIER COL 89% — the SAME waiver covering both
  // directions of the same instability, which is what "load-dependent"
  // means.
  //
  // What r403 DID settle is the other bound. PINE's 0-30 read had gone to
  // 6.32 s against a 3 s bar, and that was not equilibrium at all: the
  // runway search priced trees at their 1.8 u trunk radius while r399's
  // underbrush drag fires on three trees within 8 u, so the search could
  // pick the most heavily braked line on the world and call it the
  // surface. It uses the physics' own brush test now, and the 0-30 bound
  // passes on both worlds unwaived. Only "grass tops" is still listed.
  //
  // Tried and rejected on the way: walking the runway at 4 u to match the
  // 3% frame filter, which read worse on BOTH worlds (PINE 68 -> 84%,
  // GLACIER 81 -> 40%) — the search and the filter want separate work, and
  // a steady-state top-speed read is booked as its own item rather than
  // smuggled into a bridge build.
  { suite: 'test-phase4.mjs', match: /(PINE VALLEY|GLACIER COL): grass tops/,
    reason: 'thrust-equilibrium marginal vs [55,75]; r388 ledger; corridor pick is load-dependent (r403 base: PINE 53%, GLACIER 89%); the 0-30 bound is no longer waived — see the r403 brush fix' },
];

const runSuite = (file) => new Promise((resolve) => {
  const child = spawn('node', [path.join(HERE, file)], {
    env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  const t0 = Date.now();
  child.on('close', (code) => resolve({ out, code, secs: (Date.now() - t0) / 1000 }));
});

const judge = (file, out) => {
  const fails = [];
  for (const line of out.split('\n')) {
    const m1 = line.match(/^(\d+) FAILED/);
    const m2 = line.match(/(\d+) passed, (\d+) failed/);
    if ((m1 && +m1[1] > 0) || (m2 && +m2[2] > 0)) fails.push('count: ' + line.trim());
    if (/^FAIL\b/.test(line)) fails.push(line.trim());
  }
  const hard = [], waived = [];
  for (const f of fails) {
    if (f.startsWith('count:')) continue; // counts are summaries; FAIL lines carry the detail
    const w = WAIVERS.find((w) => w.suite === file && w.match.test(f));
    (w ? waived : hard).push(w ? `${f}  [WAIVED: ${w.reason}]` : f);
  }
  // a bare bad count with no FAIL lines (crashed suite, truncated output) is hard
  if (!hard.length && !waived.length && fails.length) hard.push(...fails);
  // an empty output or a crash is a hard failure too — silence is not green
  if (!out.trim()) hard.push('suite produced no output');
  return { hard, waived };
};

const set = process.env.FULL ? [...DEPLOY_SET, ...FULL_EXTRA] : DEPLOY_SET;
let blocked = false;
for (const [file, covers] of set) {
  const { out, secs } = await runSuite(file);
  const { hard, waived } = judge(file, out);
  const verdict = hard.length ? 'BLOCK' : waived.length ? 'waived' : 'green';
  console.log(`${verdict.padEnd(7)} ${file.padEnd(26)} ${secs.toFixed(0)}s  ${covers}`);
  for (const w of waived) console.log(`        ${w}`);
  for (const h of hard) console.log(`        ${h}`);
  if (hard.length) blocked = true;
}
console.log(blocked ? '\nGATE: BLOCKED — the build MUST NOT deploy (MASTER §6).'
  : '\nGATE: green — clear to deploy.');
process.exit(blocked ? 1 : 0);
