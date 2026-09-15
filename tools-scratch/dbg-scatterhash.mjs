/* ZERO-DRAW PROOF for the E-9 hazard build.
 *
 * J-6: the world RNG is per-world (seedForLevel + withSeed), and a draw added
 * partway through a build re-rolls everything constructed AFTER it in that
 * world — on all 78 worlds at once, since they share one builder. The hazard
 * work is therefore written to spend NO random draws: explosive crates and
 * dynamite cacti are picked from a loop index already in hand, and charge
 * plates are placed deterministically by walking stations.
 *
 * "Spends no draws" is a claim, so it gets an instrument. This hashes every
 * scattered body's position on a sample of worlds. Run it on the base, run it
 * again after the change: IDENTICAL HASHES ARE THE PASS.
 *
 * Note the inversion against the wrap-count bug, where byte-identical output
 * was the tell of a fix that never ran. Here it is the whole point — which is
 * why the hash covers props/trees/solids and prints per-list counts too, so a
 * build that silently produced NOTHING cannot masquerade as a clean pass.
 *
 *   node tools-scratch/dbg-scatterhash.mjs            # default sample
 *   node tools-scratch/dbg-scatterhash.mjs 0 12 66    # specific levels
 */
import { chromium } from 'playwright-core';
import { createHash } from 'node:crypto';

const levels = process.argv.slice(2).map(Number).filter(Number.isFinite);
const LEVELS = levels.length ? levels : [0, 12, 30, 47, 66];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);

for (const lv of LEVELS) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`,
    { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center?.length, undefined, { timeout: 600000 });
  const r = await p.evaluate(() => {
    const t = window.__game.track;
    const q = (n) => Math.round(n * 1000) / 1000;      // kill float noise, keep real moves
    const lists = {
      props: t.props ?? [], trees: t.trees ?? [], solids: t.solids ?? [],
      camTrees: t.camTrees ?? [], tireStacks: t.tireStacks ?? [],
      buildings: t.buildings ?? [], barriers: t.barriers ?? [],
    };
    const out = {};
    for (const [k, arr] of Object.entries(lists)) {
      out[k] = { n: arr.length, s: arr.map((e) =>
        `${q(e.x ?? e.x1 ?? 0)},${q(e.z ?? e.z1 ?? 0)},${q(e.r ?? 0)}`).join(';') };
    }
    return { name: t.level?.name, out };
  }, undefined);
  const parts = [];
  for (const [k, v] of Object.entries(r.out)) {
    parts.push(`${k}=${v.n}:${createHash('sha1').update(v.s).digest('hex').slice(0, 10)}`);
  }
  console.log(`${String(lv).padStart(2)} ${String(r.name).padEnd(18)} ${parts.join('  ')}`);
}
await b.close();
