/* EVERY GATE, ONE COMMAND, ONE EXIT CODE. Run this before pushing anything.
 *
 * It exists because of r271. That round changed one argument to
 * `renderer.setSize` and shipped a view zoomed 75% and cropped to the corner on
 * every touch device — past a "suite" that was three scripts somebody
 * remembered to run, none of which could see a layout fault. The player found
 * it. A gate nobody runs is a gate that does not exist, so this runs them all
 * and refuses on any failure.
 *
 *   node tools-scratch/gates.mjs            everything
 *   FAST=1 node tools-scratch/gates.mjs     skip the slow sweeps
 *
 * Every gate it calls must exit non-zero on failure. Adding a gate that only
 * PRINTS is the same as not adding one.
 *
 * THE BUDGETS ARE GENEROUS ON PURPOSE. Under swiftshader a track build costs
 * about ninety seconds and the whole suite runs the best part of an hour — run
 * it detached and read the file. A gate killed by its own timeout reports
 * TIMEOUT, which is a failure and not a pass; the first run of this file
 * "failed" camsanity that way while camsanity was in fact green, and a suite
 * that cries wolf gets ignored, which is how r271 shipped.
 */
import { spawn } from 'child_process';
const GATES = [
  ['pageerr',     'does the page boot at all',                      [], 120],
  ['camsanity',   'canvas box = screen, buffer aspect, cam aspect', [], 1500],
  ['boot',        'four modes build clean',                         [], 900],
  ['landscape',   'canvas fills, no HUD overlaps',                  [], 900],
  ['bayblack',    'garage bay lit and sealed',                      [], 600],
  ['playermoves', 'the player car actually drives',                 ['LEVELS=1'], 600],
  ['wedgetest',   'a car pinned on a wall counts as stuck',         ['LEVELS=1'], 600],
  ['swallowed',   'nothing hidden by the frame loop catch',         ['LEVELS=1', 'MODES=race'], 600],
  ['loomsweep',   'no massif cone leans over a road',                [], 3600],
  ['conering',    'no massif cone walked out of the world',          [], 3600],
];
const SLOW = new Set(['swallowed', 'landscape', 'camsanity', 'loomsweep', 'conering']);
const run = (name, env, secs) => new Promise((res) => {
  const e = { ...process.env };
  for (const kv of env) { const i = kv.indexOf('='); e[kv.slice(0, i)] = kv.slice(i + 1); }
  const t0 = Date.now();
  const ch = spawn('node', [`tools-scratch/${name}.mjs`], { env: e, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  ch.stdout.on('data', (d) => { out += d; });
  ch.stderr.on('data', (d) => { out += d; });
  const kill = setTimeout(() => { ch.kill('SIGKILL'); }, secs * 1000);
  ch.on('close', (code, sig) => {
    clearTimeout(kill);
    res({ code: sig ? 124 : code, secs: Math.round((Date.now() - t0) / 1000), out });
  });
});
let bad = 0;
console.log('gate           result   time  note');
for (const [name, why, env, secs] of GATES) {
  if (process.env.FAST && SLOW.has(name)) { console.log(`${name.padEnd(14)} skipped        ${why}`); continue; }
  const r = await run(name, env, secs);
  const ok = r.code === 0;
  if (!ok) bad++;
  const last = r.out.trim().split('\n').filter((l) => /PASS|FAIL|game\?/.test(l)).pop()
    || r.out.trim().split('\n').pop() || '';
  console.log(`${name.padEnd(14)} ${(ok ? 'PASS' : r.code === 124 ? 'TIMEOUT' : 'FAIL').padEnd(8)} ${String(r.secs).padStart(4)}s  ${why}`);
  if (!ok) console.log(`               ${last.slice(0, 150)}`);
}
console.log(bad ? `\nFAIL: ${bad} gate(s) — do not push` : '\nPASS: every gate green');
process.exit(bad ? 1 : 0);
