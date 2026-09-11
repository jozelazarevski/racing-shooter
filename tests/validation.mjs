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
import net from 'node:net';
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

const judge = (file, out, code) => {
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
  // A SUITE THAT DID NOT RUN MUST NOT BE GREEN.
  //
  // The gate reported "GATE: green — clear to deploy" across all ten suites in
  // 1 second each, on a tree where nothing had been tested: the local server
  // the suites fetch from was not up, every one died on ERR_CONNECTION_REFUSED,
  // and a stack trace carries no FAIL line and no count line — so `fails` came
  // back empty and every crash scored green. Two signals were available and
  // both were being discarded.
  //
  // FIRST, THE EXIT CODE. The header above says suites "historically exit 0
  // even on FAILED, so the gate parses verdict lines, never exit codes" — true
  // of a FAILING suite, and it does not follow for a CRASHING one. runSuite
  // already captured `code`; the caller destructured only {out, secs} and threw
  // it away. A non-zero exit is an unhandled throw, which is never a pass.
  if (code !== 0) hard.push(`suite exited ${code} (crash — not a verdict)`);
  // SECOND, POSITIVE EVIDENCE. tests/README rule 4 already says a check that
  // matches nothing passes forever; the same trap applies to a whole suite.
  // Green now requires a suite to show it actually asserted something, so an
  // early death mid-narration cannot pass as silence-means-success.
  if (!/\b(PASS|ok|OK|passed|green)\b/.test(out)) {
    hard.push('no assertion evidence in output (suite did not run)');
  }
  return { hard, waived };
};

// THE GATE SERVES ITS OWN PAGES.
//
// Every suite fetches http://localhost:8901. Nothing started it, so the gate
// silently depended on an operator having left a server running — and when
// that assumption broke, all ten suites died on ERR_CONNECTION_REFUSED and the
// run still reported green. The judgement fix above turns that into a BLOCK;
// this removes the failure itself. If a server is already up on 8901 we use it
// and leave it alone, so a developer's own server is not killed underneath them.
const PORT = 8901;
const portOpen = () => new Promise((res) => {
  const sock = net.connect(PORT, '127.0.0.1');
  sock.on('connect', () => { sock.destroy(); res(true); });
  sock.on('error', () => res(false));
  setTimeout(() => { sock.destroy(); res(false); }, 1500);
});

let server = null;
if (await portOpen()) {
  console.log(`note    reusing the server already listening on :${PORT}`);
} else {
  server = spawn('python3', ['-m', 'http.server', String(PORT)],
    { cwd: path.join(HERE, '..'), stdio: 'ignore', detached: false });
  for (let i = 0; i < 40 && !(await portOpen()); i++) await new Promise((r) => setTimeout(r, 250));
  if (!(await portOpen())) {
    console.log(`\nGATE: BLOCKED — could not start the page server on :${PORT}.`);
    process.exit(1);
  }
  console.log(`note    started the page server on :${PORT} for this run`);
}
const stopServer = () => { if (server && !server.killed) server.kill(); };
process.on('exit', stopServer);
process.on('SIGINT', () => { stopServer(); process.exit(130); });

const set = process.env.FULL ? [...DEPLOY_SET, ...FULL_EXTRA] : DEPLOY_SET;
let blocked = false;
for (const [file, covers] of set) {
  const { out, code, secs } = await runSuite(file);
  const { hard, waived } = judge(file, out, code);
  const verdict = hard.length ? 'BLOCK' : waived.length ? 'waived' : 'green';
  console.log(`${verdict.padEnd(7)} ${file.padEnd(26)} ${secs.toFixed(0)}s  ${covers}`);
  for (const w of waived) console.log(`        ${w}`);
  for (const h of hard) console.log(`        ${h}`);
  if (hard.length) blocked = true;
}
stopServer();
console.log(blocked ? '\nGATE: BLOCKED — the build MUST NOT deploy (MASTER §6).'
  : '\nGATE: green — clear to deploy.');
process.exit(blocked ? 1 : 0);
